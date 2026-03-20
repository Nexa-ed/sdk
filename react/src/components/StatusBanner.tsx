"use client";

import { useFileProgress } from "../hooks/useFileProgress";
import { Badge, StatusBadge } from "../primitives/Badge";
import { fmtMs } from "../utils";

export function StatusBanner({ fileId }: { fileId: string }) {
  const p = useFileProgress(fileId);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <StatusBadge status={p.fileStatus} />
        {p.isError && <Badge label="SSE error" className="bg-red-100 text-red-700" />}
        {p.activeRetries > 0 && (
          <Badge
            label={`${p.activeRetries} ${p.activeRetries === 1 ? "retry" : "retries"}`}
            className="bg-orange-100 text-orange-700"
          />
        )}
        {p.warnings.length > 0 && (
          <Badge label={`${p.warnings.length} warning(s)`} className="bg-amber-100 text-amber-800" />
        )}
        <span className="text-xs text-gray-400 ml-auto">
          Elapsed: {fmtMs(p.elapsedMs)}
          {p.etaMs !== null && ` · ETA: ~${fmtMs(p.etaMs)}`}
        </span>
      </div>

      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-2.5 rounded-full transition-all duration-700 ${
            p.isComplete ? "bg-green-500" : p.isError ? "bg-red-400" : "bg-blue-500"
          } ${!p.isComplete && !p.isError && p.progressPct > 0 ? "animate-pulse" : ""}`}
          style={{ width: `${p.progressPct}%` }}
        />
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
        <span>Pages: <strong className="text-gray-800">{p.pagesProcessed}/{p.totalPages}</strong></span>
        <span>
          Chunks: <strong className="text-gray-800">{p.chunksComplete}/{p.chunksTotal}</strong>
          {p.chunksFailed > 0 && <span className="text-red-500 ml-1">({p.chunksFailed} failed)</span>}
        </span>
        <span>Records extracted: <strong className="text-gray-800">{p.recordsExtracted}</strong></span>
        {p.analysisJob && (
          <span>
            Analysis: <StatusBadge status={p.analysisJob.status} /> {p.analysisJob.pagesProcessed}/{p.analysisJob.totalPages}
          </span>
        )}
      </div>
    </div>
  );
}
