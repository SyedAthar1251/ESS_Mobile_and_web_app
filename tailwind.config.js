/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary, #4f46e5)',
          light: 'var(--color-primary-light, #818cf8)',
          dark: 'var(--color-primary-dark, #312e81)',
        },
        accent: {
          DEFAULT: 'var(--color-accent, #a855f7)',
          light: 'var(--color-accent-light, #c084fc)',
        },
        background: {
          DEFAULT: 'var(--color-background, #f3f4f6)',
          secondary: 'var(--color-background-secondary, #ffffff)',
        },
        text: {
          DEFAULT: 'var(--color-text, #111827)',
          secondary: 'var(--color-text-secondary, #6b7280)',
        },
        border: {
          DEFAULT: 'var(--color-border, #e5e7eb)',
        },
      },
    }
  },
  plugins: []
}
