/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}"],
  theme: {
    extend: {
      boxShadow: {
        panel: "0 24px 60px rgba(15, 23, 42, 0.12)"
      },
      colors: {
        brand: {
          50: "#f2fbf9",
          100: "#d9f4ec",
          500: "#0f8b8d",
          700: "#176087",
          900: "#102a43"
        },
        accent: {
          100: "#fff3d6",
          400: "#f59e0b",
          600: "#b45309"
        }
      }
    }
  },
  plugins: []
};
