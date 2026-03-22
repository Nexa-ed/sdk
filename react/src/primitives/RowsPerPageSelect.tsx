export function RowsPerPageSelect({
  value,
  onChange,
}: {
  value: 25 | 50 | 100 | 200;
  onChange: (v: 25 | 50 | 100 | 200) => void;
}) {
  return (
    <label className="flex items-center gap-1.5 text-xs text-muted-foreground select-none">
      Rows:
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value) as 25 | 50 | 100 | 200)}
        className="border border-border rounded px-1.5 py-0.5 text-xs bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-blue-300 cursor-pointer"
      >
        {([25, 50, 100, 200] as const).map((n) => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>
    </label>
  );
}
