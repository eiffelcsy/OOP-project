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
      // Explicitly map vue-sonner imports to the installed package files. Some
      // environments (esbuild used by Vite) respect package.json "exports"
      // and prevent deep imports; these aliases point to the actual files.
      'vue-sonner/style.css': path.resolve(__dirname, 'node_modules/vue-sonner/lib/index.css'),
      'vue-sonner': path.resolve(__dirname, 'node_modules/vue-sonner/lib/index.js'),
    },
  },
  optimizeDeps: {
    include: ['vue-sonner'],
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
    // Proxy API calls to backend in development to avoid CORS and index.html fallbacks
    proxy: {
      '/api': {
        target: 'http://backend:8080',
        changeOrigin: true,
        secure: false,
        rewrite: (p) => p.replace(/^\/api/, '/api')
      }
    }
  },
})
