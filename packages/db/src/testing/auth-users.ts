import postgres from "postgres";
import { afterAll } from "vitest";

/**
 * Test-only fixture for integration suites, never imported by app code.
 *
 * users.id points at auth.users (0134), so a test user needs an auth row first.
 * Import this file statically at the top of a test file: it registers a
 * file-level afterAll that runs after every describe, even when a beforeAll or
 * another cleanup step failed. Deleting the auth row cascades everything the
 * user owns, and only the ids created here are ever deleted.
 */
const created = new Set<string>();
let client: ReturnType<typeof postgres> | undefined;

function connection() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error("createAuthUsers needs TEST_DATABASE_URL");
  client ??= postgres(url, { max: 1, prepare: false });
  return client;
}

/**
 * Creates the auth rows, then removes the public.users rows the auth trigger
 * made, so the suite's own `insert(users)` runs with exactly the values it sets.
 */
export async function createAuthUsers(...ids: string[]): Promise<void> {
  const sql = connection();
  for (const id of ids) {
    created.add(id);
    await sql`INSERT INTO auth.users (id, email, aud, role) VALUES (${id}, ${`qa-${id}@example.test`}, 'authenticated', 'authenticated')`;
    await sql`DELETE FROM public.users WHERE id = ${id}`;
  }
}

afterAll(async () => {
  if (!client) return;
  try {
    if (created.size > 0) await client`DELETE FROM auth.users WHERE id = ANY(${[...created]}::uuid[])`;
  } finally {
    await client.end();
  }
}, 120_000);
