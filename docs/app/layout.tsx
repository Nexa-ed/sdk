import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Inter, Outfit, JetBrains_Mono } from "next/font/google";
import { RootProvider } from "fumadocs-ui/provider";
import "./global.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const DOCS_URL = "https://docs.nexa-ed.com";

export const metadata: Metadata = {
  metadataBase: new URL(DOCS_URL),
  title: {
    default: "Nexa-Ed SDK Docs",
    template: "%s — Nexa-Ed Docs",
  },
  description:
    "Integrate student results processing, payments, and AI-powered document analysis into your school app in minutes.",
  keywords: [
    "Nexa-Ed SDK",
    "school portal development Nigeria",
    "student results API",
    "Paystack school payments SDK",
    "academic document processing API",
  ],
  authors: [{ name: "Nexa-Ed", url: "https://nexa-ed.com" }],
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1 },
  },
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: DOCS_URL,
    siteName: "Nexa-Ed Docs",
    title: "Nexa-Ed SDK & API Documentation",
    description:
      "Integrate student results processing, payments, and AI-powered document analysis into your school app in minutes.",
    images: [
      {
        url: "https://nexa-ed.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Nexa-Ed SDK Documentation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nexa-Ed SDK & API Documentation",
    description:
      "Official docs for the Nexa-Ed SDK — student portals, payments, OCR, and more.",
    images: ["https://nexa-ed.com/og-image.png"],
    creator: "@nexaed",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${outfit.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-fd-background font-sans text-fd-foreground antialiased">
        <RootProvider
          theme={{
            defaultTheme: "dark",
            enableSystem: true,
          }}
        >
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
