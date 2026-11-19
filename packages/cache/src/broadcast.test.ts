import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { broadcastInvalidation } from "./broadcast";

const PEER_VARS = [
  "ECOMMERCE_REVALIDATE_URL",
  "ECOMMERCE_URL",
  "ECOMMERCE_DOMAIN",
  "DASHBOARD_URL",
  "ADMIN_URL",
  "MARKETING_URL",
] as const;

const INV = { tags: ["marketing-blog:posts"], paths: [] };

describe("broadcastInvalidation", () => {
  const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));

  beforeEach(() => {
    for (const name of PEER_VARS) vi.stubEnv(name, "");
    vi.stubEnv("REVALIDATE_SECRET", "s3cret");
    vi.stubEnv("ECOMMERCE_URL", "https://www.tallaby.com");
    vi.stubEnv("DASHBOARD_URL", "https://dashboard.tallaby.com");
    vi.stubEnv("ADMIN_URL", "https://admin.tallaby.com");
    fetchMock.mockClear();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  const targets = () => fetchMock.mock.calls.map((call) => String((call as unknown[])[0])).sort();

  it("keeps today's peer list when the new vars are unset", async () => {
    await broadcastInvalidation(INV, "admin");
    expect(targets()).toEqual([
      "https://dashboard.tallaby.com/api/revalidate",
      "https://www.tallaby.com/api/revalidate",
    ]);
  });

  it("adds the marketing peer when MARKETING_URL is set", async () => {
    vi.stubEnv("MARKETING_URL", "https://marketing.internal");
    await broadcastInvalidation(INV, "admin");
    expect(targets()).toEqual([
      "https://dashboard.tallaby.com/api/revalidate",
      "https://marketing.internal/api/revalidate",
      "https://www.tallaby.com/api/revalidate",
    ]);
  });

  it("prefers ECOMMERCE_REVALIDATE_URL over ECOMMERCE_URL for the ecommerce peer", async () => {
    vi.stubEnv("ECOMMERCE_REVALIDATE_URL", "https://store.vercel.app");
    await broadcastInvalidation(INV, "dashboard");
    expect(targets()).toEqual([
      "https://admin.tallaby.com/api/revalidate",
      "https://store.vercel.app/api/revalidate",
    ]);
  });

  it("falls back to ECOMMERCE_DOMAIN when ECOMMERCE_URL is unset", async () => {
    vi.stubEnv("ECOMMERCE_URL", "");
    vi.stubEnv("ECOMMERCE_DOMAIN", "https://legacy.tallaby.com");
    await broadcastInvalidation(INV, "admin");
    expect(targets()).toContain("https://legacy.tallaby.com/api/revalidate");
  });

  it("never sends to itself", async () => {
    vi.stubEnv("MARKETING_URL", "https://marketing.internal");
    await broadcastInvalidation(INV, "marketing");
    expect(targets()).toEqual([
      "https://admin.tallaby.com/api/revalidate",
      "https://dashboard.tallaby.com/api/revalidate",
      "https://www.tallaby.com/api/revalidate",
    ]);

    fetchMock.mockClear();
    await broadcastInvalidation(INV, "ecommerce");
    expect(targets()).not.toContain("https://www.tallaby.com/api/revalidate");
    expect(targets()).toContain("https://marketing.internal/api/revalidate");
  });

  it("sends the from value and the secret header", async () => {
    vi.stubEnv("MARKETING_URL", "https://marketing.internal");
    await broadcastInvalidation(INV, "marketing");
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect((init.headers as Record<string, string>)["x-revalidate-secret"]).toBe("s3cret");
    expect(JSON.parse(String(init.body))).toMatchObject({ tags: INV.tags, from: "marketing" });
  });

  it("does nothing without REVALIDATE_SECRET", async () => {
    vi.stubEnv("REVALIDATE_SECRET", "");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await broadcastInvalidation(INV, "admin");
    expect(fetchMock).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
