import { createPreset } from "fumadocs-ui/tailwind-plugin";
import type { Config } from "tailwindcss";

// Helper: supports Tailwind opacity modifiers (e.g. bg-nexa-primary/20)
// Cast required because Tailwind's types don't expose the function overload in v3
function hslWithOpacity(h: number, s: number, l: number) {
  const fn = ({ opacityValue }: { opacityValue?: string }) =>
    opacityValue !== undefined
      ? `hsl(${h} ${s}% ${l}% / ${opacityValue})`
      : `hsl(${h} ${s}% ${l}%)`;
  return fn as unknown as string;
}

export default {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx,mdx}",
    "./components/**/*.{ts,tsx}",
    "./content/**/*.mdx",
    "../../node_modules/fumadocs-ui/dist/**/*.js",
    "../../node_modules/fumadocs-core/dist/**/*.js",
  ],
  presets: [createPreset()],
  theme: {
    extend: {
      colors: {
        // Nexa brand palette — opacity-modifier–aware
        "nexa-primary": hslWithOpacity(158, 64, 52),
        "nexa-primary-glow": hslWithOpacity(167, 82, 45),
        "nexa-secondary": hslWithOpacity(142, 76, 36),
        "nexa-accent": hslWithOpacity(160, 84, 39),
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Outfit", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "Fira Code", "monospace"],
      },
      backgroundImage: {
        "nexa-gradient": "linear-gradient(135deg, hsl(158 64% 52%), hsl(167 82% 45%))",
        "nexa-gradient-subtle":
          "linear-gradient(135deg, hsl(158 64% 52% / 0.15), hsl(142 76% 36% / 0.08))",
        "dot-grid":
          "radial-gradient(circle at 1px 1px, hsl(158 64% 52% / 0.12) 1px, transparent 0)",
      },
      backgroundSize: {
        "dot-grid": "28px 28px",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        pulse: "pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shimmer: "shimmer 2.5s linear infinite",
      },
      boxShadow: {
        "glow-sm": "0 0 20px hsl(158 64% 52% / 0.15)",
        "glow-md": "0 0 40px hsl(158 64% 52% / 0.2)",
        "glow-lg": "0 0 80px hsl(158 64% 52% / 0.25)",
        "card-hover":
          "0 8px 32px hsl(0 0% 0% / 0.3), 0 0 0 1px hsl(158 64% 52% / 0.2)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
