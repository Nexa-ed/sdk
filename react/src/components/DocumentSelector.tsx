"use client";

import { useGetUserDocuments } from "../hooks/useGetUserDocuments";
import { LoadingSpinner } from "../primitives/LoadingSpinner";

export function DocumentSelector({
  selectedId,
  onSelect,
  highlightId,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
  highlightId?: string | null;
}) {
  const { data, isLoading, refetch } = useGetUserDocuments();

  return (
    <div className="flex items-center gap-3">
      <label htmlFor="nexa-document-selector" className="text-sm font-semibold text-gray-700 whitespace-nowrap">
        Inspect file:
      </label>
      {isLoading ? (
        <LoadingSpinner />
      ) : data?.documents?.length ? (
        <select
          id="nexa-document-selector"
          className="flex-1 max-w-lg px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          value={selectedId ?? ""}
          onFocus={() => refetch()}
          onChange={(e) => e.target.value && onSelect(e.target.value)}
        >
          <option value="">— choose a file —</option>
          {data.documents.map((doc) => (
            <option key={doc.id} value={doc.id}>
              {doc.id === highlightId ? "★ " : ""}
              {doc.originalFileName ?? doc.id} — {doc.status} ({doc.progressPercentage ?? 0}%)
            </option>
          ))}
        </select>
      ) : (
        <span className="text-xs text-gray-400 italic">No files yet — upload one above</span>
      )}
    </div>
  );
}
