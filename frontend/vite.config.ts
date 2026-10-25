import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development, /api requests are forwarded to the backend on port 5000
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': 'https://brewnest-backend-02ex.onrender.com/' } }
});
