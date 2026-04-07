import type { Metadata } from "next";
import { Suspense } from "react";
import BuilderUI from "@/components/BuilderUI";

export const metadata: Metadata = {
  title: "Stack Builder",
  description:
    "Visually configure your create-nexaed-app project — pick your auth provider, features, email tier, and package manager. Copy the generated command instantly.",
};

export default function BuilderPage() {
  return (
    <div className="relative">
      {/* Dot-grid background */}
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-dot-grid opacity-40" />

      {/* Top atmospheric glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed left-1/2 top-0 h-[400px] w-[900px] -translate-x-1/2 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse, hsl(158 64% 52% / 0.06) 0%, transparent 68%)",
        }}
      />

      {/* Builder UI — wrapped in Suspense because it uses useSearchParams */}
      <Suspense
        fallback={
          <div className="flex h-[calc(100vh-3rem)] items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-fd-border border-t-nexa-primary" />
              <span className="font-mono text-xs text-fd-muted-foreground">Loading builder…</span>
            </div>
          </div>
        }
      >
        <BuilderUI />
      </Suspense>
    </div>
  );
}
