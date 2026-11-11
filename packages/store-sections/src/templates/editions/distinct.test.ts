/**
 * A niche offered on two or more templates must not look duplicated (owner,
 * 2026-11-11: "not duplicate templates, make differences"). The looks already
 * differ in layout and palette; this checks what a pack supplies: every look
 * after the first has its own `perLook` entry, and the looks of one niche
 * never share a demo store name, the hero, banner, story or tile photos, or
 * the hero, story and announcement copy. Products and prices stay shared.
 */
import { describe, expect, it } from "vitest";
import { EDITIONS } from "./index";
import { editionForLook } from "./per-look";
import type { Edition } from "./types";

/**
 * Packs still waiting for their second look's own content. Remove a niche
 * when its `perLook` entry is written; the list must end empty.
 */
const PENDING = new Set<string>([
  // fashion-bold is the niche's template and shows the pack itself; zay and fashion-luxe draw it until the fashion switch takes them off.
  "pants-jeans",
  // jewelry-warm is the niche's template (one template per niche); zay still draws the pack until the accessories switch takes it off.
  "belts-wallets",
  // zahra is the niche's template and shows the pack itself; karat and jewelry-luxe draw it until the accessories switch takes them off.
  "fashion-jewelry",
  // kholkhal is the niche's template and shows the pack itself; karat draws it until the accessories switch takes it off.
  "hair-accessories",
]);

/** What makes a look's version of the pack recognisable, each compared between two looks. */
function fingerprint(edition: Edition): Record<string, string> {
  const { copy, photos, demo } = edition;
  return {
    "store name (ar)": demo.store.name.ar,
    "store name (en)": demo.store.name.en,
    "hero title (ar)": copy.hero.title.ar,
    "hero title (en)": copy.hero.title.en,
    "hero eyebrow (en)": copy.hero.eyebrow.en,
    "story title (en)": copy.story.title.en,
    "story text (en)": copy.story.text.en,
    "first announcement (en)": copy.announcement[0]?.en ?? "",
    "newsletter title (en)": copy.newsletter.title.en,
    "hero photo": photos.hero.wide,
    "hero photo (phone)": photos.hero.tall,
    "banner photo": photos.banner,
    "story photo": photos.story,
  };
}

/** Problems between every two looks of one pack; empty when they read as different stores. */
export function duplicateProblems(edition: Edition): string[] {
  const problems: string[] = [];
  const [first, ...rest] = edition.looks;
  for (const look of rest) if (!edition.perLook?.[look]) problems.push(`${edition.niche}: look "${look}" has no perLook entry`);
  for (const key of Object.keys(edition.perLook ?? {})) {
    if (!edition.looks.includes(key)) problems.push(`${edition.niche}: perLook "${key}" is not one of its looks`);
    if (key === first) problems.push(`${edition.niche}: perLook "${key}" is its first look, which shows the pack itself`);
  }
  const versions = edition.looks.map((look) => ({ look, edition: editionForLook(edition, look) }));
  for (let i = 0; i < versions.length; i++) {
    for (let j = i + 1; j < versions.length; j++) {
      const a = versions[i]!;
      const b = versions[j]!;
      const fa = fingerprint(a.edition);
      const fb = fingerprint(b.edition);
      for (const key of Object.keys(fa)) {
        if (fa[key] && fa[key] === fb[key]) problems.push(`${edition.niche}: "${a.look}" and "${b.look}" share the ${key}`);
      }
      const tiles = new Set(a.edition.photos.tiles);
      const sharedTiles = b.edition.photos.tiles.filter((tile) => tiles.has(tile));
      if (sharedTiles.length) problems.push(`${edition.niche}: "${a.look}" and "${b.look}" share ${sharedTiles.length} category tile photo(s)`);
    }
  }
  return problems;
}

describe("niche editions on two templates are not duplicates", () => {
  for (const edition of EDITIONS.filter((e) => e.looks.length > 1 && !PENDING.has(e.niche))) {
    it(`${edition.niche}: ${edition.looks.join(" vs ")}`, () => {
      expect(duplicateProblems(edition)).toEqual([]);
    });
  }

  it("lists only packs that really are waiting", () => {
    const stale = [...PENDING].filter((niche) => {
      const edition = EDITIONS.find((e) => e.niche === niche);
      return !edition || edition.looks.length < 2 || duplicateProblems(edition).length === 0;
    });
    expect(stale).toEqual([]);
  });

  it("every pack on one look has no perLook entry", () => {
    expect(EDITIONS.filter((e) => e.looks.length === 1 && e.perLook && Object.keys(e.perLook).length > 0).map((e) => e.niche)).toEqual([]);
  });
});

describe("editionForLook", () => {
  const base = EDITIONS.find((e) => e.looks.length > 1)!;
  const [first, second] = base.looks as [string, string];
  const pack: Edition = {
    ...base,
    perLook: {
      [second]: {
        store: { name: { ar: "متجر تاني", en: "Other Store" } },
        copy: { hero: { title: { ar: "عنوان تاني", en: "Another title" } } },
        photos: { banner: "https://example.com/banner.webp" },
        journey: { primary: "featured" },
      },
    },
  };

  it("leaves the first look as the pack, without perLook", () => {
    const resolved = editionForLook(pack, first);
    expect(resolved.perLook).toBeUndefined();
    expect(resolved.copy).toBe(base.copy);
    expect(resolved.demo).toBe(base.demo);
  });

  it("merges copy slot by slot and replaces only the photos given", () => {
    const resolved = editionForLook(pack, second);
    expect(resolved.demo.store.name.en).toBe("Other Store");
    expect(resolved.demo.store.description).toEqual(base.demo.store.description);
    expect(resolved.demo.products).toBe(base.demo.products);
    expect(resolved.copy.hero.title.en).toBe("Another title");
    expect(resolved.copy.hero.cta).toEqual(base.copy.hero.cta);
    expect(resolved.copy.trust).toEqual(base.copy.trust);
    expect(resolved.photos.banner).toBe("https://example.com/banner.webp");
    expect(resolved.photos.hero).toEqual(base.photos.hero);
    expect(resolved.journey?.primary).toBe("featured");
    expect(resolved.productStage).toEqual(base.productStage);
  });
});
