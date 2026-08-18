import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.live.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**"],
    testTimeout: 45_000,
    hookTimeout: 45_000,
    retry: 1,
    fileParallelism: false,
  },
});
