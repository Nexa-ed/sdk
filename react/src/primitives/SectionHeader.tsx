"use client";

const COLOR_CLASSES: Record<string, string> = {
  blue:   "bg-blue-600 text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-t-lg",
  green:  "bg-emerald-600 text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-t-lg",
  purple: "bg-purple-600 text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-t-lg",
  orange: "bg-orange-500 text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-t-lg",
  gray:   "bg-gray-600 text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-t-lg",
};

export function SectionHeader({ label, color = "blue" }: { label: string; color?: string }) {
  const className = COLOR_CLASSES[color] ?? COLOR_CLASSES.blue;
  return <div className={className}>{label}</div>;
}
