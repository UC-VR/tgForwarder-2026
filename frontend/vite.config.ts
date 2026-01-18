import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:8000';
    const port = parseInt(process.env.PORT || '3005');

    return {
      server: {
        port: port,
        host: '0.0.0.0',
        proxy: {
            '/rules': {
                target: backendUrl,
                changeOrigin: true
            },
            '/logs': {
                target: backendUrl,
                changeOrigin: true
            }
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});