import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
        },
        komapara: {
          bg: "#FAFAFA",
          card: "#FFFFFF",
          border: "#E5E7EB",
          text: "#1F2937",
          muted: "#6B7280",
          like: "#EF4444",
          tag: "#EFF6FF",
          "tag-text": "#3B82F6",
        },
      },
    },
  },
  plugins: [],
};
export default config;
