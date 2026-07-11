/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f1f6ff",
          100: "#dfeaff",
          200: "#b9d3ff",
          300: "#8bb5ff",
          400: "#5c8fff",
          500: "#3466ff",
          600: "#2148f0",
          700: "#1b39c2",
          800: "#1a319a",
          900: "#1a2e79",
        },
        accent: {
          500: "#ff8a3d",
          600: "#f0701c",
        },
      },
      fontFamily: {
        sans: ["Assistant", "Heebo", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 10px rgba(20, 30, 70, 0.06)",
        floating: "0 8px 24px rgba(20, 30, 70, 0.14)",
      },
    },
  },
  plugins: [],
};
