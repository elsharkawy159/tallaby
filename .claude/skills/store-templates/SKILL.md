---
name: store-templates
description: Source of truth for Tallaby (طلبي) storefront templates and section designs - what a template is, the one-template-per-niche direction, niches and industries, editions (niche packs) and edition-ready looks, the design system (colours, fonts, radius, product stage, motion), template photos, gallery card screenshots, and the step-by-step workflow to convert a look, write a pack, guard fixtures and ship. Use it whenever a task touches packages/store-sections/src/templates or src/designs, NICHE_TEMPLATES, NICHES, EDITIONS, a pack under editions/packs, a template's palette or fonts, template photos or .editions-inbox, template-shots.mjs or the template card previews, the AI builder's template shortlist, or when someone asks to add, fix, redesign, re-photo or review a template, theme, look, niche or section - even if they only say "theme", "look", "store design" or name a template like Vella or Hareer. For the demo copy itself also load template-copywriter.
---

# Tallaby store templates

A **template** is a whole starting site (header, footer, home, about, contact, FAQ and the product page) that a seller picks in the gallery. Every section in it is an **element tree** built with `defineDesign` and inserted as a `custom-section` whose single root is a `section` node, so the seller can select, restyle and move every element (`CLAUDE.md` rule 17).

Code wins over every doc, this one included (`CLAUDE.md` rule 1). The numbers below were read from the code on 2026-11-15; re-count before you quote them.

## What exists (2026-11-15)

| Thing | Count | Where |
|---|---|---|
| Templates | **84** = Tallaby Classic + 83 niche templates | `CODE_TEMPLATES` in `packages/store-sections/src/templates/catalog.ts` |
| Industries | 17, all switched to niche-only galleries | `SWITCHED_INDUSTRIES` in `templates/editions/niche-templates.ts` |
| Niches | 83 | `NICHES` in `templates/editions/niches.ts` |
| Niche → template rows | 83: **37 `ready`** (34 with a pack + 3 native: `sitara`, `fadda`, `saa`), **46 `own`**, 0 `pending` | `NICHE_TEMPLATES` (working tree; the last commit has 33 / 50, the food wave is in progress) |
| Packs (editions) | 34 in 9 industry folders (30 committed + 4 food in progress) | `templates/editions/packs/<industry>/<niche>.ts`, registered in `EDITIONS` (`editions/index.ts`) |
| Look-guard fixtures | 35 | `templates/editions/__fixtures__/<key>.v<version>.json` |
| Section designs | **328** in 29 library categories | `packages/store-sections/src/designs/<category>/`, `DESIGNS`, `EXPECTED` in `designs/designs.test.tsx` |
| Card screenshots | 24 templates (ar + en, desktop + phone) | `apps/ecommerce/public/template-previews/`, manifest `templates/preview-shots.generated.ts` |

Ready templates with no card screenshot yet: `furniture-luxe`, `mafrash`, `rokn`, `tanzim`, `matbakh`, `sufra`, `qahwa`, `atara`, `khodar`, `lahma`, `loaf` (and the natives `sitara`, `saa`). Shoot them when you next touch them (see Screenshots).

## Direction (owner decisions)

- **Code only since 2026-10-27.** `CODE_TEMPLATES` and `DESIGNS` are the single source; the `templates`, `template_versions` and `library_sections` tables were dropped (0109). A template or design change ships with a deploy, never a migration.
- **Stores keep their own copies.** Applying a template copies it into the store's drafts; a code change never alters an existing store's draft or live site. Never write code or SQL that "updates" stores to a new template version.
- **One template per niche** (2026-11-11/12, `docs/systems/one-template-per-niche.md`). Each niche has exactly one template; no template serves two niches; each has its own home order, designs, palette and type, not just other photos. Templates that served no niche were deleted (116 → 84).
- **Editions.** A *look* is a template whose sections read copy and photos from a content object; an *edition* (pack) is one niche's data (catalog, photos, copy). `applyEdition(look, edition)` builds the look with the pack. Its default content must build byte-for-byte what it built before.
- **Tallaby Classic** (`tallaby-classic`, `DEFAULT_TEMPLATE`) is the default starting site, not a niche template. Changing its design needs the owner's approval (`CLAUDE.md` rule 12).
- **No offers.** Templates carry no promotion, bundle or discount-only section and no coupon, sale or "% off" copy (`templates/no-discounts.ts`, `OFFER_COPY`). Product-card discount badges stay (bound to the product's own compare-at price).

## Quality bar (every template)

- **Mobile first, then desktop.** Checked at 390 and 1280 px (also 768, 1440) in Arabic and English through `/template-preview/<key>?edition=<niche>` on tallaby.com; no sideways overflow.
- **RTL-safe.** Logical properties only (start/end), no letter-spacing or uppercase on Arabic, every string `L(ar, en)`.
- **Photos:** white-background packshots for products, art-directed scenes with **no people, faces, hands, feet or other body parts, no mannequins, no logos, no lettering**, none shared with another template or pack. New photos come only from `docs/systems/editions-photos.md` (references/photos.md).
- **No fake facts.** No invented reviews or buyer quotes (a look builds its reviews section only when a pack supplies them, and packs must not), no ratings, order counts, years in business, certifications or services the seller may not offer. Copy rules: the `template-copywriter` skill.
- **Look-first home** (`docs/template-rules.md` §2a, `docs/systems/plan.md` §10): one hero first, categories second, then the trade's journey; a photo-led break between any two product sections; at most 9 sections; newsletter or a light section last; one product stage so every product photo shares a frame.
- One section the trade needs that others don't, from the library only; one orchestrated hero moment plus the library's reveals; nothing else moves.
- Load the `frontend-design:frontend-design` skill for any visual design work, and tell design subagents to.

## Never

- Write a coded `SectionDefinition` + React `Component` section, custom HTML/JS nodes or a template's own animation CSS (`CLAUDE.md` rules 9, 17).
- Change a store's own site, or a template's design "to update stores".
- Edit a look-guard fixture to make a test pass (fix the look), or bump a look's version when converting it.
- Use a new Pexels or other stock photo; overwrite a photo in `.editions-inbox/` or in `library-media`.
- Rename a library tree node's `props.field` (the field-names snapshot in `library-fields.test.ts` guards it).
- Change Tallaby Classic's design without the owner.

## Screenshots: after ANY visible change

A template's gallery card shows screenshots of its home page. **Whenever a change alters how a template looks** (copy, photos, layout, colours, fonts, its pack, or a library design it uses), re-shoot that template and commit the new shots and manifest in the same change:

```
pnpm --filter ecommerce dev        # tallaby.com on http://localhost:3000
PLAYWRIGHT_DIR=<path to playwright-core> node packages/store-sections/scripts/template-shots.mjs --keys <key>[,<key2>]
```

It shoots Arabic and English, desktop (1280 px, stored 600 px wide) and phone (400 px at 2x), writes `apps/ecommerce/public/template-previews/<key>.<locale>[.mobile].webp` and rewrites `templates/preview-shots.generated.ts` (never edit it by hand). `--list` prints the default keys; `--manifest-only` rebuilds the manifest. Look at the shots before committing. Details: references/workflow.md §6.

## References (read the one you need)

| File | Read it when |
|---|---|
| [references/niches.md](references/niches.md) | Mapping industries → niches → templates, statuses, adding a niche, matching a store to its niche |
| [references/design-system.md](references/design-system.md) | Choosing or checking a template's palette, fonts, radius, container, product stage, dark pages, motion; contrast rules |
| [references/photos.md](references/photos.md) | Ordering, checking, naming, uploading or wiring template photos |
| [references/workflow.md](references/workflow.md) | Converting a look, writing a pack, fixtures, registering, tests, screenshots, docs to update |
| `template-copywriter` skill | Writing or reviewing any template or section demo copy |

Detailed docs these summarise (they stay the deep references):

- `packages/store-sections/src/templates/editions/README.md`: the edition system, slot names, custom slots, the row rule, optional reviews.
- `docs/systems/one-template-per-niche.md`: the owner's niche decisions and the quality bar.
- `docs/systems/niche-editions-plan.md`: the original editions plan (2026-11-11; historical in parts).
- `docs/systems/editions-photos.md`: every photo prompt and the photo status per niche.
- `docs/template-rules.md` and `docs/section-rules.md`: home order, chrome, links, design language, motion, section checklist.
- `docs/superpowers/specs/2026-10-19-tree-sections-design.md` §6: the ten authoring rules for every design.
