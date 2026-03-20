export type RecordRow = {
  id: string;
  recordData: Record<string, string | null> | null;
  pageNumber?: number | null;
  recordNumberForPage?: number | null;
  warnings?: unknown;
};

export type CellEdit = { recordId: string; col: string; value: string; rowIdx: number; colIdx: number };

export type ActiveBar =
  | { col: string; mode: "massUpdate" }
  | { col: string; mode: "renumber" }
  | null;

export type UploadState =
  | { phase: "idle" }
  | { phase: "uploading"; progress: number; fileName: string }
  | { phase: "processing"; fileName: string }
  | { phase: "done"; fileName: string; fileId: string }
  | { phase: "error"; message: string };

export type StageStatus = "pending" | "active" | "done" | "failed" | "warning" | "skipped";

export const TABS = ["Overview", "Records", "Chunks", "Analysis", "Stats"] as const;
export type Tab = (typeof TABS)[number];
