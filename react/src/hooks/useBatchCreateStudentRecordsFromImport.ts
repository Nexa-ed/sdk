"use client";

import { useMutation } from "@tanstack/react-query";
import { useNexaContext } from "../context";

type CreateInput = {
  fileId: string;
  rows: Array<Record<string, string | null>>;
};

export function useBatchCreateStudentRecordsFromImport() {
  const { orpc } = useNexaContext();
  return useMutation<{ created: string[] }, Error, CreateInput>({
    ...orpc.documents.batchCreateStudentRecordsFromImport.mutationOptions(),
  });
}
