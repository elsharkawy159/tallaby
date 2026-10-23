import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Component tests (`*.test.tsx`) render with the automatic JSX runtime, as Next does.
  esbuild: { jsx: "automatic" },
  test: {
    environment: "node",
    include: ["app/**/*.test.ts", "lib/**/*.test.ts", "components/**/*.test.ts", "components/**/*.test.tsx"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
