/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        keepgoing: {
          "primary":          "#c2410c",  // orange-700
          "primary-content":  "#ffffff",
          "secondary":        "#9a3412",  // orange-800
          "accent":           "#ea580c",  // orange-600
          "neutral":          "#1c1c1c",
          "base-100":         "#111111",  // near black
          "base-200":         "#1a1a1a",  // dark gray
          "base-300":         "#242424",  // slightly lighter gray
          "base-content":     "#e5e5e5",  // light text
          "info":             "#3b82f6",
          "success":          "#22c55e",
          "warning":          "#f59e0b",
          "error":            "#ea580c",  // orange-600 (no red in this app)
          "error-content":   "#ffffff",
        },
      },
    ],
  },
}
