/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sketch: ['"Shantell Sans"', '"Patrick Hand"', '"Kalam"', 'sans-serif'],
        hand: ['"Architects Daughter"', '"Caveat"', 'cursive'],
        kalam: ['"Kalam"', 'cursive'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      gridTemplateColumns: {
        '24': 'repeat(24, minmax(0, 1fr))',
      },
      colors: {
        paper: {
          50: '#fcfbf8',
          100: '#f7f5ef',
          200: '#eee9de',
          300: '#dfd8c7',
          700: '#232936',
          800: '#181d27',
          900: '#11151e',
          950: '#0c0f16',
        },
        graphite: {
          100: '#e5e7eb',
          300: '#9ca3af',
          500: '#6b7280',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        ink: {
          blue: '#1d4ed8',
          cyan: '#0284c7',
          green: '#15803d',
          purple: '#7e22ce',
          amber: '#b45309',
          rose: '#be123c',
        },
        background: '#090d16',
        surface: '#0f172a',
        'surface-elevated': '#1e293b',
        'surface-hover': '#334155',
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        incognito: {
          50: '#faf5ff',
          100: '#f3e8ff',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          900: '#3b0764'
        }
      },
      boxShadow: {
        'sketch': '2px 3px 0px rgba(0, 0, 0, 0.08)',
        'sketch-lg': '3px 4px 0px rgba(0, 0, 0, 0.12)',
        'sketch-dark': '2px 3px 0px rgba(0, 0, 0, 0.4)',
        'glow-cyan': '0 0 20px -5px rgba(56, 189, 248, 0.3)',
        'glow-purple': '0 0 20px -5px rgba(168, 85, 247, 0.3)',
        'glow-emerald': '0 0 20px -5px rgba(16, 185, 129, 0.3)',
        'glow-amber': '0 0 20px -5px rgba(245, 158, 11, 0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        }
      }
    },
  },
  plugins: [],
}
