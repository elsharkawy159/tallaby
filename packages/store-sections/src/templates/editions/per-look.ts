/**
 * A pack on one of its looks (owner, 2026-11-11: a niche offered on two
 * templates must not look duplicated). `Edition.perLook[lookKey]` changes the
 * demo store's name, the copy, the art-directed photos, the journey and the
 * extras for that look; the products, prices, categories and product stage
 * stay the pack's. The result is a plain `Edition` with no `perLook`, so
 * `applyEdition` and `validateEdition` read it like any pack. No React here.
 */
import type { Edition, EditionLookOverride } from "./types";

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Objects merge key by key; a list or a value replaces. `{ ar, en }` merges too, so one language can be overridden. */
function deepMerge<T>(base: T, patch: unknown): T {
  if (patch === undefined) return base;
  if (!isPlainObject(base) || !isPlainObject(patch)) return patch as T;
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(patch)) out[key] = deepMerge(out[key], value);
  return out as T;
}

/** The pack as `lookKey` shows it: its `perLook` entry applied, `perLook` dropped. */
export function editionForLook(edition: Edition, lookKey: string): Edition {
  const { perLook, ...base } = edition;
  const o: EditionLookOverride | undefined = perLook?.[lookKey];
  if (!o) return base;
  const { dark: darkPatch, ...lightPatch } = o.photos ?? {};
  const photos = {
    ...base.photos,
    ...lightPatch,
    ...(darkPatch || base.photos.dark ? { dark: { ...base.photos.dark, ...darkPatch } } : {}),
  };
  // New tiles are the categories' images too: a category image that was the pack's tile follows the look's own tile.
  const tiles = lightPatch.tiles;
  const categories = tiles
    ? base.demo.categories.map((category, i) => (category.image && category.image === base.photos.tiles[i] ? { ...category, image: tiles[i] ?? null } : category))
    : base.demo.categories;
  return {
    ...base,
    demo: { ...base.demo, ...(o.store && { store: { ...base.demo.store, ...o.store } }), ...(tiles && { categories }) },
    copy: deepMerge(base.copy, o.copy),
    photos,
    ...(o.journey && { journey: { ...base.journey, ...o.journey } }),
    ...(o.extras && { extras: o.extras }),
    ...(o.productPage && { productPage: deepMerge(base.productPage ?? {}, o.productPage) }),
  };
}
