/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./lib/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: "#e0b64a",
          light: "#f3d580",
          dark: "#b8912f",
        },
        ink: {
          900: "#0a0a0c",
          800: "#111114",
          700: "#17171c",
          600: "#1f1f26",
          500: "#2a2a33",
        },
        bull: "#26a69a",
        bear: "#ef5350",
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};
