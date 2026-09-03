/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}", "./emails/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#fafaf8",
        foreground: "#333333",
        primary: "#145163",
        "primary-foreground": "#fafafa",
        secondary: "#89a8b1",
        muted: "#f7f7f7",
        "muted-foreground": "#808080",
        accent: "#fdad28",
        border: "#e2cbcb",
        card: "#ffffff",
        success: "#0f766e",
      },
    },
  },
  plugins: [],
};
