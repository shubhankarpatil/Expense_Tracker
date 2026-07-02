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
        surface: '#27272a',
        page: '#18181b',
        track: '#3f3f46',
        cat: {
          food: '#2a78d6',
          travel: '#1baf7a',
          bills: '#eda100',
          shopping: '#008300',
          entertainment: '#4a3aa7',
          health: '#e05c5c',
          other: '#71717a',
        },
      },
    },
  },
  plugins: [],
};

export default config;
