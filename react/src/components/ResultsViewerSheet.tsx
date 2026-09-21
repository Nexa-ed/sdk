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
  /**
   * Which tab to open on. Defaults to "Pipeline".
   * Pass "Records" when opening from a "Review Extracted Data" action so the
   * teacher lands directly on the records and match CTA.
   */
  initialTab?: "Pipeline" | "Records" | "Stats" | "Original";
  /**
   * When provided, a "Match Students with Class" CTA is shown at the top of
   * the Records tab. Call this to hand off to your student-matching flow.
   */
  onMatchStudents?: () => void;
  /**
   * Direct URL of the original uploaded PDF (e.g. the UploadThing ufsUrl).
   * When provided, an "Original" tab is added so users can compare the source
   * document against extracted records side-by-side.
   */
  pdfUrl?: string;
  /** File name shown in the Original tab header. */
  pdfFileName?: string;
}

type Tab = "Pipeline" | "Records" | "Stats" | "Original";

export function ResultsViewerSheet({
  fileId,
  open,
  onOpenChange,
  title = "Pipeline Results",
  llmEnabled = false,
  initialTab = "Pipeline",
  onMatchStudents,
  pdfUrl,
  pdfFileName,
}: ResultsViewerSheetProps) {
  const tabs: Tab[] = ["Pipeline", "Records", "Stats", ...(pdfUrl ? ["Original" as Tab] : [])];
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  // Reset tab when a new file is opened or when initialTab changes
  useEffect(() => {
    if (open) setActiveTab(initialTab);
  }, [open, fileId, initialTab]);

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
          {tabs.map((tab) => (
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
            <>
              {onMatchStudents && (
                <div className="flex items-center justify-between gap-4 rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-indigo-900">
                      Match Students with Your Class
                    </p>
                    <p className="mt-0.5 text-xs text-indigo-600">
                      Review the extracted records below, then map them to enrolled
                      students so scores are saved to the gradebook.
                    </p>
                  </div>
                  <button
                    onClick={onMatchStudents}
                    className="shrink-0 flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:bg-indigo-800 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Match with Class
                  </button>
                </div>
              )}
              <StudentRecordsTable fileId={fileId} />
            </>
          )}
          {activeTab === "Stats" && (
            <StatsPanel fileId={fileId} />
          )}
          {activeTab === "Original" && pdfUrl && (
            <div className="-m-6 h-full" style={{ minHeight: "calc(100vh - 120px)" }}>
              {/* Toolbar */}
              <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-200 bg-white">
                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="flex-1 text-xs text-gray-600 truncate font-medium">
                  {pdfFileName ?? "Original document"}
                </span>
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Open in new tab
                </a>
              </div>
              {/* iframe fills the remaining panel height */}
              <iframe
                src={pdfUrl}
                title={pdfFileName ?? "Original PDF"}
                className="w-full border-0 bg-gray-100"
                style={{ height: "calc(100vh - 168px)" }}
              />
            </div>
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
