import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: './dist',
    lib: {
      entry: "src/cloud_input.js",
      name: "ime",
      formats: ["umd"],
      fileName: () => `cloud-ime-lib.js`,
    },
    minify: false,
  },
});
