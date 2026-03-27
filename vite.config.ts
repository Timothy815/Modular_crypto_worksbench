import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/Modular_crypto_worksbench/',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react';
          }

          if (id.includes('/src/ui/demo-projects.ts')) {
            return 'demo-data';
          }

          if (id.includes('/src/ui/starter-tutorials.ts') || id.includes('/src/ui/starter-challenges.ts')) {
            return 'guide-data';
          }

          return undefined;
        },
      },
    },
  },
})
