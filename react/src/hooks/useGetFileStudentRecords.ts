"use client";

import { useQuery } from "@tanstack/react-query";
import { useNexaContext } from "../context";
import type { StudentRecordsResult } from "../api-types";

export function useGetFileStudentRecords(
  fileId: string,
  page = 1,
  limit = 100,
  filters?: { pageStart?: number; pageEnd?: number; hasWarnings?: boolean }
) {
  const { orpc } = useNexaContext();
  return useQuery<StudentRecordsResult>({
    ...orpc.documents.getFileStudentRecords.queryOptions({
      input: { fileId, page, limit, ...filters },
    }),
    enabled: !!fileId,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
