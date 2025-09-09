import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    // Suprimir avisos de CORS para serviços externos
    cors: {
      origin: true,
      credentials: true
    }
  },
  build: {
    // Suprimir warnings desnecessários no build
    rollupOptions: {
      onwarn(warning, warn) {
        // Ignorar warnings específicos
        if (warning.code === 'CIRCULAR_DEPENDENCY') return;
        if (warning.message.includes('appsignal')) return;
        if (warning.message.includes('sentry')) return;
        warn(warning);
      }
    }
  }
});
