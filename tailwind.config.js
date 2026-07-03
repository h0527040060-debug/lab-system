export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Heebo', 'system-ui', 'sans-serif'],
      },
      colors: {
        orange: {
          50:  '#fff8f0',
          100: '#ffedcc',
          200: '#ffd999',
          300: '#ffc266',
          400: '#ffa833',
          500: '#f39200',
          600: '#cc7a00',
          700: '#a66300',
          800: '#804d00',
          900: '#5c3700',
          950: '#3d2500',
        },
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%':   { opacity: '0', transform: 'translateX(40px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '15%':      { transform: 'translateX(-6px)' },
          '30%':      { transform: 'translateX(6px)' },
          '45%':      { transform: 'translateX(-4px)' },
          '60%':      { transform: 'translateX(4px)' },
          '75%':      { transform: 'translateX(-2px)' },
          '90%':      { transform: 'translateX(2px)' },
        },
        pulse2: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.5' },
        },
        ripple: {
          '0%':   { transform: 'scale(0)', opacity: '0.4' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
      },
      animation: {
        'fade-in':        'fadeIn 0.18s ease-out both',
        'slide-up':       'slideUp 0.22s ease-out both',
        'slide-in-right': 'slideInRight 0.25s ease-out both',
        'scale-in':       'scaleIn 0.15s ease-out both',
        'shimmer':        'shimmer 1.4s linear infinite',
        'shake':          'shake 0.45s ease-in-out both',
        'pulse2':         'pulse2 1.5s ease-in-out infinite',
        'ripple':         'ripple 0.5s ease-out forwards',
      },
    },
  },
  plugins: [],
}
