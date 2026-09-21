"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";

interface ScreenshotProps {
  caption?: string;
  /** URL of the actual screenshot image. When provided the image is rendered; otherwise shows a placeholder. */
  src?: string;
  /** "wide" = landscape 16/9-ish,  "tall" = portrait panel,  "default" = standard 4/3-ish */
  size?: "default" | "wide" | "tall";
  children?: ReactNode;
}

const CameraIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

const ExpandIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

const heightMap: Record<string, string> = {
  default: "min-h-[200px]",
  wide:    "min-h-[260px]",
  tall:    "min-h-[360px]",
};

function Lightbox({ src, caption, onClose }: { src: string; caption?: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-[92vw] max-h-[92vh] flex flex-col items-center gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute -top-3 -right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-fd-background border border-fd-border text-fd-muted-foreground hover:text-fd-foreground shadow-lg transition-colors"
        >
          <CloseIcon />
        </button>
        <img
          src={src}
          alt={caption ?? "Screenshot"}
          className="max-w-full max-h-[82vh] rounded-xl border border-fd-border shadow-2xl object-contain"
        />
        {caption && (
          <p className="text-center text-xs text-white/70 max-w-xl leading-relaxed">
            {caption}
          </p>
        )}
      </div>
    </div>
  );
}

export function Screenshot({ caption, src, size = "default", children }: ScreenshotProps) {
  const [expanded, setExpanded] = useState(false);
  const open = useCallback(() => setExpanded(true), []);
  const close = useCallback(() => setExpanded(false), []);

  const hasContent = src || children;

  return (
    <>
      <figure className="my-6 not-prose">
        {hasContent ? (
          src ? (
            // URL-based image — clickable to expand
            <div className="group relative cursor-zoom-in" onClick={open}>
              <img
                src={src}
                alt={caption ?? "Screenshot"}
                className={`w-full rounded-xl border border-fd-border object-cover transition-opacity group-hover:opacity-95 ${heightMap[size]}`}
              />
              <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/50 px-2 py-1 text-[11px] text-white opacity-0 group-hover:opacity-100 transition-opacity select-none">
                <ExpandIcon />
                Expand
              </div>
            </div>
          ) : (
            // Slot-based children
            <div className="w-full rounded-xl border border-fd-border overflow-hidden">
              {children}
            </div>
          )
        ) : (
          // Placeholder
          <div
            className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-fd-border bg-fd-card/50 px-6 py-8 ${heightMap[size]}`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-fd-border bg-fd-background text-fd-muted-foreground">
              <CameraIcon />
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-fd-muted-foreground">
                Screenshot
              </p>
              {caption && (
                <p className="mt-1 max-w-sm text-xs leading-relaxed text-fd-muted-foreground">
                  {caption}
                </p>
              )}
            </div>
          </div>
        )}
        {caption && hasContent && (
          <figcaption className="mt-2 text-center text-xs text-fd-muted-foreground">
            {caption}
          </figcaption>
        )}
      </figure>

      {expanded && src && <Lightbox src={src} caption={caption} onClose={close} />}
    </>
  );
}
