/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        swarm: {
          dark: '#0f172a',
          panel: '#1e293b',
          border: '#334155',
          primary: '#3b82f6',
          success: '#22c55e',
          warning: '#eab308',
          danger: '#ef4444',
        }
      }
    },
  },
  plugins: [],
}
