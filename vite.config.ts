import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import svgLoader from 'vite-svg-loader'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: './dist',
    lib: {
      entry: 'src/index.ts',
      name: 'SimpleIme',
      formats: ['es', 'umd', 'cjs', 'iife'],
      fileName: (format) => {
        const map: Record<string, string> = {
          es: 'simple-ime.es.js',
          umd: 'simple-ime.umd.js',
          cjs: 'simple-ime.cjs',
          iife: 'simple-ime.global.js',
        }
        return map[format]
      },
    },
    minify: true,
    // sourcemap: true,
  },
  plugins: [
    dts(),
    svgLoader({
      svgo: true,
      defaultImport: 'url',
    }),
  ],
})
