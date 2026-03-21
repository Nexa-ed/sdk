"use client";

import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNexaContext } from "../context";

export function useAddRowsToList(
  fileId: string,
  page: number,
  limit: number,
  hasWarnings?: boolean
) {
  const { orpc } = useNexaContext();
  const queryClient = useQueryClient();
  const mutation = useMutation<unknown, Error, { fileId: string; pageNumber: number; rows: Array<Record<string, string | null>> }>(
    orpc.documents.createStudentRecords.mutationOptions()
  );

  const handleAddRows = useCallback(
    async (pageNumber: number, rows: Array<Record<string, string | null>>) => {
      const listQueryKey = orpc.documents.getFileStudentRecords.queryOptions({
        input: { fileId, page: pageNumber, limit, hasWarnings },
      }).queryKey;

      await queryClient.cancelQueries({ queryKey: listQueryKey });
      const previousData = queryClient.getQueryData(listQueryKey);
      queryClient.setQueryData(listQueryKey, (old: any) => {
        if (!old) return old;
        const donor = old.items[0] ?? {
          chunkId: "", tableId: "", userId: fileId, createdAt: new Date(),
          updatedAt: new Date(), isCurrent: 1, warnings: null,
          tableWarnings: null, tableStatus: null, hasEmbedding: false,
        };
        const pageItemCount = old.items.length;
        const tempItems = rows.map((rowData, i) => ({
          ...donor,
          id: `optimistic_${Date.now()}_${i}`,
          fileId,
          recordData: rowData,
          pageNumber,
          recordNumberForPage: pageItemCount + i + 1,
        }));
        return {
          ...old,
          items: [...old.items, ...tempItems],
          pagination: {
            ...old.pagination,
            total: (old.pagination?.total ?? 0) + rows.length,
          },
        };
      });

      try {
        await mutation.mutateAsync({ fileId, pageNumber, rows });
      } catch (err) {
        queryClient.setQueryData(listQueryKey, previousData);
        throw err;
      } finally {
        queryClient.invalidateQueries({ queryKey: listQueryKey });
      }
    },
    [fileId, limit, hasWarnings, queryClient, mutation, orpc]
  );

  return { handleAddRows, isPending: mutation.isPending, isError: mutation.isError, error: mutation.error };
}
