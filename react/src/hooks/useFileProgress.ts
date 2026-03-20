"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useNexaContext } from "../context";

export interface AnalysisJobProgress {
  status: string;
  pagesProcessed: number;
  totalPages: number;
}

export interface FileProgressData {
  fileStatus: string;
  progressPct: number;
  totalPages: number;
  pagesProcessed: number;
  chunksTotal: number;
  chunksComplete: number;
  chunksFailed: number;
  recordsExtracted: number;
  elapsedMs: number;
  etaMs: number | null;
  isComplete: boolean;
  isError: boolean;
  analysisJob: AnalysisJobProgress | null;
  activeRetries: number;
  warnings: string[];
}

const DEFAULT_STATE: FileProgressData = {
  fileStatus: "unknown",
  progressPct: 0,
  totalPages: 0,
  pagesProcessed: 0,
  chunksTotal: 0,
  chunksComplete: 0,
  chunksFailed: 0,
  recordsExtracted: 0,
  elapsedMs: 0,
  etaMs: null,
  isComplete: false,
  isError: false,
  analysisJob: null,
  activeRetries: 0,
  warnings: [],
};

const MAX_RETRIES = 3;
const RETRY_BASE_MS = 1000;

/**
 * Subscribe to live file processing progress via SSE.
 *
 * Routes through the SDK's route handler at `${basePath}/progress/${fileId}`,
 * which proxies to the Nexa platform with API key injection.
 *
 * Pass `fileId = null` to skip connecting (e.g. when no file is selected).
 */
export function useFileProgress(fileId: string | null): FileProgressData {
  const { basePath } = useNexaContext();
  const [data, setData] = useState<FileProgressData>(DEFAULT_STATE);

  const esRef = useRef<EventSource | null>(null);
  const retriesRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCompleteRef = useRef(false);

  const cleanup = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!fileId || isCompleteRef.current) return;

    cleanup();

    const url = `${basePath}/progress/${fileId}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);

        if (payload.type === "ping") return;

        if (payload.type === "complete") {
          isCompleteRef.current = true;
          setData((prev) => ({
            ...prev,
            fileStatus: payload.fileStatus ?? prev.fileStatus,
            progressPct: 100,
            isComplete: true,
          }));
          cleanup();
          return;
        }

        if (payload.type === "error") {
          setData((prev) => ({ ...prev, isError: true }));
          cleanup();
          return;
        }

        if (payload.type === "progress") {
          retriesRef.current = 0;
          setData({
            fileStatus: payload.fileStatus ?? "unknown",
            progressPct: payload.progressPct ?? 0,
            totalPages: payload.totalPages ?? 0,
            pagesProcessed: payload.pagesProcessed ?? 0,
            chunksTotal: payload.chunksTotal ?? 0,
            chunksComplete: payload.chunksComplete ?? 0,
            chunksFailed: payload.chunksFailed ?? 0,
            recordsExtracted: payload.recordsExtracted ?? 0,
            elapsedMs: payload.elapsedMs ?? 0,
            etaMs: payload.etaMs ?? null,
            isComplete: false,
            isError: false,
            analysisJob: payload.analysisJob ?? null,
            activeRetries: payload.activeRetries ?? 0,
            warnings: payload.warnings ?? [],
          });
        }
      } catch {
        // Malformed event — ignore
      }
    };

    es.onerror = () => {
      cleanup();
      if (isCompleteRef.current) return;

      retriesRef.current += 1;
      if (retriesRef.current > MAX_RETRIES) {
        setData((prev) => ({ ...prev, isError: true }));
        return;
      }

      const delay = RETRY_BASE_MS * Math.pow(2, retriesRef.current - 1);
      retryTimerRef.current = setTimeout(() => {
        connect();
      }, delay);
    };
  }, [fileId, basePath, cleanup]);

  useEffect(() => {
    isCompleteRef.current = false;
    retriesRef.current = 0;
    setData(DEFAULT_STATE);

    if (fileId) {
      connect();
    }

    return cleanup;
  }, [fileId, connect, cleanup]);

  return data;
}
