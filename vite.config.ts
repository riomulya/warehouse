import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss({
      content: ['./index.html', './src/**/*.{ts,tsx}'],
    }),
  ],
  server: {
    port: 5173,
    open: true,
    watch: {
      usePolling: true,
    },
  },
});
