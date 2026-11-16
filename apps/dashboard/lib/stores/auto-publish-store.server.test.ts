import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  publishNewStoreIfReady: vi.fn(),
  applyInvalidation: vi.fn(),
  revalidateDashboardPath: vi.fn(),
}));

vi.mock("@workspace/cache", () => ({ applyInvalidation: mocks.applyInvalidation }));
vi.mock("@workspace/lib/store-sites/auto-publish", () => ({ publishNewStoreIfReady: mocks.publishNewStoreIfReady }));
vi.mock("@workspace/store-sections/render", () => ({ storeSectionRegistry: { allowedSections: () => ({ hero: 1 }) } }));
vi.mock("@/lib/i18n/revalidate-dashboard-path.server", () => ({ revalidateDashboardPath: mocks.revalidateDashboardPath }));

import { autoPublishStore, autoPublishStoreIfReady } from "./auto-publish-store.server";

const SELLER = "11111111-1111-4111-8111-111111111111";
const STORE = "22222222-2222-4222-8222-222222222222";
const USER = "33333333-3333-4333-8333-333333333333";
const INVALIDATION = { tags: ["store-site"], paths: [] };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.publishNewStoreIfReady.mockResolvedValue({ published: true, invalidation: INVALIDATION });
  mocks.applyInvalidation.mockResolvedValue(undefined);
});

describe("autoPublishStoreIfReady", () => {
  it("asks the shared rule with the section registry and clears the store's caches once it is live", async () => {
    expect(await autoPublishStoreIfReady(SELLER, STORE, USER)).toBe(true);

    expect(mocks.publishNewStoreIfReady).toHaveBeenCalledExactlyOnceWith(SELLER, STORE, USER, { allowedSections: { hero: 1 } });
    expect(mocks.applyInvalidation).toHaveBeenCalledExactlyOnceWith(INVALIDATION, { from: "dashboard", mode: "action" });
    expect(mocks.revalidateDashboardPath).toHaveBeenCalledWith("/stores/[storeId]/website", "layout");
  });

  it.each(["no_active_product", "template_not_chosen", "already_published", "not_draft", "failed"] as const)(
    "clears nothing when the store stays as it is (%s)",
    async (reason) => {
      mocks.publishNewStoreIfReady.mockResolvedValue({ published: false, reason });

      expect(await autoPublishStoreIfReady(SELLER, STORE, USER)).toBe(false);
      expect(await autoPublishStore(SELLER, STORE, USER)).toEqual({ published: false, reason });
      expect(mocks.applyInvalidation).not.toHaveBeenCalled();
      expect(mocks.revalidateDashboardPath).not.toHaveBeenCalled();
    },
  );

  it("never throws into the caller's action", async () => {
    mocks.applyInvalidation.mockRejectedValue(new Error("outside a server action"));
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(await autoPublishStore(SELLER, STORE, USER)).toEqual({ published: false, reason: "failed" });
    expect(error).toHaveBeenCalledOnce();
    error.mockRestore();
  });
});
