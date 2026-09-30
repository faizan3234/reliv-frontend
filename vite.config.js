import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    strictPort: false,
  },
  build: {
    outDir: 'dist',
    // Load kiosk styles with index.html, not as a fallible lazy-route preload.
    cssCodeSplit: false,
    manifest: true,
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          mqtt: ['mqtt'],
        },
      },
    },
  },
  preview: {
    port: 4173,
    host: true,
  },
})
