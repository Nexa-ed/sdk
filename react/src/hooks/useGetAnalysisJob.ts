"use client";

import { useQuery } from "@tanstack/react-query";
import { useNexaContext } from "../context";
import type { AnalysisJob } from "../api-types";

export function useGetLatestAnalysisJobForFile(fileId: string) {
  const { orpc } = useNexaContext();
  return useQuery<AnalysisJob | null>({
    ...orpc.documents.getLatestAnalysisJobForFile.queryOptions({
      input: { fileId },
    }),
    enabled: !!fileId,
    staleTime: 15_000,
    refetchOnWindowFocus: false,
  });
}

export function useGetAnalysisJobResult(jobId: string) {
  const { orpc } = useNexaContext();
  return useQuery<AnalysisJob | null>({
    ...orpc.documents.getAnalysisJobResult.queryOptions({
      input: { jobId },
    }),
    enabled: !!jobId,
    staleTime: 15_000,
    refetchOnWindowFocus: false,
  });
}
