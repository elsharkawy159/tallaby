import { describe, expect, it } from "vitest";
import { BLOCKED_TEST_DATABASE_URL, connectionStringForEnv } from "./connection-guard";

const STAGING = "postgres://u:p@db.cxqjrwjianxskhzmrkla.supabase.co:5432/postgres";
const PRODUCTION = "postgres://u:p@db.sakwqwocbccpyrmwjowq.supabase.co:5432/postgres";

describe("database connection under tests", () => {
  it("blocks production and any other address under Vitest", () => {
    expect(connectionStringForEnv({ DATABASE_URL: PRODUCTION, VITEST: "true" })).toBe(BLOCKED_TEST_DATABASE_URL);
    expect(connectionStringForEnv({ DATABASE_URL: "postgres://localhost/x", VITEST: "true" })).toBe(BLOCKED_TEST_DATABASE_URL);
    expect(connectionStringForEnv({ VITEST: "true" })).toBe(BLOCKED_TEST_DATABASE_URL);
  });

  it("allows staging under Vitest", () => {
    expect(connectionStringForEnv({ DATABASE_URL: STAGING, VITEST: "true" })).toBe(STAGING);
  });

  it("changes nothing outside tests", () => {
    expect(connectionStringForEnv({ DATABASE_URL: PRODUCTION })).toBe(PRODUCTION);
  });
});
