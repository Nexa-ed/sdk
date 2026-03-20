import type { SortDir } from "../hooks/useColumnSort";

export function SortIcon({ dir }: { dir: SortDir }) {
  if (dir === "asc") return <span role="img" aria-label="sorted ascending">↑</span>;
  if (dir === "desc") return <span role="img" aria-label="sorted descending">↓</span>;
  return <span role="img" className="text-gray-300" aria-label="sortable">⇅</span>;
}
