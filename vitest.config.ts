/// <reference types="vitest" />
import { getViteConfig } from "astro/config";

export default getViteConfig({
  test: {
    // Enable global test APIs (describe, it, expect) without imports
    globals: true,

    // Use jsdom for DOM testing with React components
    environment: "jsdom",

    // Setup files for global mocks and custom matchers
    setupFiles: ["./src/test/setup.ts"],

    // Include patterns for test files
    include: ["src/**/*.{test,spec}.{ts,tsx}"],

    // Exclude patterns
    exclude: ["node_modules", "dist", "e2e"],

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      reportsDirectory: "./coverage",
      exclude: [
        "node_modules/",
        "dist/",
        "e2e/",
        "src/test/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/types.ts",
      ],
      // Thresholds can be enabled when test coverage is established
      // thresholds: {
      //   lines: 80,
      //   functions: 80,
      //   branches: 80,
      //   statements: 80,
      // },
    },

    // Type checking in tests
    typecheck: {
      enabled: true,
      tsconfig: "./tsconfig.json",
    },

    // Reporter configuration
    reporters: ["default"],

    // Pool for running tests
    pool: "forks",

    // Watch mode exclude patterns
    watchExclude: ["node_modules", "dist"],
  },
});

