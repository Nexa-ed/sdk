"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "sonner";
import { Download, Upload, FileSpreadsheet, FileText, Braces, ChevronDown, X } from "lucide-react";
import { useNexaContext } from "../context";
import { useGetFileStudentRecords } from "../hooks/useGetFileStudentRecords";
import { useUpdateRecordInList } from "../hooks/useUpdateRecordInList";
import { useAddRowsToList } from "../hooks/useAddRowsToList";
import { useColumnSort } from "../hooks/useColumnSort";
import { useSerialRenumber } from "../hooks/useSerialRenumber";
import { useDeleteRecordFromList } from "../hooks/useDeleteRecordFromList";
import { useGetRoster } from "../hooks/useGetRoster";
import { useBatchUpdateStudentRecords } from "../hooks/useBatchUpdateStudentRecords";
import { useBatchCreateStudentRecordsFromImport } from "../hooks/useBatchCreateStudentRecordsFromImport";
import { LoadingSpinner } from "../primitives/LoadingSpinner";
import { RowsPerPageSelect } from "../primitives/RowsPerPageSelect";
import { HelpButton } from "../primitives/HelpModal";
import { RecordDataGrid } from "./RecordDataGrid";
import { downloadAsXlsx, downloadAsCsv, downloadAsJson } from "../exportUtils";
import { parseImportFile, buildImportDiff } from "../importUtils";
import type { ImportDiff } from "../importUtils";
import type { RecordRow, RosterEntry } from "../types";

export function StudentRecordsTable({ fileId }: { fileId: string }) {
  const { orpc } = useNexaContext();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<25 | 50 | 100 | 200>(25);
  const [hasWarningsFilter, setHasWarningsFilter] = useState<boolean | undefined>(undefined);
  const [hideMissingOnly, setHideMissingOnly] = useState(false);
  const [hideNoiseRows, setHideNoiseRows] = useState(true);
  const [showPartialOnly, setShowPartialOnly] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [lastSerialNumber, setLastSerialNumber] = useState<number | null>(null);

  // Export / import-sync state
  const [exportLoading, setExportLoading] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importParsing, setImportParsing] = useState(false);
  const [importDiff, setImportDiff] = useState<ImportDiff | null>(null);
  const [importApplying, setImportApplying] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);
  const batchUpdateMutation = useBatchUpdateStudentRecords();
  const batchCreateMutation = useBatchCreateStudentRecordsFromImport();
  const [newRecordIds, setNewRecordIds] = useState<Set<string>>(new Set());

  // Roster
  const { data: rosterData } = useGetRoster(1, 5000);
  const rosterEntriesMap = useMemo<Map<string, RosterEntry>>(() => {
    const m = new Map<string, RosterEntry>();
    for (const e of (rosterData as { items?: RosterEntry[] } | undefined)?.items ?? []) {
      m.set(e.id, { id: e.id, name: e.name, externalId: e.externalId ?? null, classGroup: e.classGroup ?? null, metadata: e.metadata ?? null });
    }
    return m;
  }, [rosterData]);
  const assignRosterMutation = useMutation<unknown, Error, { recordId: string; rosterId: string | null }>({
    ...orpc.documents.assignRosterMatch.mutationOptions(),
  });

  const { data, isLoading, isError, error } = useGetFileStudentRecords(fileId, page, limit, {
    hasWarnings: hasWarningsFilter,
  });

  const updateMutation = useUpdateRecordInList(fileId, page, limit, hasWarningsFilter);
  const { handleAddRows } = useAddRowsToList(fileId, page, limit, hasWarningsFilter);
  const { sortCol, sortDir, toggleSort, sortedRecords } = useColumnSort();
  const deleteMutation = useDeleteRecordFromList(fileId, page, limit, hasWarningsFilter);

  const { handleRenumber } = useSerialRenumber(
    fileId, page, limit, hasWarningsFilter,
    queryClient,
    batchUpdateMutation.mutateAsync as unknown as (vars: { recordId: string; recordData: Record<string, string | null> }) => Promise<unknown>
  );

  const rawRecords = (data?.items ?? []) as RecordRow[];

  // User-controlled column order, persisted in localStorage per fileId
  const [userColumnOrder, setUserColumnOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`nexa:col-order:${fileId}`);
      if (saved) {
        const parsed = JSON.parse(saved) as unknown;
        if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) return parsed as string[];
      }
    } catch {}
    return [];
  });

  const stableColumnOrder = useMemo(() => {
    const allKeys = Array.from(new Set(rawRecords.flatMap((r) => Object.keys(r.recordData ?? {}))));
    if (!allKeys.length) return userColumnOrder;
    if (userColumnOrder.length > 0) {
      const known = new Set(userColumnOrder);
      const newCols = allKeys.filter((k) => !known.has(k));
      return newCols.length > 0 ? [...userColumnOrder, ...newCols] : userColumnOrder;
    }
    const rate = new Map<string, number>();
    for (const key of allKeys) {
      const filled = rawRecords.filter((r) => { const v = (r.recordData ?? {})[key]; return v != null && v !== ""; }).length;
      rate.set(key, rawRecords.length > 0 ? Math.round((filled / rawRecords.length) * 100) : 0);
    }
    return [...allKeys].sort((a, b) => {
      const diff = (rate.get(b) ?? 0) - (rate.get(a) ?? 0);
      return diff !== 0 ? diff : a.localeCompare(b);
    });
  }, [rawRecords, userColumnOrder]);

  useEffect(() => {
    if (userColumnOrder.length === 0 && stableColumnOrder.length > 0) {
      setUserColumnOrder(stableColumnOrder);
    } else if (userColumnOrder.length > 0 && stableColumnOrder.length > userColumnOrder.length) {
      setUserColumnOrder(stableColumnOrder);
    }
  }, [stableColumnOrder, userColumnOrder.length]);

  useEffect(() => {
    if (userColumnOrder.length > 0) {
      try { localStorage.setItem(`nexa:col-order:${fileId}`, JSON.stringify(userColumnOrder)); } catch {}
    }
  }, [fileId, userColumnOrder]);

  const handleColumnReorder = useCallback((newOrder: string[]) => setUserColumnOrder(newOrder), []);
  const handleResetColumnOrder = useCallback(() => {
    setUserColumnOrder([]);
    try { localStorage.removeItem(`nexa:col-order:${fileId}`); } catch {}
  }, [fileId]);

  const rowNullCount = useCallback(
    (r: RecordRow) =>
      stableColumnOrder.filter((c) => { const v = (r.recordData ?? {})[c]; return v == null || v === ""; }).length,
    [stableColumnOrder]
  );

  const filteredRecords: RecordRow[] = useMemo(() => {
    let rows = rawRecords;
    if (hideNoiseRows) rows = rows.filter((r) => rowNullCount(r) <= 4);
    if (showPartialOnly) rows = rows.filter((r) => { const n = rowNullCount(r); return n > 1 && n <= 4; });
    if (hideMissingOnly) rows = rows.filter((r) => Object.values(r.recordData ?? {}).some((v) => v == null || v === ""));
    return rows;
  }, [rawRecords, hideNoiseRows, showPartialOnly, hideMissingOnly, rowNullCount]);

  const records: RecordRow[] = useMemo(() => sortedRecords(filteredRecords), [filteredRecords, sortedRecords]);

  const noiseRowCount = useMemo(
    () => rawRecords.filter((r) => rowNullCount(r) > 4).length,
    [rawRecords, rowNullCount]
  );

  const partialRowCount = useMemo(
    () => rawRecords.filter((r) => { const n = rowNullCount(r); return n > 1 && n <= 4; }).length,
    [rawRecords, rowNullCount]
  );

  const total = (data as any)?.pagination?.total ?? 0;
  const totalPages = (data as any)?.pagination?.totalPages ?? 1;

  function handleLimitChange(newLimit: 25 | 50 | 100 | 200) {
    setLimit(newLimit);
    setPage(1);
  }

  const listQueryKey = useCallback(
    () => orpc.documents.getFileStudentRecords.queryOptions({ input: { fileId, page, limit, hasWarnings: hasWarningsFilter } }).queryKey,
    [orpc, fileId, page, limit, hasWarningsFilter]
  );

  const handleDeleteRow = useCallback(
    async (recordId: string) => { await deleteMutation.mutateAsync({ recordId }); },
    [deleteMutation]
  );

  const handleDeleteRows = useCallback(
    async (recordIds: string[]) => {
      if (!recordIds.length) return;
      const qKey = listQueryKey();
      await queryClient.cancelQueries({ queryKey: qKey });
      const previousData = queryClient.getQueryData(qKey);
      const idSet = new Set(recordIds);
      queryClient.setQueryData(qKey, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.filter((r: any) => !idSet.has(r.id)),
          pagination: old.pagination
            ? { ...old.pagination, total: Math.max(0, (old.pagination.total ?? 0) - recordIds.length) }
            : old.pagination,
        };
      });
      const results = await Promise.allSettled(recordIds.map((recordId) => deleteMutation.mutateAsync({ recordId })));
      const failedIndices = results.reduce<number[]>((acc, r, i) => (r.status === "rejected" ? [...acc, i] : acc), []);
      if (failedIndices.length > 0) {
        const failedIds = new Set(failedIndices.map((i) => recordIds[i]));
        queryClient.setQueryData(qKey, (current: any) => {
          if (!current || !previousData) return current;
          const restoredItems = (previousData as any).items.filter((r: any) => failedIds.has(r.id));
          return {
            ...current,
            items: [...(current.items ?? []).filter((r: any) => !failedIds.has(r.id)), ...restoredItems],
            pagination: current.pagination
              ? { ...current.pagination, total: Math.max(0, (current.pagination.total ?? 0) + failedIds.size) }
              : current.pagination,
          };
        });
      }
      queryClient.invalidateQueries({ queryKey: qKey });
    },
    [listQueryKey, queryClient, deleteMutation]
  );

  const handleMassUpdateRows = useCallback(
    async (recordIds: string[], col: string, value: string | null) => {
      if (!recordIds.length) return;
      const qKey = listQueryKey();
      await queryClient.cancelQueries({ queryKey: qKey });
      const previousData = queryClient.getQueryData(qKey);
      const idSet = new Set(recordIds);
      queryClient.setQueryData(qKey, (old: any) => {
        if (!old) return old;
        return { ...old, items: old.items.map((r: any) => idSet.has(r.id) ? { ...r, recordData: { ...(r.recordData ?? {}), [col]: value } } : r) };
      });
      const targetRecords = records.filter((r) => idSet.has(r.id));
      try {
        await batchUpdateMutation.mutateAsync({
          updates: targetRecords.map((r) => ({ recordId: r.id, recordData: { ...(r.recordData ?? {}), [col]: value } as Record<string, string | null> })),
        });
      } catch (err) {
        queryClient.setQueryData(qKey, previousData);
        throw err;
      } finally {
        queryClient.invalidateQueries({ queryKey: qKey });
      }
    },
    [records, listQueryKey, queryClient, batchUpdateMutation]
  );

  const handleSave = useCallback(
    async (recordId: string, newData: Record<string, string | null>) => {
      setSavingId(recordId);
      try { await updateMutation.mutateAsync({ recordId, recordData: newData }); }
      finally { setSavingId(null); }
    },
    [updateMutation]
  );

  const handleMassUpdate = useCallback(
    async (col: string, value: string | null) => {
      if (!records.length) return;
      const qKey = listQueryKey();
      await queryClient.cancelQueries({ queryKey: qKey });
      const previousData = queryClient.getQueryData(qKey);
      const visibleIds = new Set(records.map((r) => r.id));
      queryClient.setQueryData(qKey, (old: any) => {
        if (!old) return old;
        return { ...old, items: old.items.map((r: any) => visibleIds.has(r.id) ? { ...r, recordData: { ...(r.recordData ?? {}), [col]: value } } : r) };
      });
      try {
        await batchUpdateMutation.mutateAsync({
          updates: records.map((r) => ({ recordId: r.id, recordData: { ...(r.recordData ?? {}), [col]: value } as Record<string, string | null> })),
        });
      } catch (err) {
        queryClient.setQueryData(qKey, previousData);
        throw err;
      } finally {
        queryClient.invalidateQueries({ queryKey: qKey });
      }
    },
    [records, listQueryKey, queryClient, batchUpdateMutation]
  );

  // ── Export ──────────────────────────────────────────────────────────────────
  const handleExport = useCallback(
    async (format: "xlsx" | "csv" | "json") => {
      setExportLoading(true);
      setExportDropdownOpen(false);
      try {
        const result = await queryClient.fetchQuery(
          orpc.documents.getFileStudentRecordsForExport.queryOptions({ input: { fileId, hasWarnings: hasWarningsFilter } })
        );

        if ((result as { truncated?: boolean }).truncated) {
          toast.warning("Only the first 10 000 records were exported. This file exceeds the export limit.");
        }

        let allRows = ((result as { items: RecordRow[] }).items ?? []) as RecordRow[];

        const nullCount = (r: RecordRow) =>
          stableColumnOrder.filter((c) => { const v = (r.recordData ?? {})[c]; return v == null || v === ""; }).length;

        if (hideNoiseRows) allRows = allRows.filter((r) => nullCount(r) <= 4);
        if (showPartialOnly) allRows = allRows.filter((r) => { const n = nullCount(r); return n > 1 && n <= 4; });
        if (hideMissingOnly) allRows = allRows.filter((r) => Object.values(r.recordData ?? {}).some((v) => v == null || v === ""));

        const sorted = sortedRecords(allRows);
        const exportRows = sorted.map((item) => ({ __record_id: item.id, ...(item.recordData ?? {}) }));
        const fileName = `records-${fileId.slice(0, 8)}`;

        if (format === "xlsx") downloadAsXlsx(exportRows, fileName, stableColumnOrder);
        else if (format === "csv") downloadAsCsv(exportRows, fileName, stableColumnOrder);
        else downloadAsJson(exportRows, fileName);
      } catch {
        toast.error("Export failed. Please try again.");
      } finally {
        setExportLoading(false);
      }
    },
    [fileId, queryClient, orpc, stableColumnOrder, hasWarningsFilter, hideNoiseRows, showPartialOnly, hideMissingOnly, sortedRecords]
  );

  // ── Import / Sync ───────────────────────────────────────────────────────────
  const handleImportFileSelect = useCallback(
    async (file: File) => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File is too large. Maximum size is 10 MB.");
        return;
      }
      setImportFile(file);
      setImportParsing(true);
      setImportDiff(null);
      try {
        const parsed = await parseImportFile(file);
        const allRecords = await queryClient.fetchQuery(
          orpc.documents.getFileStudentRecordsForExport.queryOptions({ input: { fileId } })
        );
        const typedRecords = allRecords as { items: Array<{ id: string; recordData: Record<string, string | null> | null }>; truncated?: boolean };
        if (typedRecords.truncated) {
          toast.warning("This file has more than 10 000 records. Only the first 10 000 will be included in the sync diff.");
        }
        const currentMap = new Map<string, Record<string, string | null>>(
          (typedRecords.items ?? []).map((r) => [r.id, r.recordData ?? {}])
        );
        setImportDiff(buildImportDiff(parsed, currentMap));
      } catch {
        toast.error("Could not parse file.");
      } finally {
        setImportParsing(false);
      }
    },
    [fileId, queryClient, orpc]
  );

  const handleImportApply = useCallback(async () => {
    if (!importDiff) return;
    const hasWork = importDiff.toUpdate.length > 0 || importDiff.toCreate.length > 0;
    if (!hasWork) return;
    setImportApplying(true);
    const qKey = listQueryKey();
    try {
      const createdIds: string[] = [];
      const CHUNK = 500;

      for (let i = 0; i < importDiff.toUpdate.length; i += CHUNK) {
        await batchUpdateMutation.mutateAsync({
          updates: importDiff.toUpdate.slice(i, i + CHUNK).map((u) => ({ recordId: u.id, recordData: u.recordData })),
        });
      }

      for (let i = 0; i < importDiff.toCreate.length; i += CHUNK) {
        const result = await batchCreateMutation.mutateAsync({ fileId, rows: importDiff.toCreate.slice(i, i + CHUNK) });
        createdIds.push(...(result as any).created);
      }

      if (createdIds.length > 0) setNewRecordIds(new Set(createdIds));

      await queryClient.invalidateQueries({ queryKey: qKey });

      const parts: string[] = [];
      if (importDiff.toUpdate.length) parts.push(`${importDiff.toUpdate.length} updated`);
      if (createdIds.length) parts.push(`${createdIds.length} created`);
      toast.success(parts.join(", ") + ".");
      setImportOpen(false);
      setImportFile(null);
      setImportDiff(null);
    } catch {
      toast.error("Sync failed. Please try again.");
    } finally {
      setImportApplying(false);
    }
  }, [importDiff, fileId, listQueryKey, queryClient, batchUpdateMutation, batchCreateMutation]);

  const handleImportDialogClose = useCallback((open: boolean) => {
    if (!open) { setImportFile(null); setImportDiff(null); setImportParsing(false); }
    setImportOpen(open);
  }, []);

  // ── Roster matching ─────────────────────────────────────────────────────────
  const handleAssignRoster = useCallback(
    (recordId: string, rosterId: string | null) => {
      const qKey = listQueryKey();
      assignRosterMutation.mutate(
        { recordId, rosterId },
        { onSuccess: () => queryClient.invalidateQueries({ queryKey: qKey }) }
      );
    },
    [listQueryKey, queryClient, assignRosterMutation]
  );

  const handleRerunMatching = useCallback(async () => {
    const qKey = listQueryKey();
    try {
      const res = await fetch("/api/roster/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Match request failed");
      const { matched, unmatched, total: tot } = await res.json() as { matched: number; unmatched: number; total: number };
      await queryClient.invalidateQueries({ queryKey: qKey });
      toast.success(`Matched ${matched} of ${tot} students.${unmatched ? ` ${unmatched} unmatched.` : ""}`);
    } catch {
      toast.error("Roster matching failed. Please try again.");
    }
  }, [fileId, listQueryKey, queryClient]);

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-xs text-muted-foreground font-semibold">
          {records.length} student{records.length !== 1 ? "s" : ""}
          {total !== records.length && <span className="text-muted-foreground"> of {total}</span>}
        </span>

        <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none" title="Hides rows with more than 4 blank fields.">
          <input type="checkbox" checked={hideNoiseRows} onChange={(e) => setHideNoiseRows(e.target.checked)} className="rounded accent-blue-600" />
          <span className={hideNoiseRows ? "text-blue-700 font-medium" : "text-muted-foreground"}>Students only</span>
          {hideNoiseRows && noiseRowCount > 0 && (
            <span className="text-muted-foreground">({noiseRowCount} noise row{noiseRowCount !== 1 ? "s" : ""} hidden)</span>
          )}
        </label>

        <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none" title="Shows only rows with 2–4 missing fields.">
          <input type="checkbox" checked={showPartialOnly} onChange={(e) => setShowPartialOnly(e.target.checked)} className="rounded accent-amber-500" />
          <span className={showPartialOnly ? "text-amber-700 font-medium" : "text-muted-foreground"}>Partially filled only</span>
          {showPartialOnly && partialRowCount > 0 && <span className="text-muted-foreground">({partialRowCount} rows)</span>}
        </label>

        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
          <input type="checkbox" checked={hasWarningsFilter === true} onChange={(e) => setHasWarningsFilter(e.target.checked ? true : undefined)} className="rounded" />
          Has warnings
        </label>

        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
          <input type="checkbox" checked={hideMissingOnly} onChange={(e) => setHideMissingOnly(e.target.checked)} className="rounded" />
          Missing fields only
        </label>

        <RowsPerPageSelect value={limit} onChange={handleLimitChange} />
        <HelpButton />

        {/* Export dropdown */}
        <div className="relative">
          <button
            onClick={() => setExportDropdownOpen((o) => !o)}
            onBlur={(e) => {
              if (!e.currentTarget.parentElement?.contains(e.relatedTarget as Node)) setExportDropdownOpen(false);
            }}
            disabled={exportLoading}
            title="Export records — respects active filters and sort order"
            className="flex items-center gap-1 text-xs border border-border rounded-lg px-2.5 py-1.5 hover:bg-muted disabled:opacity-50 transition-colors text-muted-foreground font-medium"
          >
            {exportLoading ? (
              <span className="text-muted-foreground">Exporting…</span>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                Export
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </>
            )}
          </button>
          {exportDropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-background border border-border rounded-xl shadow-lg z-20 py-1 overflow-hidden">
              <button onClick={() => handleExport("xlsx")} className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-muted text-foreground">
                <FileSpreadsheet className="w-3.5 h-3.5 text-green-600" />
                Export as Excel
              </button>
              <button onClick={() => handleExport("csv")} className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-muted text-foreground">
                <FileText className="w-3.5 h-3.5 text-blue-500" />
                Export as CSV
              </button>
              <button onClick={() => handleExport("json")} className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-muted text-foreground">
                <Braces className="w-3.5 h-3.5 text-orange-500" />
                Export as JSON
              </button>
            </div>
          )}
        </div>

        {/* Sync from file dialog */}
        <Dialog.Root open={importOpen} onOpenChange={handleImportDialogClose}>
          <Dialog.Trigger asChild>
            <button className="flex items-center gap-1 text-xs border border-border rounded-lg px-2.5 py-1.5 hover:bg-muted transition-colors text-muted-foreground font-medium">
              <Upload className="w-3.5 h-3.5" />
              Sync from file
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/30 z-40" />
            <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] max-w-[95vw] bg-background rounded-2xl shadow-2xl z-50 p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <Dialog.Title className="text-sm font-semibold text-foreground">Sync from file</Dialog.Title>
                  <Dialog.Description className="text-xs text-muted-foreground leading-relaxed">
                    Upload an Excel, CSV, or JSON file exported from this table. Existing rows are matched by their record ID and updated. Rows without an ID are created as new records. Nothing is deleted.
                  </Dialog.Description>
                </div>
                <Dialog.Close asChild>
                  <button className="shrink-0 text-muted-foreground hover:text-foreground p-1 -mr-1 -mt-1 rounded-lg hover:bg-muted transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </Dialog.Close>
              </div>

              <input
                ref={importFileRef}
                type="file"
                accept=".xlsx,.csv,.json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImportFileSelect(f);
                  e.target.value = "";
                }}
              />

              {importFile ? (
                <div className="flex items-center gap-3 border border-border rounded-xl px-4 py-3 bg-muted/30">
                  {importFile.name.endsWith(".xlsx") ? (
                    <FileSpreadsheet className="w-5 h-5 text-emerald-500 shrink-0" />
                  ) : importFile.name.endsWith(".json") ? (
                    <Braces className="w-5 h-5 text-amber-500 shrink-0" />
                  ) : (
                    <FileText className="w-5 h-5 text-blue-500 shrink-0" />
                  )}
                  <span className="text-xs font-medium text-foreground flex-1 truncate">{importFile.name}</span>
                  <button onClick={() => importFileRef.current?.click()} className="text-xs text-blue-600 hover:text-blue-800 font-medium shrink-0">Change</button>
                  <button onClick={() => { setImportFile(null); setImportDiff(null); }} className="text-muted-foreground hover:text-foreground shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => importFileRef.current?.click()}
                  className="w-full py-8 border-2 border-dashed border-border rounded-xl text-xs text-muted-foreground hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/30 transition-colors flex flex-col items-center gap-1.5"
                >
                  <Upload className="w-5 h-5 opacity-50" />
                  <span>Click to choose an <span className="font-medium">.xlsx</span>, <span className="font-medium">.csv</span>, or <span className="font-medium">.json</span> file</span>
                </button>
              )}

              {importParsing && (
                <div className="flex items-center justify-center gap-2 py-1">
                  <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                  <p className="text-xs text-muted-foreground">Analysing file…</p>
                </div>
              )}

              {importDiff && (
                <div className="rounded-xl border border-border overflow-hidden">
                  <div className="px-4 py-2.5 bg-muted/50 border-b border-border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Preview</p>
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    {importDiff.toCreate.length > 0 && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                          <span className="text-xs text-emerald-700 font-medium">New rows to create</span>
                        </div>
                        <span className="text-xs font-semibold text-emerald-700 tabular-nums">{importDiff.toCreate.length}</span>
                      </div>
                    )}
                    {importDiff.toUpdate.length > 0 && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                          <span className="text-xs text-blue-700 font-medium">Rows to update</span>
                        </div>
                        <span className="text-xs font-semibold text-blue-700 tabular-nums">{importDiff.toUpdate.length}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-muted-foreground/30 shrink-0" />
                        <span className="text-xs text-muted-foreground">Unchanged</span>
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums">{importDiff.unchanged}</span>
                    </div>
                    {importDiff.skipped > 0 && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                          <span className="text-xs text-amber-700">From another document</span>
                        </div>
                        <span className="text-xs text-amber-600 tabular-nums">{importDiff.skipped}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <Dialog.Close asChild>
                  <button className="px-4 py-2 text-xs border border-border rounded-lg text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
                </Dialog.Close>
                <button
                  onClick={handleImportApply}
                  disabled={(!importDiff?.toUpdate.length && !importDiff?.toCreate.length) || importApplying}
                  className="px-4 py-2 text-xs bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-40 hover:bg-blue-700 transition-colors min-w-[100px]"
                >
                  {importApplying ? "Applying…" : (() => {
                    const parts = [];
                    if (importDiff?.toUpdate.length) parts.push(`${importDiff.toUpdate.length} update${importDiff.toUpdate.length !== 1 ? "s" : ""}`);
                    if (importDiff?.toCreate.length) parts.push(`${importDiff.toCreate.length} new row${importDiff.toCreate.length !== 1 ? "s" : ""}`);
                    return parts.length ? `Apply — ${parts.join(" + ")}` : "Apply";
                  })()}
                </button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        {totalPages > 1 && (
          <div className="flex items-center gap-1 ml-auto">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-2 py-1 text-xs bg-muted hover:bg-muted disabled:opacity-40 rounded border border-border">Prev</button>
            <span className="text-xs text-muted-foreground tabular-nums">{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-2 py-1 text-xs bg-muted hover:bg-muted disabled:opacity-40 rounded border border-border">Next</button>
          </div>
        )}
      </div>

      {updateMutation.isError && (
        <div className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded px-3 py-2">
          Save failed: {String(updateMutation.error)}
        </div>
      )}
      {deleteMutation.isError && (
        <div className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded px-3 py-2">
          Delete failed: {String(deleteMutation.error)}
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p className="font-semibold">Could not load records</p>
          <p className="mt-0.5 text-destructive/80 text-xs">{String(error)}</p>
        </div>
      )}

      {!isLoading && !isError && total === 0 && (
        <div className="rounded-lg border border-border bg-muted/50 px-6 py-8 text-center">
          <p className="text-sm font-medium text-muted-foreground">No student records were extracted</p>
          <p className="mt-1 text-xs text-muted-foreground">
            The pipeline completed but did not find structured table data in this document. Check the Pipeline tab for details.
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="py-8 flex justify-center"><LoadingSpinner /></div>
      ) : !isError && total > 0 ? (
        <RecordDataGrid
          records={records}
          onSave={handleSave}
          saving={savingId}
          onDeleteRow={handleDeleteRow}
          onDeleteRows={handleDeleteRows}
          onMassUpdateRows={handleMassUpdateRows}
          columnOrder={stableColumnOrder}
          onAddRows={handleAddRows}
          onMassUpdate={handleMassUpdate}
          sortCol={sortCol}
          sortDir={sortDir}
          onToggleSort={toggleSort}
          onRenumber={handleRenumber}
          lastSerialNumber={lastSerialNumber}
          onRenumberComplete={setLastSerialNumber}
          rosterEntries={rosterEntriesMap.size > 0 ? rosterEntriesMap : undefined}
          onAssignRoster={rosterEntriesMap.size > 0 ? handleAssignRoster : undefined}
          onRerunMatching={rosterEntriesMap.size > 0 ? handleRerunMatching : undefined}
          onColumnReorder={handleColumnReorder}
          onResetColumnOrder={handleResetColumnOrder}
          newRecordIds={newRecordIds.size > 0 ? newRecordIds : undefined}
        />
      ) : null}
    </div>
  );
}
