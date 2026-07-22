import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// Import the library straight from source so the demo tracks local changes.
const weightedGrid = fileURLToPath(new URL('../src/index.ts', import.meta.url));
const weightedGridReact = fileURLToPath(new URL('../src/react.tsx', import.meta.url));

// react is an *optional* peer dep of weighted-grid, so vite stubs it when resolving ../src/react.tsx.
// Force it onto the demo's real react install.
const require = createRequire(import.meta.url);
const reactMod = require.resolve('react');
const jsxRuntime = require.resolve('react/jsx-runtime');
const jsxDevRuntime = require.resolve('react/jsx-dev-runtime');

export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/weighted-grid/' : '/',
  build: {
    target: 'es2020',
    minify: 'oxc',
    cssMinify: true,
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: 'weighted-grid/react', replacement: weightedGridReact },
      { find: 'weighted-grid', replacement: weightedGrid },
      { find: /^react\/jsx-runtime$/, replacement: jsxRuntime },
      { find: /^react\/jsx-dev-runtime$/, replacement: jsxDevRuntime },
      { find: /^react$/, replacement: reactMod },
    ],
  },
});
