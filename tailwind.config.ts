import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        cinema: {
          charcoal: "#171923",
          slate: "#242B3A",
          surface: "#1E2430",
          card: "#212836",
          red: "#E83B50",
          "red-hover": "#D32F43",
          gold: "#E8B86D",
          "gold-hover": "#D9A95C",
          offwhite: "#F4F3F0",
          muted: "#8E9AA8",
          border: "#2D3748",
          emerald: "#10B981",
        },
        primary: {
          DEFAULT: "#E83B50",
          foreground: "#F4F3F0",
        },
        secondary: {
          DEFAULT: "#242B3A",
          foreground: "#F4F3F0",
        },
        accent: {
          DEFAULT: "#E8B86D",
          foreground: "#171923",
        },
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#F4F3F0",
        },
        muted: {
          DEFAULT: "#242B3A",
          foreground: "#8E9AA8",
        },
        popover: {
          DEFAULT: "#242B3A",
          foreground: "#F4F3F0",
        },
        card: {
          DEFAULT: "#212836",
          foreground: "#F4F3F0",
        },
      },
      borderRadius: {
        lg: "0.5rem",
        md: "calc(0.5rem - 2px)",
        sm: "calc(0.5rem - 4px)",
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
        pulseGlow: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.85", transform: "scale(1.02)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-glow": "pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;

