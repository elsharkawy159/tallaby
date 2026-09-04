import "dotenv/config";

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import * as DB_SCHEMA from "./schema";
import * as DB_RELATIONS from "./relations";

export const schema = { ...DB_SCHEMA, ...DB_RELATIONS };

const connectionString = process.env.DATABASE_URL!;

/**
 * Supabase's transaction-mode pooler (port 6543, pgbouncer) does not support
 * session-level prepared statements. postgres-js prepares statements by
 * default, which is silently incompatible with that pooler mode — disable
 * it whenever the connection string targets :6543.
 *
 * `max` must stay comfortably ABOVE the app's peak query concurrency. When
 * noticeably more queries are in flight than the pool has connections, the
 * postgres-js queue against this pooler stops draining and every waiter hangs
 * forever — not a slow query, a permanent stall. `max: 1` therefore deadlocked
 * on any two concurrent queries at all, which Next.js produces on every
 * request by rendering layout and page in parallel. Measured against this
 * database: max:1 with 2 parallel queries never resolves; max:20 with 40
 * parallel queries resolves in ~650ms.
 *
 * Serverless invocations serve one request at a time and are billed per
 * connection, so they stay small; a long-running Node server needs headroom.
 */
const usesTransactionPooler = /:6543(\/|$)/.test(connectionString);
const isServerless = Boolean(
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME,
);

const client = postgres(connectionString, {
  max: isServerless ? 4 : 20,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: !usesTransactionPooler,
  /**
   * Skip the type-introspection round-trip postgres-js runs the first time it
   * meets an unknown OID. It costs an extra query on every new connection and
   * is the other operation observed to wedge under the transaction pooler.
   */
  fetch_types: false,
});

// Instantiate Drizzle client with pg driver and schema.
export const db = drizzle(client, { schema });

/**
 * Drizzle's postgres-js driver replaces date/json OID serializers with
 * identity functions. postgres.js Bind() then calls Buffer.byteLength on
 * non-strings (Date, number for int8 LIMIT, objects) and throws. Restore
 * wire-safe string serializers after drizzle() mutates them.
 */
const toPostgresWireString = (value: unknown): string => {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object" && value !== null) return JSON.stringify(value);
  return String(value);
};

for (const oid of [
  "20", // int8 / bigint (LIMIT/OFFSET)
  "1082", // date
  "1083", // time
  "1114", // timestamp
  "1115", // timestamp[]
  "1182", // date[]
  "1184", // timestamptz
  "1185", // timestamptz[]
  "1231", // numeric[]
  "114", // json
  "3802", // jsonb
] as const) {
  client.options.serializers[oid] = toPostgresWireString;
}

// Re-export specific drizzle-orm functions
export {
  eq,
  and,
  or,
  not,
  isNull,
  isNotNull,
  desc,
  asc,
  sql,
  count,
  sum,
  avg,
  min,
  max,
  like,
  ilike,
  inArray,
  notInArray,
  between,
  notBetween,
  gte,
  gt,
  lte,
  lt,
  exists,
  notExists,
  ne,
} from "drizzle-orm";
