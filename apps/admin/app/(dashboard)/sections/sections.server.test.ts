import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@workspace/db/log", () => ({ logServerError: vi.fn() }));
vi.mock("@workspace/cache", () => ({ applyInvalidation: vi.fn(async () => {}), invalidateLibrarySections: vi.fn(() => ({ tags: ["library:sections"], paths: [] })) }));
vi.mock("../_lib/saas-admin.server", () => ({ adminActorId: vi.fn(async () => "actor") }));
vi.mock("@workspace/lib/admin/server", () => ({
  createLibrarySection: vi.fn(),
  deleteLibrarySection: vi.fn(),
  duplicateLibrarySection: vi.fn(),
  setLibrarySectionHidden: vi.fn(),
  updateLibrarySectionMeta: vi.fn(),
}));

import { revalidatePath } from "next/cache";
import { applyInvalidation } from "@workspace/cache";
import { logServerError } from "@workspace/db/log";
import { createLibrarySection, deleteLibrarySection } from "@workspace/lib/admin/server";
import { createSectionAction, deleteSectionAction } from "./sections.server";

describe("section library actions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("refreshes the palette after a committed write", async () => {
    vi.mocked(createLibrarySection).mockResolvedValueOnce({ success: true, data: { id: "s1" } } as never);
    expect(await createSectionAction({ key: "hero", reason: "new hero" })).toEqual({ success: true, message: "Section created and logged", id: "s1" });
    expect(applyInvalidation).toHaveBeenCalledTimes(1);
    expect(revalidatePath).toHaveBeenCalledWith("/sections");
  });

  it("a throwing invalidation or revalidatePath never turns a committed write into a failure", async () => {
    vi.mocked(deleteLibrarySection).mockResolvedValueOnce({ success: true, data: null } as never);
    vi.mocked(applyInvalidation).mockRejectedValueOnce(new Error("redis down"));
    vi.mocked(revalidatePath).mockImplementationOnce(() => {
      throw new Error("no store");
    });
    expect(await deleteSectionAction({ id: "s1", reason: "unused" })).toEqual({ success: true, message: "Section deleted and logged" });
    expect(logServerError).toHaveBeenCalledTimes(2);
  });

  it("a failing write is reported and refreshes nothing", async () => {
    vi.mocked(deleteLibrarySection).mockRejectedValueOnce(new Error("db down"));
    expect(await deleteSectionAction({ id: "s1", reason: "unused" })).toEqual({ success: false, error: "Something went wrong. Try again." });
    expect(applyInvalidation).not.toHaveBeenCalled();
  });
});
