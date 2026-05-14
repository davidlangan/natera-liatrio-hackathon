import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "SF Pro Text",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
      },
      colors: {
        // Backgrounds
        "bg-dark": "#0a0e14",
        "bg-light": "#f4f7fa",
        "surface-dark": "#11161d",
        "surface-light": "#ffffff",
        // Borders
        "border-dark": "#1f2630",
        "border-light": "#e3e8ef",
        // Brand
        "natera-blue": "#00A0DC",
        "natera-blue-deep": "#0077B6",
        "liatrio-green": "#A3E635",
        "liatrio-green-2": "#84CC16",
        // Text
        "text-on-dark": "#ffffff",
        "text-muted-dark": "#94a3b8",
        "text-on-light": "#0f172a",
        "text-muted-light": "#475569",
        // Status
        success: "#22c55e",
        warning: "#f59e0b",
      },
      letterSpacing: {
        eyebrow: "0.12em",
      },
      spacing: {
        "section-y": "96px",
        "section-y-mobile": "64px",
      },
      borderRadius: {
        card: "14px",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(1)", opacity: "1" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out",
        "slide-up": "slide-up 0.5s ease-out",
        "pulse-ring": "pulse-ring 1.5s ease-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
