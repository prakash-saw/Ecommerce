/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        blanc: {
          bg: '#FAFAF8',
          card: '#FFFFFF',
          dark: '#111111',
          charcoal: '#222222',
          muted: '#6B7280',
          subtle: '#EAEAE6',
          border: '#E5E5E0',
          accent: '#18181B'
        },
        noir: {
          bg: '#0F0F10',
          card: '#18181B',
          cardBorder: '#27272A',
          muted: '#A1A1AA',
          border: '#27272A',
          subtle: '#1C1C1F'
        }
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      letterSpacing: {
        tighter: '-0.04em',
        tight: '-0.02em',
        widest: '0.15em',
        editorial: '0.2em'
      }
    },
  },
  plugins: [],
}
