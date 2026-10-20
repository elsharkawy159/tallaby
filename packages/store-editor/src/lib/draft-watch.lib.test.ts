import { describe, expect, it } from "vitest";
import type { DraftVersions } from "../adapter.types";
import { detectExternalChange } from "./draft-watch.lib";

const base: DraftVersions = { pages: { a: 2, b: 1 }, designVersion: 3, chromeVersion: 4, editedByAdminAt: null };
const copy = (patch: Partial<DraftVersions> = {}): DraftVersions => ({ ...base, pages: { ...base.pages }, ...patch });

describe("detectExternalChange", () => {
  it("is unchanged for identical versions", () => {
    expect(detectExternalChange(base, copy())).toEqual({ changed: false, byAdmin: false });
  });

  it("detects a higher remote page version", () => {
    expect(detectExternalChange(base, copy({ pages: { a: 3, b: 1 } })).changed).toBe(true);
  });

  it("detects a new remote page", () => {
    expect(detectExternalChange(base, copy({ pages: { a: 2, b: 1, c: 1 } })).changed).toBe(true);
  });

  it("detects a higher remote design or chrome version", () => {
    expect(detectExternalChange(base, copy({ designVersion: 4 })).changed).toBe(true);
    expect(detectExternalChange(base, copy({ chromeVersion: 5 })).changed).toBe(true);
  });

  it("flags byAdmin when editedByAdminAt is later than the local value", () => {
    const local = copy({ editedByAdminAt: "2026-10-20T10:00:00.000Z" });
    const remote = copy({ pages: { a: 3, b: 1 }, editedByAdminAt: "2026-10-20T11:00:00.000Z" });
    expect(detectExternalChange(local, remote)).toEqual({ changed: true, byAdmin: true });
    expect(detectExternalChange(base, copy({ pages: { a: 3, b: 1 }, editedByAdminAt: "2026-10-20T11:00:00.000Z" })).byAdmin).toBe(true);
  });

  it("is not byAdmin when the admin timestamp is unchanged", () => {
    const local = copy({ editedByAdminAt: "2026-10-20T10:00:00.000Z" });
    const remote = copy({ pages: { a: 3, b: 1 }, editedByAdminAt: "2026-10-20T10:00:00.000Z" });
    expect(detectExternalChange(local, remote)).toEqual({ changed: true, byAdmin: false });
  });

  it("ignores a local version that is higher than remote (own unsaved bump)", () => {
    expect(detectExternalChange(copy({ pages: { a: 5, b: 1 }, designVersion: 9 }), base)).toEqual({ changed: false, byAdmin: false });
  });

  it("ignores a page the remote no longer has", () => {
    expect(detectExternalChange(base, copy({ pages: { a: 2 } })).changed).toBe(false);
  });
});
