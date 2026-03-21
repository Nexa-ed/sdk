"use client";

import { useGetFileChunks } from "../hooks/useGetFileChunks";
import { useFileProgress } from "../hooks/useFileProgress";
import { LoadingSpinner } from "../primitives/LoadingSpinner";
import { fmtMs, stageRing, stageRow, stageLine, stageText } from "../utils";
import type { StageStatus } from "../types";
import type { FileChunk } from "../api-types";

function ChunkPills({
  chunks,
  activeStatuses,
  doneStatuses,
  failedStatuses,
  timingKey,
}: {
  chunks: FileChunk[];
  activeStatuses: string[];
  doneStatuses: string[];
  failedStatuses: string[];
  timingKey: "ocrProcessingTimeMs" | "llmProcessingTimeMs";
}) {
  if (!chunks.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {chunks.map((c) => {
        const isDone   = doneStatuses.includes(c.status);
        const isFail   = failedStatuses.includes(c.status);
        const isActive = activeStatuses.includes(c.status);
        const timing   = c[timingKey];
        return (
          <span
            key={c.id}
            title={`Chunk ${c.chunkIndex + 1} · p.${c.pageStart}–${c.pageEnd} · ${c.status}${timing ? ` · ${fmtMs(timing)}` : ""}`}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border cursor-default select-none
              ${isFail   ? "bg-red-100 border-red-300 text-red-700" :
                isActive ? "bg-blue-100 border-blue-300 text-blue-700 animate-pulse" :
                isDone   ? "bg-green-100 border-green-300 text-green-700" :
                           "bg-gray-100 border-gray-200 text-gray-400"}`}
          >
            C{c.chunkIndex + 1}
            {timing ? <span className="opacity-60 ml-0.5">{fmtMs(timing)}</span> : null}
          </span>
        );
      })}
    </div>
  );
}

export interface PipelineTimelineProps {
  fileId: string;
  /** Whether the LLM refinement stage is enabled. Defaults to false. */
  llmEnabled?: boolean;
}

export function PipelineTimeline({ fileId, llmEnabled = false }: PipelineTimelineProps) {
  const p = useFileProgress(fileId);
  const { data: chunksData } = useGetFileChunks(fileId, 1, 100);
  const chunks = (chunksData?.items ?? []) as FileChunk[];
  const totalChunkCount = (chunksData as { totalCount?: number } | undefined)?.totalCount ?? chunks.length;
  const isChunkListPartial = totalChunkCount > 100;

  const fs = p.fileStatus;

  const ocrActive    = chunks.filter(c => ["processing","retrying","analyzing_layout","extracting_data"].includes(c.status)).length;
  const ocrFailed    = chunks.filter(c => ["failed","retrying_failed"].includes(c.status)).length;
  const ocrProcessed = chunks.filter(c => !["pending","queued","uploading"].includes(c.status)).length;
  const ocrSucceeded = chunks.filter(c => !["pending","queued","uploading","failed","retrying_failed"].includes(c.status)).length;

  const llmActive  = chunks.filter(c => ["llm_queued","llm_processing","llm_refining"].includes(c.status)).length;
  const llmFailed  = chunks.filter(c => c.status === "llm_failed").length;
  const llmDone    = chunks.filter(c => ["llm_completed","completed"].includes(c.status)).length;

  const total = p.chunksTotal;

  // ocrProcessed used only to avoid unused-variable lint warning
  void ocrProcessed;

  const s: Record<string, StageStatus> = {
    upload:   "done",
    dispatch: "done",
    chunking: ["uploading","pending"].includes(fs) ? "active"
              : total > 0 ? "done"
              : fs === "processing" ? "active"
              : "pending",
    ocr: total === 0 ? "pending"
         : ocrActive > 0 ? "active"
         : ocrFailed > 0 && ocrSucceeded < total ? "failed"
         : ocrSucceeded >= total && ocrFailed === 0 ? "done"
         : "pending",
    llm: !llmEnabled ? "skipped"
         : total === 0 ? "pending"
         : llmActive > 0 ? "active"
         : llmFailed > 0 && llmDone < total ? "failed"
         : llmDone >= total && total > 0 ? "done"
         : llmDone > 0 ? "active"
         : "pending",
    analysis: !llmEnabled ? "skipped"
              : !p.analysisJob ? (llmDone > 0 ? "active" : "pending")
              : ["done","completed"].includes(p.analysisJob.status) ? "done"
              : ["failed","error"].includes(p.analysisJob.status) ? "failed"
              : "active",
    complete: fs === "completed" ? "done"
              : fs === "completed_with_persistent_warnings" ? "warning"
              : fs === "failed" ? "failed"
              : !llmEnabled && total > 0 && ocrSucceeded >= total && ocrFailed === 0 ? "done"
              : "pending",
  };

  const stages: Array<{ id: string; label: string; desc: string; children?: React.ReactNode }> = [
    {
      id: "upload",
      label: "File Uploaded",
      desc: "PDF stored in UploadThing",
    },
    {
      id: "dispatch",
      label: "Dispatched to FastAPI",
      desc: "OCR job queued in processing pipeline",
    },
    {
      id: "chunking",
      label: "PDF Chunking",
      desc: total > 0
        ? `Split into ${total} chunk${total !== 1 ? "s" : ""} for parallel processing`
        : "Splitting PDF into page chunks…",
    },
    {
      id: "ocr",
      label: "OCR Extraction",
      desc: total === 0
        ? "Waiting for chunks…"
        : `${ocrSucceeded}/${total} chunks extracted${ocrFailed > 0 ? ` · ${ocrFailed} failed` : ""}${isChunkListPartial ? " (showing first 100)" : ""}`,
      children: (
        <ChunkPills
          chunks={chunks}
          activeStatuses={["processing","retrying","analyzing_layout","extracting_data"]}
          doneStatuses={["completed","llm_queued","llm_processing","llm_refining","llm_completed","llm_failed"]}
          failedStatuses={["failed","retrying_failed"]}
          timingKey="ocrProcessingTimeMs"
        />
      ),
    },
    {
      id: "llm",
      label: "LLM Refinement",
      desc: !llmEnabled
        ? "Not configured — pass llmEnabled={true} to enable"
        : total === 0
        ? "Waiting for OCR…"
        : `${llmDone}/${total} chunks refined${llmFailed > 0 ? ` · ${llmFailed} failed` : ""}`,
      children: llmEnabled ? (
        <ChunkPills
          chunks={chunks}
          activeStatuses={["llm_queued","llm_processing","llm_refining"]}
          doneStatuses={["llm_completed","completed"]}
          failedStatuses={["llm_failed"]}
          timingKey="llmProcessingTimeMs"
        />
      ) : undefined,
    },
    {
      id: "analysis",
      label: "Results Analysis",
      desc: !llmEnabled
        ? "Not configured — LLM refinement is disabled"
        : p.analysisJob
        ? `Mastra agent · ${p.analysisJob.pagesProcessed}/${p.analysisJob.totalPages} pages · ${p.analysisJob.status}`
        : "Mastra agent — subject group & record analysis",
    },
    {
      id: "complete",
      label: "Pipeline Complete",
      desc: fs === "completed"
        ? `✓ ${p.recordsExtracted} student records extracted`
        : fs === "completed_with_persistent_warnings"
        ? `Done with ${p.warnings.length} warning(s)`
        : fs === "failed"
        ? "Pipeline failed — see red stages above for details"
        : !llmEnabled && total > 0 && ocrSucceeded >= total && ocrFailed === 0
        ? `✓ OCR complete · ${p.recordsExtracted} student records extracted (LLM skipped)`
        : "Waiting for all stages to finish…",
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Pipeline</h2>
        <span className="text-xs text-gray-400 tabular-nums">
          {p.recordsExtracted} records · {fmtMs(p.elapsedMs)} elapsed
          {p.etaMs !== null ? ` · ~${fmtMs(p.etaMs)} left` : ""}
        </span>
      </div>

      <div className="divide-y divide-gray-100">
        {stages.map((stage, i) => {
          const st = s[stage.id];
          return (
            <div key={stage.id} className={`flex gap-4 px-5 py-4 ${stageRow(st)}`}>
              <div className="flex flex-col items-center shrink-0" style={{ width: 28 }}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 text-xs font-bold shrink-0 ${stageRing(st)}`}>
                  {st === "done"    ? "✓" :
                   st === "failed"  ? "✕" :
                   st === "warning" ? "!" :
                   st === "skipped" ? "–" :
                   st === "active"  ? <LoadingSpinner size={3} /> :
                   String(i + 1)}
                </div>
                {i < stages.length - 1 && (
                  <div className={`w-0.5 flex-1 mt-1 min-h-[16px] rounded-full ${stageLine(st)}`} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${stageText(st)}`}>{stage.label}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{stage.desc}</p>
                {stage.children}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
