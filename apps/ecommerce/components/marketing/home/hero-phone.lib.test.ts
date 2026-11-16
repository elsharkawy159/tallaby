import { describe, expect, it } from "vitest";
import type { GalleryEntry } from "@/lib/marketing/templates.lib";
import { HERO_PHONE_SHOT_COUNT, heroPhoneShots, heroPhoneTourSeconds, pickHeroPhoneShot } from "./hero-phone.lib";

const phone = (id: string) => ({ src: `/template-previews/${id}.en.mobile.webp`, width: 600, height: 6000 });

const entry = (id: string, category: string, shot: "phone" | "desktop" | "none" = "phone") =>
  ({
    id,
    category,
    name: `name ${id}`,
    shot: shot === "none" ? null : { src: `/template-previews/${id}.en.webp`, width: 600, height: 1800, edition: null, ...(shot === "phone" ? { mobile: phone(id) } : {}) },
  }) as unknown as GalleryEntry;

describe("heroPhoneShots", () => {
  it("takes one phone shot from each of 10 different industries by default", () => {
    const entries = Array.from({ length: 14 }, (_, i) => [entry(`c${i}a`, `c${i}`), entry(`c${i}b`, `c${i}`)]).flat();
    const shots = heroPhoneShots(entries);
    expect(HERO_PHONE_SHOT_COUNT).toBe(10);
    expect(shots).toHaveLength(10);
    const industries = shots.map((shot) => /\/(c\d+)[ab]\./.exec(shot.src)![1]);
    expect(new Set(industries).size).toBe(10);
  });

  it("sends the phone shot's file and size, and nothing else", () => {
    expect(heroPhoneShots([entry("a1", "a")])).toEqual([phone("a1")]);
  });

  it("leaves out templates with no phone shot", () => {
    const entries = [entry("live", "a", "none"), entry("wide", "b", "desktop"), entry("ok", "c")];
    expect(heroPhoneShots(entries)).toEqual([phone("ok")]);
    expect(heroPhoneShots([])).toEqual([]);
  });
});

describe("pickHeroPhoneShot", () => {
  it("maps a random number in 0..1 to one of the shots", () => {
    const shots = ["a", "b", "c", "d"];
    expect(pickHeroPhoneShot(shots, 0)).toBe("a");
    expect(pickHeroPhoneShot(shots, 0.26)).toBe("b");
    expect(pickHeroPhoneShot(shots, 0.999)).toBe("d");
  });

  it("stays inside the list and gives null for an empty one", () => {
    expect(pickHeroPhoneShot(["a", "b"], 1)).toBe("b");
    expect(pickHeroPhoneShot(["a", "b"], -0.2)).toBe("a");
    expect(pickHeroPhoneShot([], 0.5)).toBeNull();
  });
});

describe("heroPhoneTourSeconds", () => {
  it("takes longer for a longer page, between 12 and 30 seconds", () => {
    expect(heroPhoneTourSeconds(600, 1300)).toBe(12);
    expect(heroPhoneTourSeconds(600, 5000)).toBeCloseTo(14.7, 1);
    expect(heroPhoneTourSeconds(600, 9000)).toBe(30);
    expect(heroPhoneTourSeconds(600, 6000)).toBeGreaterThan(heroPhoneTourSeconds(600, 5000));
  });

  it("falls back to the shortest run for a broken size", () => {
    expect(heroPhoneTourSeconds(0, 5000)).toBe(12);
    expect(heroPhoneTourSeconds(600, Number.NaN)).toBe(12);
  });
});
