/** @type {import('tailwindcss').Config} */
// Sistema visual «Cuaderno nocturno» (2026-11-09): tinta cálida de noche, papel crema,
// tomate como acento principal (la voz de Danonino es Tomate), menta para los sueños y oro para lo aprendido.
// Los nombres antiguos (cyan, violet, lavender…) se conservan para que todas las vistas cambien de piel de una vez.
const tinta = {
  bg: '#110e13',
  surface: '#18141b',
  card: '#1f1a22',
  cardHover: '#28212b',
  border: '#352c38',
  borderLight: '#4a3e4c'
}
const acentos = {
  tomate: '#ff6a45',
  tomateHondo: '#e0472a',
  menta: '#8fe0c4',
  oro: '#f2bd5c',
  ciruela: '#c98bd6',
  rosa: '#ff8fa8',
  papel: '#f4ecdf'
}

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Bricolage Grotesque Variable"', 'ui-sans-serif', 'sans-serif'],
        display: ['"Fraunces Variable"', 'ui-serif', 'Georgia', 'serif'],
        mono: ['"Martian Mono"', 'ui-monospace', 'monospace']
      },
      colors: {
        // Gama de texto cálida: reemplaza el gris azulado en toda la app
        slate: {
          50: '#fbf7f0', 100: '#f4ecdf', 200: '#e7dccb', 300: '#cdbfac', 400: '#a3968a',
          500: '#7f7369', 600: '#5f5550', 700: '#463d3f', 800: '#2c2530', 900: '#1a161d', 950: '#110e13'
        },
        zinc: {
          400: '#a3968a', 700: '#463d3f', 800: '#2c2530', 900: '#1a161d'
        },
        danonino: {
          ...tinta,
          // Acentos (nombres heredados → colores nuevos)
          cyan: acentos.tomate,
          blue: acentos.ciruela,
          violet: acentos.tomateHondo,
          lavender: acentos.menta,
          accent: acentos.rosa,
          success: '#7fd1a3',
          warning: acentos.oro,
          muted: '#a3968a',
          text: acentos.papel,
          // Nombres nuevos
          ...acentos
        }
      },
      borderRadius: {
        hoja: '22px'
      },
      animation: {
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'float': 'float 5s ease-in-out infinite',
        'glow-spin': 'glowSpin 8s linear infinite',
        'fade-in': 'fadeIn 0.45s cubic-bezier(.2,.7,.2,1) both',
        'respirar': 'respirar 6s ease-in-out infinite',
        'deriva': 'deriva 18s ease-in-out infinite'
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.45', transform: 'scale(1)' },
          '50%': { opacity: '0.95', transform: 'scale(1.04)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        glowSpin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        respirar: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.85' },
          '50%': { transform: 'scale(1.06)', opacity: '1' },
        },
        deriva: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '33%': { transform: 'translate(6px, -8px)' },
          '66%': { transform: 'translate(-5px, 5px)' },
        }
      }
    },
  },
  plugins: [],
}
