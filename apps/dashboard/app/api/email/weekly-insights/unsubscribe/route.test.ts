import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const optOut = vi.fn();
vi.mock("@workspace/db/log", () => ({ logServerError: vi.fn() }));
vi.mock("@workspace/lib/emails/seller-insights/server", () => ({ optOutOfWeeklyInsights: (token: unknown) => optOut(token) }));

const { GET, POST } = await import("./route");

const TOKEN = `${"a".repeat(32)}.${"b".repeat(22)}`;
const url = (token: string) => new NextRequest(`https://dashboard.tallaby.com/api/email/weekly-insights/unsubscribe?token=${token}`);

beforeEach(() => optOut.mockReset());

describe("weekly insights unsubscribe", () => {
  it("GET only shows a confirm form and never opts out", async () => {
    const res = await GET(url(TOKEN));
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('<form method="post"');
    expect(optOut).not.toHaveBeenCalled();
  });

  it("GET rejects a malformed token", async () => {
    expect((await GET(url("nope"))).status).toBe(400);
  });

  it("POST opts out with a valid token and reports invalid or unavailable otherwise", async () => {
    optOut.mockResolvedValueOnce("done");
    expect((await POST(url(TOKEN))).status).toBe(200);
    expect(optOut).toHaveBeenCalledWith(TOKEN);
    optOut.mockResolvedValueOnce("invalid");
    expect((await POST(url(TOKEN))).status).toBe(400);
    optOut.mockResolvedValueOnce("unavailable");
    expect((await POST(url(TOKEN))).status).toBe(503);
    optOut.mockRejectedValueOnce(new Error("db down"));
    expect((await POST(url(TOKEN))).status).toBe(503);
  });
});
