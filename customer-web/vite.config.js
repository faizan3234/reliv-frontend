import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), {
    name: 'reliv-versioned-worker',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        // The tiny inline loading UI must paint before the main stylesheet.
        return html.replace(/<link rel="stylesheet" crossorigin href="([^"]+)">/g,
          '<link rel="stylesheet" crossorigin href="$1" media="print" data-reliv-style onload="this.media=\'all\'">');
      },
    },
    generateBundle() {
      const source = readFileSync(new URL('./public/sw.js', import.meta.url), 'utf8');
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: source.replace('reliv-customer-shell-v1', `reliv-customer-shell-${Date.now()}`) });
    },
  }],
  build: { target: 'es2018' },
  server: {
    port: 3000,
    host: true,
  },
});
