import { defineConfig } from 'vite'
import svgLoader from 'vite-svg-loader'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: './dist',
    lib: {
      entry: 'src/index.ts',
      name: 'SimpleIme',
      formats: ['iife'],
      fileName: () => 'simple-ime.global.js',
    },
    minify: false,
  },
  plugins: [
    svgLoader({
      svgo: true,
      defaultImport: 'url',
    }),
  ],
})
