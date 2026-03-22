"use client";

import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { useNexaContext } from "../context";
import type { RecordRow } from "../types";

export function useSerialRenumber(
  fileId: string,
  page: number,
  limit: number,
  hasWarnings: boolean | undefined,
  queryClient: QueryClient,
  // kept for signature compatibility but no longer used for renumber
  _mutateAsync: (vars: { recordId: string; recordData: Record<string, string | null> }) => Promise<unknown>
) {
  const { orpc } = useNexaContext();

  type BatchInput = { updates: Array<{ recordId: string; recordData: Record<string, string | null> }> };
  const batchMutation = useMutation<unknown, Error, BatchInput>({
    ...orpc.documents.batchUpdateStudentRecords.mutationOptions(),
  });

  const handleRenumber = useCallback(
    async (records: RecordRow[], col: string, startFrom: number) => {
      if (!records.length) return;

      const listQueryKey = orpc.documents.getFileStudentRecords.queryOptions({
        input: { fileId, page, limit, hasWarnings },
      }).queryKey;

      await queryClient.cancelQueries({ queryKey: listQueryKey });
      const previousData = queryClient.getQueryData(listQueryKey);

      // Optimistic update
      const patches = new Map(records.map((r, i) => [r.id, String(startFrom + i)]));
      queryClient.setQueryData(listQueryKey, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          items: (old.items ?? []).map((r: RecordRow) => {
            const newVal = patches.get(r.id);
            return newVal !== undefined
              ? { ...r, recordData: { ...(r.recordData ?? {}), [col]: newVal } }
              : r;
          }),
        };
      });

      try {
        await batchMutation.mutateAsync({
          updates: records.map((r, i) => ({
            recordId: r.id,
            recordData: {
              ...(r.recordData ?? {}),
              [col]: String(startFrom + i),
            } as Record<string, string | null>,
          })),
        });
      } catch (err) {
        console.error("[useSerialRenumber] batch renumber failed — restoring", err);
        queryClient.setQueryData(listQueryKey, previousData);
      } finally {
        queryClient.invalidateQueries({ queryKey: listQueryKey });
      }
    },
    [fileId, page, limit, hasWarnings, queryClient, batchMutation, orpc]
  );

  return { handleRenumber };
}
