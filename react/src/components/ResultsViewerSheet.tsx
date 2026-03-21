"use client";

import { useState, useEffect } from "react";
import { PipelineTimeline } from "./PipelineTimeline";
import { StudentRecordsTable } from "./StudentRecordsTable";
import { StatsPanel } from "./StatsPanel";

export interface ResultsViewerSheetProps {
  /** NeonDB file ID to display */
  fileId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Header title */
  title?: string;
  /** Whether LLM refinement is enabled in your pipeline. Passed to PipelineTimeline. */
  llmEnabled?: boolean;
}

const TABS = ["Pipeline", "Records", "Stats"] as const;
type Tab = (typeof TABS)[number];

export function ResultsViewerSheet({
  fileId,
  open,
  onOpenChange,
  title = "Pipeline Results",
  llmEnabled = false,
}: ResultsViewerSheetProps) {
  const [activeTab, setActiveTab] = useState<Tab>("Pipeline");

  // Reset tab when a new file is opened
  useEffect(() => {
    if (open) setActiveTab("Pipeline");
  }, [open, fileId]);

  // Trap keyboard: close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        aria-hidden="true"
        onClick={() => onOpenChange(false)}
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-4xl flex-col bg-gray-50 shadow-2xl"
        style={{ animation: "nexaSlideIn 0.22s ease-out" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-100">
              <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">{title}</h2>
              <p className="text-xs text-gray-500 font-mono">{fileId}</p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-gray-200 bg-white px-6 shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === "Pipeline" && (
            <PipelineTimeline fileId={fileId} llmEnabled={llmEnabled} />
          )}
          {activeTab === "Records" && (
            <StudentRecordsTable fileId={fileId} />
          )}
          {activeTab === "Stats" && (
            <StatsPanel fileId={fileId} />
          )}
        </div>
      </aside>

      {/* Keyframe for slide-in animation */}
      <style>{`
        @keyframes nexaSlideIn {
          from { transform: translateX(100%); opacity: 0.5; }
          to   { transform: translateX(0);    opacity: 1;   }
        }
      `}</style>
    </>
  );
}
