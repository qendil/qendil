import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    root: "src",
    globals: true,
    setupFiles: ["setuptests.ts"],
    coverage: {
      reporter: ["lcov", "text"],
    },
  },
});
