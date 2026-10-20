import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@workspace/db/log", () => ({ logServerError: vi.fn() }));
vi.mock("@workspace/cache", () => ({
  applyInvalidation: vi.fn(async () => {}),
  invalidateTemplateCatalog: vi.fn(() => ({ tags: ["templates:catalog"], paths: [] })),
}));
vi.mock("@/app/(dashboard)/_lib/saas-admin.server", () => ({ adminActorId: vi.fn(async () => "actor") }));
vi.mock("@workspace/lib/admin/server", () => ({
  saveTemplateDraft: vi.fn(),
  publishTemplateVersion: vi.fn(),
  restoreTemplateVersionToDraft: vi.fn(),
  listTemplateVersionsForStudio: vi.fn(),
  getTemplateForStudio: vi.fn(),
}));

import { applyInvalidation } from "@workspace/cache";
import { logServerError } from "@workspace/db/log";
import {
  getTemplateForStudio,
  listTemplateVersionsForStudio,
  publishTemplateVersion,
  restoreTemplateVersionToDraft,
  saveTemplateDraft,
} from "@workspace/lib/admin/server";
import { adminActorId } from "@/app/(dashboard)/_lib/saas-admin.server";
import {
  listTemplateVersionsAction,
  publishTemplateAction,
  restoreTemplateVersionAction,
  saveTemplateDraftAction,
} from "./template-editor.server";

const ID = "0f8fad5b-d9cb-469f-a165-70867728950e";
const VERSION_ID = "7c9e6679-7425-40de-944b-e07fc1f90ae7";

describe("template editor actions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("saves the draft (not audited, no cache refresh) and maps a version conflict to the reload banner", async () => {
    vi.mocked(saveTemplateDraft).mockResolvedValueOnce({ success: true, data: { draftVersion: 4 } });
    expect(await saveTemplateDraftAction(ID, { pages: [] }, 3)).toEqual({ success: true, data: { draftVersion: 4 } });
    expect(saveTemplateDraft).toHaveBeenCalledWith("actor", ID, { pages: [] }, 3, undefined, undefined);
    vi.mocked(saveTemplateDraft).mockResolvedValueOnce({ success: true, data: { draftVersion: 5 } });
    const names = { home: { ar: "الرئيسية", en: "Home" } };
    await saveTemplateDraftAction(ID, { pages: [] }, 4, names);
    expect(saveTemplateDraft).toHaveBeenLastCalledWith("actor", ID, { pages: [] }, 4, undefined, names);
    vi.mocked(saveTemplateDraft).mockResolvedValueOnce({ success: false, error: "version_conflict" });
    expect(await saveTemplateDraftAction(ID, {}, 3)).toEqual({ success: false, error: "versionConflict" });
    vi.mocked(saveTemplateDraft).mockResolvedValueOnce({ success: false, error: "invalid_config" });
    expect(await saveTemplateDraftAction(ID, {}, 3)).toEqual({ success: false, error: "invalidContent" });
    expect(applyInvalidation).not.toHaveBeenCalled();
  });

  it("publishes with the changelog and reason, then refreshes the template catalog", async () => {
    vi.mocked(publishTemplateVersion).mockResolvedValueOnce({ success: true, data: { version: 5, versionId: VERSION_ID } });
    expect(await publishTemplateAction(ID, "New hero", "seasonal refresh")).toEqual({ success: true, data: { revisionId: VERSION_ID, revisionNumber: 5 } });
    expect(publishTemplateVersion).toHaveBeenCalledWith("actor", ID, "New hero", "seasonal refresh");
    expect(applyInvalidation).toHaveBeenCalledTimes(1);
  });

  it("sends an empty changelog as null and maps no_change to 'nothing to publish'", async () => {
    vi.mocked(publishTemplateVersion).mockResolvedValueOnce({ success: false, error: "no_change" });
    expect(await publishTemplateAction(ID, "  ", "why not")).toEqual({ success: false, error: "nothingToPublish" });
    expect(publishTemplateVersion).toHaveBeenCalledWith("actor", ID, null, "why not");
    expect(applyInvalidation).not.toHaveBeenCalled();
  });

  it("refuses a reason outside 3–500 characters before calling the lib", async () => {
    expect(await publishTemplateAction(ID, null, "no")).toEqual({ success: false, error: "invalidInput" });
    expect(await restoreTemplateVersionAction(ID, VERSION_ID, "x".repeat(501))).toEqual({ success: false, error: "invalidInput" });
    expect(publishTemplateVersion).not.toHaveBeenCalled();
    expect(restoreTemplateVersionToDraft).not.toHaveBeenCalled();
  });

  it("reports a committed publish as a success even when the cache refresh fails", async () => {
    vi.mocked(publishTemplateVersion).mockResolvedValueOnce({ success: true, data: { version: 2, versionId: VERSION_ID } });
    vi.mocked(applyInvalidation).mockRejectedValueOnce(new Error("redis down"));
    expect(await publishTemplateAction(ID, null, "why not")).toEqual({ success: true, data: { revisionId: VERSION_ID, revisionNumber: 2 } });
    expect(logServerError).toHaveBeenCalledTimes(1);
  });

  it("restores a version into the draft and refreshes the catalog", async () => {
    vi.mocked(restoreTemplateVersionToDraft).mockResolvedValueOnce({ success: true, data: { draftVersion: 9, version: 2 } });
    vi.mocked(getTemplateForStudio).mockResolvedValueOnce({ config: { pages: [{}, {}] } } as never);
    expect(await restoreTemplateVersionAction(ID, VERSION_ID, "roll back")).toEqual({ success: true, data: { pages: 2 } });
    expect(restoreTemplateVersionToDraft).toHaveBeenCalledWith("actor", ID, VERSION_ID, "roll back");
    expect(applyInvalidation).toHaveBeenCalledTimes(1);
  });

  it("lists the versions as editor revisions (the current one is live)", async () => {
    vi.mocked(listTemplateVersionsForStudio).mockResolvedValueOnce([
      { id: VERSION_ID, version: 2, changelog: null, publishedAt: "2026-10-20T10:00:00.000Z" },
      { id: ID, version: 1, changelog: "Created", publishedAt: "2026-10-19T10:00:00.000Z" },
    ]);
    vi.mocked(getTemplateForStudio).mockResolvedValueOnce({ version: 2 } as never);
    expect(await listTemplateVersionsAction(ID)).toEqual({
      success: true,
      data: [
        { id: VERSION_ID, revisionNumber: 2, createdAt: "2026-10-20T10:00:00.000Z", publishedBy: null, isLive: true },
        { id: ID, revisionNumber: 1, createdAt: "2026-10-19T10:00:00.000Z", publishedBy: null, isLive: false },
      ],
    });
  });

  it("refuses a non-admin (or moderator) session without calling the lib", async () => {
    vi.mocked(adminActorId).mockResolvedValue(null);
    expect(await saveTemplateDraftAction(ID, {}, 1)).toEqual({ success: false, error: "notFound" });
    expect(await publishTemplateAction(ID, null, "why not")).toEqual({ success: false, error: "notFound" });
    expect(await restoreTemplateVersionAction(ID, VERSION_ID, "why not")).toEqual({ success: false, error: "notFound" });
    expect(await listTemplateVersionsAction(ID)).toEqual({ success: false, error: "notFound" });
    expect(adminActorId).toHaveBeenCalledWith("canManageUsers");
    expect(saveTemplateDraft).not.toHaveBeenCalled();
    expect(publishTemplateVersion).not.toHaveBeenCalled();
    expect(listTemplateVersionsForStudio).not.toHaveBeenCalled();
    vi.mocked(adminActorId).mockResolvedValue("actor");
  });
});
