/* eslint-disable import/no-extraneous-dependencies */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://github.com/egoist/vite-plugin-mix/issues/33
import type { Plugin } from 'vite';
import type { Adapter } from 'vite-plugin-mix';
import mixPlugin from 'vite-plugin-mix';

interface MixConfig {
  handler: string
  adapter?: Adapter | undefined
}
type MixPlugin = (config: MixConfig) => Plugin // eslint-disable-line no-unused-vars
interface Mix {
  default: MixPlugin
}
const mix = (mixPlugin as unknown as Mix).default;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    mix({
      handler: './src/utils/translate.ts',
    }),
  ],

  server: {
    proxy: {
      '/anki': {
        target: 'http://127.0.0.1:8765',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/anki/, ''),
        // changeOrigin does not seem to work with AnkiConnect
        // these headers need to be manually set
        headers: {
          host: 'http://127.0.0.1:8765',
          origin: 'http://127.0.0.1:8765',
        },
      },
    },
  },
});
