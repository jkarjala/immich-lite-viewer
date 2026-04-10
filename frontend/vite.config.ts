import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [
      react(),
      legacy({
        targets: ['chrome 38'],
        modernTargets: [],
        renderLegacyChunks: true,
        modernPolyfills: false,
        polyfills: [
        'es.symbol',
        'es.symbol.iterator',
        'es.promise',
        'es.object.assign',
        'es.array.includes',
        'es.map',
        'es.set'
      ]

    })
  ],
  build: {
    target: 'es5'
  },
  server: {
    host: '0.0.0.0',
    proxy: {
      '/search': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/folders': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
