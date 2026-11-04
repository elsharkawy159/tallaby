/** The staging project. Test runs may only ever reach this database. */
const STAGING_REF = "cxqjrwjianxskhzmrkla";

/** Nothing listens here, so a query fails loudly and touches no data. */
export const BLOCKED_TEST_DATABASE_URL = "postgres://blocked:blocked@127.0.0.1:1/blocked-outside-staging";

/**
 * The address the database client connects to. Each app's `.env` points at
 * production, and `dotenv/config` loads it when a test imports this package
 * before setting DATABASE_URL, which once wrote test rows to production
 * (2026-11-04). So under Vitest anything but staging becomes an address that
 * can't connect. Outside tests this returns the address unchanged.
 */
export function connectionStringForEnv(env: { DATABASE_URL?: string; VITEST?: string }): string {
  const url = env.DATABASE_URL!;
  if (!env.VITEST) return url;
  return url?.includes(STAGING_REF) ? url : BLOCKED_TEST_DATABASE_URL;
}
