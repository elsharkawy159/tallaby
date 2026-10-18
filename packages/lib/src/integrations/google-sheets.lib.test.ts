import { randomBytes } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import {
  buildGoogleAuthUrl,
  exchangeGoogleCode,
  GOOGLE_SHEETS_SCOPE,
  orderToSheetRow,
  planSheetWrite,
  readGoogleClientEnv,
  readOrderIdColumn,
  revokeGoogleToken,
  type SheetOrder,
} from "./google-sheets.lib";
import { deriveOAuthStateKey, nonceMatches, OAUTH_STATE_TTL_MS, signOAuthState, verifyOAuthState } from "./google-oauth-state.server";

const order = (id: string, createdAt: string, overrides: Partial<SheetOrder> = {}): SheetOrder => ({
  id,
  orderNumber: `ORD-${id}`,
  createdAt,
  status: "pending",
  paymentStatus: "pending",
  paymentMethod: "cash",
  customerName: "=HYPERLINK(\"x\")",
  customerPhone: "01000000000",
  city: "Cairo",
  itemCount: 2,
  subtotal: "200.00",
  shippingCost: "50.00",
  discountAmount: "0.00",
  totalAmount: "250.00",
  currency: "EGP",
  ...overrides,
});

describe("OAuth state", () => {
  const key = deriveOAuthStateKey(randomBytes(32));
  const payload = { sellerId: "seller-a", storeId: "store-a1", nonce: "n0nce" };

  it("round-trips the seller, store and nonce", () => {
    expect(verifyOAuthState(signOAuthState(payload, key), key)).toEqual(payload);
  });

  it("rejects tampering, another key, expiry and junk", () => {
    const token = signOAuthState(payload, key, 1_000);
    expect(verifyOAuthState(token, key, 1_000 + OAUTH_STATE_TTL_MS + 1)).toBeNull();

    const fresh = signOAuthState(payload, key);
    const [body, mac] = fresh.split(".");
    const forged = Buffer.from(JSON.stringify({ s: "store-b1", u: "seller-a", n: "n0nce", e: Date.now() + 60_000 })).toString("base64url");
    expect(verifyOAuthState(`${forged}.${mac}`, key)).toBeNull();
    expect(verifyOAuthState(`${body}.${mac}x`, key)).toBeNull();
    expect(verifyOAuthState(fresh, deriveOAuthStateKey(randomBytes(32)))).toBeNull();
    expect(verifyOAuthState("a.b.c", key)).toBeNull();
    expect(verifyOAuthState(undefined, key)).toBeNull();
  });

  it("compares nonces in constant time and refuses empties", () => {
    expect(nonceMatches("abc", "abc")).toBe(true);
    expect(nonceMatches("abc", "abd")).toBe(false);
    expect(nonceMatches("", "")).toBe(false);
    expect(nonceMatches(undefined, "abc")).toBe(false);
  });
});

describe("Google client config and OAuth calls", () => {
  it("is unavailable without both env values", () => {
    expect(readGoogleClientEnv({})).toBeNull();
    expect(readGoogleClientEnv({ GOOGLE_OAUTH_CLIENT_ID: "id" })).toBeNull();
    expect(readGoogleClientEnv({ GOOGLE_OAUTH_CLIENT_ID: "id", GOOGLE_OAUTH_CLIENT_SECRET: "s" })).toEqual({ clientId: "id", clientSecret: "s" });
  });

  it("asks for drive.file, offline access and carries the state", () => {
    const url = new URL(buildGoogleAuthUrl({ clientId: "cid", redirectUri: "https://dash.example/cb" }, "st.ate"));
    expect(url.origin).toBe("https://accounts.google.com");
    expect(url.searchParams.get("scope")).toBe(GOOGLE_SHEETS_SCOPE);
    expect(url.searchParams.get("access_type")).toBe("offline");
    expect(url.searchParams.get("state")).toBe("st.ate");
  });

  it("requires a refresh token and the drive.file scope from the code exchange", async () => {
    const client = { clientId: "c", clientSecret: "s", redirectUri: "https://d/cb" };
    const ok = vi.fn(async () => new Response(JSON.stringify({ refresh_token: "r", access_token: "a", scope: GOOGLE_SHEETS_SCOPE })));
    expect(await exchangeGoogleCode(client, "code", { fetchImpl: ok as unknown as typeof fetch })).toEqual({
      ok: true,
      data: { refreshToken: "r", accessToken: "a", scopes: [GOOGLE_SHEETS_SCOPE] },
    });
    const noRefresh = vi.fn(async () => new Response(JSON.stringify({ access_token: "a", scope: GOOGLE_SHEETS_SCOPE })));
    expect(await exchangeGoogleCode(client, "code", { fetchImpl: noRefresh as unknown as typeof fetch })).toEqual({ ok: false, error: "auth" });
    const wrongScope = vi.fn(async () => new Response(JSON.stringify({ refresh_token: "r", access_token: "a", scope: "email" })));
    expect(await exchangeGoogleCode(client, "code", { fetchImpl: wrongScope as unknown as typeof fetch })).toEqual({ ok: false, error: "auth" });
  });

  it("treats an already-invalid token as revoked", async () => {
    const gone = vi.fn(async () => new Response("{}", { status: 400 }));
    expect(await revokeGoogleToken("t", { fetchImpl: gone as unknown as typeof fetch })).toBe(true);
    const down = vi.fn(async () => new Response("{}", { status: 503 }));
    expect(await revokeGoogleToken("t", { fetchImpl: down as unknown as typeof fetch })).toBe(false);
  });

  it("reads existing order ids from column A, skipping the header", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ values: [["Order ID"], ["o1"], [], ["o2"]] })));
    const result = await readOrderIdColumn("tok", "s".repeat(44), { fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(result).toEqual({ ok: true, data: new Map([["o1", 2], ["o2", 4]]) });
  });
});

describe("order → sheet rows", () => {
  it("maps one row per order with the order id first", () => {
    expect(orderToSheetRow(order("o1", "2026-10-18T09:30:00.000Z"))).toEqual([
      "o1",
      "ORD-o1",
      "2026-10-18 09:30:00",
      "pending",
      "pending",
      "cash",
      "=HYPERLINK(\"x\")",
      "01000000000",
      "Cairo",
      2,
      200,
      50,
      0,
      250,
      "EGP",
    ]);
  });

  it("updates rows already in the sheet and appends the rest, oldest first, without duplicates", () => {
    const orders = [
      order("o3", "2026-10-03T00:00:00Z"),
      order("o1", "2026-10-01T00:00:00Z", { status: "delivered" }),
      order("o2", "2026-10-02T00:00:00Z"),
      order("o2", "2026-10-02T00:00:00Z"),
    ];
    const plan = planSheetWrite(orders, new Map([["o1", 2]]));
    expect(plan.updates).toEqual([{ row: 2, values: expect.arrayContaining(["o1", "delivered"]) }]);
    expect(plan.appends.map((row) => row[0])).toEqual(["o2", "o3"]);

    // A re-run after the append changes nothing but refreshes rows in place.
    const again = planSheetWrite(orders, new Map([["o1", 2], ["o2", 3], ["o3", 4]]));
    expect(again.appends).toEqual([]);
    expect(again.updates.map((u) => u.row)).toEqual([2, 3, 4]);
  });
});
