export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
        secondary: '#475569',
        success: '#22c55e',
        warning: '#eab308',
        danger: '#ef4444',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      },
      maxWidth: {
        '7xl': '80rem',
      },
    },
  },
  plugins: [],
}