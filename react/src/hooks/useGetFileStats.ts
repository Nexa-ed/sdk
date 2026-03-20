"use client";

import { useQuery } from "@tanstack/react-query";
import { useNexaContext } from "../context";
import type { FileStatisticsResult } from "../api-types";

export function useGetFileStatistics(fileId: string) {
  const { orpc } = useNexaContext();
  return useQuery<FileStatisticsResult>({
    ...orpc.documents.getFileStatistics.queryOptions({
      input: { fileId },
    }),
    enabled: !!fileId,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
