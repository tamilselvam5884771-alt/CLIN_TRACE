/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        clinical: {
          primary: "#0F766E",
          "primary-light": "#CCFBF1",
          bg: "#F5F8F7",
          surface: "#FFFFFF",
          text: "#0B2523",
          muted: "#5B7A76",
          border: "#E2E9E8",
        },
        urgency: {
          emergency: "#DC2626",
          urgent: "#F59E0B",
          standard: "#0F766E",
          nonurgent: "#94A3B8",
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        mono: ['"SF Mono"', 'Consolas', 'monospace'],
      },
      boxShadow: {
        clinical: "0 1px 3px 0 rgba(11, 37, 35, 0.05), 0 1px 2px 0 rgba(11, 37, 35, 0.03)",
        "clinical-md": "0 4px 6px -1px rgba(11, 37, 35, 0.06), 0 2px 4px -1px rgba(11, 37, 35, 0.04)",
      }
    },
  },
  plugins: [],
};
