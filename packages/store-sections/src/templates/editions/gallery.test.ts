/**
 * Niche editions in galleries, previews and installs (ROADMAP F-90, plan
 * §4.5): which edition a look may be shown with, what a gallery offers, and
 * the fallbacks. Shown with the fixture pack (`tshirts.fixture.ts`), passed
 * in, since the registry may be empty.
 */
import { describe, expect, it } from "vitest";
import { getCodeTemplate } from "../catalog";
import { defaultNiche, editionOnLook, editionOptions, EDITIONS, nicheFirst, offeredNiches, templateWithEdition } from "./index";
import { getNiche } from "./niches";
import { TSHIRTS } from "./tshirts.fixture";
import type { Edition } from "./types";

const PACKS = [TSHIRTS];
const TSHIRTS_OPTION = { id: "tshirts", name: { ar: "تيشيرتات", en: "T-shirts" } };

describe("editionOnLook: the preview and install rule", () => {
  it("finds the pack of a real niche approved on an edition-ready look", () => {
    expect(editionOnLook("fashion-luxe", "tshirts", PACKS)).toBe(TSHIRTS);
  });

  it("falls back (undefined) for an unknown niche, a niche with no pack, and a value that is not a string", () => {
    expect(editionOnLook("fashion-luxe", "no-such-niche", PACKS)).toBeUndefined();
    expect(editionOnLook("fashion-luxe", "dresses", PACKS)).toBeUndefined();
    for (const value of [undefined, null, "", 7, ["tshirts"], { niche: "tshirts" }]) expect(editionOnLook("fashion-luxe", value, PACKS)).toBeUndefined();
  });

  it("falls back when the pack is not approved on that look", () => {
    // `kabl` is edition-ready, and the t-shirts pack does not list it.
    expect(editionOnLook("kabl", "tshirts", PACKS)).toBeUndefined();
  });

  it("falls back when the look is not edition-ready, even if a pack lists it", () => {
    const onClassic: Edition = { ...TSHIRTS, looks: ["tallaby-classic", "fashion-luxe"] };
    expect(editionOnLook("tallaby-classic", "tshirts", [onClassic])).toBeUndefined();
    expect(editionOnLook("no-such-template", "tshirts", [onClassic])).toBeUndefined();
    expect(editionOnLook("fashion-luxe", "tshirts", [onClassic])).toBe(onClassic);
  });

  it("never trusts a pack whose niche id is not in the niche list", () => {
    expect(editionOnLook("fashion-luxe", "made-up", [{ ...TSHIRTS, niche: "made-up" }])).toBeUndefined();
  });
});

describe("templateWithEdition", () => {
  it("builds the look with the edition: its store, catalog and niche, under the look's key", () => {
    const built = templateWithEdition("fashion-luxe", "tshirts", PACKS)!;
    expect(built.key).toBe("fashion-luxe");
    expect(built.edition).toBe("tshirts");
    expect(built.demo.store.name.en).toBe("Qotna");
    expect(JSON.stringify(built.config())).toContain("Tees that last for years");
    expect(JSON.stringify(getCodeTemplate("fashion-luxe")!.config())).not.toContain("Tees that last for years");
  });

  it("is undefined whenever the rule says fall back", () => {
    expect(templateWithEdition("fashion-luxe", "dresses", PACKS)).toBeUndefined();
    expect(templateWithEdition("kabl", "tshirts", PACKS)).toBeUndefined();
    expect(templateWithEdition("tallaby-classic", "tshirts", PACKS)).toBeUndefined();
  });

  it("is undefined, not an error, for a pack that cannot be built on the look", () => {
    const broken = structuredClone(TSHIRTS) as { copy: { hero?: unknown } } & Edition;
    delete (broken.copy as { hero?: unknown }).hero;
    expect(templateWithEdition("fashion-luxe", "tshirts", [broken])).toBeUndefined();
  });
});

describe("what a gallery offers", () => {
  it("lists a look's editions as chips, and none for a look without editions", () => {
    expect(editionOptions("fashion-luxe", PACKS)).toEqual([TSHIRTS_OPTION]);
    expect(editionOptions("kabl", PACKS)).toEqual([]);
    expect(editionOptions("tallaby-classic", [{ ...TSHIRTS, looks: ["tallaby-classic"] }])).toEqual([]);
  });

  it("offers only the niches of the industry that have a pack on an edition-ready look", () => {
    expect(offeredNiches("fashion", PACKS)).toEqual([TSHIRTS_OPTION]);
    expect(offeredNiches("electronics", PACKS)).toEqual([]);
    expect(offeredNiches(null, PACKS)).toEqual([]);
    // A pack whose looks are not converted yet leads nowhere, so its niche is not offered.
    expect(offeredNiches("fashion", [{ ...TSHIRTS, looks: ["tallaby-classic"] }])).toEqual([]);
  });

  it("offers nothing with no pack: no niche filter and no chips anywhere", () => {
    expect(offeredNiches("fashion", [])).toEqual([]);
    expect(editionOptions("fashion-luxe", [])).toEqual([]);
    expect(nicheFirst([{ key: "a" }, { key: "fashion-luxe" }], "tshirts", [])).toEqual([{ key: "a" }, { key: "fashion-luxe" }]);
  });

  it("agrees with the registry: a registered niche is offered exactly when a look shows its edition", () => {
    for (const edition of EDITIONS) {
      const niche = getNiche(edition.niche)!;
      const offered = offeredNiches(niche.industry).some((option) => option.id === niche.id);
      const shown = edition.looks.some((look) => editionOptions(look).some((option) => option.id === niche.id));
      expect(offered, edition.niche).toBe(shown);
    }
  });

  it("defaults to the store's niche only when it is offered", () => {
    const teeShop = { category: { en: "T-shirts", ar: "تيشيرتات" }, name: "Qotna" };
    expect(defaultNiche(teeShop, [TSHIRTS_OPTION])).toBe("tshirts");
    expect(defaultNiche(teeShop, [])).toBeNull();
    expect(defaultNiche(teeShop, [{ id: "dresses", name: { ar: "فساتين", en: "Dresses" } }])).toBeNull();
    expect(defaultNiche({ category: { en: "Fashion" }, name: "Nour" }, [TSHIRTS_OPTION])).toBeNull();
  });

  it("puts a niche's looks first, best first, and keeps the rest in order", () => {
    const list = [{ key: "kasr" }, { key: "fashion-luxe" }, { key: "kabl" }, { key: "vella" }];
    expect(nicheFirst(list, "tshirts", PACKS).map((t) => t.key)).toEqual(["fashion-luxe", "kasr", "kabl", "vella"]);
    const two: Edition = { ...TSHIRTS, looks: ["kabl", "tallaby-classic", "fashion-luxe"] };
    expect(nicheFirst(list, "tshirts", [two]).map((t) => t.key)).toEqual(["kabl", "fashion-luxe", "kasr", "vella"]);
    expect(nicheFirst(list, null, PACKS)).toEqual(list);
    expect(nicheFirst(list, "dresses", PACKS)).toEqual(list);
  });
});
