/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./index.tsx",
        "./App.tsx",
        "./components/**/*.{ts,tsx,js,jsx}",
        "./services/**/*.{ts,tsx,js,jsx}"
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
                mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
            },
            colors: {
                'glass': {
                    50: 'rgba(255, 255, 255, 0.05)',
                    100: 'rgba(255, 255, 255, 0.08)',
                    200: 'rgba(255, 255, 255, 0.12)',
                    300: 'rgba(255, 255, 255, 0.16)',
                    400: 'rgba(255, 255, 255, 0.20)',
                    500: 'rgba(255, 255, 255, 0.30)',
                },
                'dark-glass': {
                    50: 'rgba(0, 0, 0, 0.05)',
                    100: 'rgba(0, 0, 0, 0.08)',
                    200: 'rgba(0, 0, 0, 0.12)',
                    300: 'rgba(0, 0, 0, 0.16)',
                    400: 'rgba(0, 0, 0, 0.20)',
                    500: 'rgba(0, 0, 0, 0.30)',
                },
                'iris': {
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#0f172a',
                },
            },
            backdropBlur: {
                xs: '2px',
                sm: '4px',
                md: '12px',
                lg: '16px',
                xl: '24px',
                '2xl': '40px',
                '3xl': '64px',
            },
            animation: {
                'fade-in': 'fadeIn 0.6s ease-out',
                'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
                'float': 'float 6s ease-in-out infinite',
                'shimmer': 'shimmer 2s ease-in-out infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'pulse-glow': {
                    '0%, 100%': { boxShadow: '0 0 20px rgba(0, 0, 0, 0.1)' },
                    '50%': { boxShadow: '0 0 40px rgba(0, 0, 0, 0.2)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                shimmer: {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(100%)' },
                },
            },
            boxShadow: {
                'glass': '0 8px 32px rgba(0, 0, 0, 0.12)',
                'float': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                'inner-glow': 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                'dark-glow': '0 0 40px rgba(0, 0, 0, 0.3)',
            },
        },
    },
    plugins: [],
};
