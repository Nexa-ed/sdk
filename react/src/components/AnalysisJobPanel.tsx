"use client";

import { useGetLatestAnalysisJobForFile, useGetAnalysisJobResult } from "../hooks/useGetAnalysisJob";
import { LoadingSpinner } from "../primitives/LoadingSpinner";
import { Badge, StatusBadge } from "../primitives/Badge";

export interface AnalysisJobPanelProps {
  fileId: string;
  /** Show LLM analysis results. Defaults to false. */
  llmEnabled?: boolean;
}

export function AnalysisJobPanel({ fileId, llmEnabled = false }: AnalysisJobPanelProps) {
  const { data: jobData, isLoading } = useGetLatestAnalysisJobForFile(fileId);

  // Always call hook (Rules of Hooks); enabled only when llmEnabled + job done
  const resultJobId =
    llmEnabled && jobData?.status === "done" && (jobData?.jobId ?? jobData?.id)
      ? (jobData.jobId ?? jobData.id)!
      : "";
  const { data: resultDataRaw } = useGetAnalysisJobResult(resultJobId);

  if (!llmEnabled) {
    return (
      <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-6 text-center space-y-1">
        <p className="text-sm font-medium text-gray-500">LLM refinement is not configured</p>
        <p className="text-xs text-gray-400">
          Pass <code className="bg-gray-100 px-1 rounded font-mono">llmEnabled</code> to enable Mastra results analysis.
        </p>
      </div>
    );
  }

  const resultData = resultDataRaw as {
    result: { totalRecords?: number; totalBatches?: number; groupsCreated?: string[] } | null;
  } | undefined;

  if (isLoading) return <div className="py-8 flex justify-center"><LoadingSpinner /></div>;
  if (!jobData) return <p className="text-gray-400 text-sm italic">No analysis job found for this file.</p>;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Status</p>
          <StatusBadge status={jobData.status} />
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Pages</p>
          <span className="text-sm font-bold text-gray-800">
            {jobData.pagesProcessed ?? 0}/{jobData.totalPages ?? "?"}
          </span>
        </div>
        {jobData.errorMessage && (
          <div className="col-span-full">
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 font-mono">
              {jobData.errorMessage}
            </p>
          </div>
        )}
      </div>

      {resultData && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Analysis Result</h3>
          <div className="flex flex-wrap gap-4 text-sm">
            <span>Records: <strong>{resultData.result?.totalRecords ?? "—"}</strong></span>
            <span>Batches: <strong>{resultData.result?.totalBatches ?? "—"}</strong></span>
          </div>
          {resultData.result?.groupsCreated && resultData.result.groupsCreated.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-2">Subject Groups Created</p>
              <div className="flex flex-wrap gap-1.5">
                {resultData.result.groupsCreated.map((g) => (
                  <Badge key={g} label={g} className="bg-indigo-100 text-indigo-800" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
