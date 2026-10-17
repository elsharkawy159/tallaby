import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    testTimeout: 30_000,
    // Integration files each open their own pool against TEST_DATABASE_URL; in
    // parallel they exceed the Supabase session pooler (15 clients) and fail
    // with EMAXCONNSESSION. Run files one after another when a DB is used.
    fileParallelism: !process.env.TEST_DATABASE_URL,
  },
});
