import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ["var(--font-heading)", "system-ui", "sans-serif"],
        body:    ["var(--font-body)",    "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          navy:       "#0F172A",
          blue:       "#2563EB",
          "blue-dark":"#1E40AF",
          "blue-mid": "#DBEAFE",
          "blue-light":"#EFF6FF",
          accent:     "#c6e2ff",
        },
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
