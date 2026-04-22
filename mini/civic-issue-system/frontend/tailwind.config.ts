import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#F8FAFC",
        foreground: "#1E293B",
        primary: {
          light: "#E0F2FE", 
          DEFAULT: "#0284C7", 
          dark: "#0369A1",
        },
        secondary: {
          light: "#F3E8FF", 
          DEFAULT: "#8B5CF6",
          dark: "#7C3AED",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(14, 165, 233, 0.1)",
        glow: "0 0 20px 0 rgba(2, 132, 199, 0.25)",
        glowSec: "0 0 20px 0 rgba(139, 92, 246, 0.2)"
      },
      animation: {
        pulseMap: "pulseMap 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 6s ease-in-out infinite",
        panMap: "panMap 30s linear infinite alternate",
      },
      keyframes: {
        pulseMap: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: ".5", transform: "scale(1.2)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        panMap: {
          "0%": { backgroundPosition: "0% 0%" },
          "100%": { backgroundPosition: "100% 100%" },
        }
      }
    },
  },
  plugins: [],
};
export default config;
