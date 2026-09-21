"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import type { RecordRow, RosterEntry } from "../types";

export type { RosterEntry };

function statusColor(status: string | null | undefined) {
  if (status === "auto") return "bg-green-100 text-green-700 border-green-200";
  if (status === "manual") return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-gray-100 text-gray-500 border-gray-200";
}

export function RosterCell({
  record,
  rosterEntries,
  onAssignRoster,
  disabled,
}: {
  record: RecordRow;
  rosterEntries: Map<string, RosterEntry>;
  onAssignRoster?: (recordId: string, rosterId: string | null) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);

  // Compute fixed position from trigger bounding rect when opening
  useEffect(() => {
    if (!open) { setPos(null); return; }
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left });
    }
  }, [open]);

  // Close if click is outside both trigger and portal
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (!triggerRef.current?.contains(target) && !portalRef.current?.contains(target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on scroll so the popover doesn't drift from its anchor
  useEffect(() => {
    if (!open) return;
    function onScroll() { setOpen(false); }
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    return () => window.removeEventListener("scroll", onScroll, { capture: true });
  }, [open]);

  const matched = record.rosterId ? rosterEntries.get(record.rosterId) : null;
  const status = record.rosterMatchStatus;

  const filteredEntries = Array.from(rosterEntries.values()).filter((e) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const metaValues = Object.values(e.metadata ?? {}).join(" ").toLowerCase();
    return (
      e.name.toLowerCase().includes(q) ||
      (e.externalId ?? "").toLowerCase().includes(q) ||
      (e.classGroup ?? "").toLowerCase().includes(q) ||
      metaValues.includes(q)
    );
  });

  function handleSelect(rosterId: string | null) {
    onAssignRoster?.(record.id, rosterId);
    setOpen(false);
    setSearch("");
  }

  const badgeLabel = matched
    ? (matched.externalId ?? matched.name.split(" ")[0] ?? "—") + (matched.classGroup ? ` · ${matched.classGroup}` : "")
    : status === "unmatched"
    ? "unmatched"
    : null;

  const popover = open && pos ? (
    <div
      ref={portalRef}
      style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 9999 }}
      className="w-56 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
    >
      <div className="p-2 border-b border-gray-100">
        <input
          autoFocus
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search roster…"
          className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-300"
        />
      </div>
      <div className="max-h-48 overflow-y-auto">
        {filteredEntries.slice(0, 50).map((e) => {
          const metaTags = Object.entries(e.metadata ?? {}).map(([, v]) => v).filter(Boolean);
          return (
            <button
              key={e.id}
              onMouseDown={(ev) => { ev.preventDefault(); handleSelect(e.id); }}
              className={`flex flex-col w-full px-3 py-1.5 text-xs hover:bg-gray-50 text-left gap-0.5 ${
                e.id === record.rosterId ? "bg-green-50 text-green-700 font-medium" : "text-gray-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="truncate">{e.name}</span>
                <span className="text-gray-400 text-[10px] shrink-0 ml-2">
                  {[e.externalId, e.classGroup].filter(Boolean).join(" · ")}
                </span>
              </div>
              {metaTags.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {metaTags.map((v, i) => (
                    <span key={i} className="inline-flex items-center px-1 py-0 rounded text-[9px] bg-gray-100 text-gray-500 border border-gray-200">
                      {v}
                    </span>
                  ))}
                </div>
              )}
            </button>
          );
        })}
        {filteredEntries.length === 0 && (
          <p className="text-xs text-gray-400 px-3 py-2 italic">No matches</p>
        )}
      </div>
      {record.rosterId && (
        <div className="border-t border-gray-100">
          <button
            onMouseDown={(ev) => { ev.preventDefault(); handleSelect(null); }}
            className="w-full px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 text-left"
          >
            Clear match
          </button>
        </div>
      )}
    </div>
  ) : null;

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        disabled={disabled || !onAssignRoster}
        onClick={() => { setOpen((o) => !o); setSearch(""); }}
        title={matched
          ? [
              matched.name,
              record.rosterMatchConfidence ? `(${Math.round(Number(record.rosterMatchConfidence) * 100)}%)` : "",
              ...Object.entries(matched.metadata ?? {}).map(([k, v]) => `${k}: ${v}`),
            ].filter(Boolean).join(" · ")
          : "Click to assign roster entry"}
        className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border transition-colors ${
          badgeLabel
            ? statusColor(status)
            : "border-dashed border-gray-200 text-gray-300 hover:border-gray-400 hover:text-gray-400"
        } ${onAssignRoster && !disabled ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
      >
        {badgeLabel ?? "+"}
      </button>

      {typeof document !== "undefined" && popover
        ? createPortal(popover, document.body)
        : null}
    </div>
  );
}
