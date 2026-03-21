"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNexaContext } from "../context";

export function useDeleteRecordFromList(
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
    ...orpc.documents.deleteStudentRecord.mutationOptions(),
    onMutate: async ({ recordId }: { recordId: string }) => {
      await queryClient.cancelQueries({ queryKey: listQueryKey });
      const previousData = queryClient.getQueryData(listQueryKey);
      queryClient.setQueryData(listQueryKey, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.filter((r: any) => r.id !== recordId),
          pagination: old.pagination
            ? { ...old.pagination, total: Math.max(0, (old.pagination.total ?? 1) - 1) }
            : old.pagination,
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
