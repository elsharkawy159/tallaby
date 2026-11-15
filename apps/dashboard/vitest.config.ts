import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["app/**/*.test.ts", "lib/**/*.test.ts", "components/**/*.test.ts", "i18n/**/*.test.ts"],
    // next-intl's navigation imports `next/navigation` without an extension, which
    // Node's ESM loader can't resolve; bundling it through Vite resolves it
    // (modules importing @/i18n/navigation, plan Phase 1.5).
    server: { deps: { inline: ["next-intl"] } },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
