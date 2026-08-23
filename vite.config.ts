import stylex from "@stylexjs/unplugin"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [
    stylex.vite({
      runtimeInjection: false,
      styleResolution: "property-specificity",
      useCSSLayers: false,
      unstable_moduleResolution: { type: "commonJS", rootDir: "." },
    }),
    react(),
  ],
  resolve: {
    alias: { "@": new URL("./src", import.meta.url).pathname },
  },
  server: {
    allowedHosts: ["t-03gqdm7gbyb6d4prr0ifleomw-p29957.onamp.dev"],
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
})
