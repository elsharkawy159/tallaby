import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@workspace/lib/admin/server", () => ({ getStoreForAdmin: vi.fn() }));
vi.mock(
  "@/app/(builder)/stores/[storeId]/editor/admin-store-editor.server",
  () => ({
    applyTemplate: vi.fn(),
    discardDraft: vi.fn(),
    publish: vi.fn(),
    restoreRevision: vi.fn(),
    undoTemplate: vi.fn(),
    unpublish: vi.fn(),
  }),
);

import { getStoreForAdmin } from "@workspace/lib/admin/server";
import {
  applyTemplate,
  discardDraft,
  publish,
  restoreRevision,
  undoTemplate,
  unpublish,
} from "@/app/(builder)/stores/[storeId]/editor/admin-store-editor.server";
import {
  applyStoreThemeAction,
  discardSiteDraftAction,
  restoreSiteRevisionAction,
  undoStoreThemeAction,
  unpublishSiteAction,
} from "./website-actions.server";

const STORE = "22222222-2222-4222-8222-222222222222";
const REVISION = "55555555-5555-4555-8555-555555555555";

describe("store Website tab actions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("restores a revision through the audited editor action with the reason", async () => {
    vi.mocked(restoreRevision).mockResolvedValueOnce({
      success: true,
      data: { pages: 3 },
    });
    const result = await restoreSiteRevisionAction({
      storeId: STORE,
      revisionId: REVISION,
      reason: "Seller asked",
    });
    expect(result).toEqual({
      success: true,
      message: "Revision restored to the drafts and logged",
    });
    expect(restoreRevision).toHaveBeenCalledWith(
      STORE,
      REVISION,
      "Seller asked",
    );
  });

  it("discards drafts and unpublishes through the audited editor actions", async () => {
    vi.mocked(discardDraft).mockResolvedValueOnce({
      success: true,
      data: { pages: 2 },
    });
    expect(
      await discardSiteDraftAction({ storeId: STORE, reason: "Broken draft" }),
    ).toMatchObject({ success: true });
    expect(discardDraft).toHaveBeenCalledWith(STORE, "Broken draft");
    vi.mocked(unpublish).mockResolvedValueOnce({ success: true, data: null });
    expect(
      await unpublishSiteAction({ storeId: STORE, reason: "Policy breach" }),
    ).toMatchObject({ success: true });
    expect(unpublish).toHaveBeenCalledWith(STORE, "Policy breach");
  });

  it("maps refusals (moderator / unknown store, missing reason) to messages", async () => {
    vi.mocked(unpublish).mockResolvedValueOnce({
      success: false,
      error: "notFound",
    });
    expect(await unpublishSiteAction({ storeId: STORE, reason: "x" })).toEqual({
      success: false,
      error: "Only admins can do this, or the store no longer exists.",
    });
    vi.mocked(discardDraft).mockResolvedValueOnce({
      success: false,
      error: "invalidInput",
    });
    expect(await discardSiteDraftAction(null)).toEqual({
      success: false,
      error: "Enter a reason of 3–500 characters.",
    });
    expect(discardDraft).toHaveBeenCalledWith("", "");
    vi.mocked(restoreRevision).mockResolvedValueOnce({
      success: false,
      error: "generic",
    });
    expect(
      await restoreSiteRevisionAction({
        storeId: STORE,
        revisionId: 5,
        reason: "why not",
      }),
    ).toEqual({
      success: false,
      error: "Something went wrong. Try again.",
    });
    expect(restoreRevision).toHaveBeenCalledWith(STORE, "", "why not");
  });

  it("applies a theme to the drafts with the reason, publishing only a live site when asked", async () => {
    vi.mocked(applyTemplate).mockResolvedValue({
      success: true,
      data: { pagesUpdated: 3, pagesCreated: 1 },
    });
    expect(
      await applyStoreThemeAction({
        storeId: STORE,
        templateKey: "botanica",
        reason: "Seller asked",
      }),
    ).toEqual({
      success: true,
      message: "Theme applied to the drafts and logged",
    });
    expect(applyTemplate).toHaveBeenCalledWith(
      STORE,
      "botanica",
      "Seller asked",
    );
    expect(publish).not.toHaveBeenCalled();

    vi.mocked(getStoreForAdmin).mockResolvedValueOnce({
      siteStatus: "draft",
    } as never);
    expect(
      await applyStoreThemeAction({
        storeId: STORE,
        templateKey: "botanica",
        reason: "Seller asked",
        publishNow: true,
      }),
    ).toMatchObject({ success: true });
    expect(publish).not.toHaveBeenCalled();

    vi.mocked(getStoreForAdmin).mockResolvedValueOnce({
      siteStatus: "published",
    } as never);
    vi.mocked(publish).mockResolvedValueOnce({
      success: true,
      data: { revisionId: REVISION, revisionNumber: 4 },
    });
    expect(
      await applyStoreThemeAction({
        storeId: STORE,
        templateKey: "botanica",
        reason: "Seller asked",
        publishNow: true,
      }),
    ).toEqual({
      success: true,
      message: "Theme applied, published and logged",
    });
    expect(publish).toHaveBeenCalledWith(STORE, "Seller asked");
  });

  it("refuses a theme change without a reason and maps template errors", async () => {
    expect(
      await applyStoreThemeAction({
        storeId: STORE,
        templateKey: "botanica",
        reason: " x ",
      }),
    ).toEqual({
      success: false,
      error: "Enter a reason of 3–500 characters.",
    });
    expect(applyTemplate).not.toHaveBeenCalled();
    vi.mocked(applyTemplate).mockResolvedValueOnce({
      success: false,
      error: "premiumTemplate",
    });
    expect(
      await applyStoreThemeAction({
        storeId: STORE,
        templateKey: "lux",
        reason: "Seller asked",
      }),
    ).toEqual({
      success: false,
      error: "Premium themes cannot be applied yet.",
    });
    vi.mocked(undoTemplate).mockResolvedValueOnce({
      success: false,
      error: "nothingToUndo",
    });
    expect(
      await undoStoreThemeAction({ storeId: STORE, reason: "Wrong theme" }),
    ).toEqual({
      success: false,
      error: "There is no theme change to undo.",
    });
    expect(undoTemplate).toHaveBeenCalledWith(STORE, "Wrong theme");
  });
});
