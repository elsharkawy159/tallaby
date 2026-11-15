# Design system: tokens, palettes, fonts, radius, stage, motion

A store's look is its **design system** (`designSystemSchema` in `packages/store-sections/src/config/schema.ts`, stored in `store_design_systems`). A template sets one; the seller restyles it from Website › Theme. Sections never hard-code colours or fonts: they use theme tokens, so a design system re-points everything at once (`docs/section-rules.md` §5.1, tree-sections rule 3).

## The schema

| Group | Keys | Notes |
|---|---|---|
| `colors` | `primary`, `secondary`, `background`, `foreground`, `muted`, `border`, `accent`, `destructive` | Hex only. `core/theme.ts` maps them to CSS variables: primary → `--sf-brand`, secondary → `--sf-shelf` (the soft surface), background → `--sf-paper`, foreground → `--sf-ink`, muted → `--sf-muted`, border → `--sf-line`, accent → `--sf-sun`. |
| `typography` | `headingFont`, `bodyFont` (also `arabicFont`, `baseFontSize`, `scaleRatio`) | Only a font in `STORE_FONTS` (`core/fonts.ts`) renders; any other name is ignored. |
| `spacing` | `borderRadius` (0–64), `containerMaxWidth` (320–2560), `sectionPaddingY`, `productStage` | `productStage` lives under `spacing` because that is a stored column; a new top-level key is dropped on save until it gets a column (what happened to `motion`, 0162). |
| `motion` | `reveal`, `hoverZoom`, `default`, `speed`, `intensity` (`subtle`/`normal`/`expressive`) | Theme › Motion. Unset = on, automatic, normal. |

Classic's defaults (`CLASSIC_TOKENS` in `core/theme.ts`) apply when a value is unset, so a store with no design system looks like Tallaby Classic.

## How a template sets it

`libraryTemplate({...})` and `editionTemplate({...})` (`templates/library-template.ts`, `templates/editions/apply.ts`) take:

- `palette`: four swatches shown on the gallery card (not used for rendering).
- `colors`: the design system colours above.
- `fonts: { heading, body }`: two `STORE_FONTS` names.
- `radius`: one corner radius for the whole template; it is also the library designs' `corners` (`fromLibrary(..., { corners: spec.radius })`) and picks the product page surface (`0` → flat, else card).
- `containerMaxWidth` (default 1440), `productStage`, `style` (one or more of `luxe`, `bold`, `warm`, `minimal`, `playful`, `classic`: `TEMPLATE_STYLES` in `templates/traits.ts`, read by the AI builder), and `dark: true` for a dark page (a pack can then give `photos.dark`).

Tone (light or dark) and how many cards and tiles the home needs are computed, not hand-written (`templateTraits` in `traits.ts`).

Example (`templates/fashion-luxe/index.ts`, Hareer): white paper, `#161616` ink as primary, taupe accent `#a08c72`, Reem Kufi over Noto Sans Arabic, radius 0, container 1400, stage `1:1 cover`.

## Fonts and pairing

Every `STORE_FONTS` face covers **both Arabic and Latin**, so one pair serves both store languages. The 18 faces: Readex Pro (Classic, the storefront default), Cairo, Tajawal, Almarai, IBM Plex Sans Arabic, Noto Kufi Arabic, El Messiri, Amiri, Rubik, Noto Sans Arabic, Alexandria, Changa, Noto Naskh Arabic, Lalezar, Aref Ruqaa, Reem Kufi, Baloo Bhaijaan 2, Lemonada. A new face means loading it in `apps/ecommerce` (`storefront-font.ts`) and the dashboard preview first; don't name a font that isn't in the list.

- Pair a characterful heading (Reem Kufi, El Messiri, Amiri, Lalezar, Changa, Aref Ruqaa) with a calm, readable body (Noto Sans Arabic, IBM Plex Sans Arabic, Cairo, Tajawal, Readex Pro). Display faces (Lalezar, Aref Ruqaa, Lemonada, Baloo Bhaijaan 2) are for headings only, never body text.
- The seller's quick pairings are `FONT_PAIRINGS` in `core/fonts.ts`; a template may use any two faces.
- No uppercase and no letter-spacing on Arabic (it breaks the joined letters); English eyebrows may be spaced, Arabic stays plain (`docs/section-rules.md` §5.2).
- Within one industry, no two niche templates share the same palette and type pair (`docs/systems/one-template-per-niche.md` §3). Avoid the defaults the owner called out: warm-cream-and-terracotta, acid-lime-on-black, all-caps eyebrows over every heading.

## Contrast rules

- Text needs **4.5:1** against its background (3:1 for large headings), `docs/section-rules.md` §8. No test checks template colours, so check by hand with `contrastRatio(a, b)` from `core/palette.ts` (or `colorContrastRatio` in `templates/traits.ts`).
- **`primary` is also a text colour.** Designs use it for links, prices, eyebrows and headings on the background, and the schema has no separate "primary text" key. So a light brand colour (yellow, pastel, light gold) **cannot** be `primary`: put it in `accent` or `secondary` and keep a dark `primary`, or darken it until it passes 4.5:1 on `background`. The AI builder does the same automatically (`derivePaletteFromPrimary` nudges primary's lightness and notes `primary_darkened_for_text`).
- Text on the brand colour (buttons, the announcement bar) is chosen for you: `designSystemToTokens` sets `--sf-brand-ink` to Classic's dark ink on a light primary and white on a dark one (`isLightHex`). Don't fight it with hard-coded white text.
- `muted` text must also pass 4.5:1 on both `background` and `secondary` (it sits on shelf bands).
- White text is allowed only on a photo, with the design's own scrim.
- Dark pages: keep `foreground`/`muted` light enough on the dark `background`, and never two `dark` section schemes in a row.

## Product stage

`spacing.productStage = { ratio: "1:1" | "4:5" | "3:4", fit: "contain" | "cover", background, padding }` gives every product photo in product lists one frame (`docs/systems/plan.md` §4.5). Packs set it per niche (`Edition.productStage`): white packshots usually `1:1 contain` on `#ffffff` so each piece shows whole; clothing flat lays may use `4:5`. One ratio per photo slot across a template.

## Radius and layout

- One radius per template (0 for editorial and luxury looks, larger for soft or playful ones), applied through tokens and `corners`; no per-section radius overrides unless the design is decoration.
- Only the full-width hero is edge to edge; every other section stays in the container (`designs/container-width.test.ts`, owner 2026-10-28).
- Spacing comes from the section padding token and parent `gap`, never child margins (`docs/section-rules.md` §5.2–5.3).

## Motion

Calm, on by default, the same platform runtime everywhere (`docs/section-rules.md` §6; tokens: 700 ms reveal, 24 px rise, 80 ms stagger, image zoom 1.06 → 1). For templates:

- Each home section except the hero reveals once on scroll; the hero heading is never hidden.
- One orchestrated moment per template (for example a hero photo that drifts as the page scrolls, `kasr`), set on nodes, plus the library's reveals. Nothing else moves; no marquee, parallax or wipe unless the design provides it.
- Never add animation CSS or a library (GSAP is blocked by ESLint); leave sections on "Same as site" unless one must not move.
- With reduced motion nothing moves and all content stays visible.
- Motion v2 plan: `docs/motion-v2-plan.md`.
