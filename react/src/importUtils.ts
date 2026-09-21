import * as XLSX from "xlsx";

/**
 * A single row parsed from an imported file.
 * If the row came from a previously exported file, `__record_id` holds the
 * database ID of the original record. Rows the teacher added in Excel will
 * not have a `__record_id` value — those are treated as new rows to create.
 */
export type ParsedImportRow = {
  __record_id?: string;
  [key: string]: string | null | undefined;
};

/**
 * The result of {@link buildImportDiff} — classifies parsed import rows into
 * four categories so the caller can preview changes before applying them.
 */
export type ImportDiff = {
  /** Rows whose `__record_id` matched a current record AND at least one value changed. */
  toUpdate: Array<{ id: string; recordData: Record<string, string | null> }>;
  /** Rows with no `__record_id` that contain at least one non-empty value. These are new records to insert. */
  toCreate: Array<Record<string, string | null>>;
  /** Number of rows that matched a current record but had no changed values. */
  unchanged: number;
  /** Number of rows with a `__record_id` that does not exist in the current document (e.g. exported from a different file). */
  skipped: number;
};

async function parseJsonFile(file: File): Promise<ParsedImportRow[]> {
  const text = await file.text();
  const raw: unknown = JSON.parse(text);
  if (!Array.isArray(raw)) throw new Error("JSON must be an array of objects");
  const parsed: ParsedImportRow[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;
    const obj = item as Record<string, unknown>;
    const row: ParsedImportRow = {};
    for (const [k, v] of Object.entries(obj)) {
      row[k] = v == null || v === "" ? null : String(v);
    }
    parsed.push(row);
  }
  return parsed;
}

/**
 * Parses an uploaded file (`.xlsx`, `.csv`, or `.json`) into a flat array of
 * row objects. All values are coerced to `string | null`.
 *
 * - **XLSX / CSV** — reads the first sheet via `SheetJS` (`xlsx` package).
 * - **JSON** — expects a top-level array of objects.
 *
 * Rows without a `__record_id` column value are kept — they represent new
 * rows the teacher added in Excel and will be classified as `toCreate` by
 * {@link buildImportDiff}.
 *
 * @param file - A `File` object from an `<input type="file">` or drag-and-drop.
 * @returns    Promise resolving to the parsed row array.
 *
 * @example
 * const rows = await parseImportFile(uploadedFile);
 * // [{ __record_id: "rec_abc", name: "Alice", score: "92" }, ...]
 */
export function parseImportFile(file: File): Promise<ParsedImportRow[]> {
  if (file.name.toLowerCase().endsWith(".json")) {
    return parseJsonFile(file);
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]!];
        if (!ws) { resolve([]); return; }
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, {
          defval: null,
          raw: false,
        }) as ParsedImportRow[];
        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Compares parsed import rows against a snapshot of the current records and
 * returns a diff object classifying each row into one of four categories.
 *
 * **Merge strategy for updates:** `{ ...existing, ...imported }` — columns
 * absent from the uploaded file are preserved from the existing record, so
 * nothing is erased by omission (e.g. the teacher deleted a column in Excel).
 *
 * @param parsed         - Output of {@link parseImportFile}.
 * @param currentRecords - Map of `recordId → recordData` for the current document.
 *                         Build it from the records already loaded in the UI:
 *                         `new Map(records.map(r => [r.id, r.recordData ?? {}]))`
 * @returns              {@link ImportDiff} — safe to show as a preview before applying.
 *
 * @example
 * const parsed = await parseImportFile(file);
 * const currentMap = new Map(records.map((r) => [r.id, r.recordData ?? {}]));
 * const diff = buildImportDiff(parsed, currentMap);
 *
 * console.log(`${diff.toUpdate.length} rows will be updated`);
 * console.log(`${diff.toCreate.length} new rows will be created`);
 * console.log(`${diff.unchanged} unchanged`);
 * console.log(`${diff.skipped} from another document`);
 */
export function buildImportDiff(
  parsed: ParsedImportRow[],
  currentRecords: Map<string, Record<string, string | null>>
): ImportDiff {
  const toUpdate: ImportDiff["toUpdate"] = [];
  const toCreate: ImportDiff["toCreate"] = [];
  let unchanged = 0;
  let skipped = 0;

  for (const row of parsed) {
    const { __record_id, ...fields } = row;
    const rowData = fields as Record<string, string | null>;

    if (!__record_id) {
      if (Object.values(rowData).some((v) => v != null && v !== "")) {
        toCreate.push(rowData);
      }
      continue;
    }

    const existing = currentRecords.get(__record_id);
    if (!existing) {
      skipped++;
      continue;
    }

    const merged = { ...existing, ...rowData };
    const hasChange = Object.keys(merged).some((k) => merged[k] !== existing[k]);
    if (hasChange) {
      toUpdate.push({ id: __record_id, recordData: merged });
    } else {
      unchanged++;
    }
  }

  return { toUpdate, toCreate, unchanged, skipped };
}
