import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@workspace/db/log", () => ({ logServerError: vi.fn() }));
vi.mock("@workspace/cache", () => ({ applyInvalidation: vi.fn(async () => {}), invalidateLibrarySections: vi.fn(() => ({ tags: ["library:sections"], paths: [] })) }));
vi.mock("@/app/(dashboard)/_lib/saas-admin.server", () => ({ adminActorId: vi.fn(async () => "actor") }));
vi.mock("@workspace/lib/admin/server", () => ({ publishLibrarySection: vi.fn(), saveLibrarySectionDraft: vi.fn() }));

import { applyInvalidation } from "@workspace/cache";
import { publishLibrarySection, saveLibrarySectionDraft } from "@workspace/lib/admin/server";
import { adminActorId } from "@/app/(dashboard)/_lib/saas-admin.server";
import { publishSection, saveSectionDraft } from "./section-editor.server";

describe("section editor actions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("maps lib errors to editor messages (no_change is 'nothing to publish')", async () => {
    vi.mocked(publishLibrarySection).mockResolvedValueOnce({ success: false, error: "no_change" });
    expect(await publishSection("id", "why")).toEqual({ success: false, error: "nothingToPublish" });
    vi.mocked(saveLibrarySectionDraft).mockResolvedValueOnce({ success: false, error: "version_conflict" });
    expect(await saveSectionDraft("id", {}, 1)).toEqual({ success: false, error: "versionConflict" });
    vi.mocked(saveLibrarySectionDraft).mockResolvedValueOnce({ success: false, error: "invalid_tree" });
    expect(await saveSectionDraft("id", {}, 1)).toEqual({ success: false, error: "invalidContent" });
    expect(applyInvalidation).not.toHaveBeenCalled();
  });

  it("invalidates the seller palette after a publish", async () => {
    vi.mocked(publishLibrarySection).mockResolvedValueOnce({ success: true, data: { version: 3 } });
    expect(await publishSection("id", "why")).toEqual({ success: true, data: { revisionId: "id", revisionNumber: 3 } });
    expect(applyInvalidation).toHaveBeenCalledTimes(1);
  });

  it("refuses a non-admin (or moderator) session without calling the lib", async () => {
    vi.mocked(adminActorId).mockResolvedValueOnce(null);
    expect(await publishSection("id", "why")).toEqual({ success: false, error: "notFound" });
    expect(publishLibrarySection).not.toHaveBeenCalled();
  });
});
