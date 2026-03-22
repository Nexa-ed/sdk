"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import type { RecordRow, CellEdit, ActiveBar } from "../types";
import type { SortDir } from "../hooks/useColumnSort";
import { moveCell } from "../hooks/useGridNavigation";
import { SortIcon } from "../primitives/SortIcon";

// ── Selection types ───────────────────────────────────────────────────────────
type CellPos = { rowIdx: number; colIdx: number };
type Selection = { anchor: CellPos; active: CellPos } | null;

function isInSelection(rowIdx: number, colIdx: number, sel: Selection): boolean {
  if (!sel) return false;
  const minR = Math.min(sel.anchor.rowIdx, sel.active.rowIdx);
  const maxR = Math.max(sel.anchor.rowIdx, sel.active.rowIdx);
  const minC = Math.min(sel.anchor.colIdx, sel.active.colIdx);
  const maxC = Math.max(sel.anchor.colIdx, sel.active.colIdx);
  return rowIdx >= minR && rowIdx <= maxR && colIdx >= minC && colIdx <= maxC;
}

function isActiveCell(rowIdx: number, colIdx: number, sel: Selection): boolean {
  if (!sel) return false;
  return sel.active.rowIdx === rowIdx && sel.active.colIdx === colIdx;
}

function selectionSize(sel: Selection): number {
  if (!sel) return 0;
  const rows = Math.abs(sel.active.rowIdx - sel.anchor.rowIdx) + 1;
  const cols = Math.abs(sel.active.colIdx - sel.anchor.colIdx) + 1;
  return rows * cols;
}

export function RecordDataGrid({
  records,
  onSave,
  saving,
  diffBase,
  label,
  columnOrder,
  onAddRows,
  onMassUpdate,
  onDeleteRow,
  onDeleteRows,
  onMassUpdateRows,
  // Sort props
  sortCol,
  sortDir,
  onToggleSort,
  // Renumber props
  onRenumber,
  lastSerialNumber,
  onRenumberComplete,
}: {
  records: RecordRow[];
  onSave?: (recordId: string, newData: Record<string, string | null>) => Promise<void>;
  saving?: string | null;
  diffBase?: Record<string, Record<string, string | null>>;
  label?: string;
  columnOrder?: string[];
  onAddRows?: (pageNumber: number, rows: Array<Record<string, string | null>>) => Promise<void>;
  onMassUpdate?: (col: string, value: string | null) => Promise<void>;
  onDeleteRow?: (recordId: string) => Promise<void>;
  onDeleteRows?: (recordIds: string[]) => Promise<void>;
  onMassUpdateRows?: (recordIds: string[], col: string, value: string | null) => Promise<void>;
  // Sort
  sortCol?: string | null;
  sortDir?: SortDir;
  onToggleSort?: (col: string) => void;
  // Renumber
  onRenumber?: (records: RecordRow[], col: string, startFrom: number) => Promise<void>;
  lastSerialNumber?: number | null;
  onRenumberComplete?: (lastSerial: number) => void;
}) {
  // ── Edit state ──────────────────────────────────────────────────────────────
  const [editing, setEditing] = useState<CellEdit | null>(null);

  // ── Selection state ─────────────────────────────────────────────────────────
  const [selection, setSelection] = useState<Selection>(null);

  // ── Active bar (mass-update / renumber) ─────────────────────────────────────
  const [activeBar, setActiveBar] = useState<ActiveBar>(null);
  const [massUpdateValue, setMassUpdateValue] = useState("");
  const [massUpdating, setMassUpdating] = useState(false);

  // ── Renumber state ──────────────────────────────────────────────────────────
  const [renumberStart, setRenumberStart] = useState("");
  const [renumbering, setRenumbering] = useState(false);

  // ── Row selection ────────────────────────────────────────────────────────────
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const lastCheckedRowIdxRef = useRef<number | null>(null);
  // Ctrl+Click anchor — first Ctrl+Click sets it; second Ctrl+Click fills the range to it
  const ctrlAnchorRef = useRef<number | null>(null);
  // Row action bar state
  const [rowEditOpen, setRowEditOpen] = useState(false);
  const [rowEditCol, setRowEditCol] = useState("");
  const [rowEditValue, setRowEditValue] = useState("");
  const [rowEditing, setRowEditing] = useState(false);
  const [confirmDeleteSelected, setConfirmDeleteSelected] = useState(false);

  // ── Delete confirm (single row) ──────────────────────────────────────────────
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // ── Add rows modal ──────────────────────────────────────────────────────────
  const [addRowsOpen, setAddRowsOpen] = useState(false);
  const [addRowsPageNum, setAddRowsPageNum] = useState(1);
  const [addRowsDraft, setAddRowsDraft] = useState<Array<Record<string, string>>>([{}]);
  const [addRowsSubmitting, setAddRowsSubmitting] = useState(false);

  // ── Auto-save flash ─────────────────────────────────────────────────────────
  const [lastSavedCell, setLastSavedCell] = useState<{ recordId: string; col: string } | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Table container ref (for keyboard focus) ────────────────────────────────
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);

  // ── Column ordering ──────────────────────────────────────────────────────────
  const { allCols, colFillRate } = useMemo(() => {
    const keySet = new Set(records.flatMap((r) => Object.keys(r.recordData ?? {})));
    const baseKeys = columnOrder
      ? [...columnOrder, ...Array.from(keySet).filter((k) => !columnOrder.includes(k))]
      : Array.from(keySet);
    const rate = new Map<string, number>();
    for (const key of baseKeys) {
      const filled = records.filter((r) => {
        const v = (r.recordData ?? {})[key];
        return v != null && v !== "";
      }).length;
      rate.set(key, records.length > 0 ? Math.round((filled / records.length) * 100) : 0);
    }
    const sorted = columnOrder
      ? baseKeys
      : baseKeys.sort((a, b) => {
          const diff = (rate.get(b) ?? 0) - (rate.get(a) ?? 0);
          return diff !== 0 ? diff : a.localeCompare(b);
        });
    return { allCols: sorted, colFillRate: rate };
  }, [records, columnOrder]);

  // ── Summary stats ─────────────────────────────────────────────────────────
  const totalNulls = records.reduce(
    (acc, r) => acc + allCols.filter((c) => (r.recordData ?? {})[c] == null || (r.recordData ?? {})[c] === "").length,
    0
  );
  const changedCells = diffBase
    ? records.reduce((acc, r) => {
        const base = diffBase[r.id] ?? {};
        return acc + allCols.filter((c) => base[c] !== (r.recordData ?? {})[c]).length;
      }, 0)
    : 0;

  // Early return after all hooks are declared
  if (!records.length)
    return <p className="text-muted-foreground text-sm italic py-4">No records found.</p>;

  // ── Edit helpers ───────────────────────────────────────────────────────────
  function startEdit(rec: RecordRow, col: string, rowIdx: number, colIdx: number) {
    if (!onSave) return;
    setEditing({ recordId: rec.id, col, value: (rec.recordData?.[col] ?? "") ?? "", rowIdx, colIdx });
    setSelection({ anchor: { rowIdx, colIdx }, active: { rowIdx, colIdx } });
  }

  async function commitEdit(rec: RecordRow) {
    if (!editing || !onSave) return;
    const col = editing.col;
    const val = editing.value;
    const newData = { ...(rec.recordData ?? {}), [col]: val } as Record<string, string | null>;
    setEditing(null);
    tableRef.current?.focus();
    try {
      await onSave(rec.id, newData);
      const savedCell = { recordId: rec.id, col };
      setLastSavedCell(savedCell);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      flashTimerRef.current = setTimeout(() => setLastSavedCell(null), 1500);
    } catch (err) {
      console.error("[RecordDataGrid] Save failed:", err);
    }
  }

  // ── Bulk cell clear ───────────────────────────────────────────────────────
  const clearSelectedCells = useCallback(async () => {
    if (!selection || !onSave) return;
    const minR = Math.min(selection.anchor.rowIdx, selection.active.rowIdx);
    const maxR = Math.max(selection.anchor.rowIdx, selection.active.rowIdx);
    const minC = Math.min(selection.anchor.colIdx, selection.active.colIdx);
    const maxC = Math.max(selection.anchor.colIdx, selection.active.colIdx);
    const affectedRows = records.slice(minR, maxR + 1);
    const affectedCols = allCols.slice(minC, maxC + 1);
    const results = await Promise.allSettled(
      affectedRows.map((rec) => {
        const newData = { ...(rec.recordData ?? {}) } as Record<string, string | null>;
        for (const col of affectedCols) newData[col] = null;
        return onSave(rec.id, newData);
      })
    );
    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length > 0) {
      console.error(`[RecordDataGrid] ${failed.length} cell clear(s) failed`);
    }
  }, [selection, records, allCols, onSave]);

  // ── Edit keyboard handler ─────────────────────────────────────────────────
  function handleEditKeyDown(e: React.KeyboardEvent, rec: RecordRow) {
    if (!editing) return;
    const totalRows = records.length;
    const totalCols = allCols.length;

    if (e.key === "Escape") { setEditing(null); tableRef.current?.focus(); return; }

    const navMap: Record<string, Parameters<typeof moveCell>[0]> = {
      Enter: "down", ArrowDown: "down", ArrowUp: "up",
    };
    const dir = e.shiftKey && e.key === "Tab" ? "left"
      : e.key === "Tab" ? "right"
      : navMap[e.key];

    if (dir) {
      e.preventDefault();
      commitEdit(rec);
      const next = moveCell(dir, editing.rowIdx, editing.colIdx, totalRows, totalCols);
      if (next) {
        const nextRec = records[next.rowIdx];
        const nextCol = allCols[next.colIdx];
        if (nextRec && nextCol) startEdit(nextRec, nextCol, next.rowIdx, next.colIdx);
      } else {
        tableRef.current?.focus();
      }
    }
  }

  // ── Table-level keyboard handler (selection mode) ─────────────────────────
  function handleTableKeyDown(e: React.KeyboardEvent) {
    if (editing) return; // editing handles its own keys

    if (e.key === "Escape") { setSelection(null); return; }

    // Ctrl+A — select all
    if ((e.ctrlKey || e.metaKey) && e.key === "a") {
      e.preventDefault();
      setSelection({ anchor: { rowIdx: 0, colIdx: 0 }, active: { rowIdx: records.length - 1, colIdx: allCols.length - 1 } });
      return;
    }

    // Enter or F2 — edit active cell
    if ((e.key === "Enter" || e.key === "F2") && selection) {
      e.preventDefault();
      const { active } = selection;
      const rec = records[active.rowIdx];
      const col = allCols[active.colIdx];
      if (rec && col) startEdit(rec, col, active.rowIdx, active.colIdx);
      return;
    }

    // Delete / Backspace — clear selected cells
    if ((e.key === "Delete" || e.key === "Backspace") && selection && onSave) {
      e.preventDefault();
      clearSelectedCells();
      return;
    }

    // Arrow key navigation / extension
    const arrowDir: Record<string, Parameters<typeof moveCell>[0]> = {
      ArrowRight: "right", ArrowLeft: "left", ArrowUp: "up", ArrowDown: "down",
    };
    const dir = arrowDir[e.key];
    if (dir && selection) {
      e.preventDefault();
      const pivot = e.shiftKey ? selection.active : selection.active; // same either way
      const next = moveCell(dir, pivot.rowIdx, pivot.colIdx, records.length, allCols.length);
      if (next) {
        setSelection((prev) =>
          prev
            ? e.shiftKey
              ? { anchor: prev.anchor, active: next }
              : { anchor: next, active: next }
            : { anchor: next, active: next }
        );
      }
    }
  }

  // ── Cell click / double-click ─────────────────────────────────────────────
  function handleCellClick(rec: RecordRow, col: string, rowIdx: number, colIdx: number, e: React.MouseEvent) {
    // Ctrl/Cmd+Click is reserved for row selection — don't also activate cell selection
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      handleRowCtrlClick(rec, rowIdx);
      return;
    }
    if (editing) {
      // Committing current edit by clicking elsewhere is handled by onBlur
      return;
    }
    if (e.shiftKey && selection) {
      setSelection((prev) => prev ? { ...prev, active: { rowIdx, colIdx } } : { anchor: { rowIdx, colIdx }, active: { rowIdx, colIdx } });
    } else {
      setSelection({ anchor: { rowIdx, colIdx }, active: { rowIdx, colIdx } });
    }
    tableRef.current?.focus();
  }

  function handleCellDoubleClick(rec: RecordRow, col: string, rowIdx: number, colIdx: number) {
    startEdit(rec, col, rowIdx, colIdx);
  }

  // ── Mass update ───────────────────────────────────────────────────────────
  async function handleMassUpdateConfirm() {
    if (!activeBar || activeBar.mode !== "massUpdate" || !onMassUpdate) return;
    setMassUpdating(true);
    try {
      await onMassUpdate(activeBar.col, massUpdateValue.trim() || null);
      setActiveBar(null);
      setMassUpdateValue("");
    } finally {
      setMassUpdating(false);
    }
  }

  // ── Renumber ──────────────────────────────────────────────────────────────
  function openRenumberBar(col: string) {
    const defaultStart = lastSerialNumber != null ? lastSerialNumber + 1 : 1;
    setRenumberStart(String(defaultStart));
    setActiveBar({ col, mode: "renumber" });
  }

  async function handleRenumberConfirm() {
    if (!activeBar || activeBar.mode !== "renumber" || !onRenumber) return;
    const start = parseInt(renumberStart, 10);
    if (isNaN(start)) return;
    setRenumbering(true);
    try {
      await onRenumber(records, activeBar.col, start);
      onRenumberComplete?.(start + records.length - 1);
      setActiveBar(null);
    } finally {
      setRenumbering(false);
    }
  }

  // ── Row delete (single) ───────────────────────────────────────────────────
  async function handleDeleteRow(recordId: string) {
    if (!onDeleteRow) return;
    try {
      await onDeleteRow(recordId);
      setConfirmDeleteId(null);
      setSelection(null);
      setSelectedRows((prev) => { const s = new Set(prev); s.delete(recordId); return s; });
    } catch (err) {
      console.error("[RecordDataGrid] Delete row failed:", err);
      setConfirmDeleteId(null);
    }
  }

  // ── Row selection helpers ─────────────────────────────────────────────────
  function toggleRowSelect(rec: RecordRow, rowIdx: number, shiftKey: boolean) {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (shiftKey && lastCheckedRowIdxRef.current !== null) {
        const from = Math.min(lastCheckedRowIdxRef.current, rowIdx);
        const to = Math.max(lastCheckedRowIdxRef.current, rowIdx);
        const shouldCheck = !prev.has(rec.id);
        for (let i = from; i <= to; i++) {
          const r = records[i];
          if (r) { if (shouldCheck) next.add(r.id); else next.delete(r.id); }
        }
      } else {
        if (next.has(rec.id)) next.delete(rec.id);
        else next.add(rec.id);
      }
      return next;
    });
    lastCheckedRowIdxRef.current = rowIdx;
  }

  function toggleAllRows() {
    const allSelected = records.every((r) => selectedRows.has(r.id));
    if (allSelected) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(records.map((r) => r.id)));
    }
    lastCheckedRowIdxRef.current = null;
  }

  // Ctrl+Click: first click = toggle + set anchor; second click = range-fill from anchor
  function handleRowCtrlClick(rec: RecordRow, rowIdx: number) {
    if (ctrlAnchorRef.current === null || ctrlAnchorRef.current === rowIdx) {
      // First Ctrl+Click — toggle this row and plant the anchor
      setSelectedRows((prev) => {
        const next = new Set(prev);
        if (next.has(rec.id)) next.delete(rec.id);
        else next.add(rec.id);
        return next;
      });
      ctrlAnchorRef.current = rowIdx;
    } else {
      // Second Ctrl+Click — fill range from anchor to here (additive, keeps existing)
      const from = Math.min(ctrlAnchorRef.current, rowIdx);
      const to = Math.max(ctrlAnchorRef.current, rowIdx);
      setSelectedRows((prev) => {
        const next = new Set(prev);
        for (let i = from; i <= to; i++) {
          const r = records[i];
          if (r) next.add(r.id);
        }
        return next;
      });
      ctrlAnchorRef.current = null; // reset after range is filled
    }
    lastCheckedRowIdxRef.current = rowIdx;
  }

  // Header checkbox: set indeterminate via callback ref
  const headerCheckboxRef = (el: HTMLInputElement | null) => {
    if (!el) return;
    const allChecked = records.length > 0 && records.every((r) => selectedRows.has(r.id));
    const someChecked = records.some((r) => selectedRows.has(r.id));
    el.checked = allChecked;
    el.indeterminate = someChecked && !allChecked;
  };

  // Bulk delete selected rows
  async function handleDeleteSelected() {
    if (!onDeleteRows) return;
    const ids = Array.from(selectedRows);
    try {
      await onDeleteRows(ids);
      setConfirmDeleteSelected(false);
      setSelectedRows(new Set());
      setSelection(null);
    } catch (err) {
      console.error("[RecordDataGrid] Bulk delete failed:", err);
      setConfirmDeleteSelected(false);
    }
  }

  // Bulk edit column for selected rows
  async function handleRowEditApply() {
    if (!onMassUpdateRows || !rowEditCol) return;
    setRowEditing(true);
    try {
      await onMassUpdateRows(Array.from(selectedRows), rowEditCol, rowEditValue.trim() || null);
      setRowEditOpen(false);
      setRowEditValue("");
    } finally {
      setRowEditing(false);
    }
  }

  // ── Add rows modal ────────────────────────────────────────────────────────
  function openAddRowsModal() {
    const defaultPage = records[0]?.pageNumber ?? 1;
    setAddRowsPageNum(defaultPage ?? 1);
    setAddRowsDraft([Object.fromEntries(allCols.map((c) => [c, ""]))]);
    setAddRowsOpen(true);
  }

  async function handleAddRowsSubmit() {
    if (!onAddRows) return;
    const nonEmpty = addRowsDraft.filter((row) => Object.values(row).some((v) => v !== ""));
    if (!nonEmpty.length) return;
    setAddRowsSubmitting(true);
    try {
      await onAddRows(
        addRowsPageNum,
        nonEmpty.map((row) => Object.fromEntries(allCols.map((c) => [c, row[c] || null])))
      );
      setAddRowsOpen(false);
      setAddRowsDraft([{}]);
    } finally {
      setAddRowsSubmitting(false);
    }
  }

  function openRowEdit() {
    setRowEditCol((c) => c || allCols[0] || "");
    setRowEditValue("");
    setRowEditOpen(true);
  }

  // ── Selection info label ──────────────────────────────────────────────────
  const selCells = selectionSize(selection);
  const isMultiSelect = selCells > 1;

  return (
    <div className="space-y-2">
      {/* Stats row */}
      <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">{records.length} records · {allCols.length} columns</span>
        {totalNulls > 0 && (
          <span className="text-red-500 cursor-help underline decoration-dotted" title={`${totalNulls} cells have no extracted value.`}>
            {totalNulls} missing cells
          </span>
        )}
        {changedCells > 0 && (
          <span className="text-blue-600 cursor-help underline decoration-dotted" title={`LLM changed or filled ${changedCells} cells vs raw OCR.`}>
            {changedCells} cells changed by LLM
          </span>
        )}
        {/* Selection info */}
        {isMultiSelect && (
          <span className="text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full">
            {selCells} cells selected
            {onSave && (
              <button
                onClick={clearSelectedCells}
                className="ml-1.5 text-red-400 hover:text-red-600 font-semibold"
                title="Clear selected cells (set to blank)"
              >
                ✕ Clear
              </button>
            )}
          </span>
        )}
        {onSave && !isMultiSelect && (
          <span className="text-muted-foreground italic cursor-help" title="Click to select, double-click to edit. Tab/Enter to move between cells. Shift+Arrow to select a range. Delete to clear.">
            ✏ Click cell · Double-click to edit · Del to clear
          </span>
        )}
        {onAddRows && (
          <button
            onClick={openAddRowsModal}
            title="Add one or more student rows that were missed by the OCR."
            className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-md border border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 transition-colors text-xs font-medium"
          >
            + Add rows
          </button>
        )}
      </div>

      {/* Mass-update bar */}
      {activeBar?.mode === "massUpdate" && onMassUpdate && (
        <div className="flex items-center gap-2 flex-wrap px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs">
          <span className="font-semibold text-blue-700 shrink-0">
            Set &ldquo;{activeBar.col.replace(/_/g, " ")}&rdquo; for all {records.length} visible records:
          </span>
          <input
            autoFocus
            type="text"
            value={massUpdateValue}
            onChange={(e) => setMassUpdateValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleMassUpdateConfirm();
              if (e.key === "Escape") { setActiveBar(null); setMassUpdateValue(""); }
            }}
            placeholder="New value (leave blank to clear)"
            className="flex-1 min-w-[160px] px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 bg-background text-xs"
          />
          <button onClick={handleMassUpdateConfirm} disabled={massUpdating} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded font-semibold transition-colors">
            {massUpdating ? "Updating…" : `Update all ${records.length}`}
          </button>
          <button onClick={() => { setActiveBar(null); setMassUpdateValue(""); }} className="px-2 py-1 text-blue-500 hover:text-blue-700">Cancel</button>
        </div>
      )}

      {/* Renumber bar */}
      {activeBar?.mode === "renumber" && onRenumber && (
        <div className="flex items-center gap-2 flex-wrap px-3 py-2 bg-violet-50 border border-violet-200 rounded-lg text-xs">
          <span className="font-semibold text-violet-700 shrink-0">
            Renumber &ldquo;{activeBar.col.replace(/_/g, " ")}&rdquo; sequentially for all {records.length} records:
          </span>
          <label className="flex items-center gap-1 text-violet-600 font-medium">
            Start from:
            <input
              autoFocus
              type="number"
              min={1}
              value={renumberStart}
              onChange={(e) => setRenumberStart(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenumberConfirm();
                if (e.key === "Escape") setActiveBar(null);
              }}
              className="w-20 px-2 py-1 border border-violet-300 rounded focus:outline-none focus:ring-1 focus:ring-violet-400 bg-background text-xs ml-1"
            />
          </label>
          <button onClick={handleRenumberConfirm} disabled={renumbering || isNaN(parseInt(renumberStart, 10))} className="px-3 py-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded font-semibold transition-colors">
            {renumbering ? "Renumbering…" : `Renumber ${records.length}`}
          </button>
          <button onClick={() => setActiveBar(null)} className="px-2 py-1 text-violet-500 hover:text-violet-700">Cancel</button>
        </div>
      )}

      {/* Row selection action tray */}
      {selectedRows.size > 0 && (
        <div className="flex items-center gap-2 flex-wrap px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg text-xs shadow-sm">
          {/* Count badge */}
          <span className="flex items-center gap-1.5 font-semibold text-indigo-700 shrink-0">
            <span className="bg-indigo-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs leading-none">
              {selectedRows.size}
            </span>
            row{selectedRows.size !== 1 ? "s" : ""} selected
          </span>

          <span className="text-indigo-300">|</span>

          {/* Set column form */}
          {onMassUpdateRows && (
            rowEditOpen ? (
              <>
                <select
                  autoFocus
                  value={rowEditCol}
                  onChange={(e) => setRowEditCol(e.target.value)}
                  className="border border-indigo-300 rounded px-2 py-1 text-xs bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-400"
                >
                  {allCols.map((c) => (
                    <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
                  ))}
                </select>
                <span className="text-indigo-400">→</span>
                <input
                  type="text"
                  value={rowEditValue}
                  onChange={(e) => setRowEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRowEditApply();
                    if (e.key === "Escape") setRowEditOpen(false);
                  }}
                  placeholder="New value (blank to clear)"
                  className="flex-1 min-w-[140px] border border-indigo-300 rounded px-2 py-1 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
                />
                <button
                  onClick={handleRowEditApply}
                  disabled={rowEditing || !rowEditCol}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded font-semibold transition-colors"
                >
                  {rowEditing ? "Applying…" : `Apply to ${selectedRows.size}`}
                </button>
                <button
                  onClick={() => setRowEditOpen(false)}
                  className="px-2 py-1 text-indigo-500 hover:text-indigo-700"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={openRowEdit}
                className="flex items-center gap-1 px-2.5 py-1 border border-indigo-300 text-indigo-600 rounded hover:bg-indigo-100 transition-colors font-medium"
              >
                ✏ Edit column…
              </button>
            )
          )}

          {/* Bulk delete */}
          {onDeleteRows && (
            confirmDeleteSelected ? (
              <>
                <span className="text-red-600 font-semibold shrink-0">Delete {selectedRows.size} rows permanently?</span>
                <button
                  onClick={handleDeleteSelected}
                  className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-semibold transition-colors"
                >
                  Yes, delete
                </button>
                <button
                  onClick={() => setConfirmDeleteSelected(false)}
                  className="px-2 py-1 text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirmDeleteSelected(true)}
                className="flex items-center gap-1 px-2.5 py-1 border border-red-200 text-red-500 rounded hover:bg-red-50 hover:border-red-300 transition-colors font-medium ml-auto"
              >
                🗑 Delete {selectedRows.size} row{selectedRows.size !== 1 ? "s" : ""}
              </button>
            )
          )}

          {/* Clear selection */}
          <button
            onClick={() => { setSelectedRows(new Set()); setConfirmDeleteSelected(false); setRowEditOpen(false); ctrlAnchorRef.current = null; }}
            title="Clear row selection"
            className={`text-indigo-400 hover:text-indigo-600 font-bold px-1 ${onDeleteRows ? "" : "ml-auto"}`}
          >
            ✕
          </button>
        </div>
      )}

      {/* Diff legend */}
      {diffBase && (
        <div className="flex items-center gap-3 text-xs flex-wrap">
          <span className="px-2 py-0.5 rounded bg-green-100 text-green-800 cursor-help" title="OCR left blank; LLM filled it in.">Null → filled</span>
          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 cursor-help" title="OCR and LLM disagreed on this value.">Value changed</span>
          <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 cursor-help" title="OCR had a value; LLM removed it.">Value removed</span>
          <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground cursor-help" title="No value in either OCR or LLM output.">— missing in both</span>
        </div>
      )}

      {/* Add Rows Modal */}
      {addRowsOpen && onAddRows && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h2 className="text-sm font-bold text-foreground">Add Student Rows</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Enter rows that the OCR missed. Press Enter in the last field to add another row.</p>
              </div>
              <button onClick={() => setAddRowsOpen(false)} className="text-muted-foreground hover:text-foreground text-lg leading-none">✕</button>
            </div>
            <div className="px-5 py-3 border-b border-border/50 flex items-center gap-3">
              <label className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Page number:</label>
              <input type="number" min={1} value={addRowsPageNum} onChange={(e) => setAddRowsPageNum(Number(e.target.value))}
                className="w-20 text-xs border border-border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-300" />
              <span className="text-xs text-muted-foreground">The page this row belongs to in the original PDF.</span>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
              {addRowsDraft.map((row, rowIdx) => (
                <div key={rowIdx} className="border border-border rounded-lg p-3 space-y-2 relative">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-muted-foreground">Row {rowIdx + 1}</span>
                    {addRowsDraft.length > 1 && (
                      <button onClick={() => setAddRowsDraft((d) => d.filter((_, i) => i !== rowIdx))} className="text-xs text-red-400 hover:text-red-600">Remove</button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {allCols.map((col, colIdx) => {
                      const isLastCol = colIdx === allCols.length - 1;
                      const isLastRow = rowIdx === addRowsDraft.length - 1;
                      return (
                        <div key={col}>
                          <label className="block text-xs text-muted-foreground mb-0.5 truncate" title={col}>{col.replace(/_/g, " ")}</label>
                          <input
                            value={row[col] ?? ""}
                            onChange={(e) => setAddRowsDraft((d) => d.map((r, i) => i === rowIdx ? { ...r, [col]: e.target.value } : r))}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && isLastCol && isLastRow) {
                                e.preventDefault();
                                setAddRowsDraft((d) => [...d, Object.fromEntries(allCols.map((c) => [c, ""]))]);
                              }
                            }}
                            className="w-full text-xs border border-border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-300"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              <button onClick={() => setAddRowsDraft((d) => [...d, Object.fromEntries(allCols.map((c) => [c, ""]))])}
                className="w-full py-2 border border-dashed border-border rounded-lg text-xs text-muted-foreground hover:border-blue-300 hover:text-blue-600 transition-colors">
                + Add another row
              </button>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border bg-muted/30">
              <button onClick={() => setAddRowsOpen(false)} className="px-4 py-2 text-xs text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors">Cancel</button>
              <button
                onClick={handleAddRowsSubmit}
                disabled={addRowsSubmitting || addRowsDraft.every((r) => Object.values(r).every((v) => !v))}
                className="px-4 py-2 text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-semibold transition-colors"
              >
                {addRowsSubmitting ? "Adding…" : `Add ${addRowsDraft.filter((r) => Object.values(r).some((v) => v !== "")).length || 1} row${addRowsDraft.length !== 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete popover rendered outside table */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-40" onClick={() => setConfirmDeleteId(null)}>
          <div className="bg-background rounded-xl shadow-xl px-5 py-4 flex flex-col gap-3 w-72" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-semibold text-foreground">Delete this row?</p>
            <p className="text-xs text-muted-foreground">This will permanently remove the record. This action cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmDeleteId(null)} className="px-3 py-1.5 text-xs text-muted-foreground border border-border rounded-lg hover:bg-muted">Cancel</button>
              <button onClick={() => handleDeleteRow(confirmDeleteId)} className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── TABLE ── */}
      <div
        ref={tableRef}
        tabIndex={0}
        className="overflow-x-auto rounded-lg border border-border focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-inset"
        onKeyDown={handleTableKeyDown}
        onMouseDown={() => {
          // Ensure the table wrapper gets focus when clicking inside it
          // (individual cell clicks set selection and call tableRef.focus())
        }}
      >
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-muted/50 border-b border-border sticky top-0">
              {(onDeleteRows || onMassUpdateRows) && (
                <th className="w-8 px-2 py-2 border-r border-border/50">
                  <input
                    ref={headerCheckboxRef}
                    type="checkbox"
                    onChange={toggleAllRows}
                    title="Select / deselect all visible rows"
                    className="rounded accent-indigo-600 cursor-pointer"
                  />
                </th>
              )}
              <th className="px-2 py-2 text-muted-foreground font-semibold w-9 text-center border-r border-border cursor-help" title="Page number in the original PDF.">Pg</th>
              <th className="px-2 py-2 text-muted-foreground font-semibold w-7 text-center border-r border-border cursor-help" title="Row number within the table on that page.">#</th>
              {allCols.map((col) => {
                const fillPct = colFillRate.get(col) ?? 0;
                const isEmptyCol = fillPct === 0;
                const isSparseCol = fillPct > 0 && fillPct < 50;
                const filledCount = records.filter(r => { const v = (r.recordData ?? {})[col]; return v != null && v !== ""; }).length;
                const colTooltip = isEmptyCol
                  ? `"${col}" — No value extracted for any record (0/${records.length} filled).`
                  : isSparseCol
                  ? `"${col}" — ${filledCount}/${records.length} records have a value (${fillPct}%).`
                  : `"${col}" — ${filledCount}/${records.length} records filled (${fillPct}%).`;
                const isActiveMassUpdate = activeBar?.col === col && activeBar.mode === "massUpdate";
                const isActiveRenumber = activeBar?.col === col && activeBar.mode === "renumber";
                const isThisSorted = sortCol === col;

                return (
                  <th
                    key={col}
                    title={colTooltip}
                    className={`px-3 py-2 font-semibold whitespace-nowrap capitalize border-r border-border/50 last:border-r-0 select-none max-w-[140px] ${
                      isActiveMassUpdate ? "bg-blue-100 text-blue-700 ring-1 ring-inset ring-blue-300"
                      : isActiveRenumber ? "bg-violet-100 text-violet-700 ring-1 ring-inset ring-violet-300"
                      : isThisSorted ? "bg-muted text-foreground"
                      : isEmptyCol ? "text-red-300 bg-red-50/50"
                      : isSparseCol ? "text-amber-600"
                      : "text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-1 group">
                      <span
                        onClick={() => {
                          if (!onMassUpdate) return;
                          if (isActiveMassUpdate) { setActiveBar(null); setMassUpdateValue(""); }
                          else { setActiveBar({ col, mode: "massUpdate" }); setMassUpdateValue(""); }
                        }}
                        className={`truncate max-w-[80px] ${onMassUpdate ? "cursor-pointer hover:text-blue-600" : "cursor-help"}`}
                      >
                        {col.replace(/_/g, " ")}
                        {isActiveMassUpdate && <span className="ml-1 text-blue-400">▼</span>}
                        {isActiveRenumber && <span className="ml-1 text-violet-400">⟳</span>}
                        {!isActiveMassUpdate && !isActiveRenumber && isEmptyCol && <span className="ml-1 text-red-300">●</span>}
                        {!isActiveMassUpdate && !isActiveRenumber && isSparseCol && !isEmptyCol && <span className="ml-1 text-amber-400">◑</span>}
                      </span>
                      {onToggleSort && (
                        <button
                          tabIndex={-1}
                          onClick={(e) => { e.stopPropagation(); onToggleSort(col); }}
                          title={isThisSorted ? `Sorted ${sortDir === "asc" ? "A→Z" : "Z→A"} — click to change` : "Sort by this column"}
                          className={`shrink-0 px-0.5 rounded hover:bg-muted transition-opacity ${isThisSorted ? "opacity-100 text-foreground" : "opacity-0 group-hover:opacity-100 text-muted-foreground"}`}
                        >
                          <SortIcon dir={isThisSorted ? sortDir ?? null : null} />
                        </button>
                      )}
                      {onRenumber && (
                        <button
                          tabIndex={-1}
                          onClick={(e) => { e.stopPropagation(); openRenumberBar(col); }}
                          title="Renumber this column sequentially"
                          className={`shrink-0 px-0.5 rounded hover:bg-violet-100 text-violet-400 transition-opacity ${isActiveRenumber ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                        >
                          ⟳
                        </button>
                      )}
                    </div>
                  </th>
                );
              })}
              <th className="px-2 py-2 w-14 text-muted-foreground font-semibold text-center cursor-help" title="Warnings and missing-field counts. ⚠ = processing warning; N✗ = blank fields.">⚠ / ✗</th>
              {onDeleteRow && <th className="w-8 px-1" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {records.map((rec, rowIdx) => {
              const data = rec.recordData ?? {};
              const nullCount = allCols.filter((c) => data[c] == null || data[c] === "").length;
              const missingFieldNames = allCols.filter((c) => data[c] == null || data[c] === "");
              const hasWarn = !!(Array.isArray(rec.warnings) ? (rec.warnings as unknown[]).length : rec.warnings);
              const warningText = hasWarn
                ? Array.isArray(rec.warnings)
                  ? (rec.warnings as string[]).map(String).join("\n• ")
                  : typeof rec.warnings === "object" && rec.warnings !== null
                  ? Object.entries(rec.warnings as Record<string, unknown>).map(([k, v]) => `${k}: ${v}`).join("\n• ")
                  : String(rec.warnings)
                : "";
              const isSaving = saving === rec.id;
              const base = diffBase?.[rec.id];
              const cellRangeSelected = allCols.some((_, ci) => isInSelection(rowIdx, ci, selection));
              const rowChecked = selectedRows.has(rec.id);
              const isCtrlAnchor = ctrlAnchorRef.current === rowIdx;

              return (
                <tr
                  key={rec.id}
                  title={isCtrlAnchor ? "Ctrl+Click anchor — Ctrl+Click another row to select the range" : undefined}
                  className={`group/row transition-colors ${isSaving ? "opacity-50 pointer-events-none" : ""} ${
                    rowChecked
                      ? "bg-indigo-50/60"
                      : nullCount > 4
                      ? "bg-red-50/40"
                      : nullCount > 1
                      ? "bg-amber-50/20"
                      : ""
                  } ${cellRangeSelected && !rowChecked ? "bg-blue-50/30" : ""} ${
                    isCtrlAnchor ? "outline outline-2 outline-indigo-400 outline-offset-[-2px]" : ""
                  }`}
                >
                  {/* Row select checkbox */}
                  {(onDeleteRows || onMassUpdateRows) && (
                    <td className="px-2 py-1.5 border-r border-border/50 w-8">
                      <input
                        type="checkbox"
                        checked={rowChecked}
                        onChange={() => {/* handled by onClick for shift support */}}
                        onClick={(e) => toggleRowSelect(rec, rowIdx, e.shiftKey)}
                        className="rounded accent-indigo-600 cursor-pointer"
                      />
                    </td>
                  )}
                  <td className="px-2 py-1.5 text-muted-foreground text-center font-mono border-r border-border/50">{rec.pageNumber ?? "—"}</td>
                  <td className="px-2 py-1.5 text-muted-foreground text-center font-mono border-r border-border/50">{rec.recordNumberForPage ?? "—"}</td>

                  {allCols.map((col, colIdx) => {
                    const val = data[col];
                    const isEmpty = val == null || val === "";
                    const baseVal = base?.[col];
                    const isDiff = base !== undefined && baseVal !== val;
                    const wasNullNowFilled = isDiff && (baseVal == null || baseVal === "") && !isEmpty;
                    const wasFilledNowNull = isDiff && isEmpty && !(baseVal == null || baseVal === "");
                    const valueChanged = isDiff && !wasNullNowFilled && !wasFilledNowNull;
                    const isEditing = editing?.recordId === rec.id && editing.col === col;
                    const selected = isInSelection(rowIdx, colIdx, selection);
                    const active = isActiveCell(rowIdx, colIdx, selection);
                    const isFlashing = lastSavedCell?.recordId === rec.id && lastSavedCell?.col === col;

                    const cellBg = isEditing
                      ? ""
                      : isFlashing
                      ? "ring-2 ring-inset ring-green-400 bg-green-50"
                      : active && !selected
                      ? "ring-2 ring-inset ring-blue-400"
                      : selected
                      ? "bg-blue-100/70 ring-1 ring-inset ring-blue-300"
                      : wasNullNowFilled
                      ? "bg-green-100 text-green-800"
                      : wasFilledNowNull
                      ? "bg-red-100 text-red-700 line-through"
                      : valueChanged
                      ? "bg-blue-100 text-blue-800"
                      : isEmpty
                      ? "text-muted-foreground/40 italic"
                      : "text-foreground";

                    if (isEditing) {
                      return (
                        <td key={col} className="px-1 py-1 border-r border-border/50 bg-background ring-2 ring-inset ring-blue-400">
                          <div className="flex items-center gap-1">
                            <input
                              autoFocus
                              className="min-w-[80px] w-28 text-xs border border-blue-400 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-300 bg-background"
                              value={editing.value}
                              onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                              onKeyDown={(e) => handleEditKeyDown(e, rec)}
                              onBlur={() => commitEdit(rec)}
                            />
                            <button onMouseDown={(e) => e.preventDefault()} onClick={() => commitEdit(rec)} className="text-white bg-blue-500 hover:bg-blue-600 px-1.5 py-0.5 rounded">✓</button>
                            <button onMouseDown={(e) => e.preventDefault()} onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground px-1">✕</button>
                          </div>
                        </td>
                      );
                    }

                    return (
                      <td
                        key={col}
                        onClick={(e) => handleCellClick(rec, col, rowIdx, colIdx, e)}
                        onDoubleClick={() => handleCellDoubleClick(rec, col, rowIdx, colIdx)}
                        title={
                          isDiff
                            ? `OCR: "${baseVal ?? "—"}" → LLM: "${val ?? "—"}"`
                            : onSave
                            ? `${isEmpty ? "—" : String(val)}\n\nClick to select · Double-click to edit`
                            : isEmpty ? undefined : String(val)
                        }
                        className={`px-2 py-1.5 max-w-[150px] truncate border-r border-border/50 last:border-r-0 select-none ${
                          onSave ? "cursor-pointer" : ""
                        } ${cellBg}`}
                      >
                        {isEmpty ? <span className="text-muted-foreground/40 select-none">—</span> : String(val)}
                        {isDiff && !isEmpty && !wasFilledNowNull && (
                          <span className="ml-1 text-xs opacity-50" title={`was: ${baseVal ?? "—"}`}>↑</span>
                        )}
                      </td>
                    );
                  })}

                  {/* ⚠/✗ column */}
                  <td className="px-2 py-1.5 text-center whitespace-nowrap">
                    {hasWarn && (
                      <span title={`Warnings:\n• ${warningText}`} className="text-amber-500 cursor-help">⚠</span>
                    )}
                    {nullCount > 0 && (
                      <span title={`${nullCount} missing field${nullCount !== 1 ? "s" : ""}:\n  ${missingFieldNames.join(", ")}`} className="text-red-400 ml-0.5 text-xs cursor-help">
                        {nullCount}✗
                      </span>
                    )}
                  </td>

                  {/* Delete row button */}
                  {onDeleteRow && (
                    <td className="px-1 py-1 w-8">
                      <div className="relative">
                        <button
                          onClick={() => setConfirmDeleteId(rec.id)}
                          title="Delete this row"
                          className="opacity-0 group-hover/row:opacity-100 transition-opacity p-1 rounded text-muted-foreground/40 hover:text-red-500 hover:bg-red-50"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {label && <p className="text-xs text-muted-foreground italic text-right">{label}</p>}
    </div>
  );
}
