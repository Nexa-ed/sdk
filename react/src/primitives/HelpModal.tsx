"use client";

import { useState, useRef, useEffect } from "react";

type Section = {
  title: string;
  icon: string;
  items: { keys?: string[]; label: string; detail?: string }[];
};

const SECTIONS: Section[] = [
  {
    title: "Cell Selection",
    icon: "⬜",
    items: [
      { keys: ["Click"], label: "Select a cell", detail: "Sets the active selection to that single cell." },
      { keys: ["Double-click"], label: "Edit a cell", detail: "Opens the cell for inline text editing." },
      { keys: ["Shift", "+", "Click"], label: "Extend selection to cell", detail: "Expands the selection rectangle to include the clicked cell." },
      { keys: ["↑ ↓ ← →"], label: "Move selection one cell", detail: "Moves the single-cell selection in the given direction." },
      { keys: ["Shift", "+", "↑ ↓ ← →"], label: "Extend selection", detail: "Keeps the anchor fixed and moves the opposite corner." },
      { keys: ["Ctrl", "+", "A"], label: "Select all cells", detail: "Selects every cell in the current filtered view." },
      { keys: ["Esc"], label: "Clear selection", detail: "Deselects all cells and returns the table to its normal state." },
    ],
  },
  {
    title: "Editing",
    icon: "✏️",
    items: [
      { keys: ["Enter", "or", "F2"], label: "Edit active cell", detail: "Starts editing the currently selected cell without a mouse click." },
      { keys: ["Tab"], label: "Commit + move right", detail: "Saves the current edit and moves to the next cell to the right. Wraps to the next row." },
      { keys: ["Shift", "+", "Tab"], label: "Commit + move left", detail: "Saves and moves to the previous cell. Wraps to the previous row." },
      { keys: ["Enter", "or", "↓"], label: "Commit + move down", detail: "Saves the edit and moves to the cell directly below." },
      { keys: ["↑"], label: "Commit + move up", detail: "Saves the edit and moves to the cell directly above." },
      { keys: ["Esc"], label: "Cancel edit", detail: "Discards the typed value and restores the original. Keeps the cell selected." },
      { keys: ["Click ✓"], label: "Save edit", detail: "Commits the typed value and saves it to the server." },
      { keys: ["Click ✕"], label: "Cancel edit", detail: "Discards typed value without saving." },
    ],
  },
  {
    title: "Bulk Operations",
    icon: "⚡",
    items: [
      { keys: ["Delete", "or", "Backspace"], label: "Clear selected cells", detail: "Wipes the value from every cell in the current selection." },
      { label: "Click column label → mass-update bar", detail: "Opens a blue bar to set one value across all visible records for that column." },
      { label: "⟳ renumber button in column header", detail: "Opens a violet bar to assign sequential numbers down the column." },
    ],
  },
  {
    title: "Row Management",
    icon: "🗑️",
    items: [
      { label: "Checkbox (leftmost column)", detail: "Click to toggle a row in/out of the selection." },
      { keys: ["Shift", "+", "Click checkbox"], label: "Range-select rows", detail: "Selects all rows between the last checked row and the clicked row." },
      { label: "Header checkbox", detail: "Checks or unchecks all visible rows at once." },
      { label: "Selection tray — 🗑 Delete N rows", detail: "Permanently removes all selected rows after a confirmation step." },
      { label: "+ Add rows button", detail: "Opens a modal to manually enter student rows that the OCR scanner missed." },
    ],
  },
  {
    title: "Sorting & Filtering",
    icon: "↕️",
    items: [
      { label: "⇅ sort button in column header", detail: "Click once for A→Z, again for Z→A, again to restore original order." },
      { label: "Students only", detail: "Hides noise rows (PDF headers, footers, scanner artefacts)." },
      { label: "Missing fields only", detail: "Shows only rows that have at least one blank cell." },
      { label: "Has warnings", detail: "Shows only records flagged with a processing warning." },
      { label: "Rows selector", detail: "Change how many records load per page: 25 / 50 / 100 / 200." },
    ],
  },
  {
    title: "Reading the Table",
    icon: "📖",
    items: [
      { label: "— (red dash)", detail: "The OCR found no value for this cell." },
      { label: "Red row background", detail: "More than 4 blank fields — likely a noise row." },
      { label: "Amber row background", detail: "2–4 blank fields — partial record that may need correction." },
      { label: "⚠ indicator", detail: "The pipeline attached a processing warning to this row." },
    ],
  },
];

function Key({ children }: { children: string }) {
  const isWord = children.length > 2 && !["Tab", "Esc", "Del", "F2"].includes(children);
  if (["or", "and", "+"].includes(children)) {
    return <span className="text-muted-foreground text-xs mx-0.5">{children}</span>;
  }
  return (
    <kbd className={`inline-flex items-center px-1.5 py-0.5 rounded border border-border bg-muted text-foreground font-mono text-xs shadow-sm ${isWord ? "px-2" : ""}`}>
      {children}
    </kbd>
  );
}

export function HelpButton() {
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title="Keyboard shortcuts & interactions guide"
        className={[
          "flex items-center gap-1 px-2 py-1 text-xs border rounded-md transition-colors select-none",
          open
            ? "bg-muted text-foreground border-border"
            : "text-muted-foreground border-border hover:bg-muted hover:text-foreground",
        ].join(" ")}
      >
        <span className="font-bold">?</span>
        <span className="hidden sm:inline">Help</span>
      </button>

      {open && (
        <div
          className="absolute bottom-full right-0 mb-2 z-50 w-[min(640px,90vw)] bg-background border border-border rounded-xl shadow-xl flex flex-col overflow-hidden"
          style={{ maxHeight: "min(500px, 70vh)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
            <div>
              <h2 className="text-sm font-bold text-foreground">Table Interactions Guide</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Everything you can do inside the student records table</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground w-6 h-6 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* Nav */}
            <nav className="w-40 shrink-0 border-r border-border py-2 overflow-y-auto">
              {SECTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSection(i)}
                  className={[
                    "w-full text-left px-3 py-1.5 text-xs flex items-center gap-1.5 transition-colors",
                    activeSection === i
                      ? "bg-primary/10 text-primary font-semibold border-r-2 border-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  ].join(" ")}
                >
                  <span>{s.icon}</span>
                  {s.title}
                </button>
              ))}
            </nav>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {SECTIONS[activeSection] && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <span>{SECTIONS[activeSection].icon}</span>
                    {SECTIONS[activeSection].title}
                  </h3>
                  <div className="space-y-2.5">
                    {SECTIONS[activeSection].items.map((item, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        {item.keys ? (
                          <div className="flex items-center gap-0.5 flex-wrap min-w-[130px] shrink-0">
                            {item.keys.map((k, ki) => <Key key={ki}>{k}</Key>)}
                          </div>
                        ) : (
                          <div className="min-w-[130px] shrink-0 text-xs text-muted-foreground italic leading-5">{item.label}</div>
                        )}
                        <div className="flex-1">
                          {item.keys && (
                            <p className="text-xs font-medium text-foreground">{item.label}</p>
                          )}
                          {item.detail && (
                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.detail}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-2.5 border-t border-border bg-muted/30 flex items-center justify-between shrink-0">
            <p className="text-xs text-muted-foreground">Tip: all edits save instantly and update the server in the background.</p>
            <button
              onClick={() => setOpen(false)}
              className="px-3 py-1 text-xs bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity font-medium ml-3 shrink-0"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
