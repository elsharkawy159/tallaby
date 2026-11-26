/**
 * Which product card each template draws (owner, 2026-11-26: the gallery's
 * product cards were all the same). `libraryTemplate` restyles the product
 * lists of every page section with `applyCardStyle`
 * (`designs/products/card-styles.ts`); a template's own `card` (or an
 * edition's) wins over this map.
 *
 * Picked by the template's look (`style`): luxe → quiet or editorial, bold →
 * framed or compact, warm or playful → icon or outline, minimal or classic →
 * classic, quiet or compact. Within an industry, templates next to each other
 * in the gallery (by `sortOrder`) never share a style, and no style covers
 * more than about a third of the templates (`card-styles.test.ts`).
 * Tallaby Classic is not here: it keeps its own card (CLAUDE.md rule 12).
 */
import type { CardStyleId } from "../designs/products/card-styles";

export const TEMPLATE_CARD_STYLES: Readonly<Record<string, CardStyleId>> = {
  // auto
  garage: "framed",
  moto: "compact",
  tyre: "outline",
  zeina: "icon",
  kahraba: "classic",
  garagy: "quiet",
  // beauty
  pure: "quiet",
  botanica: "icon",
  barber: "classic",
  "beauty-bold": "framed",
  "perfumes-bold": "outline",
  // books
  doodle: "icon",
  hekaya: "outline",
  "kids-luxe": "quiet",
  // electronics
  techhub: "compact",
  arena: "framed",
  zaki: "classic",
  saa: "compact",
  shasha: "outline",
  "electronics-luxe": "editorial",
  // fashion
  streetwear: "framed",
  kasr: "editorial",
  zay: "quiet",
  sitara: "outline",
  "fashion-luxe": "editorial",
  "fashion-bold": "compact",
  "fashion-warm": "icon",
  "sports-luxe": "editorial",
  vella: "classic",
  // food
  sizzle: "framed",
  loaf: "icon",
  khodar: "compact",
  lahma: "outline",
  atara: "icon",
  souq: "framed",
  // handmade
  fokhar: "icon",
  tawla: "outline",
  "gifts-luxe": "quiet",
  "gifts-warm": "classic",
  // health
  nada: "quiet",
  ward: "outline",
  "beauty-luxe": "editorial",
  // home
  tanzim: "compact",
  zarea: "icon",
  mafrash: "outline",
  rokn: "classic",
  "furniture-luxe": "editorial",
  // jewelry
  karat: "framed",
  fadda: "quiet",
  zahra: "icon",
  saat: "editorial",
  kholkhal: "outline",
  "jewelry-luxe": "editorial",
  "jewelry-warm": "classic",
  // kids
  bambino: "icon",
  hadaya: "outline",
  farha: "framed",
  "kids-bold": "compact",
  // kitchen
  sufra: "outline",
  matbakh: "framed",
  qahwa: "icon",
  beity: "classic",
  // mobile accessories
  volt: "compact",
  kabl: "classic",
  wasla: "quiet",
  // pets
  sabaha: "icon",
  "kids-warm": "outline",
  "grocery-warm": "compact",
  // shoes and bags
  ghorza: "editorial",
  shanta: "quiet",
  tasfya: "framed",
  safar: "icon",
  "sports-bold": "compact",
  // sports
  stride: "framed",
  core: "compact",
  basecamp: "icon",
  yoga: "quiet",
  koora: "outline",
  darraga: "framed",
  // sweets
  roast: "icon",
  halawa: "outline",
  bunn: "framed",
  "grocery-luxe": "quiet",
};
