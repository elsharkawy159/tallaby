import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  applyStoreTemplate: vi.fn(),
  autoPublishStore: vi.fn(),
  requireStore: vi.fn(),
  revalidateDashboardPath: vi.fn(),
}));

vi.mock("next-intl/server", () => ({ getTranslations: vi.fn(async () => (key: string) => key) }));
vi.mock("@workspace/lib/store-forms", () => ({ buildTemplateForm: vi.fn(), getFormTemplate: vi.fn() }));
vi.mock("@workspace/lib/store-sites/server", () => ({
  applyStoreTemplate: mocks.applyStoreTemplate,
  getStoreTemplateConfig: vi.fn(),
  getTemplateMeta: vi.fn(),
  listStoreTemplates: vi.fn(),
  templateEditionId: vi.fn(),
  undoStoreTemplate: vi.fn(),
}));
vi.mock("@workspace/lib/stores/niche", () => ({ effectiveStoreNiche: vi.fn() }));
vi.mock("@workspace/lib/stores/server", () => ({ getStore: vi.fn() }));
vi.mock("@workspace/store-sections/render", () => ({
  contentOverrideKeys: () => ({}),
  storeSectionRegistry: { allowedSections: () => ({ hero: 1 }) },
}));
vi.mock("@/components/dashboard/sidebar.config", () => ({ storeBuilderEnabled: () => true }));
vi.mock("@/lib/auth/require-seller.server", () => ({ isAccessError: () => false, requireStore: mocks.requireStore }));
vi.mock("@/lib/i18n/revalidate-dashboard-path.server", () => ({ revalidateDashboardPath: mocks.revalidateDashboardPath }));
vi.mock("@/lib/store-templates.data", () => ({ loadCachedTemplateCards: vi.fn(), loadCachedTemplateConfig: vi.fn() }));
vi.mock("@/lib/stores/auto-publish-store.server", () => ({ autoPublishStore: mocks.autoPublishStore }));
vi.mock("@/lib/stores/industries.lib", () => ({ findIndustry: vi.fn() }));
vi.mock("./templates.lib", () => ({}));

import { applyTemplate } from "./templates.server";

const SELLER = "11111111-1111-4111-8111-111111111111";
const STORE = "22222222-2222-4222-8222-222222222222";
const USER = "33333333-3333-4333-8333-333333333333";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireStore.mockResolvedValue({ seller: { sellerId: SELLER, userId: USER }, store: { id: STORE, subdomain: "shop" } });
  mocks.applyStoreTemplate.mockResolvedValue({ success: true, data: { installId: "i", templateKey: "vella", pagesUpdated: 2, pagesCreated: 1 } });
  mocks.autoPublishStore.mockResolvedValue({ published: true });
});

describe("applyTemplate", () => {
  it("leaves a new store offline when it has no published product, and says so", async () => {
    mocks.autoPublishStore.mockResolvedValue({ published: false, reason: "no_active_product" });

    expect(await applyTemplate(STORE, "vella")).toEqual({
      success: true,
      data: { pagesUpdated: 2, pagesCreated: 1, published: false, needsProduct: true },
    });
  });

  it("puts a new store live when it already has a published product", async () => {
    expect(await applyTemplate(STORE, "vella")).toEqual({
      success: true,
      data: { pagesUpdated: 2, pagesCreated: 1, published: true, needsProduct: false },
    });
    // The session's seller and the checked store, never a client value.
    expect(mocks.autoPublishStore).toHaveBeenCalledExactlyOnceWith(SELLER, STORE, USER);
  });

  it.each(["not_draft", "already_published", "failed"] as const)("a store that stays as it is for another reason needs no product (%s)", async (reason) => {
    mocks.autoPublishStore.mockResolvedValue({ published: false, reason });

    expect(await applyTemplate(STORE, "vella")).toMatchObject({ success: true, data: { published: false, needsProduct: false } });
  });

  it("does not try to publish when the template was not applied", async () => {
    mocks.applyStoreTemplate.mockResolvedValue({ success: false, error: "template_not_found" });

    expect(await applyTemplate(STORE, "gone")).toMatchObject({ success: false });
    expect(mocks.autoPublishStore).not.toHaveBeenCalled();
  });
});
