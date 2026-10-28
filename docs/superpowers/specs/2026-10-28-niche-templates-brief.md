# Niche templates brief (owner, 2026-10-28)

Three homepage templates per store niche, 10 niches, 30 templates. They should look like premium 2026 Shopify themes: modern, attractive to new merchants browsing the gallery, and nothing like generic layouts. **Furniture is done and approved** (`templates/furniture-luxe`, `furniture-bold`, `furniture-warm`). It is the reference for every later niche. Copy its file shape, helpers and conventions exactly.

## Niches and status

| # | Niche | `category` (industry id) | Status |
|---|---|---|---|
| 1 | Furniture & home decor | `home` | done (sort 1200–1220) |
| 2 | Fashion & clothing | check `catalog.ts` | todo |
| 3 | Electronics & gadgets | | todo |
| 4 | Beauty & skincare | | todo |
| 5 | Perfumes | | todo |
| 6 | Jewelry & accessories | | todo |
| 7 | Kids & toys | | todo |
| 8 | Grocery & food | | todo |
| 9 | Sports & fitness | | todo |
| 10 | Gifts & handmade | | todo |

Keys are `<niche>-luxe`, `<niche>-bold` and `<niche>-warm`: one premium/minimal, one bold, one warm/editorial. Use the next free `sortOrder` block of 30 after the last niche (furniture used 1200, 1210 and 1220, so fashion uses 1230, 1240 and 1250, and so on). Take the industry id from the existing templates' `category` values in `catalog.ts`. Never invent a new one.

## Owner decisions (these override the original brief)

- **No discounts.** Do not use `promo-*` top bars or coupon or offer newsletters (`newsletter-coupon`, `newsletter-offer`). The top bar is `header-topbar` or a ticker inside the header. A `compareAtPrice` on some products is fine.
- **Video hero** is `hero-video`: muted autoplay, with the poster shown first.
- **No people or body parts in any photo.** That includes hands, models, faces, printed figures on packaging or art, and wall lettering or visible brand logos. This is hard for fashion, jewelry and beauty: use flat-lays, products on stands or hangers, still lifes and interiors.
- Stop after each niche for the owner's review unless the owner says otherwise.

## Fixed 12-slot home (do not add, remove or reorder)

1. Top bar, part of the header (`role: "announcement"`): 2–3 messages plus Track order.
2. Header: logo, menu, search, account, cart.
3. Hero: `hero-video`, `hero-carousel`, `hero-carousel-images`, `hero-fullbleed`, `hero-banner`, `hero-halves`, `hero-thumbs` (also `hero-split`, `hero-collage`, `hero-bento`, `hero-poster`).
4. Categories: 6–8 tiles (`categories-*`).
5. Products: featured or best sellers (`products-*`).
6. About: image and story (`about-*`, category `image-text`).
7–10. Four "products by category" rows: `categoryRows(lib, …)` from `_category-rows.ts` (places 1–4). Vary the card look and the muted rows across the three templates.
11. Newsletter (`newsletter-*`, not coupon or offer).
12. Footer (`footer-*`).

Within a niche, the three templates must not share a header, hero, categories or footer design. At least one template uses `hero-video` and at least one uses a hero carousel. `niche-templates.test.ts` enforces this. Add the niche to `NICHES` there.

## Design system per template

Each template sets its own theme the way furniture does: palette (primary, secondary, accent, background, surface, text, muted, border, sale, all WCAG AA, dark on light), an Arabic + Latin font pairing, corners (`corners` in `lib`), and container width (1280–1440). Do not hard-code colours or fonts inside designs.

## Demo data (no placeholders)

- An invented brand name in Arabic and English, a description, and a story with an Egyptian setting.
- 6–8 categories, each with a photo. The first 4 categories need **at least 8 products each** (furniture has about 40 products in total).
- Products: Arabic and English names, a price in EGP, `compareAtPrice` on some, `rating` from 4.2 to 5.0, `sold90`, a few `isFeatured`, at least one `inStock: false`. Each product's photo shows that exact product.
- All copy is natural Egyptian marketing Arabic plus natural English, not literal translations. Phone numbers use the `+20 1xx` format, emails use the brand's `.eg` domain, and addresses are in Cairo.
- Known limits (`TemplateDemo`): no product descriptions, variants or review counts, and header menus can't link categories. Don't fight these.

## Images

Use Pexels only, through `pexels(id, width)` (hero 1920, tiles and about 1200, products 800) and `pexelsVideo` / `pexelsVideoPoster`. Every URL must return HTTP 200, and every image must be checked by eye on a contact sheet. No image may appear twice within a template. Use a consistent look within each row. Search Pexels with WebFetch (curl gets a 403).

## QA per template

Render `/template-preview/<key>` (dashboard dev server; restart it after editing a template, because configs are cached) at 360 (CDP device emulation), 768, 1440 and 1920 px, in Arabic and in English. Check that everything aligns to the container, there is no horizontal overflow, there are no broken or mismatched images, each row shows its own category, and the result looks gallery-ready.

## Done means

`pnpm --filter @workspace/store-sections test` and `typecheck` pass. The browser QA is clean. `PLAN.md` §23 has a log entry in the same style as the furniture entry. Each niche lists its photos and video in the template's header comment.
