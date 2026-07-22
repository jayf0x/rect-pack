import { fileURLToPath } from 'node:url';
import preact from '@preact/preset-vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// Import the library straight from source so the demo tracks local changes.
const rectPack = fileURLToPath(new URL('../src/index.ts', import.meta.url));

export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/rect-pack/' : '/',
  plugins: [preact(), tailwindcss()],
  resolve: {
    alias: { 'rect-pack': rectPack },
  },
});
