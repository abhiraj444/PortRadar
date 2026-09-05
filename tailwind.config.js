/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cad: {
          dark: '#0f172a',
          darker: '#090d16',
          panel: '#1e293b',
          panelLight: '#334155',
          accent: '#3b82f6',
          accentHover: '#2563eb',
          grid: '#334155',
          border: '#1e293b',
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}

