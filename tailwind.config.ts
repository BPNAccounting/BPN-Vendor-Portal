import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // BPN brand — red: #FF4438, dark: #2D2A26
        bpn: {
          50:  '#fff1f0',
          100: '#ffe0dd',
          200: '#ffc0bb',
          300: '#ff9088',
          400: '#ff6055',
          500: '#ff4438',  // exact brand red
          600: '#e83228',
          700: '#cc1f18',
          800: '#a81912',
          900: '#8a1610',
          950: '#2D2A26',  // exact brand dark (headers)
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};

export default config;
