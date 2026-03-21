"use client";

import { useGetChunksWithPages } from "../hooks/useGetFileChunks";
import { LoadingSpinner } from "../primitives/LoadingSpinner";
import { StatusBadge } from "../primitives/Badge";
import { fmtMs, pageColor, accuracyBar } from "../utils";

export function ChunkPageMap({
  fileId,
  selectedPage,
  onSelectPage,
}: {
  fileId: string;
  selectedPage: number | null;
  onSelectPage: (page: number) => void;
}) {
  const { data, isLoading, isError } = useGetChunksWithPages(fileId);

  if (isLoading) return <div className="py-6 flex justify-center"><LoadingSpinner /></div>;
  if (isError) return <p className="text-red-500 text-sm">Failed to load chunk data. Please try refreshing.</p>;
  if (!data?.length) return <p className="text-gray-400 text-sm italic">No chunk data yet.</p>;

  return (
    <div className="space-y-2">
      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-1">
        {[
          { color: "bg-green-500", label: "LLM refined" },
          { color: "bg-teal-400", label: "OCR done" },
          { color: "bg-yellow-400", label: "LLM queued" },
          { color: "bg-red-400", label: "Failed" },
          { color: "bg-gray-200", label: "Pending" },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1">
            <span className={`w-3 h-3 rounded ${color} inline-block`} />
            {label}
          </span>
        ))}
      </div>

      {data.map((chunk) => {
        const pages = chunk.pages ?? [];
        const totalRecords = pages.reduce((s, p) => s + (p.transactionCount ?? 0), 0);
        const refinedPages = pages.filter((p) => p.hasLLMRefinement).length;
        const failedPages = pages.filter((p) => (p.status ?? "").includes("failed")).length;
        const pct = pages.length > 0 ? Math.round((refinedPages / pages.length) * 100) : 0;
        const { color: barColor, label: barLabel } = accuracyBar(pct);

        return (
          <div
            key={chunk.chunkId}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-4"
          >
            {/* Chunk header row */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3">
              <span className="text-sm font-bold text-gray-800">
                Batch {chunk.chunkIndex + 1}
              </span>
              <span className="text-xs text-gray-400 font-mono">
                p.{chunk.pageStart}–{chunk.pageEnd}
              </span>
              <StatusBadge status={chunk.status} />
              {chunk.ocrProcessingTimeMs != null && (
                <span className="text-xs text-gray-400">OCR {fmtMs(chunk.ocrProcessingTimeMs)}</span>
              )}
              {chunk.llmProcessingTimeMs != null && (
                <span className="text-xs text-gray-400">LLM {fmtMs(chunk.llmProcessingTimeMs)}</span>
              )}
              {totalRecords > 0 && (
                <span className="text-xs text-gray-500">{totalRecords} records</span>
              )}
              {failedPages > 0 && (
                <span className="text-xs text-red-500 font-medium">
                  {failedPages} page{failedPages > 1 ? "s" : ""} failed
                </span>
              )}

              {/* Accuracy bar — pushed right */}
              <div className="ml-auto flex items-center gap-2">
                <span
                  className="text-xs text-gray-400"
                  title={`${refinedPages} of ${pages.length} pages have LLM refinement`}
                >
                  {barLabel}
                </span>
                <div
                  className="w-20 h-1.5 rounded-full bg-gray-100 overflow-hidden border border-gray-200"
                  title={`${pct}% of pages LLM-refined`}
                >
                  <div
                    className={`h-full rounded-full transition-all ${barColor}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs tabular-nums text-gray-400">{pct}%</span>
              </div>
            </div>

            {/* Pages */}
            {pages.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {pages.map((p, pageIdx) => (
                  <button
                    key={`${chunk.chunkId}_${p.pageNumber}_${pageIdx}`}
                    onClick={() => onSelectPage(p.pageNumber)}
                    title={`Page ${p.pageNumber} · ${p.hasLLMRefinement ? "LLM refined" : (p.status ?? "pending")} · ${p.transactionCount ?? 0} records`}
                    className={`w-9 h-9 rounded-lg text-xs font-bold transition-all
                      ${selectedPage === p.pageNumber ? "ring-2 ring-blue-500 ring-offset-1 scale-110 shadow-md" : "hover:scale-105 hover:shadow-sm"}
                      ${pageColor(!!p.hasLLMRefinement, p.status)}`}
                  >
                    {p.pageNumber}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No page data yet.</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
