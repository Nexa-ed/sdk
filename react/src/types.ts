export type RecordRow = {
  id: string;
  recordData: Record<string, string | null> | null;
  pageNumber?: number | null;
  recordNumberForPage?: number | null;
  warnings?: unknown;
  rosterId?: string | null;
  rosterMatchConfidence?: string | null;
  rosterMatchStatus?: "auto" | "manual" | "unmatched" | null;
};

export type RosterEntry = {
  id: string;
  name: string;
  externalId?: string | null;
  classGroup?: string | null;
  metadata?: Record<string, string> | null;
};

export type ParsedImportRow = {
  __record_id?: string;
  [key: string]: string | null | undefined;
};

export type ImportDiff = {
  toUpdate: Array<{ id: string; recordData: Record<string, string | null> }>;
  toCreate: Array<Record<string, string | null>>;
  unchanged: number;
  skipped: number;
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
