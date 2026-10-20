import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@workspace/db/log", () => ({ logServerError: vi.fn() }));
vi.mock("@workspace/cache", () => ({
  applyInvalidation: vi.fn(async () => {}),
  invalidateTemplateCatalog: vi.fn(() => ({ tags: ["templates:catalog"], paths: [] })),
}));
vi.mock("../_lib/saas-admin.server", () => ({
  adminActorId: vi.fn(async () => "actor"),
  saasError: (code: string) => ({ success: false, error: `saas:${code}` }),
}));
vi.mock("@workspace/lib/admin/server", () => ({
  createTemplate: vi.fn(),
  duplicateTemplate: vi.fn(),
  deleteTemplate: vi.fn(),
  restoreTemplateVersionToDraft: vi.fn(),
  updateTemplateByAdmin: vi.fn(),
  setDefaultTemplateByAdmin: vi.fn(),
}));

import { applyInvalidation } from "@workspace/cache";
import { logServerError } from "@workspace/db/log";
import {
  createTemplate,
  deleteTemplate,
  duplicateTemplate,
  restoreTemplateVersionToDraft,
  setDefaultTemplateByAdmin,
  updateTemplateByAdmin,
} from "@workspace/lib/admin/server";
import { adminActorId } from "../_lib/saas-admin.server";
import {
  createTemplateAction,
  deleteTemplateAction,
  duplicateTemplateAction,
  restoreTemplateVersionToDraftAction,
  setDefaultTemplateAction,
  updateTemplateAction,
} from "./templates.server";

const ID = "0f8fad5b-d9cb-469f-a165-70867728950e";

describe("template page actions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates an inactive template with the reason split from the fields and returns its id", async () => {
    vi.mocked(createTemplate).mockResolvedValueOnce({ success: true, data: { id: ID, key: "summer" } });
    const fields = { key: "summer", name: { ar: "صيف", en: "Summer" }, description: { ar: "", en: "" }, category: "fashion" };
    expect(await createTemplateAction({ ...fields, reason: "new season" })).toMatchObject({ success: true, id: ID });
    expect(createTemplate).toHaveBeenCalledWith("actor", fields, "new season");
    expect(applyInvalidation).toHaveBeenCalledTimes(1);
  });

  it("duplicates, deletes and restores with the reason, refreshing the catalog each time", async () => {
    vi.mocked(duplicateTemplate).mockResolvedValueOnce({ success: true, data: { id: "new", key: "atelier-copy" } });
    vi.mocked(deleteTemplate).mockResolvedValueOnce({ success: true, data: null });
    vi.mocked(restoreTemplateVersionToDraft).mockResolvedValueOnce({ success: true, data: { draftVersion: 3, version: 1 } });
    expect(await duplicateTemplateAction({ id: ID, key: "atelier-copy", reason: "variant" })).toMatchObject({ success: true, id: "new" });
    expect(duplicateTemplate).toHaveBeenCalledWith("actor", ID, "atelier-copy", "variant");
    expect((await deleteTemplateAction({ id: ID, reason: "unused" })).success).toBe(true);
    expect(deleteTemplate).toHaveBeenCalledWith("actor", ID, "unused");
    expect((await restoreTemplateVersionToDraftAction({ id: ID, versionId: "v1", reason: "roll back" })).success).toBe(true);
    expect(restoreTemplateVersionToDraft).toHaveBeenCalledWith("actor", ID, "v1", "roll back");
    expect(applyInvalidation).toHaveBeenCalledTimes(3);
  });

  it("explains a refused delete of the default template and does not refresh", async () => {
    vi.mocked(deleteTemplate).mockResolvedValueOnce({ success: false, error: "default_template" });
    const result = await deleteTemplateAction({ id: ID, reason: "unused" });
    expect(result.success).toBe(false);
    expect(!result.success && result.error).toMatch(/default template cannot be deleted/);
    expect(applyInvalidation).not.toHaveBeenCalled();
  });

  it("reports a committed write as a success even when the cache refresh fails", async () => {
    vi.mocked(applyInvalidation).mockRejectedValue(new Error("redis down"));
    vi.mocked(createTemplate).mockResolvedValueOnce({ success: true, data: { id: ID, key: "k1" } });
    vi.mocked(updateTemplateByAdmin).mockResolvedValueOnce({ success: true });
    vi.mocked(setDefaultTemplateByAdmin).mockResolvedValueOnce({ success: true });
    expect((await createTemplateAction({ reason: "why not" })).success).toBe(true);
    expect((await updateTemplateAction({ reason: "why not" })).success).toBe(true);
    expect((await setDefaultTemplateAction({ reason: "why not" })).success).toBe(true);
    expect(logServerError).toHaveBeenCalledTimes(3);
    vi.mocked(applyInvalidation).mockResolvedValue(undefined);
  });

  it("refuses a non-admin (or moderator) session without calling the lib", async () => {
    vi.mocked(adminActorId).mockResolvedValue(null);
    expect((await createTemplateAction({})).success).toBe(false);
    expect((await duplicateTemplateAction({})).success).toBe(false);
    expect((await deleteTemplateAction({})).success).toBe(false);
    expect((await updateTemplateAction({})).success).toBe(false);
    expect(adminActorId).toHaveBeenCalledWith("canManageUsers");
    expect(createTemplate).not.toHaveBeenCalled();
    expect(updateTemplateByAdmin).not.toHaveBeenCalled();
    vi.mocked(adminActorId).mockResolvedValue("actor");
  });
});
