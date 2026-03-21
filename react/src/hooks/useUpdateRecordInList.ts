"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNexaContext } from "../context";

export function useUpdateRecordInList(
  fileId: string,
  page: number,
  limit: number,
  hasWarnings?: boolean
) {
  const { orpc } = useNexaContext();
  const queryClient = useQueryClient();
  const listQueryKey = orpc.documents.getFileStudentRecords.queryOptions({
    input: { fileId, page, limit, hasWarnings },
  }).queryKey;

  return useMutation({
    ...orpc.documents.updateStudentRecord.mutationOptions(),
    onMutate: async ({ recordId, recordData }: { recordId: string; recordData: Record<string, string | null> }) => {
      await queryClient.cancelQueries({ queryKey: listQueryKey });
      const previousData = queryClient.getQueryData(listQueryKey);
      queryClient.setQueryData(listQueryKey, (old: any) => {
        if (!old || !Array.isArray(old.items)) return old;
        return {
          ...old,
          items: old.items.map((r: any) =>
            r.id === recordId ? { ...r, recordData } : r
          ),
        };
      });
      return { previousData };
    },
    onError: (_err: unknown, _vars: unknown, context: any) => {
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(listQueryKey, context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: listQueryKey });
    },
  });
}
