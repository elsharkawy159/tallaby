import { beforeEach, describe, expect, it, vi } from "vitest";

const { getWelcomeGiftWatch, getBillingState } = vi.hoisted(() => ({
  getWelcomeGiftWatch: vi.fn(),
  getBillingState: vi.fn(),
}));

vi.mock("@workspace/lib/store-wallet/server", () => ({ getWelcomeGiftWatch }));
vi.mock("@workspace/lib/billing/server", () => ({ getBillingState }));

import { loadWelcomeGiftWatch } from "./welcome-gift.data";

const unseen = { state: "unseen", amount: "100.00", expiresAt: "2026-12-01" } as const;

describe("loadWelcomeGiftWatch", () => {
  beforeEach(() => vi.resetAllMocks());

  it("keeps the pop-up while the USD switch is off", async () => {
    getWelcomeGiftWatch.mockResolvedValue(unseen);
    getBillingState.mockResolvedValue({ usdLive: false });
    expect(await loadWelcomeGiftWatch("s")).toEqual(unseen);
  });

  it("hides the pop-up once the USD switch is on", async () => {
    getWelcomeGiftWatch.mockResolvedValue({ state: "pending" });
    getBillingState.mockResolvedValue({ usdLive: true });
    expect(await loadWelcomeGiftWatch("s")).toEqual({ state: "none" });
  });

  it("keeps today's behaviour if the billing read fails", async () => {
    getWelcomeGiftWatch.mockResolvedValue(unseen);
    getBillingState.mockRejectedValue(new Error("no table"));
    expect(await loadWelcomeGiftWatch("s")).toEqual(unseen);
  });

  it("skips the billing read when there is nothing to show", async () => {
    getWelcomeGiftWatch.mockResolvedValue({ state: "none" });
    expect(await loadWelcomeGiftWatch("s")).toEqual({ state: "none" });
    expect(getBillingState).not.toHaveBeenCalled();
  });
});
