"use client";

import { useQuery } from "@tanstack/react-query";
import { useNexaContext } from "../context";

export function useGetRoster(page = 1, limit = 100, search?: string) {
  const { orpc } = useNexaContext();
  return useQuery({
    ...orpc.roster.getRoster.queryOptions({ input: { page, limit, search } }),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
