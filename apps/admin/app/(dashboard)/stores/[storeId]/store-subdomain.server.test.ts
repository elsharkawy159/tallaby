import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@workspace/db/log", () => ({ logServerError: vi.fn() }));
vi.mock("@workspace/cache", () => ({
  applyInvalidation: vi.fn(),
  invalidateStorefront: vi.fn((hosts: string[]) => ({ storefront: hosts })),
  invalidateCustomDomain: vi.fn((subdomain: string, domain: string) => ({ domain: [subdomain, domain] })),
  mergeInvalidations: vi.fn((...parts: unknown[]) => parts),
}));
vi.mock("@workspace/lib/admin/server", () => ({ changeStoreSubdomainByAdmin: vi.fn() }));
vi.mock("../../_lib/saas-admin.server", () => ({ adminActorId: vi.fn() }));

import { applyInvalidation, invalidateCustomDomain, invalidateStorefront } from "@workspace/cache";
import { changeStoreSubdomainByAdmin } from "@workspace/lib/admin/server";
import { adminActorId } from "../../_lib/saas-admin.server";
import { changeStoreSubdomainAction } from "./store-subdomain.server";

const ADMIN = "11111111-1111-4111-8111-111111111111";
const STORE = "22222222-2222-4222-8222-222222222222";
const SELLER = "33333333-3333-4333-8333-333333333333";

describe("changeStoreSubdomainAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(adminActorId).mockResolvedValue(ADMIN);
  });

  it("refuses without an admin session and never calls the lib", async () => {
    vi.mocked(adminActorId).mockResolvedValueOnce(null);
    expect(await changeStoreSubdomainAction({ storeId: STORE, subdomain: "new-shop", reason: "Seller asked" })).toEqual({
      success: false,
      error: "Only verified admins can make this change.",
    });
    expect(changeStoreSubdomainByAdmin).not.toHaveBeenCalled();
  });

  it("moves the store and clears both storefront names and the custom domain", async () => {
    vi.mocked(changeStoreSubdomainByAdmin).mockResolvedValueOnce({
      success: true,
      data: { auditId: "a", sellerId: SELLER, storeId: STORE, subdomain: "new-shop", previous: "old-shop", customDomain: "shop.com" },
    });
    const result = await changeStoreSubdomainAction({ storeId: STORE, subdomain: "new-shop", reason: "Seller asked", sellerId: "ignored" });
    expect(result).toMatchObject({ success: true });
    // Only the route's store id, the subdomain and the reason reach the lib (no seller id from the client).
    expect(changeStoreSubdomainByAdmin).toHaveBeenCalledWith(ADMIN, { storeId: STORE, subdomain: "new-shop", reason: "Seller asked" });
    expect(invalidateStorefront).toHaveBeenCalledWith(["old-shop", "new-shop"]);
    expect(invalidateCustomDomain).toHaveBeenCalledWith("new-shop", "shop.com");
    expect(applyInvalidation).toHaveBeenCalledOnce();
  });

  it("maps taken, reserved and invalid to clear messages without clearing any cache", async () => {
    for (const [error, message] of [
      ["taken", "Another store already uses this subdomain, or keeps it as an old address."],
      ["reserved", "This name is reserved by Tallaby."],
      ["invalid", "Use lowercase English letters, digits and single hyphens, not at the start or end."],
    ] as const) {
      vi.mocked(changeStoreSubdomainByAdmin).mockResolvedValueOnce({ success: false, error });
      expect(await changeStoreSubdomainAction({ storeId: STORE, subdomain: "x-shop", reason: "Seller asked" })).toEqual({ success: false, error: message });
    }
    expect(applyInvalidation).not.toHaveBeenCalled();
  });
});
