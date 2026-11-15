# Workflow: from a niche to a shipped template

The step-by-step detail for converting a look and writing a pack is `packages/store-sections/src/templates/editions/README.md`; follow it. This page is the order of work around it, with the checks. Commands run from `packages/store-sections` unless they say otherwise.

## 0. Before you start

- `git status`: another agent may be editing packs or looks. Never touch files you didn't change (`CLAUDE.md` rule 16).
- Read the template's file, its row in `NICHE_TEMPLATES`, the niche's section in `docs/systems/editions-photos.md`, and the look's fixture if it has one.
- Confirm the niche's essential photos exist (references/photos.md). No photos, no pack.
- Load `frontend-design:frontend-design` for any design change and `template-copywriter` for any copy.

## 1. Convert the look (only if it isn't edition-ready yet)

A look is edition-ready when its file uses `editionTemplate` (`editionReadyLooks()` in `editions/index.ts` lists them).

1. **Capture the fixture first**, with the look still unconverted:
   `LOOK_FIXTURE=<key> npx vitest run src/templates/editions/look-guard.test.ts`
   It writes `src/templates/editions/__fixtures__/<key>.v<version>.json` and never overwrites. Check the file is new in `git status`. Already edited the look? Stash, capture, restore.
2. Sort every string and photo into slots, store-derived values and generic labels; write `DEFAULT_CONTENT` character for character; wrap the sections in `look(c, journey)`; switch `libraryTemplate` to `editionTemplate` with `slots`, `optional`, `journey`, `defaultContent` (README §1).
3. **Do not bump the version** and keep key order inside every object: the default build must be byte-identical. When the guard fails it names the first difference as a JSON path. Fix the look, never the fixture.
4. Don't edit `editions/types.ts`, `apply.ts`, `validate.ts`, `niches.ts`, `match.ts` or `index.ts` while converting; missing slot groups go in custom slots (`custom.<kebab-key>`).

A deliberate redesign of a look (not a conversion) bumps its `version`, recaptures the fixture, and deletes the old fixture file in the same change (`look-guard.test.ts` header).

## 2. Write the pack

`packs/<industry>/<niche>.ts` exporting `const <NICHE>: Edition` (README §2; good recent examples: `packs/kitchen/cookware.ts`, `packs/home/furniture.ts`).

- `niche`, `looks: ["<its template>"]` (one template per niche), `priceBand` (EGP), `productStage`, `demo: demoStore({...})` (4–8 categories, 12–24 products, ≥ 3 per category, 4 per category if the look has category rows), `photos`, `copy` with every slot the look declares (3 announcement lines, 4 promises), and `custom` keys the look reads.
- Copy follows the `template-copywriter` skill. No `reviews` (no invented buyer quotes). Set the replaceable labels a look offers when its default names another trade or addresses only women (README §3, for example `custom.footer-offers` on `vella`).
- Header comment: the shop it describes, where its photos come from (generated, date, checked by eye), and what the look's home shows.

## 3. Register and flip the row

- Add the pack to `EDITIONS` in `editions/index.ts`.
- In `NICHE_TEMPLATES` (`editions/niche-templates.ts`) add `edition: "<niche>"` to the row and set `status: "ready"`. Keep the row on one line (the screenshot script parses it).

## 4. Tests

```
npx vitest run src/templates          # look guard, editions × looks, niche map, no-discounts, template rules
npx vitest run src/designs            # if a design changed: snapshots, EXPECTED ids, field names, container width
npx tsc --noEmit
```

Then the repo checks (`CLAUDE.md` rule 15): `pnpm --filter @workspace/store-sections test`, `pnpm typecheck`, `pnpm lint` (the dashboard has tests that read the gallery: `pnpm --filter dashboard test`). Update a snapshot only when the change is intended, and say so.

What the tests don't catch, so check it yourself: white packshot backgrounds, no people or logos, one ratio per slot, product order where a look shows the newest products (`fashion-luxe`'s look dots), copy quality, contrast (references/design-system.md).

## 5. Look at it

`pnpm --filter ecommerce dev`, then `http://localhost:3000/template-preview/<key>?edition=<niche>` (Arabic) and `/en/template-preview/<key>?edition=<niche>`, at 390 and 1280 px (also 768 and 1440). Check: no sideways overflow, hero copy readable on the photo on phones, every list full, no empty category row, no dead link, both languages. The `niche-template-qa` agent can do this pass.

## 6. Screenshots (required after any visible change)

Any change that alters how a template looks (copy, photos, layout, colours, fonts, its pack, or a library design it uses) needs fresh gallery card shots in the same change:

```
pnpm --filter ecommerce dev
PLAYWRIGHT_DIR=<installed playwright-core> node packages/store-sections/scripts/template-shots.mjs --keys <key>
```

- Playwright is not a repo dependency: install `playwright-core` outside the repo and point `PLAYWRIGHT_DIR` at it; `CHROME_PATH` picks the browser. `--base` changes the host (default `http://localhost:3000`).
- Output: `apps/ecommerce/public/template-previews/<key>.ar.webp`, `<key>.en.webp` (1280 px, stored 600 px wide) and `<key>.ar.mobile.webp`, `<key>.en.mobile.webp` (400 px at 2x, stored 600 px wide), plus a rewritten `packages/store-sections/src/templates/preview-shots.generated.ts`. Never edit the manifest by hand; `--manifest-only` rebuilds it from the files.
- Without `--keys` it shoots every `ready` row whose pack (or native template) uses `editionPhoto(`; `--list` prints them. Other templates' files are kept.
- Open the four images and check them before committing. Commit the WebP files and the manifest with the template change.
- The catalog picks the shots up by itself (`shotPreview` in `templates/preview.ts`); the dashboard and Admin load them from tallaby.com.

## 7. Docs to update in the same change

- `ROADMAP.md`: the F-90 entry, §6 checklist and a §7 log line (`CLAUDE.md` rule 19).
- `docs/systems/editions-photos.md`: the niche's status line only (the photo agent owns the rest).
- `docs/systems/one-template-per-niche.md` §2 counts if the number of packs or ready rows changed.
- This skill's numbers (`SKILL.md` "What exists", `references/niches.md`) when they change.

## 8. Commit

One commit per task on `main`, after review (`CLAUDE.md` rule 21); no push or deploy until the owner says so. Templates are code-only: no migration.
