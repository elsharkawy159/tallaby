import "dotenv/config";

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import * as DB_SCHEMA from "../../migrations/schema";
import * as DB_RELATIONS from "../../migrations/relations";

export const schema = { ...DB_SCHEMA, ...DB_RELATIONS };

const client = postgres(process.env.DATABASE_URL!);
// const client = postgres("postgresql://postgres.wnhzenpxtvpgetvjvdjg:e-commerce123@aws-0-eu-central-1.pooler.supabase.com:6543/postgres");

// Instantiate Drizzle client with pg driver and schema.
export const db = drizzle(client, { schema });
