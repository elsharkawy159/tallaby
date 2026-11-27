import { describe, expect, it } from "vitest";
import { OTHER_APPS_LIMIT, pickOtherApps } from "./other-apps.lib";

describe("pickOtherApps", () => {
  const apps = Array.from({ length: 20 }, (_, i) => `app-${i}`);

  it("returns at most the limit, each app once, without changing the input", () => {
    const before = [...apps];
    const picked = pickOtherApps(apps);
    expect(picked).toHaveLength(OTHER_APPS_LIMIT);
    expect(new Set(picked).size).toBe(picked.length);
    for (const app of picked) expect(apps).toContain(app);
    expect(apps).toEqual(before);
  });

  it("returns every app when there are fewer than the limit", () => {
    expect(pickOtherApps(["a", "b"]).sort()).toEqual(["a", "b"]);
    expect(pickOtherApps([])).toEqual([]);
  });

  it("shuffles with the given random source", () => {
    expect(pickOtherApps(["a", "b", "c"], 3, () => 0)).toEqual(["b", "c", "a"]);
  });
});
