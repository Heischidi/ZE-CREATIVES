/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Ze: Creatives brand palette
        brand: {
          primary: "#7957F5",
          "primary-dark": "#5E3DD0",
          "primary-light": "#9B7CF7",
          lavender: "#E9DFFF",
          blush: "#F8E7F0",
          bg: "#FCFAFF",
          text: "#171526",
          muted: "#777386",
          border: "#EEEAF5",
          "border-strong": "#D4C9F5",
          white: "#FFFFFF",
          surface: "#FFFFFF",
          "surface-2": "#F8F6FF",
        },
        purple: {
          50: "#FCFAFF",
          100: "#E9DFFF",
          200: "#D4C9F5",
          300: "#B9A5F0",
          400: "#9B7CF7",
          500: "#7957F5",
          600: "#5E3DD0",
          700: "#4529A6",
          800: "#2E1878",
          900: "#171526",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-2xl": ["4.5rem", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" }],
        "display-xl": ["3.75rem", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" }],
        "display-lg": ["3rem", { lineHeight: "1.15", letterSpacing: "-0.02em", fontWeight: "700" }],
        "display-md": ["2.25rem", { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "700" }],
        "display-sm": ["1.875rem", { lineHeight: "1.25", letterSpacing: "-0.01em", fontWeight: "600" }],
        "display-xs": ["1.5rem", { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "600" }],
      },
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
        "112": "28rem",
        "128": "32rem",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        card: "0 1px 3px rgba(121, 87, 245, 0.04), 0 4px 16px rgba(121, 87, 245, 0.06)",
        "card-hover": "0 4px 12px rgba(121, 87, 245, 0.1), 0 16px 48px rgba(121, 87, 245, 0.12)",
        button: "0 2px 8px rgba(121, 87, 245, 0.25)",
        "button-hover": "0 4px 16px rgba(121, 87, 245, 0.35)",
        glow: "0 0 40px rgba(121, 87, 245, 0.15)",
        "inner-sm": "inset 0 1px 3px rgba(0, 0, 0, 0.06)",
      },
      backgroundImage: {
        "gradient-brand": "linear-gradient(135deg, #7957F5 0%, #9B7CF7 50%, #C4AAFF 100%)",
        "gradient-soft": "linear-gradient(135deg, #FCFAFF 0%, #F0EAFF 100%)",
        "gradient-card": "linear-gradient(145deg, #FFFFFF 0%, #F8F6FF 100%)",
        "gradient-hero": "radial-gradient(ellipse at 60% 0%, #E9DFFF 0%, transparent 60%), radial-gradient(ellipse at 10% 80%, #F8E7F0 0%, transparent 60%)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "fade-up": "fadeUp 0.6s ease-out",
        "scale-in": "scaleIn 0.3s ease-out",
        "slide-in-right": "slideInRight 0.4s ease-out",
        float: "float 6s ease-in-out infinite",
        "pulse-soft": "pulseSoft 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        fadeUp: { "0%": { opacity: "0", transform: "translateY(20px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        scaleIn: { "0%": { opacity: "0", transform: "scale(0.95)" }, "100%": { opacity: "1", transform: "scale(1)" } },
        slideInRight: { "0%": { opacity: "0", transform: "translateX(20px)" }, "100%": { opacity: "1", transform: "translateX(0)" } },
        float: { "0%, 100%": { transform: "translateY(0px)" }, "50%": { transform: "translateY(-20px)" } },
        pulseSoft: { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0.7" } },
      },
      transitionTimingFunction: {
        "bounce-soft": "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },
  },
  plugins: [],
};
