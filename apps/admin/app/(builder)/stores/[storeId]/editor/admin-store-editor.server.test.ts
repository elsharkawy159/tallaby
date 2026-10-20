import { beforeEach, describe, expect, it, vi } from "vitest";

// --- mocks (hoisted) --------------------------------------------------------
const tx = { tx: true };
vi.mock("@workspace/db", () => ({ db: { transaction: vi.fn(async (run: (q: unknown) => unknown) => run(tx)) } }));
vi.mock("@workspace/db/log", () => ({ logServerError: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next-intl", () => ({ createTranslator: vi.fn(() => (key: string) => key) }));
vi.mock("@workspace/cache", () => ({ applyInvalidation: vi.fn(async () => {}), invalidateStoreSite: vi.fn(() => ({ tags: [] })) }));
vi.mock("@/app/(dashboard)/_lib/saas-admin.server", () => ({ adminActorId: vi.fn() }));
vi.mock("@workspace/lib/admin/server", () => ({
  resolveStoreForAdmin: vi.fn(),
  markSiteEditedByAdmin: vi.fn(async () => {}),
  auditStoreSite: vi.fn(async () => "audit-id"),
}));
vi.mock("@workspace/lib/store-sites/server", () => ({
  createStorePage: vi.fn(),
  deleteStorePage: vi.fn(),
  discardStoreDrafts: vi.fn(),
  getStoreDraftVersions: vi.fn(),
  getStoreDraftKey: vi.fn(),
  getStoreSiteStatus: vi.fn(),
  listStoreRevisions: vi.fn(),
  publishStoreSite: vi.fn(),
  reorderStorePages: vi.fn(),
  restoreRevisionToDraft: vi.fn(),
  saveStoreChrome: vi.fn(),
  saveStoreDesignSystem: vi.fn(),
  saveStorePageDraft: vi.fn(),
  unpublishStoreSite: vi.fn(),
  updateStorePage: vi.fn(),
  applyStoreTemplate: vi.fn(),
  undoStoreTemplate: vi.fn(),
  getStoreTemplateConfig: vi.fn(),
  getTemplateMeta: vi.fn(async () => null),
}));
vi.mock("@workspace/lib/store-sites/preview", () => ({ signStorePreviewToken: vi.fn(), storePreviewSecret: vi.fn(() => null) }));
vi.mock("@workspace/lib/storefront", () => ({ storeUrl: vi.fn(() => "https://shop.example") }));
vi.mock("@workspace/lib/storefront/server", () => ({ findActiveCustomDomainForSubdomain: vi.fn(async () => null) }));
vi.mock("@workspace/lib/store-forms/server", () => ({ listStoreForms: vi.fn(async () => []), createStoreForm: vi.fn() }));
vi.mock("@workspace/lib/store-forms", () => ({ buildTemplateForm: vi.fn(), getFormTemplate: vi.fn() }));
vi.mock("@workspace/lib/stores/server", () => ({ getStoreCatalog: vi.fn() }));
vi.mock("@workspace/store-sections/render", () => ({
  storeSectionRegistry: { allowedSections: () => ({}) },
  contentOverrideKeys: () => [],
}));
vi.mock("./admin-store-editor.data", () => ({
  loadEditorForms: vi.fn(async () => []),
  loadEditorSnapshot: vi.fn(),
  storePageSlug: vi.fn(async () => "about"),
  storeSiteMeta: vi.fn(async () => ({ revisionId: "rev-old", defaultLocale: "ar" })),
}));

import { adminActorId } from "@/app/(dashboard)/_lib/saas-admin.server";
import { auditStoreSite, markSiteEditedByAdmin, resolveStoreForAdmin } from "@workspace/lib/admin/server";
import { publishStoreSite, saveStorePageDraft } from "@workspace/lib/store-sites/server";
import { applyInvalidation } from "@workspace/cache";
import { openStoreEditor, publish, saveDraft } from "./admin-store-editor.server";

const ADMIN = "11111111-1111-4111-8111-111111111111";
const STORE = "22222222-2222-4222-8222-222222222222";
const SELLER = "33333333-3333-4333-8333-333333333333";
const PAGE = "44444444-4444-4444-8444-444444444444";
const REF = { sellerId: SELLER, storeId: STORE, subdomain: "shop", status: "active", sellerStatus: "approved" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(adminActorId).mockResolvedValue(ADMIN);
  vi.mocked(resolveStoreForAdmin).mockResolvedValue(REF);
});

describe("admin store editor actions", () => {
  it("returns notFound and never calls the lib without an admin actor", async () => {
    vi.mocked(adminActorId).mockResolvedValue(null);
    const result = await saveDraft(STORE, PAGE, { sections: [] }, 3);
    expect(result).toEqual({ success: false, error: "notFound" });
    expect(resolveStoreForAdmin).not.toHaveBeenCalled();
    expect(saveStorePageDraft).not.toHaveBeenCalled();
  });

  it("returns notFound for a store the admin lookup does not resolve", async () => {
    vi.mocked(resolveStoreForAdmin).mockResolvedValue(null);
    const result = await saveDraft(STORE, PAGE, { sections: [] }, 3);
    expect(result).toEqual({ success: false, error: "notFound" });
    expect(saveStorePageDraft).not.toHaveBeenCalled();
  });

  it("saves with the resolved sellerId (not a client value) and marks the site as admin-edited", async () => {
    vi.mocked(saveStorePageDraft).mockResolvedValue({ success: true, data: { draftVersion: 4 } });
    const result = await saveDraft(STORE, PAGE, { sections: [], sellerId: "evil" }, 3);
    expect(result).toEqual({ success: true, data: { draftVersion: 4 } });
    expect(resolveStoreForAdmin).toHaveBeenCalledWith(ADMIN, STORE);
    expect(vi.mocked(saveStorePageDraft).mock.calls[0]!.slice(0, 2)).toEqual([SELLER, STORE]);
    expect(markSiteEditedByAdmin).toHaveBeenCalledWith(STORE);
  });

  it("does not mark the site when the save fails", async () => {
    vi.mocked(saveStorePageDraft).mockResolvedValue({ success: false, error: "version_conflict" });
    const result = await saveDraft(STORE, PAGE, { sections: [] }, 3);
    expect(result).toEqual({ success: false, error: "versionConflict" });
    expect(markSiteEditedByAdmin).not.toHaveBeenCalled();
  });

  it("publishes in one transaction with an audit row carrying the reason", async () => {
    vi.mocked(publishStoreSite).mockResolvedValue({ success: true, data: { revisionId: "rev-new", revisionNumber: 7 } });
    const result = await publish(STORE, "Seller asked on WhatsApp");
    expect(result).toEqual({ success: true, data: { revisionId: "rev-new", revisionNumber: 7 } });
    expect(resolveStoreForAdmin).toHaveBeenCalledWith(ADMIN, STORE, tx);
    expect(publishStoreSite).toHaveBeenCalledWith(SELLER, STORE, ADMIN, { allowedSections: {} }, tx);
    expect(auditStoreSite).toHaveBeenCalledWith(tx, {
      actorId: ADMIN,
      sellerId: SELLER,
      storeId: STORE,
      action: "publish_store_site",
      before: { revisionId: "rev-old" },
      after: { revisionId: "rev-new" },
      reason: "Seller asked on WhatsApp",
    });
    expect(applyInvalidation).toHaveBeenCalled();
  });

  it("refuses to publish without a valid reason", async () => {
    const result = await publish(STORE, "x");
    expect(result).toEqual({ success: false, error: "invalidInput" });
    expect(publishStoreSite).not.toHaveBeenCalled();
    expect(auditStoreSite).not.toHaveBeenCalled();
  });

  it("writes no audit row when the publish fails", async () => {
    vi.mocked(publishStoreSite).mockResolvedValue({ success: false, error: "publish_blocked" });
    const result = await publish(STORE, "Seller asked on WhatsApp");
    expect(result).toEqual({ success: false, error: "publishBlocked" });
    expect(auditStoreSite).not.toHaveBeenCalled();
  });

  it("audits opening the editor", async () => {
    const result = await openStoreEditor(STORE, "  Fix the hero  ");
    expect(result).toEqual({ success: true, data: null });
    expect(auditStoreSite).toHaveBeenCalledWith(tx, expect.objectContaining({ action: "open_store_editor", reason: "Fix the hero", sellerId: SELLER }));
  });
});
