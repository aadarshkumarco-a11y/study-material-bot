/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#000000",
        surface: "#111111",
        surface2: "#1a1a1a",
        border: "#222222",
        accent: "#E53E3E",
        accentDark: "#C53030",
        premium: "#DD6B20",
        online: "#48BB78",
        tgblue: "#0088CC",
        diskBlue: "#3B82F6",
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};
