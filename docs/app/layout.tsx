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
const MAIN_URL = "https://nexa-ed.com";

export const metadata: Metadata = {
  metadataBase: new URL(DOCS_URL),
  title: {
    default: "Nexa-Ed SDK Docs — School Management API & SDK",
    template: "%s — Nexa-Ed Docs",
  },
  description:
    "Official SDK & API documentation for Nexa-Ed — the school management platform for any school, anywhere. Integrate student results processing, payments, email provisioning, and AI document analysis in minutes. Works with Next.js, React, Node.js, Vue, Svelte, and any REST client.",
  keywords: [
    // SDK / developer keywords
    "Nexa-Ed SDK",
    "school management SDK",
    "school management API",
    "student results API",
    "school portal SDK",
    "school fees payment API",
    "Paystack school payments SDK",
    "academic document processing API",
    "school management REST API",
    "school software API documentation",
    // Framework-specific
    "school management Next.js SDK",
    "school portal React SDK",
    "school app Node.js",
    "school management TypeScript SDK",
    // Nigeria / Africa (primary market)
    "school portal development Nigeria",
    "school management SDK Nigeria",
    "school API Africa",
    "edtech SDK Nigeria",
    // Global developer reach
    "school management SDK worldwide",
    "international school management API",
    "school software developer documentation",
    "student information system API",
    "school ERP API",
    "open school platform SDK",
    // Brand
    "Nexa-Ed",
    "Nexium Labs",
    "Nexium Labs SDK",
    "create-nexaed-app",
  ],
  authors: [
    { name: "Nexa-Ed", url: MAIN_URL },
    { name: "Nexium Labs" },
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["en_NG", "en_GB"],
    url: DOCS_URL,
    siteName: "Nexa-Ed Docs",
    title: "Nexa-Ed SDK & API Documentation — School Management for Any Stack",
    description:
      "Integrate school management into any app in minutes. Student results, payments, email provisioning, AI OCR — REST API + typed SDKs for Next.js, React, Node, Vue, and Svelte.",
    images: [
      {
        url: `${MAIN_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Nexa-Ed SDK Documentation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nexa-Ed SDK & API Docs — School Management for Any Stack",
    description:
      "Official docs for the Nexa-Ed SDK — student portals, payments, OCR, and more. Any framework, any country.",
    images: [`${MAIN_URL}/og-image.png`],
    creator: "@nexaed",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    name: "Nexa-Ed SDK & API Documentation",
    url: DOCS_URL,
    description:
      "Official SDK & API documentation for the Nexa-Ed school management platform. Supports Next.js, React, Node.js, Vue, Svelte, and any REST client. Available worldwide.",
    publisher: {
      "@type": "Organization",
      name: "Nexa-Ed",
      url: MAIN_URL,
      logo: `${MAIN_URL}/icon-512.png`,
      areaServed: ["Nigeria", "Ghana", "Kenya", "South Africa", "Africa", "Worldwide"],
      parentOrganization: {
        "@type": "Organization",
        name: "Nexium Labs",
      },
    },
    keywords:
      "school management SDK, school management API, student results API, school portal development, Paystack school payments, edtech SDK, school management worldwide",
  };

  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${outfit.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
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
