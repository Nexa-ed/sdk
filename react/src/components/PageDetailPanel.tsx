"use client";

import { useState, useMemo, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNexaContext } from "../context";
import { useGetPageRecordsWithRefinement } from "../hooks/useGetPageRecords";
import { useRefinePageWithLLM } from "../hooks/useRefinePageWithLLM";
import { useUpdatePageRecord } from "../hooks/useUpdatePageRecord";
import { useDeletePageRecord } from "../hooks/useDeletePageRecord";
import { LoadingSpinner } from "../primitives/LoadingSpinner";
import { SectionHeader } from "../primitives/SectionHeader";
import { RecordDataGrid } from "./RecordDataGrid";
import type { RecordRow } from "../types";

export function PageDetailPanel({ fileId, pageNumber }: { fileId: string; pageNumber: number }) {
  const { orpc } = useNexaContext();
  const queryClient = useQueryClient();
  const [savingId, setSavingId] = useState<string | null>(null);

  const { data, isLoading } = useGetPageRecordsWithRefinement(fileId, pageNumber);

  const chunksData = queryClient.getQueryData(
    orpc.documents.getChunksWithPages.queryOptions({ input: { fileId } }).queryKey
  ) as Array<{ chunkId: string; pages?: Array<{ pageNumber: number }> }> | undefined;

  const chunkId = chunksData
    ?.find((chunk) => chunk.pages?.some((p) => p.pageNumber === pageNumber))
    ?.chunkId;

  const refineMutation = useRefinePageWithLLM();
  const updateMutation = useUpdatePageRecord(fileId, pageNumber);
  const deleteMutation = useDeletePageRecord(fileId, pageNumber);

  const pageQueryKey = useMemo(
    () => orpc.documents.getPageRecordsWithRefinement.queryOptions({ input: { fileId, pageNumber } }).queryKey,
    [orpc, fileId, pageNumber]
  );

  const handleRefine = () => {
    if (!chunkId) return;
    refineMutation.mutate(
      { fileId, chunkId, pageNumber },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: pageQueryKey });
          queryClient.invalidateQueries({
            queryKey: orpc.documents.getChunksWithPages.queryOptions({ input: { fileId } }).queryKey,
          });
        },
      }
    );
  };

  const handleOcrSave = useCallback(
    async (recordId: string, newData: Record<string, string | null>) => {
      setSavingId(recordId);
      try {
        await updateMutation.mutateAsync({ recordId, recordData: newData });
      } finally {
        setSavingId(null);
      }
    },
    [updateMutation]
  );

  const handleOcrDelete = useCallback(
    async (recordId: string) => {
      await deleteMutation.mutateAsync({ recordId });
    },
    [deleteMutation]
  );

  if (isLoading) return <div className="py-8 flex justify-center"><LoadingSpinner /></div>;
  if (!data) return null;

  const ocrRecords = (data.ocrRecords ?? []) as Array<{
    id: string;
    recordData: Record<string, string | null> | null;
    pageNumber: number | null;
    recordNumberForPage: number | null;
    warnings: unknown;
  }>;

  const rawLlm = (data.llmTransactions ?? []) as Record<string, unknown>[];
  const llmRecords: RecordRow[] = rawLlm.map((r, i) => ({
    id: String(r.id ?? i),
    recordData: (
      (r.transactionData ?? r.refinedData ?? r.recordData ?? {}) as Record<string, string | null>
    ),
    pageNumber: pageNumber,
    recordNumberForPage: (r.transactionNumberForPage ?? r.recordNumberForPage ?? i + 1) as number,
    warnings: r.warnings,
  }));

  const ocrByRecordNumber = new Map(
    ocrRecords
      .filter((r) => r.recordNumberForPage != null)
      .map((r) => [r.recordNumberForPage as number, r])
  );
  const diffBase: Record<string, Record<string, string | null>> = {};
  llmRecords.forEach((llmRec, i) => {
    const matchedByKey = llmRec.recordNumberForPage != null
      ? ocrByRecordNumber.get(llmRec.recordNumberForPage as number)
      : undefined;
    const ocr = matchedByKey ?? ocrRecords[i];
    if (ocr?.recordData) diffBase[llmRec.id] = ocr.recordData as Record<string, string | null>;
  });

  const allOcrCols = Array.from(new Set(ocrRecords.flatMap((r) => Object.keys(r.recordData ?? {}))));
  const missingPerCol = allOcrCols.map((col) => ({
    col,
    missing: ocrRecords.filter((r) => !r.recordData?.[col]).length,
  })).filter((x) => x.missing > 0).sort((a, b) => b.missing - a.missing);

  return (
    <div className="mt-4 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-gray-800 text-white px-5 py-3 flex items-center gap-3 flex-wrap">
        <span className="font-bold text-sm">Page {pageNumber}</span>
        <span className="text-xs text-gray-400">{ocrRecords.length} OCR · {llmRecords.length} LLM records</span>
        {chunkId && (
          <button
            onClick={handleRefine}
            disabled={refineMutation.isPending}
            className="ml-auto text-xs bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-md font-semibold transition-colors"
          >
            {refineMutation.isPending ? "Refining…" : "Refine with LLM ✦"}
          </button>
        )}
        {!chunkId && <span className="ml-auto text-xs text-gray-400">Chunk not resolved</span>}
      </div>

      {missingPerCol.length > 0 && (
        <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-200 flex flex-wrap gap-2 items-center text-xs">
          <span className="text-amber-700 font-semibold">Missing fields on this page:</span>
          {missingPerCol.map(({ col, missing }) => (
            <span key={col} className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-mono">
              {col.replace(/_/g, " ")} <span className="opacity-70">({missing}/{ocrRecords.length})</span>
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 divide-y xl:divide-y-0 xl:divide-x divide-gray-200">
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <SectionHeader label={`OCR Extracted (${ocrRecords.length})`} color="green" />
            <span className="text-xs text-gray-400 italic">Editable — double-click or click any cell</span>
          </div>
          <RecordDataGrid
            records={ocrRecords as RecordRow[]}
            onSave={handleOcrSave}
            saving={savingId}
            onDeleteRow={handleOcrDelete}
          />
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <SectionHeader label={`LLM-Refined (${llmRecords.length})`} color="purple" />
            {llmRecords.length > 0 && <span className="text-xs text-gray-400 italic">Hover cell to see original value</span>}
          </div>
          {llmRecords.length > 0 ? (
            <RecordDataGrid records={llmRecords} diffBase={diffBase} />
          ) : (
            <div className="py-8 text-center space-y-2 text-sm text-gray-400">
              <p>LLM refinement not yet run for this page.</p>
              {chunkId && (
                <p className="text-xs">Click <strong>Refine with LLM ✦</strong> above to run it.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {refineMutation.isError && (
        <div className="px-5 py-2 bg-red-50 text-red-600 text-xs border-t border-red-200">
          Refine failed: {refineMutation.error instanceof Error ? refineMutation.error.message : JSON.stringify(refineMutation.error)}
        </div>
      )}
      {updateMutation.isError && (
        <div className="px-5 py-2 bg-red-50 text-red-600 text-xs border-t border-red-200">
          Save failed: {updateMutation.error instanceof Error ? updateMutation.error.message : JSON.stringify(updateMutation.error)}
        </div>
      )}
      {deleteMutation.isError && (
        <div className="px-5 py-2 bg-red-50 text-red-600 text-xs border-t border-red-200">
          Delete failed: {deleteMutation.error instanceof Error ? deleteMutation.error.message : JSON.stringify(deleteMutation.error)}
        </div>
      )}
    </div>
  );
}
