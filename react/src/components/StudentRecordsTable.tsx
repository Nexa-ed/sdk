"use client";

import { useState, useMemo, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNexaContext } from "../context";
import { useGetFileStudentRecords } from "../hooks/useGetFileStudentRecords";
import { useUpdateRecordInList } from "../hooks/useUpdateRecordInList";
import { useAddRowsToList } from "../hooks/useAddRowsToList";
import { useColumnSort } from "../hooks/useColumnSort";
import { useSerialRenumber } from "../hooks/useSerialRenumber";
import { useDeleteRecordFromList } from "../hooks/useDeleteRecordFromList";
import { LoadingSpinner } from "../primitives/LoadingSpinner";
import { RowsPerPageSelect } from "../primitives/RowsPerPageSelect";
import { HelpButton } from "../primitives/HelpModal";
import { RecordDataGrid } from "./RecordDataGrid";
import type { RecordRow } from "../types";

export function StudentRecordsTable({ fileId }: { fileId: string }) {
  const { orpc } = useNexaContext();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<25 | 50 | 100 | 200>(50);
  const [hasWarningsFilter, setHasWarningsFilter] = useState<boolean | undefined>(undefined);
  const [hideMissingOnly, setHideMissingOnly] = useState(false);
  const [hideNoiseRows, setHideNoiseRows] = useState(true);
  const [showPartialOnly, setShowPartialOnly] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [lastSerialNumber, setLastSerialNumber] = useState<number | null>(null);

  const { data, isLoading } = useGetFileStudentRecords(fileId, page, limit, {
    hasWarnings: hasWarningsFilter,
  });

  const updateMutation = useUpdateRecordInList(fileId, page, limit, hasWarningsFilter);
  const { handleAddRows } = useAddRowsToList(fileId, page, limit, hasWarningsFilter);
  const { sortCol, sortDir, toggleSort, sortedRecords } = useColumnSort();
  const deleteMutation = useDeleteRecordFromList(fileId, page, limit, hasWarningsFilter);

  const { handleRenumber } = useSerialRenumber(
    fileId, page, limit, hasWarningsFilter,
    queryClient,
    updateMutation.mutateAsync
  );

  const rawRecords = (data?.items ?? []) as RecordRow[];

  const stableColumnOrder = useMemo(() => {
    const keySet = new Set(rawRecords.flatMap((r) => Object.keys(r.recordData ?? {})));
    const keys = Array.from(keySet);
    const rate = new Map<string, number>();
    for (const key of keys) {
      const filled = rawRecords.filter((r) => {
        const v = (r.recordData ?? {})[key];
        return v != null && v !== "";
      }).length;
      rate.set(key, rawRecords.length > 0 ? Math.round((filled / rawRecords.length) * 100) : 0);
    }
    return keys.sort((a, b) => {
      const diff = (rate.get(b) ?? 0) - (rate.get(a) ?? 0);
      return diff !== 0 ? diff : a.localeCompare(b);
    });
  }, [rawRecords]);

  const rowNullCount = useCallback(
    (r: RecordRow) =>
      stableColumnOrder.filter((c) => {
        const v = (r.recordData ?? {})[c];
        return v == null || v === "";
      }).length,
    [stableColumnOrder]
  );

  const filteredRecords: RecordRow[] = useMemo(() => {
    let rows = rawRecords;
    if (hideNoiseRows) rows = rows.filter((r) => rowNullCount(r) <= 4);
    if (showPartialOnly) rows = rows.filter((r) => { const n = rowNullCount(r); return n > 1 && n <= 4; });
    if (hideMissingOnly) rows = rows.filter((r) => Object.values(r.recordData ?? {}).some((v) => v == null || v === ""));
    return rows;
  }, [rawRecords, hideNoiseRows, showPartialOnly, hideMissingOnly, rowNullCount]);

  const records: RecordRow[] = useMemo(() => sortedRecords(filteredRecords), [filteredRecords, sortedRecords]);

  const noiseRowCount = useMemo(
    () => rawRecords.filter((r) => rowNullCount(r) > 4).length,
    [rawRecords, rowNullCount]
  );

  const partialRowCount = useMemo(
    () => rawRecords.filter((r) => { const n = rowNullCount(r); return n > 1 && n <= 4; }).length,
    [rawRecords, rowNullCount]
  );

  const total = data?.pagination?.total ?? 0;
  const totalPages = data?.pagination?.totalPages ?? 1;

  function handleLimitChange(newLimit: 25 | 50 | 100 | 200) {
    setLimit(newLimit);
    setPage(1);
  }

  const handleDeleteRow = useCallback(
    async (recordId: string) => { await deleteMutation.mutateAsync({ recordId }); },
    [deleteMutation]
  );

  const handleDeleteRows = useCallback(
    async (recordIds: string[]) => {
      if (!recordIds.length) return;
      const listQueryKey = orpc.documents.getFileStudentRecords.queryOptions({
        input: { fileId, page, limit, hasWarnings: hasWarningsFilter },
      }).queryKey;
      await queryClient.cancelQueries({ queryKey: listQueryKey });
      const previousData = queryClient.getQueryData(listQueryKey);
      const idSet = new Set(recordIds);
      queryClient.setQueryData(listQueryKey, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.filter((r: any) => !idSet.has(r.id)),
          pagination: old.pagination
            ? { ...old.pagination, total: Math.max(0, (old.pagination.total ?? 0) - recordIds.length) }
            : old.pagination,
        };
      });
      const results = await Promise.allSettled(
        recordIds.map((recordId) => deleteMutation.mutateAsync({ recordId }))
      );
      const failedIndices = results.reduce<number[]>(
        (acc, r, i) => (r.status === "rejected" ? [...acc, i] : acc), []
      );
      if (failedIndices.length > 0) {
        const failedIds = new Set(failedIndices.map((i) => recordIds[i]));
        queryClient.setQueryData(listQueryKey, (current: any) => {
          if (!current || !previousData) return current;
          const restoredItems = (previousData as any).items.filter((r: any) => failedIds.has(r.id));
          return {
            ...current,
            items: [...(current.items ?? []).filter((r: any) => !failedIds.has(r.id)), ...restoredItems],
            pagination: current.pagination
              ? { ...current.pagination, total: Math.max(0, (current.pagination.total ?? 0) + failedIds.size) }
              : current.pagination,
          };
        });
        console.error(`[StudentRecordsTable] ${failedIndices.length} deletion(s) failed`);
      }
      queryClient.invalidateQueries({ queryKey: listQueryKey });
    },
    [fileId, page, limit, hasWarningsFilter, queryClient, deleteMutation, orpc]
  );

  const handleMassUpdateRows = useCallback(
    async (recordIds: string[], col: string, value: string | null) => {
      if (!recordIds.length) return;
      const listQueryKey = orpc.documents.getFileStudentRecords.queryOptions({
        input: { fileId, page, limit, hasWarnings: hasWarningsFilter },
      }).queryKey;
      await queryClient.cancelQueries({ queryKey: listQueryKey });
      const previousData = queryClient.getQueryData(listQueryKey);
      const idSet = new Set(recordIds);
      queryClient.setQueryData(listQueryKey, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((r: any) =>
            idSet.has(r.id) ? { ...r, recordData: { ...(r.recordData ?? {}), [col]: value } } : r
          ),
        };
      });
      const targetRecords = records.filter((r) => idSet.has(r.id));
      try {
        await Promise.all(
          targetRecords.map((r) =>
            updateMutation.mutateAsync({
              recordId: r.id,
              recordData: { ...(r.recordData ?? {}), [col]: value } as Record<string, string | null>,
            })
          )
        );
      } catch (err) {
        queryClient.setQueryData(listQueryKey, previousData);
        throw err;
      } finally {
        queryClient.invalidateQueries({ queryKey: listQueryKey });
      }
    },
    [records, fileId, page, limit, hasWarningsFilter, queryClient, updateMutation, orpc]
  );

  const handleSave = useCallback(
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

  const handleMassUpdate = useCallback(
    async (col: string, value: string | null) => {
      if (!records.length) return;
      const listQueryKey = orpc.documents.getFileStudentRecords.queryOptions({
        input: { fileId, page, limit, hasWarnings: hasWarningsFilter },
      }).queryKey;
      await queryClient.cancelQueries({ queryKey: listQueryKey });
      const previousData = queryClient.getQueryData(listQueryKey);
      const visibleIds = new Set(records.map((r) => r.id));
      queryClient.setQueryData(listQueryKey, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((r: any) =>
            visibleIds.has(r.id) ? { ...r, recordData: { ...(r.recordData ?? {}), [col]: value } } : r
          ),
        };
      });
      try {
        await Promise.all(
          records.map((r) =>
            updateMutation.mutateAsync({
              recordId: r.id,
              recordData: { ...(r.recordData ?? {}), [col]: value } as Record<string, string | null>,
            })
          )
        );
      } catch (err) {
        queryClient.setQueryData(listQueryKey, previousData);
        throw err;
      } finally {
        queryClient.invalidateQueries({ queryKey: listQueryKey });
      }
    },
    [records, queryClient, fileId, page, limit, hasWarningsFilter, updateMutation, orpc]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-xs text-gray-500 font-semibold">
          {records.length} student{records.length !== 1 ? "s" : ""}
          {total !== records.length && <span className="text-gray-400"> of {total}</span>}
        </span>

        <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none" title="Hides rows with more than 4 blank fields.">
          <input type="checkbox" checked={hideNoiseRows} onChange={(e) => setHideNoiseRows(e.target.checked)} className="rounded accent-blue-600" />
          <span className={hideNoiseRows ? "text-blue-700 font-medium" : "text-gray-600"}>Students only</span>
          {hideNoiseRows && noiseRowCount > 0 && (
            <span className="text-gray-400">({noiseRowCount} noise row{noiseRowCount !== 1 ? "s" : ""} hidden)</span>
          )}
        </label>

        <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none" title="Shows only rows with 2–4 missing fields.">
          <input type="checkbox" checked={showPartialOnly} onChange={(e) => setShowPartialOnly(e.target.checked)} className="rounded accent-amber-500" />
          <span className={showPartialOnly ? "text-amber-700 font-medium" : "text-gray-600"}>Partially filled only</span>
          {showPartialOnly && partialRowCount > 0 && <span className="text-gray-400">({partialRowCount} rows)</span>}
        </label>

        <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
          <input type="checkbox" checked={hasWarningsFilter === true} onChange={(e) => setHasWarningsFilter(e.target.checked ? true : undefined)} className="rounded" />
          Has warnings
        </label>

        <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
          <input type="checkbox" checked={hideMissingOnly} onChange={(e) => setHideMissingOnly(e.target.checked)} className="rounded" />
          Missing fields only
        </label>

        <RowsPerPageSelect value={limit} onChange={handleLimitChange} />
        <HelpButton />

        {totalPages > 1 && (
          <div className="flex items-center gap-1 ml-auto">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 disabled:opacity-40 rounded border border-gray-200">Prev</button>
            <span className="text-xs text-gray-500 tabular-nums">{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 disabled:opacity-40 rounded border border-gray-200">Next</button>
          </div>
        )}
      </div>

      {updateMutation.isError && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          Save failed: {String(updateMutation.error)}
        </div>
      )}
      {deleteMutation.isError && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          Delete failed: {String(deleteMutation.error)}
        </div>
      )}

      {isLoading ? (
        <div className="py-8 flex justify-center"><LoadingSpinner /></div>
      ) : (
        <RecordDataGrid
          records={records}
          onSave={handleSave}
          saving={savingId}
          onDeleteRow={handleDeleteRow}
          onDeleteRows={handleDeleteRows}
          onMassUpdateRows={handleMassUpdateRows}
          columnOrder={stableColumnOrder}
          onAddRows={handleAddRows}
          onMassUpdate={handleMassUpdate}
          sortCol={sortCol}
          sortDir={sortDir}
          onToggleSort={toggleSort}
          onRenumber={handleRenumber}
          lastSerialNumber={lastSerialNumber}
          onRenumberComplete={setLastSerialNumber}
        />
      )}
    </div>
  );
}
