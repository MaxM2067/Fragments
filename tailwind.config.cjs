/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './App.tsx',
    './index.tsx',
    './components/**/*.{ts,tsx}',
    './utils/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      borderRadius: {
        cozy: '2rem',
        bubble: '3rem',
        block: 'var(--radius-block, 1rem)',
      },
      boxShadow: {
        block: 'var(--shadow-block)',
        header: 'var(--shadow-header)',
      },
      colors: {
        'cozy-bg': '#FBFCFE',
        'cozy-indigo': '#6366F1',
        'cozy-cerulean': '#38BDF8',
        'cozy-slate': '#94A3B8',
        'cozy-purple': '#A5B4FC',
        'cozy-sage': '#94A3B8',
        'cozy-text': '#1E293B',
      },
    },
  },
};
