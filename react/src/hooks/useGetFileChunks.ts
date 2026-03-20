"use client";

import { useQuery } from "@tanstack/react-query";
import { useNexaContext } from "../context";
import type { FileChunksResult } from "../api-types";

export function useGetFileChunks(fileId: string, page = 1, limit = 50) {
  const { orpc } = useNexaContext();
  return useQuery<FileChunksResult>({
    ...orpc.documents.getFileChunks.queryOptions({
      input: { fileId, page, limit },
    }),
    enabled: !!fileId,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

export function useGetChunksWithPages(fileId: string) {
  const { orpc } = useNexaContext();
  return useQuery<FileChunksResult>({
    ...orpc.documents.getChunksWithPages.queryOptions({
      input: { fileId },
    }),
    enabled: !!fileId,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
