# Storefront templates

Code-only since 2026-10-27 (`CLAUDE.md` rule 17): `CODE_TEMPLATES` in `catalog.ts` is the single source; there is no templates table. One template per niche (`editions/niche-templates.ts`); niche packs and edition-ready looks are explained in `editions/README.md`. Stores keep their own copies, so a change here never alters an existing store.

The full guide (direction, niches, design system, photos, workflow) is the `store-templates` skill (`.claude/skills/store-templates/`); demo copy follows the `template-copywriter` skill.

## Always update the card screenshots

**Any change that alters how a template looks** (its copy, photos, layout, colours, fonts, its niche pack, or a library design it uses) must re-shoot its gallery card screenshots in the same change:

```
pnpm --filter ecommerce dev
PLAYWRIGHT_DIR=<installed playwright-core> node packages/store-sections/scripts/template-shots.mjs --keys <key>
```

This writes `apps/ecommerce/public/template-previews/<key>.{ar,en}[.mobile].webp` (desktop and phone, both languages) and regenerates `preview-shots.generated.ts`. Check the images, then commit them with the change. Never edit `preview-shots.generated.ts` by hand.
