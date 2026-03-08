import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: "#1a56db",
        "brand-dark": "#1e40af",
      },
    },
  },
  plugins: [],
};

export default config;
