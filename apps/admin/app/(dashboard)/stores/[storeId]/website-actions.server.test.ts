import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/(builder)/stores/[storeId]/editor/admin-store-editor.server", () => ({
  discardDraft: vi.fn(),
  restoreRevision: vi.fn(),
  unpublish: vi.fn(),
}));

import { discardDraft, restoreRevision, unpublish } from "@/app/(builder)/stores/[storeId]/editor/admin-store-editor.server";
import { discardSiteDraftAction, restoreSiteRevisionAction, unpublishSiteAction } from "./website-actions.server";

const STORE = "22222222-2222-4222-8222-222222222222";
const REVISION = "55555555-5555-4555-8555-555555555555";

describe("store Website tab actions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("restores a revision through the audited editor action with the reason", async () => {
    vi.mocked(restoreRevision).mockResolvedValueOnce({ success: true, data: { pages: 3 } });
    const result = await restoreSiteRevisionAction({ storeId: STORE, revisionId: REVISION, reason: "Seller asked" });
    expect(result).toEqual({ success: true, message: "Revision restored to the drafts and logged" });
    expect(restoreRevision).toHaveBeenCalledWith(STORE, REVISION, "Seller asked");
  });

  it("discards drafts and unpublishes through the audited editor actions", async () => {
    vi.mocked(discardDraft).mockResolvedValueOnce({ success: true, data: { pages: 2 } });
    expect(await discardSiteDraftAction({ storeId: STORE, reason: "Broken draft" })).toMatchObject({ success: true });
    expect(discardDraft).toHaveBeenCalledWith(STORE, "Broken draft");
    vi.mocked(unpublish).mockResolvedValueOnce({ success: true, data: null });
    expect(await unpublishSiteAction({ storeId: STORE, reason: "Policy breach" })).toMatchObject({ success: true });
    expect(unpublish).toHaveBeenCalledWith(STORE, "Policy breach");
  });

  it("maps refusals (moderator / unknown store, missing reason) to messages", async () => {
    vi.mocked(unpublish).mockResolvedValueOnce({ success: false, error: "notFound" });
    expect(await unpublishSiteAction({ storeId: STORE, reason: "x" })).toEqual({
      success: false,
      error: "Only admins can do this, or the store no longer exists.",
    });
    vi.mocked(discardDraft).mockResolvedValueOnce({ success: false, error: "invalidInput" });
    expect(await discardSiteDraftAction(null)).toEqual({ success: false, error: "Enter a reason of 3–500 characters." });
    expect(discardDraft).toHaveBeenCalledWith("", "");
    vi.mocked(restoreRevision).mockResolvedValueOnce({ success: false, error: "generic" });
    expect(await restoreSiteRevisionAction({ storeId: STORE, revisionId: 5, reason: "why not" })).toEqual({
      success: false,
      error: "Something went wrong. Try again.",
    });
    expect(restoreRevision).toHaveBeenCalledWith(STORE, "", "why not");
  });
});
