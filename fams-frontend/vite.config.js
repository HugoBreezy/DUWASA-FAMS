import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// The backend does not enable CORS in its security chain, so in development the
// browser talks to Vite (same origin) and Vite forwards /api to Spring Boot.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: { '/api': { target: env.VITE_DEV_PROXY_TARGET || 'http://localhost:8080', changeOrigin: true } },
    },
  };
});
