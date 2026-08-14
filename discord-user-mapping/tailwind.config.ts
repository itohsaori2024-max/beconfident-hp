import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Discord ブランドカラー（ログインボタン等で使用）
        discord: {
          blurple: '#5865F2',
          'blurple-dark': '#4752C4',
          green: '#57F287',
          dark: '#2B2D31',
          darker: '#1E1F22',
          light: '#F2F3F5',
        },
        // アプリのブランドカラー（さおり塾ピンク）
        brand: {
          pink: '#e291a6',
          'pink-dark': '#d0798f',
          'pink-soft': '#f6e3e9',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
