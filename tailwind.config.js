/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Friendlier, higher-contrast palette. Same "meaning" mapping as
        // before (ink = dark text/sidebar, teal = primary action,
        // good/bad/warn = status) but softer and easier on the eyes.
        ink: "#152A3A",
        paper: "#F7F8FA",
        brand: {
          50: "#EFF9F8",
          100: "#D7F0ED",
          200: "#AFE1DB",
          400: "#2E9C93",
          500: "#0F7A70",
          600: "#0C645D",
          700: "#0A504B",
        },
        teal: "#0F7A70",
        good: "#188A4B",
        bad: "#D0342C",
        warn: "#C2760C",
        // Used only on the public landing page, grounded in the school's
        // own setting (Skardu, a valley in Gilgit-Baltistan known for its
        // apricot orchards and glacial rivers) rather than the app's
        // interior palette above.
        valley: "#1C2E37",
        gold: "#C6862B",
        glacier: "#4E7C8C",
        apricot: "#E7C08A",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
        display: ["Fraunces", "ui-serif", "Georgia", "serif"],
      },
      fontSize: {
        base: ["1rem", { lineHeight: "1.6" }],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(21,42,58,0.04), 0 2px 8px rgba(21,42,58,0.06)",
        card: "0 1px 3px rgba(21,42,58,0.06), 0 4px 14px rgba(21,42,58,0.05)",
        popover: "0 8px 30px rgba(21,42,58,0.18)",
      },
    },
  },
  plugins: [],
};
