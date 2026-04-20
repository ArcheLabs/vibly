import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sand: '#f6f1e8',
        ink: '#151515',
        slate: '#6b7280',
        mist: '#e5ddd1',
        coral: '#d86d47',
        pine: '#1f4f46',
        sky: '#c8dced',
      },
      boxShadow: {
        panel: '0 18px 60px rgba(21, 21, 21, 0.08)',
      },
      fontFamily: {
        display: ['"Space Grotesk"', '"Noto Sans SC"', '"Segoe UI"', 'sans-serif'],
        body: ['"IBM Plex Sans"', '"Noto Sans SC"', '"Segoe UI"', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config