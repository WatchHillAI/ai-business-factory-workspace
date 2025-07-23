/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'public': '#3b82f6',
        'exclusive': '#8b5cf6', 
        'ai-generated': '#f59e0b',
        'success': '#10b981',
        'dark': {
          'bg': {
            'primary': '#0a0a0b',
            'secondary': '#161618',
            'tertiary': '#1f1f23'
          },
          'text': {
            'primary': '#f4f4f5',
            'secondary': '#d4d4d8',
            'tertiary': '#a1a1aa'
          },
          'border': {
            'primary': '#27272a',
            'secondary': '#3f3f46'
          }
        }
      }
    },
  },
  plugins: [],
}