"use client";

import { statusColor } from "../utils";

export function Badge({ label, className }: { label: string; className?: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${className ?? "bg-gray-100 text-gray-600"}`}>
      {label}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge label={status.replace(/_/g, " ")} className={statusColor(status)} />;
}
