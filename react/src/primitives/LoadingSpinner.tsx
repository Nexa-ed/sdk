"use client";

export function LoadingSpinner({ size = 5 }: { size?: number }) {
  const safeSize = Math.max(1, Math.floor(size));
  return (
    <div role="status" aria-live="polite" className="inline-flex items-center">
      <div
        className="inline-block animate-spin rounded-full border-2 border-blue-500 border-t-transparent"
        style={{ width: safeSize * 4, height: safeSize * 4 }}
      />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
