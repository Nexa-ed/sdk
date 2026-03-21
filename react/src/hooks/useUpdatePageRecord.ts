"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNexaContext } from "../context";

export function useUpdatePageRecord(fileId: string, pageNumber: number) {
  const { orpc } = useNexaContext();
  const queryClient = useQueryClient();

  return useMutation({
    ...orpc.documents.updateStudentRecord.mutationOptions(),
    onMutate: async ({ recordId, recordData }: { recordId: string; recordData: Record<string, string | null> }) => {
      const qo = orpc.documents.getPageRecordsWithRefinement.queryOptions({
        input: { fileId, pageNumber },
      });
      await queryClient.cancelQueries({ queryKey: qo.queryKey });
      const previousData = queryClient.getQueryData(qo.queryKey);
      queryClient.setQueryData(qo.queryKey, (old: any) => {
        if (!old || !Array.isArray(old.ocrRecords)) return old;
        return {
          ...old,
          ocrRecords: old.ocrRecords.map((r: any) =>
            r.id === recordId ? { ...r, recordData } : r
          ),
        };
      });
      return { previousData };
    },
    onError: (_err: unknown, _vars: unknown, context: any) => {
      if (context?.previousData !== undefined) {
        const qo = orpc.documents.getPageRecordsWithRefinement.queryOptions({
          input: { fileId, pageNumber },
        });
        queryClient.setQueryData(qo.queryKey, context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: orpc.documents.getPageRecordsWithRefinement.queryOptions({
          input: { fileId, pageNumber },
        }).queryKey,
      });
    },
  });
}
