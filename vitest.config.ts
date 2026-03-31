import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
    // Run sequentially to avoid SQLite concurrency issues
    fileParallelism: false,
    // Increase timeout for DB operations
    testTimeout: 30000,
    hookTimeout: 30000,
    coverage: {
      enabled: true,
      provider: "istanbul",
      include: ["server/**/*.ts"],
      exclude: [
        "server/index.ts",   // Server bootstrap — not unit-testable
        "server/vite.ts",    // Vite dev server setup — not unit-testable
        "server/static.ts",  // Static file serving — not unit-testable
      ],
      reporter: ["text", "text-summary", "json-summary"],
      reportsDirectory: "./coverage",
    },
  },
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
});
