/// <reference types="vitest" />
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/customizable-layout/",
  build: {
    commonjsOptions: {
      transformMixedEsModules: false,
    },
  },
  server: {
    fs: {
      allow: ["../.."],
    },
  },
});