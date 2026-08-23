import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ["t-03gqdm7gbyb6d4prr0ifleomw-p29957.onamp.dev"],
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
})
