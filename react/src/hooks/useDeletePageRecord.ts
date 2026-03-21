"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNexaContext } from "../context";

export function useDeletePageRecord(fileId: string, pageNumber: number) {
  const { orpc } = useNexaContext();
  const queryClient = useQueryClient();

  return useMutation({
    ...orpc.documents.deleteStudentRecord.mutationOptions(),
    onMutate: async ({ recordId }: { recordId: string }) => {
      const qo = orpc.documents.getPageRecordsWithRefinement.queryOptions({
        input: { fileId, pageNumber },
      });
      await queryClient.cancelQueries({ queryKey: qo.queryKey });
      const previousData = queryClient.getQueryData(qo.queryKey);
      queryClient.setQueryData(qo.queryKey, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          ocrRecords: old.ocrRecords.filter((r: any) => r.id !== recordId),
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
