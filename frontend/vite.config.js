import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,  // Enable network access
    port: 3000,  // Set frontend port
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // Change 5000 to match your backend port
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
