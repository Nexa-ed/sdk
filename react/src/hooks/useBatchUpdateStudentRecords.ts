"use client";

import { useMutation } from "@tanstack/react-query";
import { useNexaContext } from "../context";

type BatchUpdateInput = {
  updates: Array<{ recordId: string; recordData: Record<string, string | null> }>;
};

export function useBatchUpdateStudentRecords() {
  const { orpc } = useNexaContext();
  return useMutation<unknown, Error, BatchUpdateInput>({
    ...orpc.documents.batchUpdateStudentRecords.mutationOptions(),
  });
}
