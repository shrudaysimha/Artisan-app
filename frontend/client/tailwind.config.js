/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        belikan: {
          bg: "#F9F3F3",
          surface: "#FFFFFF",
          dark: "#110B08",
          primary: "#AF5755",
          primaryHover: "#964745",
          secondary: "#5A4134",
          accent: "#BE6864",
          softRose: "#F4E8E8",
          rosePill: "#DBA4A4",
          border: "#EAE2E0",
          neutral: "#B1A39F",
          slate: "#757A98",
          gold: "#D4AF37",
          green: "#2D5A27",
        },
        artisan: {
          ivory: "#F9F3F3",
          terracotta: "#AF5755",
          brown: "#5A4134",
          olive: "#757A98",
        },
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "sans-serif"],
        serif: ["'Playfair Display'", "serif"],
      },
      borderRadius: {
        DEFAULT: "8px",
        primary: "1.25rem",
        secondary: "9999px",
        'belikan': "1.5rem",
      },
      boxShadow: {
        'belikan-sm': "0 2px 8px -2px rgba(17, 11, 8, 0.05)",
        'belikan-card': "0 8px 24px -4px rgba(175, 87, 85, 0.08), 0 2px 6px -1px rgba(17, 11, 8, 0.04)",
        'belikan-hover': "0 14px 32px -6px rgba(175, 87, 85, 0.16), 0 4px 12px -2px rgba(17, 11, 8, 0.06)",
        'belikan-nav': "0 -4px 20px -2px rgba(17, 11, 8, 0.05)",
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("tailwind-scrollbar-hide")],
};
