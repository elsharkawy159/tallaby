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
 */
const usesTransactionPooler = /:6543(\/|$)/.test(connectionString);

const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: !usesTransactionPooler,
});

// Instantiate Drizzle client with pg driver and schema.
export const db = drizzle(client, { schema });

/**
 * Drizzle's postgres-js driver replaces date/json serializers with identity
 * functions so it can parse values itself. postgres.js Bind() then calls
 * Buffer.byteLength on the raw JS value — numbers (LIMIT/OFFSET as int8),
 * Date instances, and jsonb objects throw ERR_INVALID_ARG_TYPE.
 * Always coerce those OIDs to a wire-safe string.
 *
 * @see https://github.com/drizzle-team/drizzle-orm/issues/5789
 */
const toPostgresWireString = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return String(value);
  }
  return JSON.stringify(value);
};

for (const oid of [
  20, // int8 — LIMIT / OFFSET / count(distinct …)
  114,
  3802, // json / jsonb
  1082,
  1083,
  1114,
  1115,
  1182,
  1184,
  1185,
  1231, // date / time / timestamp / numeric[]
]) {
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
