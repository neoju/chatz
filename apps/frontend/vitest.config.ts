import { defineConfig } from "vitest/config";
import { sveltekit } from "@sveltejs/kit/vite";
import path from "node:path";

export default defineConfig({
  plugins: [sveltekit()],
  resolve: {
    conditions: ["browser", "development"],
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.ts"],
    setupFiles: ["src/test-setup.ts"],
    alias: {
      "$lib": path.resolve(__dirname, "./src/lib"),
      "$app": path.resolve(__dirname, "./src/lib/__tests__/mocks/app"),
    },
    server: {
      deps: {
        inline: [/^svelte/],
      },
    },
  },
});
