import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        sidebar: {
          DEFAULT: '#0f0f23',
          hover: '#1a1a3e',
          active: '#2d2d5b',
          border: '#2a2a4a',
          text: '#a0a0c0',
          'text-active': '#ffffff',
        },
        brand: {
          DEFAULT: '#6366f1',
          hover: '#4f46e5',
          light: '#818cf8',
        },
      },
    },
  },
  plugins: [],
}

export default config
