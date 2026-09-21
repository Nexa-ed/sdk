import * as XLSX from "xlsx";

type ExportRow = Record<string, string | null | undefined>;

/**
 * Builds the final ordered array of column headers for an export.
 *
 * Rules:
 * - `__record_id` is always placed first (required for round-trip sync).
 * - Columns listed in `columnOrder` follow in that order.
 * - Any remaining keys not in `columnOrder` are appended in insertion order.
 *
 * @param rows        - The array of record objects to derive headers from.
 * @param columnOrder - Optional preferred column sequence (from the grid's current display order).
 * @returns           Ordered header array with `__record_id` as the first element.
 *
 * @example
 * const headers = buildExportHeaders(rows, ["name", "score"]);
 * // → ["__record_id", "name", "score", "grade", ...]
 */
export function buildExportHeaders(rows: ExportRow[], columnOrder?: string[]): string[] {
  const keys = new Set(rows.flatMap((r) => Object.keys(r)));
  keys.delete("__record_id");
  const ordered = columnOrder
    ? [...columnOrder, ...Array.from(keys).filter((k) => !columnOrder.includes(k))]
    : Array.from(keys);
  return ["__record_id", ...ordered];
}

/**
 * Triggers a browser download of the records as an `.xlsx` file.
 *
 * The `__record_id` column is written as column A but **hidden** (width 0)
 * so teachers see a clean sheet while the ID is preserved for sync.
 * The first row is frozen. Auto-widths are applied to all visible columns.
 *
 * @param rows        - Array of `{ __record_id, ...recordData }` objects.
 * @param fileName    - Base filename without extension (e.g. `"records-abc123"`).
 * @param columnOrder - Optional column sequence to match the grid's display order.
 *
 * @example
 * const rows = records.map((r) => ({ __record_id: r.id, ...r.recordData }));
 * downloadAsXlsx(rows, `records-${fileId.slice(0, 8)}`, columnOrder);
 */
export function downloadAsXlsx(rows: ExportRow[], fileName: string, columnOrder?: string[]) {
  const headers = buildExportHeaders(rows, columnOrder);
  const sheetData = [
    headers,
    ...rows.map((r) => headers.map((h) => r[h] ?? "")),
  ];
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  ws["!cols"] = headers.map((h, i) =>
    i === 0 ? { wch: 0, hidden: true } : { wch: Math.max(10, h.length + 2) }
  );

  ws["!freeze"] = { xSplit: 0, ySplit: 1, topLeftCell: "A2", activePane: "bottomLeft" } as never;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Records");
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

/**
 * Triggers a browser download of the records as a UTF-8 `.csv` file.
 *
 * Column ordering follows the same rules as {@link downloadAsXlsx}.
 * The `__record_id` column appears as the first visible column in CSV
 * (it cannot be hidden the way it is in XLSX).
 *
 * @param rows        - Array of `{ __record_id, ...recordData }` objects.
 * @param fileName    - Base filename without extension.
 * @param columnOrder - Optional column sequence.
 *
 * @example
 * downloadAsCsv(rows, `records-${fileId.slice(0, 8)}`, columnOrder);
 */
export function downloadAsCsv(rows: ExportRow[], fileName: string, columnOrder?: string[]) {
  const headers = buildExportHeaders(rows, columnOrder);
  const sheetData = [
    headers,
    ...rows.map((r) => headers.map((h) => r[h] ?? "")),
  ];
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Triggers a browser download of the records as a pretty-printed `.json` file.
 *
 * Outputs a JSON array of objects. The `__record_id` field is included in
 * every object so the file can be used for round-trip sync via
 * {@link parseImportFile} / {@link buildImportDiff}.
 *
 * @param rows     - Array of `{ __record_id, ...recordData }` objects.
 * @param fileName - Base filename without extension.
 *
 * @example
 * downloadAsJson(rows, `records-${fileId.slice(0, 8)}`);
 */
export function downloadAsJson(rows: ExportRow[], fileName: string) {
  const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
