import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  storeRows: [] as { siteStatus: string; subdomain: string }[],
  selectError: null as Error | null,
  selects: 0,
  publishStoreSite: vi.fn(),
  grantWelcomeGiftSafely: vi.fn(),
  logServerError: vi.fn(),
}));

vi.mock("@workspace/db", () => {
  const chain = {
    from: () => chain,
    where: () => chain,
    limit: async () => {
      mocks.selects += 1;
      if (mocks.selectError) throw mocks.selectError;
      return mocks.storeRows;
    },
  };
  return {
    db: { select: () => chain },
    stores: { id: "id", sellerId: "seller_id", deletedAt: "deleted_at", siteStatus: "site_status", subdomain: "subdomain" },
    and: (...parts: unknown[]) => parts,
    eq: (...parts: unknown[]) => parts,
    isNull: (part: unknown) => part,
  };
});
vi.mock("@workspace/db/log", () => ({ logServerError: mocks.logServerError }));
vi.mock("./server", () => ({ publishStoreSite: mocks.publishStoreSite }));
vi.mock("../store-wallet/welcome-gift.server", () => ({ grantWelcomeGiftSafely: mocks.grantWelcomeGiftSafely }));

import { invalidateStoreSite } from "@workspace/cache/invalidate";
import { publishNewStoreIfReady } from "./auto-publish.server";

const SELLER = "11111111-1111-4111-8111-111111111111";
const STORE = "22222222-2222-4222-8222-222222222222";
const USER = "33333333-3333-4333-8333-333333333333";
const ALLOWED = { hero: 1 };

beforeEach(() => {
  mocks.storeRows = [{ siteStatus: "draft", subdomain: "shop" }];
  mocks.selectError = null;
  mocks.selects = 0;
  mocks.publishStoreSite.mockReset().mockResolvedValue({ success: true, data: { revisionId: "r1", revisionNumber: 1 } });
  mocks.grantWelcomeGiftSafely.mockReset().mockResolvedValue(true);
  mocks.logServerError.mockReset();
});

describe("publishNewStoreIfReady", () => {
  it("publishes a never-published store only with a chosen template and a published product", async () => {
    const result = await publishNewStoreIfReady(SELLER, STORE, USER, { allowedSections: ALLOWED });

    expect(mocks.publishStoreSite).toHaveBeenCalledWith(SELLER, STORE, USER, {
      allowedSections: ALLOWED,
      requireTemplateChoice: true,
      onlyIfNeverPublished: true,
      requireActiveProduct: true,
      refuseWhenBillingOffline: true,
    });
    expect(result).toEqual({ published: true, invalidation: invalidateStoreSite(SELLER, STORE, "shop") });
    expect(mocks.grantWelcomeGiftSafely).toHaveBeenCalledExactlyOnceWith(SELLER);
  });

  it.each(["already_published", "template_not_chosen", "no_active_product", "top_up_required"] as const)("stays silent on %s", async (error) => {
    mocks.publishStoreSite.mockResolvedValue({ success: false, error });

    expect(await publishNewStoreIfReady(SELLER, STORE, USER)).toEqual({ published: false, reason: error });
    expect(mocks.grantWelcomeGiftSafely).not.toHaveBeenCalled();
    expect(mocks.logServerError).not.toHaveBeenCalled();
  });

  it("logs an unexpected refusal and grants nothing", async () => {
    mocks.publishStoreSite.mockResolvedValue({ success: false, error: "invalid_site" });

    expect(await publishNewStoreIfReady(SELLER, STORE, USER)).toEqual({ published: false, reason: "invalid_site" });
    expect(mocks.grantWelcomeGiftSafely).not.toHaveBeenCalled();
    expect(mocks.logServerError).toHaveBeenCalledOnce();
  });

  it("never throws when the publish throws", async () => {
    mocks.publishStoreSite.mockRejectedValue(new Error("db down"));

    expect(await publishNewStoreIfReady(SELLER, STORE, USER)).toEqual({ published: false, reason: "failed" });
    expect(mocks.grantWelcomeGiftSafely).not.toHaveBeenCalled();
    expect(mocks.logServerError).toHaveBeenCalledOnce();
  });

  it("never throws when the store read throws", async () => {
    mocks.selectError = new Error("db down");

    expect(await publishNewStoreIfReady(SELLER, STORE, USER)).toEqual({ published: false, reason: "failed" });
    expect(mocks.publishStoreSite).not.toHaveBeenCalled();
  });

  it.each(["published", "unpublished"])("leaves a %s store alone without taking the row lock", async (siteStatus) => {
    mocks.storeRows = [{ siteStatus, subdomain: "shop" }];

    expect(await publishNewStoreIfReady(SELLER, STORE, USER)).toEqual({ published: false, reason: "not_draft" });
    expect(mocks.publishStoreSite).not.toHaveBeenCalled();
    expect(mocks.logServerError).not.toHaveBeenCalled();
  });

  it("runs no query when the caller already knows the store is not a draft", async () => {
    expect(await publishNewStoreIfReady(SELLER, STORE, USER, { siteStatus: "published" })).toEqual({ published: false, reason: "not_draft" });
    expect(mocks.selects).toBe(0);
    expect(mocks.publishStoreSite).not.toHaveBeenCalled();
  });

  it("does nothing for a store that is not the seller's", async () => {
    mocks.storeRows = [];

    expect(await publishNewStoreIfReady(SELLER, STORE, USER)).toEqual({ published: false, reason: "not_found" });
    expect(mocks.publishStoreSite).not.toHaveBeenCalled();
  });
});
