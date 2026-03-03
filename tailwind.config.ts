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
          bg: "#fafbff",
          card: "#FFFFFF",
          border: "#E5E7EB",
          text: "#1F2937",
          muted: "#6B7280",
          like: "#EF4444",
          tag: "#EFF6FF",
          "tag-text": "#3B82F6",
        },
        gradient: {
          purple: "#8B5CF6",
          blue: "#3B82F6",
          pink: "#EC4899",
          cyan: "#06B6D4",
          orange: "#F97316",
        },
      },
      backgroundImage: {
        "gradient-main":
          "linear-gradient(135deg, #8B5CF6 0%, #3B82F6 50%, #EC4899 100%)",
        "gradient-header":
          "linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)",
        "gradient-ranking-gold":
          "linear-gradient(135deg, #F59E0B, #EAB308)",
        "gradient-ranking-silver":
          "linear-gradient(135deg, #9CA3AF, #D1D5DB)",
        "gradient-ranking-bronze":
          "linear-gradient(135deg, #F97316, #FB923C)",
        "gradient-cta":
          "linear-gradient(135deg, #EC4899, #8B5CF6)",
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
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "heart-pop": {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.3)" },
          "100%": { transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out forwards",
        "slide-up": "slide-up 0.4s ease-out forwards",
        "scale-in": "scale-in 0.2s ease-out forwards",
        "heart-pop": "heart-pop 0.3s ease-out",
        shimmer: "shimmer 2s infinite linear",
        float: "float 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
