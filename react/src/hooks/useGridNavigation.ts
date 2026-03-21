/**
 * Pure function (not a hook) for computing the next cell position from keyboard navigation.
 * Returns null when the move would go out of bounds.
 */
export type NavDir = "right" | "left" | "up" | "down";

export function moveCell(
  dir: NavDir,
  rowIdx: number,
  colIdx: number,
  totalRows: number,
  totalCols: number
): { rowIdx: number; colIdx: number } | null {
  switch (dir) {
    case "right":
      if (colIdx + 1 < totalCols) return { rowIdx, colIdx: colIdx + 1 };
      if (rowIdx + 1 < totalRows) return { rowIdx: rowIdx + 1, colIdx: 0 };
      return null;
    case "left":
      if (colIdx - 1 >= 0) return { rowIdx, colIdx: colIdx - 1 };
      if (rowIdx - 1 >= 0) return { rowIdx: rowIdx - 1, colIdx: totalCols - 1 };
      return null;
    case "up":
      if (rowIdx - 1 >= 0) return { rowIdx: rowIdx - 1, colIdx };
      return null;
    case "down":
      if (rowIdx + 1 < totalRows) return { rowIdx: rowIdx + 1, colIdx };
      return null;
  }
}
