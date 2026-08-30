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
