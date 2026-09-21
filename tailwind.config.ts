import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1.25rem", screens: { "2xl": "1360px" } },
    extend: {
      colors: {
        xfy: {
          blue: "#2563EB",
          "blue-dark": "#1D4ED8",
          "blue-soft": "#EFF6FF",
          navy: "#0F172A",
          black: "#111111",
          white: "#FFFFFF",
          gray: {
            50: "#F8FAFC",
            100: "#F1F5F9",
            200: "#E2E8F0",
            300: "#CBD5E1",
            500: "#64748B",
            700: "#334155",
          },
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xfy: "6px",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "reveal-up": { from: { opacity: "0", transform: "translateY(14px)" }, to: { opacity: "1", transform: "translateY(0)" } },
      },
      animation: {
        "fade-in": "fade-in .6s ease forwards",
        "reveal-up": "reveal-up .6s cubic-bezier(.22,.61,.36,1) forwards",
      },
    },
  },
  plugins: [],
};

export default config;
