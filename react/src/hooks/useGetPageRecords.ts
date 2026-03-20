"use client";

import { useQuery } from "@tanstack/react-query";
import { useNexaContext } from "../context";
import type { PageRecordResult } from "../api-types";

export function useGetPageRecordsWithRefinement(fileId: string, pageNumber: number) {
  const { orpc } = useNexaContext();
  return useQuery<PageRecordResult>({
    ...orpc.documents.getPageRecordsWithRefinement.queryOptions({
      input: { fileId, pageNumber },
    }),
    enabled: !!fileId && pageNumber > 0,
    staleTime: 15_000,
    refetchOnWindowFocus: false,
  });
}
