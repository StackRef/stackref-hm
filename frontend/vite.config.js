import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url)));

// https://vitejs.dev/config/
export default defineConfig(() => ({
  plugins: [react()],

  // The codebase uses absolute imports like `import x from 'src/config'`.
  resolve: {
    alias: {
      src: path.resolve(__dirname, 'src'),
    },
  },

  // The original Create React App project keeps JSX in `.js` files. Teach
  // esbuild (used by Vite for transform + dependency pre-bundling) to treat
  // `.js` as JSX so we don't have to rename hundreds of files.
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: { '.js': 'jsx' },
    },
  },

  // Keep the legacy `REACT_APP_*` environment variables working. They are read
  // from `.env`, `.env.local`, `.env.<mode>` just like before, and exposed on
  // `import.meta.env`. REACT_APP_VERSION is injected from package.json.
  envPrefix: ['REACT_APP_'],
  define: {
    'import.meta.env.REACT_APP_VERSION': JSON.stringify(pkg.version),
  },

  server: {
    port: 9003,
    open: false,
  },

  build: {
    // Match the original output dir so the existing S3/CloudFront deploy
    // scripts continue to work.
    outDir: 'build',
    sourcemap: false,
  },

  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.js'],
  },
}));
