import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

const backend='http://localhost:8787';

export default defineConfig({
  plugins:[react()],
  server:{
    port:5173,
    proxy:{
      '/proxy':backend,
      '/api':backend,
      '/oauth':backend,
      '/assert':backend,
      '/script':backend,
      '/mock':backend,
      '/health':backend
    }
  }
});
