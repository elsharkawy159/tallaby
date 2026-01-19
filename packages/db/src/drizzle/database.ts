import "dotenv/config";

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import * as DB_SCHEMA from "./schema";
import * as DB_RELATIONS from "./relations";

export const schema = { ...DB_SCHEMA, ...DB_RELATIONS };

const client = postgres(process.env.DATABASE_URL!);
// const client = postgres("postgresql://postgres.wnhzenpxtvpgetvjvdjg:e-commerce123@aws-0-eu-central-1.pooler.supabase.com:6543/postgres");

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
