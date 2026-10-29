import { describe, expect, it } from "vitest";
import {
  cairoToday,
  launchDateFor,
  roadmapCardInputSchema,
  roadmapHiddenInputSchema,
  roadmapStatusInputSchema,
} from "./roadmap-admin.lib";

const ID = "6f1c2f9e-3c55-4c8a-9a0f-2b8d5e7a1c11";
// 23:30 UTC on 28 Oct is already 29 Oct in Cairo (UTC+2/+3).
const LATE_UTC = new Date("2026-10-28T23:30:00Z");

describe("cairoToday", () => {
  it("uses the Cairo calendar day", () => {
    expect(cairoToday(LATE_UTC)).toBe("2026-10-29");
  });
});

describe("launchDateFor", () => {
  it("clears the date outside the Launched column", () => {
    expect(launchDateFor("planned", "2026-10-01", "2026-10-01", LATE_UTC)).toBeNull();
    expect(launchDateFor("in_progress", null, "2026-10-01", LATE_UTC)).toBeNull();
  });

  it("prefers the requested date, then the current one, then today", () => {
    expect(launchDateFor("launched", "2026-10-05", "2026-10-01", LATE_UTC)).toBe("2026-10-05");
    expect(launchDateFor("launched", null, "2026-10-01", LATE_UTC)).toBe("2026-10-01");
    expect(launchDateFor("launched", null, null, LATE_UTC)).toBe("2026-10-29");
  });
});

describe("roadmapCardInputSchema", () => {
  const base = { status: "planned", category: "orders", title: "  Customers list  " };

  it("trims text and turns empty optional fields into null", () => {
    const parsed = roadmapCardInputSchema.parse({ ...base, titleEn: "", descriptionEn: " ", roadmapRef: "", launchedAt: "" });
    expect(parsed).toMatchObject({
      title: "Customers list",
      description: "",
      titleEn: null,
      descriptionEn: null,
      roadmapRef: null,
      launchedAt: null,
    });
  });

  it("rejects unknown columns, short titles and bad refs or dates", () => {
    expect(roadmapCardInputSchema.safeParse({ ...base, status: "done" }).success).toBe(false);
    expect(roadmapCardInputSchema.safeParse({ ...base, title: "ab" }).success).toBe(false);
    expect(roadmapCardInputSchema.safeParse({ ...base, roadmapRef: "F 01" }).success).toBe(false);
    expect(roadmapCardInputSchema.safeParse({ ...base, launchedAt: "29/10/2026" }).success).toBe(false);
    expect(roadmapCardInputSchema.safeParse({ ...base, roadmapRef: "F-01", launchedAt: "2026-10-29" }).success).toBe(true);
  });
});

describe("status and hidden inputs", () => {
  it("need a uuid and a known value", () => {
    expect(roadmapStatusInputSchema.safeParse({ id: ID, status: "launched" }).success).toBe(true);
    expect(roadmapStatusInputSchema.safeParse({ id: "x", status: "launched" }).success).toBe(false);
    expect(roadmapHiddenInputSchema.safeParse({ id: ID, hidden: "yes" }).success).toBe(false);
  });
});
