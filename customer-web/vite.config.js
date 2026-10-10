import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), {
    name: 'reliv-versioned-worker',
    generateBundle() {
      const source = readFileSync(new URL('./public/sw.js', import.meta.url), 'utf8');
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: source.replace('reliv-customer-shell-v1', `reliv-customer-shell-${Date.now()}`) });
    },
  }],
  server: {
    port: 3000,
    host: true,
  },
});
