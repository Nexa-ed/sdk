"use client";

import { useCallback } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { useNexaContext } from "../context";
import type { RecordRow } from "../types";

export function useSerialRenumber(
  fileId: string,
  page: number,
  limit: number,
  hasWarnings: boolean | undefined,
  queryClient: QueryClient,
  mutateAsync: (vars: { recordId: string; recordData: Record<string, string | null> }) => Promise<unknown>
) {
  const { orpc } = useNexaContext();

  const handleRenumber = useCallback(
    async (records: RecordRow[], col: string, startFrom: number) => {
      if (!records.length) return;
      const listQueryKey = orpc.documents.getFileStudentRecords.queryOptions({
        input: { fileId, page, limit, hasWarnings },
      }).queryKey;

      await queryClient.cancelQueries({ queryKey: listQueryKey });
      const previousData = queryClient.getQueryData(listQueryKey);
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

      const results = await Promise.allSettled(
        records.map((r, i) =>
          mutateAsync({
            recordId: r.id,
            recordData: {
              ...(r.recordData ?? {}),
              [col]: String(startFrom + i),
            } as Record<string, string | null>,
          })
        )
      );

      const failed = results.filter((r) => r.status === "rejected");
      if (failed.length > 0) {
        console.error(`[useSerialRenumber] ${failed.length} renumber mutation(s) failed — restoring`);
        queryClient.setQueryData(listQueryKey, previousData);
      }
      queryClient.invalidateQueries({ queryKey: listQueryKey });
    },
    [fileId, page, limit, hasWarnings, queryClient, mutateAsync, orpc]
  );

  return { handleRenumber };
}
