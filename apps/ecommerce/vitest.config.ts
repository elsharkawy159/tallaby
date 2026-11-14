import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Component tests (`*.test.tsx`) render with the automatic JSX runtime, as Next does.
  esbuild: { jsx: "automatic" },
  test: {
    environment: "node",
    // next-intl imports "next/navigation" without an extension, which Node ESM can't resolve: let Vite load it.
    server: { deps: { inline: ["next-intl"] } },
    include: ["app/**/*.test.ts", "i18n/**/*.test.ts", "lib/**/*.test.ts", "components/**/*.test.ts", "components/**/*.test.tsx"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
