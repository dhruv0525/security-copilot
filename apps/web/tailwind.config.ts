import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Risk level semantic palette — used throughout the app
        risk: {
          safe: "#22c55e",
          low: "#84cc16",
          medium: "#f59e0b",
          high: "#f97316",
          critical: "#ef4444",
        },
      },
      fontFamily: {
        mono: ["var(--font-geist-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
