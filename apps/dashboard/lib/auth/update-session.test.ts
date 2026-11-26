import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

// The proxy's session check (supabase/middleware.ts, A1 of docs/plans/dashboard-performance.md):
// getClaims() decides redirects; anything but valid claims reads as signed out.
const getClaims = vi.fn();
vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({ auth: { getClaims } }),
}));

const { updateSession } = await import("@/supabase/middleware");

async function run(path: string) {
  const request = new NextRequest(new URL(path, "https://dashboard.example.com"));
  const response = NextResponse.next();
  const result = await updateSession(request, response);
  return { result, response, location: result.headers.get("location") };
}

const signedIn = () => getClaims.mockResolvedValue({ data: { claims: { sub: "user-1" } }, error: null });

describe("updateSession", () => {
  beforeEach(() => {
    getClaims.mockReset();
  });

  it("passes a signed-in seller through", async () => {
    signedIn();
    const { result, response } = await run("/orders");
    expect(result).toBe(response);
  });

  it("sends a signed-out visitor to /login, keeping the English prefix", async () => {
    getClaims.mockResolvedValue({ data: null, error: null });
    expect((await run("/orders")).location).toBe("https://dashboard.example.com/login");
    expect((await run("/en/orders")).location).toBe("https://dashboard.example.com/en/login");
  });

  it("treats an auth error or a missing sub as signed out", async () => {
    getClaims.mockResolvedValue({ data: null, error: new Error("invalid") });
    expect((await run("/orders")).location).toContain("/login");
    getClaims.mockResolvedValue({ data: { claims: {} }, error: null });
    expect((await run("/orders")).location).toContain("/login");
  });

  it("treats a thrown error (e.g. a failed JWKS fetch) as signed out", async () => {
    getClaims.mockImplementation(async () => {
      throw new TypeError("fetch failed");
    });
    expect((await run("/orders")).location).toContain("/login");
  });

  it("keeps the next param for the OAuth consent and the AI builder", async () => {
    getClaims.mockResolvedValue({ data: null, error: null });
    const oauth = new URL((await run("/oauth/authorize?client_id=a")).location!);
    expect(oauth.searchParams.get("next")).toBe("/oauth/authorize?client_id=a");
    const builder = new URL((await run("/ai-builder?x=1")).location!);
    expect(builder.searchParams.get("next")).toBe("/ai-builder");
  });

  it("leaves public paths open when signed out", async () => {
    getClaims.mockResolvedValue({ data: null, error: null });
    for (const path of ["/login", "/signup", "/signup/seller", "/roadmap", "/.well-known/oauth-authorization-server"]) {
      expect((await run(path)).location).toBeNull();
    }
  });

  it("sends a signed-in user away from /login", async () => {
    signedIn();
    expect((await run("/login")).location).toBe("https://dashboard.example.com/");
    expect((await run("/en/login")).location).toBe("https://dashboard.example.com/en");
  });
});
