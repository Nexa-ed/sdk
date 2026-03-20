"use client";

import { useQuery } from "@tanstack/react-query";
import { useNexaContext } from "../context";
import type { UserDocumentsResult } from "../api-types";

export function useGetUserDocuments() {
  const { orpc } = useNexaContext();
  return useQuery<UserDocumentsResult>({
    ...orpc.documents.getUserDocuments.queryOptions(),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
