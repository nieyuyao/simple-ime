import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: './dist',
    lib: {
      entry: "src/cloud-input.ts",
      name: "ime",
      formats: ["umd"],
      fileName: () => `cloud-ime-lib.js`,
    },
    minify: false,
  },
});
