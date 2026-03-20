import type { StageStatus } from "./types";

export function fmtMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const m = Math.floor(ms / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return `${m}m ${s}s`;
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    completed: "bg-green-100 text-green-800",
    llm_completed: "bg-emerald-100 text-emerald-800",
    failed: "bg-red-100 text-red-800",
    llm_failed: "bg-red-100 text-red-800",
    retrying_failed: "bg-red-100 text-red-800",
    processing: "bg-blue-100 text-blue-800",
    llm_processing: "bg-indigo-100 text-indigo-800",
    llm_queued: "bg-yellow-100 text-yellow-800",
    pending: "bg-gray-100 text-gray-600",
    queued: "bg-gray-100 text-gray-600",
    retrying: "bg-orange-100 text-orange-800",
    uploading: "bg-blue-100 text-blue-800",
    analyzing_layout: "bg-violet-100 text-violet-800",
    extracting_data: "bg-purple-100 text-purple-800",
    llm_refining: "bg-indigo-100 text-indigo-800",
    completed_with_persistent_warnings: "bg-amber-100 text-amber-800",
    completed_and_retrying: "bg-teal-100 text-teal-800",
  };
  return map[status] ?? "bg-gray-100 text-gray-500";
}

export function stageRing(s: StageStatus) {
  if (s === "done")    return "border-green-400 bg-green-50 text-green-600";
  if (s === "failed")  return "border-red-400 bg-red-50 text-red-600";
  if (s === "warning") return "border-amber-400 bg-amber-50 text-amber-600";
  if (s === "active")  return "border-blue-400 bg-blue-50 text-blue-600";
  if (s === "skipped") return "border-gray-300 bg-gray-50 text-gray-400";
  return "border-gray-200 bg-white text-gray-400";
}

export function stageRow(s: StageStatus) {
  if (s === "done")    return "bg-green-50/60";
  if (s === "failed")  return "bg-red-50/60";
  if (s === "warning") return "bg-amber-50/60";
  if (s === "active")  return "bg-blue-50/40";
  if (s === "skipped") return "bg-gray-50/60 opacity-60";
  return "";
}

export function stageLine(s: StageStatus) {
  if (s === "done")    return "bg-green-300";
  if (s === "failed")  return "bg-red-300";
  if (s === "active")  return "bg-blue-300";
  if (s === "skipped") return "bg-gray-200 opacity-50";
  return "bg-gray-200";
}

export function stageText(s: StageStatus) {
  if (s === "done")    return "text-green-700";
  if (s === "failed")  return "text-red-700";
  if (s === "warning") return "text-amber-700";
  if (s === "active")  return "text-blue-700";
  if (s === "skipped") return "text-gray-400 line-through";
  return "text-gray-400";
}

export function pageColor(hasLLM: boolean, status: string | null): string {
  if (hasLLM) return "bg-green-500 text-white";
  const s = status ?? "";
  if (s.includes("completed")) return "bg-teal-400 text-white";
  if (s.includes("llm_queued") || s.includes("llm_processing")) return "bg-yellow-400 text-white";
  if (s.includes("failed")) return "bg-red-400 text-white";
  return "bg-gray-200 text-gray-600";
}

export function accuracyBar(pct: number) {
  const color = pct === 100 ? "bg-green-500" : pct >= 66 ? "bg-teal-400" : pct >= 33 ? "bg-yellow-400" : "bg-red-400";
  const label = pct === 100 ? "All refined" : pct >= 66 ? "Mostly refined" : pct >= 33 ? "Partially refined" : "Pending";
  return { color, label };
}
