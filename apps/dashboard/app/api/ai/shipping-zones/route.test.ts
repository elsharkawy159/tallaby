import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireStore: vi.fn(),
  generateStructured: vi.fn(),
  checkDailyCap: vi.fn(),
  logAiUsage: vi.fn(),
  claimAiCredit: vi.fn(),
  refundAiCredit: vi.fn(),
  getAiCreditStatus: vi.fn(),
  getBillingState: vi.fn(),
}));

class FakeAccessError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

vi.mock("@/lib/auth/require-seller.server", () => ({
  requireStore: mocks.requireStore,
  isAccessError: (error: unknown) => error instanceof FakeAccessError,
}));
vi.mock("@workspace/ai", () => ({
  aiConfigured: () => true,
  aiErrorKind: () => "busy",
  checkDailyCap: mocks.checkDailyCap,
  generateStructured: mocks.generateStructured,
  logAiUsage: mocks.logAiUsage,
  modelIdForTier: () => "model",
}));
vi.mock("@workspace/db", () => ({
  db: { select: () => ({ from: () => ({ where: async () => [{ plan: "free", planExpiresAt: null, planGraceUntil: null }] }) }) },
  eq: () => null,
  sellers: { id: "id", plan: "plan", planExpiresAt: "e", planGraceUntil: "g" },
}));
vi.mock("@workspace/lib/billing", () => ({ isProActive: () => false }));
vi.mock("@workspace/lib/billing/credits", () => ({
  claimAiCredit: mocks.claimAiCredit,
  refundAiCredit: mocks.refundAiCredit,
  getAiCreditStatus: mocks.getAiCreditStatus,
}));
vi.mock("@workspace/lib/billing/server", () => ({ getBillingState: mocks.getBillingState }));

const { POST } = await import("./route");

const STORE_ID = "11111111-1111-4111-8111-111111111111";
const OUTPUT = { zones: [{ places: ["Cairo", "Narnia"], price: 60, daysMin: 2, daysMax: 2, freeOver: null }] };

const post = (body: unknown) =>
  POST(new NextRequest("http://x/api/ai/shipping-zones", { method: "POST", body: JSON.stringify(body) }));

describe("POST /api/ai/shipping-zones", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // A new seller each test, so the in-memory burst limiter never interferes.
    mocks.requireStore.mockImplementation(async () => ({ seller: { sellerId: crypto.randomUUID() }, store: { id: STORE_ID } }));
    mocks.checkDailyCap.mockResolvedValue({ allowed: true, remaining: 5 });
    mocks.getBillingState.mockResolvedValue({ usdLive: true });
    mocks.claimAiCredit.mockResolvedValue({ ok: true, reference: "ref-1" });
    mocks.refundAiCredit.mockResolvedValue(undefined);
    mocks.getAiCreditStatus.mockResolvedValue({ total: 99 });
    mocks.generateStructured.mockResolvedValue({ object: OUTPUT, cached: false });
  });

  it("returns matched zones, keeps unknown names, and calls the model the cheap way", async () => {
    const response = await post({ storeId: STORE_ID, text: "Cairo and Narnia 60, 2 days" });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      ok: true,
      remainingToday: 4,
      creditsRemaining: 99,
      zones: [{ places: ["EG/CAIRO"], unmatched: ["Narnia"], price: 60 }],
    });
    expect(mocks.generateStructured.mock.calls[0]?.[0]).toMatchObject({
      feature: "shipping_zones",
      tier: "fast",
      thinkingLevel: "minimal",
      cacheMs: 600_000,
    });
    expect(mocks.refundAiCredit).not.toHaveBeenCalled();
  });

  it("refuses a store the session seller can't write to, before any AI", async () => {
    mocks.requireStore.mockRejectedValueOnce(new FakeAccessError("not_found"));
    expect((await post({ storeId: "someone-elses", text: "Cairo 60" })).status).toBe(404);
    mocks.requireStore.mockRejectedValueOnce(new FakeAccessError("store_read_only"));
    expect((await post({ storeId: STORE_ID, text: "Cairo 60" })).status).toBe(403);
    mocks.requireStore.mockRejectedValueOnce(new FakeAccessError("unauthorized"));
    expect((await post({ storeId: STORE_ID, text: "Cairo 60" })).status).toBe(401);
    expect(mocks.claimAiCredit).not.toHaveBeenCalled();
    expect(mocks.generateStructured).not.toHaveBeenCalled();
  });

  it("refuses empty and oversized text, before any AI", async () => {
    expect((await post({ storeId: STORE_ID, text: "  " })).status).toBe(400);
    expect((await post({ storeId: STORE_ID, text: "x".repeat(801) })).status).toBe(413);
    expect(mocks.generateStructured).not.toHaveBeenCalled();
  });

  it("returns noCredits when the claim is refused", async () => {
    mocks.claimAiCredit.mockResolvedValue({ ok: false });
    const response = await post({ storeId: STORE_ID, text: "Cairo 60" });
    expect(response.status).toBe(402);
    expect(await response.json()).toEqual({ ok: false, error: "noCredits" });
    expect(mocks.generateStructured).not.toHaveBeenCalled();
  });

  it("takes no credit while the switch is off", async () => {
    mocks.getBillingState.mockResolvedValue({ usdLive: false });
    expect((await post({ storeId: STORE_ID, text: "Cairo 60" })).status).toBe(200);
    expect(mocks.claimAiCredit).not.toHaveBeenCalled();
  });

  it("gives the credit back on a cached answer, a failure and an empty answer", async () => {
    mocks.generateStructured.mockResolvedValueOnce({ object: OUTPUT, cached: true });
    const cached = await post({ storeId: STORE_ID, text: "Cairo 60" });
    expect(cached.status).toBe(200);
    expect(await cached.json()).toMatchObject({ remainingToday: 5 });
    expect(mocks.refundAiCredit).toHaveBeenCalledTimes(1);

    mocks.generateStructured.mockRejectedValueOnce(new Error("overloaded"));
    expect((await post({ storeId: STORE_ID, text: "Cairo 60" })).status).toBe(503);
    expect(mocks.refundAiCredit).toHaveBeenCalledTimes(2);

    mocks.generateStructured.mockResolvedValueOnce({ object: { zones: [] }, cached: false });
    const empty = await post({ storeId: STORE_ID, text: "hello" });
    expect(empty.status).toBe(422);
    expect(await empty.json()).toEqual({ ok: false, error: "noZones" });
    expect(mocks.refundAiCredit).toHaveBeenCalledTimes(3);
  });

  it("stops at the daily cap, before taking a credit", async () => {
    mocks.checkDailyCap.mockResolvedValue({ allowed: false, remaining: 0 });
    expect((await post({ storeId: STORE_ID, text: "Cairo 60" })).status).toBe(429);
    expect(mocks.claimAiCredit).not.toHaveBeenCalled();
    expect(mocks.logAiUsage).toHaveBeenCalledWith(expect.objectContaining({ errorCode: "daily_limit" }));
  });
});
