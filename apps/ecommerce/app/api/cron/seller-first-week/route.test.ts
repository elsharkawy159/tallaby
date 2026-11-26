import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

vi.mock("@workspace/db/log", () => ({ logServerError: vi.fn() }));

const request = (secret = "") => new Request("https://tallaby.com/api/cron/seller-first-week", {
  headers: { authorization: `Bearer ${secret}` },
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("seller insights cron", () => {
  it("rejects an unauthorized job before contacting the backend", async () => {
    vi.stubEnv("CRON_SECRET", "cron-only");
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    expect((await GET(request("wrong"))).status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("invokes the internal batch and returns its counts", async () => {
    vi.stubEnv("CRON_SECRET", "cron-only");
    vi.stubEnv("INTERNAL_API_SECRET", "email-only");
    vi.stubEnv("BACKEND_API_URL", "https://backend.example/");
    const counts = { offline: { sent: 1, failed: 0, skipped: 0 }, weekly: { sent: 2, failed: 1, skipped: 0 } };
    const fetch = vi.fn().mockResolvedValueOnce(Response.json(counts)).mockResolvedValueOnce(new Response(null, { status: 500 }));
    vi.stubGlobal("fetch", fetch);

    expect(await (await GET(request("cron-only"))).json()).toEqual(counts);
    expect(fetch).toHaveBeenCalledWith("https://backend.example/api/emails/seller-insights", expect.objectContaining({
      method: "POST",
      headers: { Authorization: "Bearer email-only" },
    }));
    expect((await GET(request("cron-only"))).status).toBe(502);
  });
});
