"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNexaContext } from "../context";

export function useRefinePageWithLLM() {
  const { orpc } = useNexaContext();
  const queryClient = useQueryClient();

  return useMutation({
    ...orpc.documents.refinePageWithLLM.mutationOptions(),
    onSuccess: (_data: unknown, variables: { fileId: string; chunkId: string; pageNumber: number }) => {
      queryClient.invalidateQueries({
        queryKey: orpc.documents.getPageRecordsWithRefinement.queryOptions({
          input: { fileId: variables.fileId, pageNumber: variables.pageNumber },
        }).queryKey,
      });
    },
  });
}
