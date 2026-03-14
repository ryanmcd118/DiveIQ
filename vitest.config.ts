import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/__tests__/**/*.test.ts"],
    setupFiles: ["src/__tests__/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "lcov"],
      include: [
        "src/app/api/**/*.ts",
        "src/services/**/*.ts",
        "src/features/**/services/**/*.ts",
        "src/features/**/lib/**/*.ts",
        "src/lib/**/*.ts",
      ],
      exclude: ["src/lib/prisma.ts", "src/**/*.test.ts"],
      thresholds: {
        statements: 30,
        branches: 25,
        functions: 30,
        lines: 30,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
