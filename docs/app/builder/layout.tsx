import type { ReactNode } from "react";
import Link from "next/link";

const NexaLogo = () => (
  <div className="flex items-center gap-2">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8 1L14 8L8 15L2 8L8 1Z" fill="hsl(158 64% 52%)" opacity="0.6" />
      <path d="M8 4L11.5 8L8 12L4.5 8L8 4Z" fill="hsl(158 64% 52%)" />
    </svg>
    <span className="font-semibold tracking-tight text-fd-foreground">Nexa Ed SDK</span>
  </div>
);

export default function BuilderLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-fd-background">
      {/* Top nav */}
      <header className="sticky top-0 z-50 border-b border-fd-border bg-fd-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-12 w-full max-w-screen-2xl items-center justify-between px-5">
          <Link href="/" className="transition-opacity hover:opacity-80">
            <NexaLogo />
          </Link>

          <nav className="flex items-center gap-1">
            <Link
              href="/docs/getting-started/installation"
              className="rounded-md px-3 py-1.5 text-sm text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-foreground"
            >
              Docs
            </Link>
            <Link
              href="/builder"
              className="rounded-md px-3 py-1.5 text-sm font-medium text-nexa-primary transition-colors hover:bg-nexa-primary/10"
            >
              Builder
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 flex h-8 w-8 items-center justify-center rounded-md text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-foreground"
              aria-label="GitHub"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </a>
          </nav>
        </div>
      </header>

      {/* Page content */}
      <div className="flex-1">{children}</div>
    </div>
  );
}
