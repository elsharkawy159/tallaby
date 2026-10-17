import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    // Integration files each open a pool against TEST_DATABASE_URL; in parallel
    // they can exceed the Supabase session pooler (15 clients). Serialize them
    // when a DB is used.
    fileParallelism: !process.env.TEST_DATABASE_URL,
  },
})
