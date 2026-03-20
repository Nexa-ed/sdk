"use client";

import { useState } from "react";

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
    return <span className="text-gray-400 text-xs mx-0.5">{children}</span>;
  }
  return (
    <kbd className={`inline-flex items-center px-1.5 py-0.5 rounded border border-gray-300 bg-gray-100 text-gray-700 font-mono text-xs shadow-sm ${isWord ? "px-2" : ""}`}>
      {children}
    </kbd>
  );
}

export function HelpButton() {
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(0);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Keyboard shortcuts & interactions guide"
        className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 border border-gray-200 rounded-md hover:bg-gray-50 hover:text-gray-700 transition-colors select-none"
      >
        <span className="font-bold text-gray-400">?</span>
        <span className="hidden sm:inline">Help</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-sm font-bold text-gray-800">Table Interactions Guide</h2>
                <p className="text-xs text-gray-400 mt-0.5">Everything you can do inside the student records table</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-1 min-h-0">
              <nav className="w-44 shrink-0 border-r border-gray-100 py-3 overflow-y-auto">
                {SECTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveSection(i)}
                    className={`w-full text-left px-4 py-2 text-xs flex items-center gap-2 transition-colors ${
                      activeSection === i
                        ? "bg-blue-50 text-blue-700 font-semibold border-r-2 border-blue-500"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span>{s.icon}</span>
                    {s.title}
                  </button>
                ))}
              </nav>

              <div className="flex-1 overflow-y-auto px-6 py-4">
                {SECTIONS[activeSection] && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <span>{SECTIONS[activeSection].icon}</span>
                      {SECTIONS[activeSection].title}
                    </h3>
                    <div className="space-y-2.5">
                      {SECTIONS[activeSection].items.map((item, i) => (
                        <div key={i} className="flex gap-3 items-start">
                          {item.keys ? (
                            <div className="flex items-center gap-0.5 flex-wrap min-w-[140px] shrink-0">
                              {item.keys.map((k, ki) => <Key key={ki}>{k}</Key>)}
                            </div>
                          ) : (
                            <div className="min-w-[140px] shrink-0 text-xs text-gray-500 italic leading-5">{item.label}</div>
                          )}
                          <div className="flex-1">
                            {item.keys && (
                              <p className="text-xs font-medium text-gray-700">{item.label}</p>
                            )}
                            {item.detail && (
                              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.detail}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <p className="text-xs text-gray-400">Tip: all edits save instantly and update the server in the background.</p>
              <button
                onClick={() => setOpen(false)}
                className="px-3 py-1.5 text-xs bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
