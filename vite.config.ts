import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { snapBuild } from 'byte-snap';
import include from 'plugin-include';

export default defineConfig({
  plugins: [dts({ rollupTypes: true }), snapBuild.vite({ dir: 'dist' }), include('./README.md')],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        react: resolve(__dirname, 'src/react.tsx'),
      },
      formats: ['es', 'cjs'],
      fileName: (format, name) => `${name}.${format === 'es' ? 'js' : 'cjs'}`,
    },
    target: 'es2020',
    minify: 'oxc',
    sourcemap: true,
    rollupOptions: {
      // Keep React out of the bundle so `@weighted-grid/react` tree-shakes away when unused.
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: { exports: 'named' },
    },
  },
});
