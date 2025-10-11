import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true, // Listen on all addresses (needed for Docker)
    port: 5173,
    watch: {
      usePolling: true, // Enable polling for file changes in Docker
    },
    hmr: {
      host: 'localhost', // Hot Module Replacement host
    },
  },
})
