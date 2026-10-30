import { describe, expect, it } from "vitest";
import { restoredStatus, trashDaysLeft, trashIds, trashPurgeCutoff, TRASH_MAX_IDS } from "./trash.lib";

const NOW = new Date("2026-10-30T12:00:00Z");

describe("trashDaysLeft", () => {
  it("counts down from 30 to 0", () => {
    expect(trashDaysLeft("2026-10-30T12:00:00Z", NOW)).toBe(30);
    expect(trashDaysLeft("2026-10-29T13:00:00Z", NOW)).toBe(30);
    expect(trashDaysLeft("2026-10-20T12:00:00Z", NOW)).toBe(20);
    expect(trashDaysLeft("2026-09-30T13:00:00Z", NOW)).toBe(1);
    expect(trashDaysLeft("2026-09-01T00:00:00Z", NOW)).toBe(0);
    expect(trashDaysLeft("not a date", NOW)).toBe(0);
  });

  it("puts the purge cutoff 30 days back", () => {
    expect(trashPurgeCutoff(NOW).toISOString()).toBe("2026-09-30T12:00:00.000Z");
  });
});

describe("restoredStatus", () => {
  const ok = { canPublish: true, hasImage: true };
  it("puts back the status it had", () => {
    expect(restoredStatus("active", ok)).toBe("active");
    expect(restoredStatus("draft", ok)).toBe("draft");
    expect(restoredStatus("rejected", ok)).toBe("rejected");
    expect(restoredStatus(null, ok)).toBe("draft");
  });

  it("brings a live product back as a draft when it can't go live now", () => {
    expect(restoredStatus("active", { canPublish: false, hasImage: true })).toBe("draft");
    expect(restoredStatus("active", { canPublish: true, hasImage: false })).toBe("draft");
  });
});

describe("trashIds", () => {
  const A = "0b6f1c2e-6a52-4c39-9a3f-2f1d3e4a5b6c";
  it("keeps unique valid ids, capped", () => {
    expect(trashIds([A, A.toUpperCase(), "x", 3, null])).toEqual([A]);
    expect(trashIds("nope")).toEqual([]);
    const many = Array.from({ length: TRASH_MAX_IDS + 5 }, (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`);
    expect(trashIds(many)).toHaveLength(TRASH_MAX_IDS);
  });
});
