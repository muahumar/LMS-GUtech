/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff1f3',
          100: '#ffe0e5',
          200: '#ffc6cf',
          300: '#ff9aab',
          400: '#f4627d',
          500: '#d62e4f',
          600: '#b3153a',
          700: '#8f0f2e',
          800: '#6f0c25',
          900: '#52091c',
          950: '#2e040f',
        },
        navy: {
          850: '#111827',
          900: '#0f172a',
          950: '#090d16',
        },
        slate: {
          850: '#1e293b',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'premium': '0 10px 25px -5px rgba(15, 23, 42, 0.06), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
        'glow': '0 0 15px -3px rgba(179, 21, 58, 0.30)',
      }
    },
  },
  plugins: [],
}
