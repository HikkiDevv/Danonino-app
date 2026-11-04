/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        danonino: {
          bg: '#070a13',
          surface: '#0d1322',
          card: '#121a2e',
          cardHover: '#18233c',
          border: '#1e2c4a',
          borderLight: '#2a3d66',
          blue: '#3b82f6',
          violet: '#8b5cf6',
          lavender: '#c084fc',
          cyan: '#06b6d4',
          accent: '#ec4899',
          success: '#10b981',
          warning: '#f59e0b'
        }
      },
      animation: {
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'float': 'float 4s ease-in-out infinite',
        'glow-spin': 'glowSpin 8s linear infinite',
        'fade-in': 'fadeIn 0.3s ease-out'
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.9', transform: 'scale(1.04)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
