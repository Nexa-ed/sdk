"use client";

import { useGetFileStatistics } from "../hooks/useGetFileStats";
import { LoadingSpinner } from "../primitives/LoadingSpinner";
import { fmtMs } from "../utils";

export function StatsPanel({ fileId }: { fileId: string }) {
  const { data, isLoading } = useGetFileStatistics(fileId);

  if (isLoading) return <div className="py-8 flex justify-center"><LoadingSpinner /></div>;
  if (!data) return <p className="text-gray-400 text-sm italic">No statistics available.</p>;

  const { chunks, records, file, retries } = data;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Chunks Success Rate</p>
          <span className="text-sm font-bold text-gray-800">{chunks.successRate}%</span>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Chunks (done/total)</p>
          <span className="text-sm font-bold text-gray-800">{chunks.completed}/{chunks.total}</span>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Records</p>
          <span className="text-sm font-bold text-gray-800">{records.total}</span>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Processing Time</p>
          <span className="text-sm font-bold text-gray-800">{file.processingTimeMs ? fmtMs(file.processingTimeMs) : "—"}</span>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Retry Waves</p>
          <span className="text-sm font-bold text-gray-800">{retries.totalWaves}</span>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Pages Retried</p>
          <span className="text-sm font-bold text-gray-800">{retries.pagesRetried}</span>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Warnings</p>
          <span className="text-sm font-bold text-gray-800">{retries.pagesWithWarnings}</span>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Chunks by Status</p>
          <div className="flex flex-wrap gap-1 mt-0.5">
            {chunks.byStatus?.map((s) => (
              <span key={s.status} className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                {s.status}: {s.count}
              </span>
            ))}
          </div>
        </div>
      </div>

      {retries.waves && retries.waves.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Retry Waves ({retries.waves.length})</h3>
          <pre className="text-xs font-mono bg-gray-900 text-green-300 p-4 rounded-lg overflow-auto max-h-64">
            {JSON.stringify(retries.waves, null, 2)}
          </pre>
        </div>
      )}

      <details className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <summary className="px-5 py-3 cursor-pointer text-xs text-gray-400 hover:bg-gray-50">Show raw stats JSON</summary>
        <pre className="text-xs font-mono bg-gray-900 text-green-300 p-4 overflow-auto max-h-96">
          {JSON.stringify(data, null, 2)}
        </pre>
      </details>
    </div>
  );
}
