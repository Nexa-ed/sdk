"use client";

import { useState, useCallback } from "react";
import type { RecordRow } from "../types";

export type SortDir = "asc" | "desc" | null;

function isNumericColumn(records: RecordRow[], col: string): boolean {
  const values = records
    .map((r) => (r.recordData ?? {})[col])
    .filter((v): v is string => v != null && v !== "");
  if (values.length === 0) return false;
  const numericCount = values.filter((v) => !isNaN(parseFloat(v))).length;
  return numericCount / values.length > 0.8;
}

function compareValues(
  a: string | null | undefined,
  b: string | null | undefined,
  numeric: boolean
): number {
  const aEmpty = a == null || a === "";
  const bEmpty = b == null || b === "";
  if (aEmpty && bEmpty) return 0;
  if (aEmpty) return 1;
  if (bEmpty) return -1;
  if (numeric) {
    const aNum = parseFloat(a!);
    const bNum = parseFloat(b!);
    const aValid = !isNaN(aNum);
    const bValid = !isNaN(bNum);
    if (aValid && bValid) return aNum - bNum;
    if (aValid) return -1;
    if (bValid) return 1;
    return String(a!).localeCompare(String(b!));
  }
  return String(a!).localeCompare(String(b!));
}

type SortState = { col: string; dir: "asc" | "desc" } | null;

export function useColumnSort() {
  const [sort, setSort] = useState<SortState>(null);

  const toggleSort = useCallback((col: string) => {
    setSort((prev) => {
      if (!prev || prev.col !== col) return { col, dir: "asc" };
      if (prev.dir === "asc") return { col, dir: "desc" };
      return null;
    });
  }, []);

  const sortedRecords = useCallback(
    (records: RecordRow[]): RecordRow[] => {
      if (!sort) return records;
      const { col, dir } = sort;
      const numeric = isNumericColumn(records, col);
      return [...records].sort((a, b) => {
        const aVal = (a.recordData ?? {})[col];
        const bVal = (b.recordData ?? {})[col];
        const cmp = compareValues(aVal, bVal, numeric);
        return dir === "asc" ? cmp : -cmp;
      });
    },
    [sort]
  );

  return {
    sortCol: sort?.col ?? null,
    sortDir: (sort?.dir ?? null) as SortDir,
    toggleSort,
    sortedRecords,
  };
}
