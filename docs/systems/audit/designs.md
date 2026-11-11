# Design inventory (generated 2026-11-11)

Generated for [`../plan.md`](../plan.md) from `DESIGNS` and `CODE_TEMPLATES` on branch `feat/motion-v2` (`62bb38b4`). One row per library design.

- **Layout** is a first guess read from the tree. The manifest replaces it in Phase 1.
- **Photos** counts photo slots outside data lists, with their ratios.
- **Grids** are columns on desktop / tablet / phone.
- **Interactive** misses tabs and swipe rails, which are list settings and not their own element. The Phase 1 fingerprint reads them.
- **Templates** is how many of the 119 templates use the design on any page or in the header or footer.
- Migration 0109 dropped the `library_sections` table, so there is no database copy to compare with the code.

## headers (15)

| Design | v | Subcategory | Nodes | Layout | Photos | Grids | Data | Interactive | Motion v2 | Templates |
|---|---|---|---|---|---|---|---|---|---|---|
| `header-classic` | 1 | commerce | 29 | centered | 0 | – | – | – | – | 0 |
| `header-line` | 1 | minimal | 40 | centered | 0 | – | – | – | – | 14 |
| `header-centered` | 1 | centered-logo | 39 | grid | 0 | 3/-/3 | – | – | – | 9 |
| `header-announcement` | 1 | announcement | 40 | centered | 0 | – | – | – | – | 17 |
| `header-search` | 1 | mega-menu | 33 | centered | 0 | – | – | – | – | 10 |
| `header-pill` | 1 | floating | 18 | centered | 0 | – | – | – | – | 16 |
| `header-ruled` | 1 | centered-logo | 24 | grid | 0 | 3/-/3 | – | – | – | 9 |
| `header-chips` | 1 | mega-menu | 21 | data-grid | 0 | 8/4/2 | categoryList:- | – | – | 10 |
| `header-brand-bar` | 1 | commerce | 17 | centered | 0 | – | – | – | – | 10 |
| `header-departments` | 1 | mega-menu | 42 | grid | 0 | 3/-/2 | – | – | – | 1 |
| `header-centered-ticker` | 1 | centered-logo | 38 | grid | 0 | 3/3/3 | – | marquee | – | 10 |
| `header-inline` | 1 | minimal | 27 | centered | 0 | – | – | – | – | 0 |
| `header-topbar` | 1 | announcement | 43 | centered | 0 | – | – | – | – | 9 |
| `header-icons` | 1 | commerce | 29 | centered | 0 | – | – | – | – | 1 |
| `header-announcement-strip` | 1 | announcement | 33 | centered | 0 | – | – | – | – | 2 |

## hero (18)

| Design | v | Subcategory | Nodes | Layout | Photos | Grids | Data | Interactive | Motion v2 | Templates |
|---|---|---|---|---|---|---|---|---|---|---|
| `hero-carousel` | 1 | full-width | 29 | slider | 3 (banner×3) | – | – | carousel | – | 21 |
| `hero-carousel-images` | 1 | full-width | 8 | slider | 3 (banner×3) | – | – | carousel | – | 0 |
| `hero-carousel-panel` | 1 | full-width | 35 | slider | 3 (banner×3) | – | – | carousel | – | 1 |
| `hero-classic` | 1 | split | 13 | overlap | 1 (portrait×1) | 2/-/1 | – | – | – | 1 |
| `hero-ticket` | 1 | full-width | 21 | overlap | 3 (landscape×3) | 3/-/1 | – | – | – | 4 |
| `hero-poster` | 1 | sale | 16 | overlap | 1 (wide×1) | 3/-/1 | – | – | – | 8 |
| `hero-inline` | 1 | editorial | 24 | split | 2 (wide×2) | 2/-/1 | – | – | – | 1 |
| `hero-product` | 1 | product | 34 | overlap | 1 (square×1) | 2/-/1, 3/-/3 | – | – | – | 1 |
| `hero-collage` | 1 | editorial | 25 | grid | 3 (landscape×1, portrait×1, square×1) | 3/-/1 | – | – | – | 2 |
| `hero-bento` | 1 | editorial | 33 | data-grid | 1 (portrait×1) | 4/-/2, 1/-/2, 1/-/- | productList:featured | – | – | 7 |
| `hero-halves` | 2 | split | 17 | split | 1 (square×1) | 2/-/1 | – | – | – | 22 |
| `hero-big-word` | 2 | product | 18 | data-grid | 0 | 1/-/- | productList:featured | – | – | 6 |
| `hero-search` | 2 | full-width | 9 | centered | 0 | – | – | – | – | 7 |
| `hero-fullbleed` | 2 | full-width | 12 | overlap | 1 (banner×1) | – | – | – | scrollEffect:parallax, reveal:words, section:fade-exit | 11 |
| `hero-video` | 1 | full-width | 13 | centered | 0 | – | – | video | – | 11 |
| `hero-split` | 2 | split | 12 | split | 1 (square×1) | 2/2/1 | – | – | – | 10 |
| `hero-thumbs` | 1 | full-width | 38 | slider | 3 (banner×3) | – | – | carousel | – | 3 |
| `hero-banner` | 1 | full-width | 21 | overlap | 1 (banner×1) | – | – | countdown | – | 2 |

## categories (17)

| Design | v | Subcategory | Nodes | Layout | Photos | Grids | Data | Interactive | Motion v2 | Templates |
|---|---|---|---|---|---|---|---|---|---|---|
| `categories-classic` | 1 | circles | 28 | grid | 6 (square×6) | 6/4/3 | – | – | – | 0 |
| `categories-tiles` | 1 | grid | 31 | grid | 4 (square×4) | 4/-/2 | – | – | – | 7 |
| `categories-stories` | 1 | circles | 39 | overlap | 8 (square×8) | 8/6/4 | – | – | – | 9 |
| `categories-rail` | 1 | editorial | 29 | overlap | 3 (portrait×3) | 4/2/1 | – | – | – | 0 |
| `categories-bento` | 1 | collections | 39 | overlap | 5 (square×5) | 2/-/1, 2/-/2 | – | – | – | 1 |
| `categories-index` | 1 | editorial | 43 | split | 1 (portrait×1) | 2/-/1 | – | – | – | 0 |
| `categories-ruled` | 1 | grid | 17 | data-grid | 0 | 4/-/2 | categoryList:- | – | – | 15 |
| `categories-chips` | 3 | circles | 10 | data-grid | 0 | 4/3/2 | categoryList:- | – | – | 20 |
| `categories-feature-list` | 1 | collections | 29 | data-grid | 0 | 2/-/1, 1/-/-, 1/-/- | categoryList:-, categoryList:- | – | – | 8 |
| `categories-big-type` | 1 | editorial | 11 | data-grid | 0 | 1/-/- | categoryList:- | – | – | 8 |
| `categories-showcase` | 1 | grid | 34 | overlap | 4 (portrait×4) | 4/2/2 | – | – | – | 0 |
| `categories-photo-tiles` | 1 | grid | 10 | data-grid | 0 | 5/3/2 | categoryList:- | – | – | 17 |
| `categories-circles` | 1 | circles | 11 | data-grid | 0 | 6/6/3 | categoryList:- | – | – | 15 |
| `categories-captioned` | 1 | grid | 20 | data-grid | 0 | 5/3/2 | categoryList:- | – | – | 15 |
| `categories-panels` | 1 | collections | 27 | bento | 4 (square×4) | 5/1/1, 2/-/2, 2/-/2, 2/-/2, 2/-/2 | – | – | – | 1 |
| `categories-counts` | 1 | circles | 11 | data-grid | 0 | 6/3/3 | categoryList:- | – | – | 1 |
| `categories-portrait-labels` | 1 | collections | 12 | data-grid | 0 | 4/3/2 | categoryList:- | – | – | 2 |

## products (20)

| Design | v | Subcategory | Nodes | Layout | Photos | Grids | Data | Interactive | Motion v2 | Templates |
|---|---|---|---|---|---|---|---|---|---|---|
| `products-classic` | 1 | new-arrivals | 23 | data-grid | 0 | 4/3/2 | productList:newest | – | – | 1 |
| `products-grid` | 2 | featured | 23 | data-grid | 0 | 4/3/2 | productList:newest | – | reveal:none, reveal:words | 23 |
| `products-rail` | 1 | best-sellers | 23 | data-grid | 0 | 4/3/2 | productList:best-sellers | – | – | 15 |
| `products-feature` | 1 | featured | 30 | data-grid | 0 | 2/-/1, 1/-/-, 2/-/2 | productList:featured, productList:newest | – | – | 13 |
| `products-shelf` | 1 | shelf | 26 | data-grid | 0 | 3/-/2 | productList:newest | – | – | 16 |
| `products-list` | 1 | list | 24 | pinned | 0 | 3/-/1, 2/-/1 | productList:newest | – | – | 5 |
| `products-tabbed` | 1 | new-arrivals | 32 | data-grid | 0 | 4/3/2 | productList:newest | – | – | 10 |
| `products-bento` | 1 | best-sellers | 36 | data-grid | 0 | 4/-/1, 1/-/-, 2/-/2 | productList:best-sellers, productList:best-sellers | – | – | 14 |
| `products-rows` | 1 | list | 22 | data-grid | 0 | 2/-/1 | productList:all | – | – | 11 |
| `products-panel-rail` | 1 | shelf | 26 | data-grid | 0 | 4/-/1, 3/-/2 | productList:featured | – | – | 6 |
| `products-tabs-grid` | 1 | new-arrivals | 31 | data-grid | 0 | 4/3/2 | productList:newest | – | – | 1 |
| `products-carousel` | 1 | best-sellers | 24 | data-grid | 0 | 4/2/2 | productList:best-sellers | – | – | 9 |
| `products-category-carousel` | 1 | by-category | 24 | data-grid | 0 | 1/-/-, 4/3/2 | categoryList:-, productList:category | – | – | 30 |
| `products-spotlight` | 1 | featured | 32 | data-grid | 1 (portrait×1) | 3/1/1, 3/3/2 | productList:newest | – | – | 2 |
| `products-minimal` | 1 | best-sellers | 34 | data-grid | 0 | 5/3/2 | productList:best-sellers | – | – | 1 |
| `products-boxed` | 1 | best-sellers | 27 | data-grid | 0 | 4/3/2 | productList:best-sellers | – | – | 1 |
| `products-campaign` | 1 | featured | 26 | data-grid | 1 (landscape×1) | 5/2/1, 1/-/- | productList:best-sellers | – | – | 1 |
| `products-deal` | 1 | featured | 20 | data-grid | 0 | 1/1/1, 2/2/1 | productList:discounted | countdown | – | 0 |
| `products-category-tabs` | 1 | new-arrivals | 25 | data-grid | 0 | 3/-/3, 5/3/2 | categoryList:-, productList:newest | – | – | 1 |
| `products-centered-row` | 1 | best-sellers | 22 | data-grid | 0 | 6/3/2 | productList:best-sellers | – | – | 1 |

## bundles (11)

| Design | v | Subcategory | Nodes | Layout | Photos | Grids | Data | Interactive | Motion v2 | Templates |
|---|---|---|---|---|---|---|---|---|---|---|
| `bundle-plus` | 1 | fixed | 29 | data-grid | 0 | 4/-/1, 3/-/3 | productList:newest | – | – | 0 |
| `bundle-builder` | 1 | build | 75 | pinned | 0 | 3/-/1, 3/-/3, 3/-/3, 3/-/3 | productList:newest, productList:newest, productList:newest | – | – | 0 |
| `bundle-poster` | 1 | fixed | 29 | data-grid | 0 | 2/-/1, 1/-/-, 1/-/-, 2/-/2 | productList:newest, productList:newest, productList:newest | – | – | 0 |
| `bundle-tabs` | 1 | several | 35 | data-grid | 0 | 4/-/1, 3/-/3 | productList:newest | – | – | 0 |
| `bundle-list` | 1 | several | 66 | data-grid | 0 | 3/-/3, 3/-/3, 3/-/3, 3/-/3 | productList:newest, productList:newest, productList:newest, productList:newest | – | – | 0 |
| `bundle-box` | 1 | gift | 32 | data-grid | 0 | 2/-/1, 2/-/2, 1/-/- | productList:newest, productList:newest | – | – | 0 |
| `bundle-quantity` | 1 | quantity | 35 | data-grid | 0 | 1/-/-, 2/-/1 | productList:newest | – | – | 0 |
| `bundle-rail` | 1 | several | 41 | data-grid | 0 | 4/-/2, 2/-/2, 2/-/2, 2/-/2, 2/-/2 | productList:newest, productList:newest, productList:newest, productList:newest | – | – | 0 |
| `bundle-price-drop` | 1 | fixed | 14 | data-grid | 0 | 3/-/1 | productList:newest | – | – | 0 |
| `bundle-gifts` | 1 | gift | 37 | overlap | 4 (portrait×4) | 4/-/2 | – | – | – | 0 |
| `bundle-together` | 1 | fixed | 19 | data-grid | 0 | 2/-/1, 3/-/-, 1/-/- | productList:newest, productList:newest | – | – | 0 |

## finder (11)

| Design | v | Subcategory | Nodes | Layout | Photos | Grids | Data | Interactive | Motion v2 | Templates |
|---|---|---|---|---|---|---|---|---|---|---|
| `finder-use` | 1 | guided | 41 | data-grid | 0 | 4/-/2, 4/-/2 | productList:best-sellers | – | – | 4 |
| `finder-budget` | 1 | budget | 30 | data-grid | 0 | 2/-/1, 4/-/2 | productList:all | – | – | 3 |
| `finder-quiz` | 1 | guided | 30 | stack | 0 | 2/-/1 | – | – | – | 0 |
| `finder-versus` | 1 | compare | 58 | data-grid | 0 | 1/-/-, 1/-/-, 3/-/-, 3/-/-, 3/-/-, 3/-/- | productList:best-sellers, productList:best-sellers | – | – | 1 |
| `finder-matrix` | 1 | compare | 91 | data-grid | 0 | 5/-/-, 4/-/-, 5/-/-, 5/-/-, 5/-/-, 5/-/-, 5/-/- | productList:best-sellers | – | – | 0 |
| `finder-price-bands` | 1 | budget | 39 | grid | 0 | 3/-/1 | – | – | – | 4 |
| `finder-sentence` | 1 | guided | 44 | centered | 0 | – | – | – | – | 0 |
| `finder-pick` | 1 | picks | 54 | data-grid | 0 | 3/-/1, 1/-/-, 2/-/1, 1/-/2, 1/-/-, 1/-/- | productList:best-sellers, productList:best-sellers, productList:best-sellers | – | – | 3 |
| `finder-features` | 1 | guided | 37 | data-grid | 0 | 2/-/1, 1/-/- | productList:best-sellers | – | – | 0 |
| `finder-this-or-that` | 1 | guided | 17 | stack | 2 (portrait×2) | – | – | – | – | 0 |
| `finder-guides` | 1 | guides | 28 | data-grid | 0 | 2/-/1, 1/-/-, 1/-/- | postList:-, postList:- | – | – | 0 |

## promotions (14)

| Design | v | Subcategory | Nodes | Layout | Photos | Grids | Data | Interactive | Motion v2 | Templates |
|---|---|---|---|---|---|---|---|---|---|---|
| `promo-pair` | 1 | split | 15 | split | 2 (square×2) | 2/-/1, 2/-/2, 2/-/2 | – | – | – | 0 |
| `promo-ticker` | 1 | full-width | 14 | centered | 0 | – | – | – | – | 0 |
| `promo-deal` | 1 | countdown | 19 | grid | 1 (square×1) | 3/-/1 | – | – | – | 0 |
| `promo-coupon` | 1 | coupon | 12 | grid | 0 | 3/-/1 | – | – | – | 0 |
| `promo-bento` | 1 | tiles | 35 | overlap | 3 (portrait×1, wide×2) | 2/-/1 | – | – | – | 0 |
| `promo-twin` | 1 | split | 25 | split | 2 (square×2) | 2/-/1, 2/-/2, 2/-/2 | – | – | – | 0 |
| `promo-shipping` | 1 | full-width | 11 | centered | 0 | – | – | – | – | 0 |
| `promo-percent` | 1 | full-width | 15 | centered | 0 | – | – | – | – | 0 |
| `promo-tiers` | 1 | tiles | 28 | grid | 0 | 3/-/1 | – | – | – | 0 |
| `promo-sticker` | 1 | countdown | 20 | data-grid | 0 | 1/-/-, 2/-/1 | productList:discounted | – | – | 0 |
| `promo-banner-fullbleed` | 3 | full-width | 10 | overlap | 1 (banner×1) | – | – | – | scrollEffect:parallax | 0 |
| `promo-campaign-tiles` | 1 | tiles | 21 | overlap | 2 (landscape×2) | 2/2/1 | – | – | – | 0 |
| `promo-marquee` | 2 | full-width | 11 | centered | 0 | – | – | marquee | – | 0 |
| `promo-countdown` | 1 | countdown | 12 | overlap | 1 (banner×1) | – | – | countdown | – | 0 |

## features (12)

| Design | v | Subcategory | Nodes | Layout | Photos | Grids | Data | Interactive | Motion v2 | Templates |
|---|---|---|---|---|---|---|---|---|---|---|
| `features-classic` | 1 | benefits-bar | 31 | grid | 0 | 4/2/2 | – | – | – | 2 |
| `features-icon-cards` | 1 | icon-grid | 30 | grid | 0 | 4/2/1 | – | – | – | 8 |
| `features-checklist` | 1 | image-features | 26 | split | 1 (portrait×1) | 2/-/1 | – | – | – | 1 |
| `features-steps` | 1 | steps | 25 | grid | 0 | 4/2/1 | – | – | – | 2 |
| `features-ruled` | 1 | steps | 19 | grid | 0 | 4/-/2 | – | – | – | 5 |
| `features-bento` | 1 | icon-grid | 27 | grid | 0 | 3/-/1 | – | – | – | 2 |
| `features-side-title` | 1 | icon-grid | 31 | pinned | 0 | 3/-/1, 2/-/1 | – | – | – | 3 |
| `features-ticker` | 1 | benefits-bar | 18 | centered | 0 | – | – | – | – | 2 |
| `features-compare` | 1 | icon-grid | 51 | centered | 0 | – | – | – | – | 4 |
| `features-orbit` | 1 | image-features | 28 | grid | 1 (square×1) | 3/-/2 | – | – | – | 1 |
| `features-trust-band` | 1 | benefits-bar | 27 | grid | 0 | 4/2/2 | – | – | – | 0 |
| `features-columns` | 1 | icon-grid | 20 | grid | 0 | 3/-/1 | – | – | – | 1 |

## payment (11)

| Design | v | Subcategory | Nodes | Layout | Photos | Grids | Data | Interactive | Motion v2 | Templates |
|---|---|---|---|---|---|---|---|---|---|---|
| `pay-methods` | 1 | methods | 31 | grid | 0 | 4/-/2 | – | – | – | 1 |
| `pay-installments` | 1 | installments | 37 | data-grid | 0 | 1/-/-, 2/-/1, 4/-/4 | productList:newest | – | – | 7 |
| `pay-zones` | 1 | delivery | 37 | grid | 0 | 2/-/1, 3/-/3, 3/-/3, 3/-/3, 3/-/3, 3/-/3, 3/-/3 | – | – | – | 5 |
| `pay-promise` | 1 | delivery | 23 | grid | 0 | 2/-/1, 3/-/3 | – | – | – | 2 |
| `pay-open-box` | 1 | cash | 23 | grid | 0 | 3/-/1 | – | – | – | 5 |
| `pay-pickup` | 1 | delivery | 39 | stack | 0 | 2/-/1, 2/-/2 | – | – | – | 0 |
| `pay-secure` | 1 | methods | 16 | centered | 0 | – | – | – | – | 0 |
| `pay-installment-table` | 1 | installments | 53 | grid | 0 | 5/-/5, 5/-/5, 5/-/5, 5/-/5 | – | – | – | 0 |
| `pay-days` | 1 | delivery | 21 | grid | 0 | 3/-/1 | – | – | – | 2 |
| `pay-receipt` | 1 | cash | 25 | stack | 0 | 2/-/1 | – | – | – | 0 |
| `pay-faq` | 1 | methods | 17 | centered | 0 | – | – | accordion | – | 0 |

## statistics (10)

| Design | v | Subcategory | Nodes | Layout | Photos | Grids | Data | Interactive | Motion v2 | Templates |
|---|---|---|---|---|---|---|---|---|---|---|
| `stats-classic` | 1 | counters | 15 | grid | 0 | 4/-/2 | – | – | – | 1 |
| `stats-big-numbers` | 1 | counters | 16 | grid | 0 | 5/3/2 | – | – | – | 2 |
| `stats-photo` | 1 | stats-content | 20 | split | 1 (portrait×1) | 2/-/1, 2/-/2 | – | – | – | 0 |
| `stats-progress` | 1 | stats-content | 26 | stack | 0 | 2/-/1 | – | – | – | 0 |
| `stats-strip` | 1 | trust-badges | 15 | grid | 0 | 4/-/2 | – | – | – | 0 |
| `stats-ruled` | 1 | stats-content | 21 | stack | 0 | 2/-/1, 2/-/2 | – | – | – | 0 |
| `stats-band` | 2 | trust-badges | 18 | centered | 0 | – | – | – | countUp:true | 3 |
| `stats-sentence` | 1 | stats-content | 11 | centered | 0 | – | – | – | – | 2 |
| `stats-rating` | 1 | counters | 48 | grid | 0 | 3/-/1 | – | – | – | 0 |
| `stats-milestones` | 1 | stats-content | 26 | grid | 0 | 4/-/1 | – | – | – | 1 |

## image-text (15)

| Design | v | Subcategory | Nodes | Layout | Photos | Grids | Data | Interactive | Motion v2 | Templates |
|---|---|---|---|---|---|---|---|---|---|---|
| `about-classic` | 1 | story | 10 | split | 1 (landscape×1) | 2/-/1 | – | – | – | 118 |
| `about-panel` | 1 | values | 8 | stack | 0 | 2/-/1 | – | – | – | 1 |
| `about-overlap` | 1 | story | 10 | overlap | 1 (wide×1) | – | – | – | – | 5 |
| `about-rows` | 1 | rows | 21 | bento | 3 (landscape×3) | 2/-/1, 2/-/1, 2/-/1 | – | – | – | 1 |
| `about-values` | 1 | values | 24 | grid | 0 | 3/-/1 | – | – | – | 0 |
| `about-list` | 1 | story | 27 | split | 1 (portrait×1) | 2/-/1 | – | – | – | 4 |
| `about-wide` | 1 | story | 9 | stack | 1 (wide×1) | – | – | – | – | 5 |
| `about-inset` | 1 | story | 13 | split | 1 (portrait×1) | 2/-/1 | – | – | – | 7 |
| `about-stories` | 1 | rows | 30 | grid | 3 (landscape×3) | 3/-/1 | – | – | – | 4 |
| `about-circle` | 1 | values | 14 | split | 1 (square×1) | 2/-/1 | – | – | – | 3 |
| `about-fullbleed` | 2 | story | 9 | split | 1 (square×1) | 2/2/1 | – | – | – | 5 |
| `about-split-story` | 2 | story | 12 | split | 1 (portrait×1) | 2/2/1 | – | – | reveal:none, reveal:wipe-start, scrollEffect:zoom | 7 |
| `about-before-after` | 1 | story | 16 | overlap | 2 (story×2) | 2/2/1, 2/2/2 | – | – | – | 0 |
| `about-shop-look` | 1 | story | 30 | data-grid | 1 (portrait×1) | 2/2/1, 1/1/1 | productList:featured | – | – | 0 |
| `image-text-steps` | 1 | story | 28 | overlap | 6 (square×6) | 2/2/1 | – | – | reveal:none, reveal:words | 0 |

## video (10)

| Design | v | Subcategory | Nodes | Layout | Photos | Grids | Data | Interactive | Motion v2 | Templates |
|---|---|---|---|---|---|---|---|---|---|---|
| `video-wide` | 2 | wide | 10 | centered | 0 | – | – | video | – | 0 |
| `video-split` | 2 | with-text | 19 | stack | 0 | 2/-/1 | – | video | – | 0 |
| `video-cinema` | 2 | cinematic | 7 | centered | 0 | – | – | video | – | 0 |
| `video-playlist` | 3 | playlist | 9 | centered | 0 | – | – | videoPlaylist | – | 0 |
| `video-reels` | 2 | reels | 25 | grid | 0 | 5/3/2 | – | video | – | 0 |
| `video-vertical` | 1 | reels | 24 | stack | 0 | 2/-/1 | – | video | – | 0 |
| `video-grid` | 1 | playlist | 22 | grid | 0 | 3/-/1 | – | video | – | 0 |
| `video-chapters` | 1 | cinematic | 26 | grid | 0 | 3/-/1 | – | video | – | 0 |
| `video-film` | 1 | with-text | 12 | stack | 0 | 2/-/1 | – | video | – | 0 |
| `video-shop` | 1 | wide | 21 | data-grid | 0 | 4/2/1 | productList:featured | video | – | 2 |

## gallery (11)

| Design | v | Subcategory | Nodes | Layout | Photos | Grids | Data | Interactive | Motion v2 | Templates |
|---|---|---|---|---|---|---|---|---|---|---|
| `gallery-feed` | 1 | instagram | 27 | grid | 8 (square×8) | 4/-/2 | – | – | – | 0 |
| `gallery-mosaic` | 1 | lookbook | 15 | grid | 4 (wide×1, square×3) | 3/-/2 | – | – | – | 0 |
| `gallery-polaroids` | 1 | customer-photos | 21 | grid | 5 (square×5) | 5/3/2 | – | – | – | 2 |
| `gallery-shoppable` | 1 | lookbook | 29 | data-grid | 1 (portrait×1) | 2/-/1, 1/-/- | productList:featured | – | – | 0 |
| `gallery-strip` | 2 | strip | 13 | overlap | 6 (portrait×6) | 6/-/3 | – | – | – | 0 |
| `gallery-captioned` | 1 | lookbook | 39 | grid | 6 (portrait×6) | 3/-/2 | – | – | – | 1 |
| `gallery-slider` | 1 | lookbook | 10 | grid | 7 (wide×1, landscape×6) | 6/-/3 | – | – | – | 0 |
| `gallery-prints` | 1 | customer-photos | 19 | grid | 5 (square×5) | 5/-/2 | – | – | – | 0 |
| `gallery-bento` | 1 | instagram | 22 | bento | 5 (square×5) | 5/-/2, 2/-/2 | – | – | – | 2 |
| `gallery-side` | 1 | instagram | 26 | bento | 6 (square×6) | 3/-/1, 3/-/3 | – | – | – | 1 |
| `gallery-social-strip` | 2 | instagram | 24 | grid | 6 (square×6) | 6/3/3 | – | – | – | 1 |

## brands (10)

| Design | v | Subcategory | Nodes | Layout | Photos | Grids | Data | Interactive | Motion v2 | Templates |
|---|---|---|---|---|---|---|---|---|---|---|
| `brands-row` | 1 | logo-grid | 10 | grid | 0 | 6/-/3 | – | – | – | 0 |
| `brands-wall` | 1 | logo-carousel | 15 | grid | 0 | 4/-/2, 4/-/2 | – | – | – | 0 |
| `brands-tiles` | 1 | brand-cards | 42 | grid | 0 | 4/-/2 | – | – | – | 1 |
| `brands-press` | 1 | press | 13 | grid | 0 | 3/-/1 | – | – | – | 0 |
| `brands-featured` | 1 | brand-cards | 14 | bento | 3 (portrait×3) | 3/-/1, 3/-/3 | – | – | – | 0 |
| `brands-ruled` | 1 | logo-grid | 25 | grid | 0 | 4/-/2 | – | – | – | 0 |
| `brands-cards` | 1 | brand-cards | 49 | grid | 0 | 4/-/2 | – | – | – | 2 |
| `brands-az` | 1 | logo-grid | 57 | grid | 0 | 4/-/2 | – | – | – | 0 |
| `brands-quotes` | 1 | press | 12 | centered | 0 | – | – | – | – | 2 |
| `brands-bubbles` | 1 | logo-carousel | 25 | centered | 0 | – | – | – | – | 2 |

## testimonials (14)

| Design | v | Subcategory | Nodes | Layout | Photos | Grids | Data | Interactive | Motion v2 | Templates |
|---|---|---|---|---|---|---|---|---|---|---|
| `testimonials-classic` | 2 | review-grid | 50 | grid | 0 | 3/-/1 | – | – | reveal:none, reveal:words | 7 |
| `testimonials-spotlight` | 1 | quote | 26 | centered | 0 | – | – | – | – | 1 |
| `testimonials-rating` | 1 | rating-summary | 74 | grid | 0 | 3/-/1 | – | – | – | 1 |
| `testimonials-wall` | 1 | review-grid | 100 | grid | 0 | 3/-/1 | – | – | – | 15 |
| `testimonials-photos` | 1 | carousel | 73 | overlap | 4 (square×4) | 4/2/1 | – | – | – | 2 |
| `testimonials-ruled` | 1 | review-grid | 51 | grid | 0 | 3/-/1 | – | – | – | 10 |
| `testimonials-chat` | 1 | review-grid | 28 | stack | 0 | 2/-/1 | – | – | – | 13 |
| `testimonials-bento` | 1 | rating-summary | 54 | grid | 0 | 3/-/1 | – | – | – | 4 |
| `testimonials-products` | 1 | review-grid | 89 | grid | 4 (square×4) | 4/2/1 | – | – | – | 2 |
| `testimonials-videos` | 1 | carousel | 25 | grid | 0 | 4/-/2 | – | video | – | 0 |
| `testimonials-carousel` | 1 | review-grid | 108 | grid | 4 (square×4) | 4/2/1 | – | – | – | 0 |
| `testimonials-photo-cards` | 1 | carousel | 77 | overlap | 4 (portrait×4) | 2/2/1, 2/2/1, 2/2/1, 2/2/1, 2/2/1 | – | – | – | 0 |
| `testimonials-quote` | 1 | quote | 15 | centered | 0 | – | – | – | – | 2 |
| `testimonials-summary` | 1 | rating-summary | 118 | grid | 0 | 3/1/1, 2/2/1 | – | – | – | 0 |

## faq (10)

| Design | v | Subcategory | Nodes | Layout | Photos | Grids | Data | Interactive | Motion v2 | Templates |
|---|---|---|---|---|---|---|---|---|---|---|
| `faq-classic` | 1 | grouped | 36 | pinned | 0 | 4/-/1 | – | accordion | – | 0 |
| `faq-simple` | 1 | simple | 16 | centered | 0 | – | – | accordion | – | 0 |
| `faq-side` | 1 | side-title | 20 | pinned | 0 | 3/-/1 | – | accordion | – | 0 |
| `faq-cards` | 1 | cards | 38 | stack | 0 | 2/-/1 | – | – | – | 1 |
| `faq-help` | 2 | help-center | 32 | grid | 0 | 3/-/1 | – | accordion | – | 0 |
| `faq-columns` | 1 | simple | 20 | stack | 0 | 2/-/1 | – | accordion | – | 118 |
| `faq-panel` | 1 | help-center | 34 | pinned | 0 | 3/-/1 | – | accordion | – | 1 |
| `faq-numbered` | 1 | side-title | 33 | centered | 0 | – | – | accordion | – | 3 |
| `faq-chat` | 1 | cards | 21 | centered | 0 | – | – | – | – | 1 |
| `faq-topics` | 1 | help-center | 48 | grid | 0 | 3/-/1 | – | – | – | 1 |

## blog (10)

| Design | v | Subcategory | Nodes | Layout | Photos | Grids | Data | Interactive | Motion v2 | Templates |
|---|---|---|---|---|---|---|---|---|---|---|
| `blog-classic` | 1 | cards | 17 | data-grid | 0 | 3/2/1 | postList:- | – | – | 0 |
| `blog-lead` | 1 | featured | 27 | data-grid | 0 | 2/-/1, 1/-/-, 1/-/- | postList:-, postList:- | – | – | 0 |
| `blog-index` | 1 | list | 16 | data-grid | 0 | 1/-/-, 6/-/1 | postList:- | – | – | 0 |
| `blog-tiles` | 1 | cards | 15 | data-grid | 0 | 4/2/2 | postList:- | – | – | 0 |
| `blog-feature` | 1 | featured | 11 | data-grid | 0 | 1/-/-, 2/-/1 | postList:- | – | – | 0 |
| `blog-dated` | 1 | list | 19 | data-grid | 0 | 1/-/- | postList:- | – | – | 0 |
| `blog-bento` | 1 | cards | 29 | data-grid | 0 | 4/-/1, 1/-/-, 2/-/1 | postList:-, postList:- | – | – | 0 |
| `blog-rail` | 1 | cards | 17 | data-grid | 0 | 4/-/2 | postList:- | – | – | 0 |
| `blog-tabbed` | 1 | cards | 26 | data-grid | 0 | 3/-/1 | postList:- | – | – | 0 |
| `blog-headline` | 1 | featured | 17 | data-grid | 0 | 1/-/-, 3/-/1 | postList:- | – | – | 0 |

## newsletter (13)

| Design | v | Subcategory | Nodes | Layout | Photos | Grids | Data | Interactive | Motion v2 | Templates |
|---|---|---|---|---|---|---|---|---|---|---|
| `newsletter-classic` | 1 | panel | 8 | stack | 0 | 2/-/1 | – | storeForm | – | 2 |
| `newsletter-centered` | 1 | panel | 11 | centered | 0 | – | – | storeForm | – | 3 |
| `newsletter-photo` | 1 | image | 10 | split | 1 (square×1) | 2/-/1 | – | storeForm | – | 5 |
| `newsletter-channels` | 1 | panel | 20 | stack | 0 | 2/-/1, 2/-/- | – | storeForm | – | 1 |
| `newsletter-coupon` | 1 | coupon | 10 | grid | 0 | 3/-/1 | – | storeForm | – | 0 |
| `newsletter-ruled` | 1 | panel | 8 | stack | 0 | 2/-/1 | – | storeForm | – | 4 |
| `newsletter-big` | 1 | panel | 8 | stack | 0 | 2/-/1 | – | storeForm | – | 5 |
| `newsletter-interests` | 1 | panel | 20 | centered | 0 | – | – | storeForm | – | 4 |
| `newsletter-sticker` | 1 | coupon | 13 | overlap | 1 (portrait×1) | 2/-/1 | – | storeForm | – | 0 |
| `newsletter-letter` | 1 | panel | 17 | centered | 0 | – | – | storeForm | – | 5 |
| `newsletter-banner` | 2 | image | 13 | overlap | 1 (banner×1) | – | – | storeForm | – | 3 |
| `newsletter-strip` | 1 | panel | 11 | stack | 0 | 2/2/1 | – | storeForm | – | 4 |
| `newsletter-offer` | 1 | coupon | 11 | split | 1 (landscape×1) | 2/2/1 | – | storeForm | – | 0 |

## popups (7)

| Design | v | Subcategory | Nodes | Layout | Photos | Grids | Data | Interactive | Motion v2 | Templates |
|---|---|---|---|---|---|---|---|---|---|---|
| `popup-welcome` | 1 | welcome | 10 | split | 1 (portrait×1) | 2/-/1 | – | storeForm | – | 0 |
| `popup-exit` | 1 | reminders | 6 | centered | 0 | – | – | – | – | 0 |
| `popup-app` | 1 | app | 19 | centered | 0 | – | – | – | – | 0 |
| `popup-whatsapp` | 1 | chat | 11 | centered | 0 | – | – | – | – | 0 |
| `popup-restock` | 1 | reminders | 14 | centered | 0 | – | – | storeForm | – | 0 |
| `popup-sale-end` | 1 | bars | 21 | centered | 0 | – | – | – | – | 0 |
| `popup-reward` | 1 | welcome | 13 | centered | 0 | – | – | – | – | 0 |

## loyalty (2)

| Design | v | Subcategory | Nodes | Layout | Photos | Grids | Data | Interactive | Motion v2 | Templates |
|---|---|---|---|---|---|---|---|---|---|---|
| `rewards-gift` | 1 | gifts | 34 | stack | 0 | 2/-/1, 2/-/2 | – | – | – | 0 |
| `rewards-birthday` | 1 | occasions | 14 | centered | 0 | – | – | storeForm | – | 0 |

## services (11)

| Design | v | Subcategory | Nodes | Layout | Photos | Grids | Data | Interactive | Motion v2 | Templates |
|---|---|---|---|---|---|---|---|---|---|---|
| `service-cards` | 1 | list | 47 | grid | 0 | 4/-/2 | – | – | – | 1 |
| `service-trade-in` | 1 | requests | 30 | grid | 0 | 2/-/1, 4/-/2 | – | – | – | 0 |
| `service-booking` | 1 | requests | 30 | grid | 0 | 3/-/- | – | storeForm | – | 4 |
| `service-warranty` | 1 | requests | 18 | stack | 0 | 2/-/1 | – | storeForm | – | 0 |
| `service-price-menu` | 1 | list | 37 | stack | 0 | 2/-/1 | – | – | – | 5 |
| `service-plans` | 1 | list | 55 | grid | 0 | 3/-/1 | – | – | – | 4 |
| `service-journey` | 1 | process | 50 | grid | 0 | 4/-/1 | – | – | – | 0 |
| `service-areas` | 1 | process | 57 | stack | 0 | 2/-/1, 2/-/1 | – | – | – | 0 |
| `service-repair-request` | 1 | requests | 11 | stack | 0 | 2/-/1 | – | storeForm | – | 0 |
| `service-fast-fix` | 1 | banners | 12 | stack | 0 | 2/-/1 | – | – | – | 0 |
| `service-support` | 1 | support | 33 | grid | 0 | 3/-/1 | – | – | – | 4 |

## about (10)

| Design | v | Subcategory | Nodes | Layout | Photos | Grids | Data | Interactive | Motion v2 | Templates |
|---|---|---|---|---|---|---|---|---|---|---|
| `team-story` | 2 | story | 13 | split | 1 (portrait×1) | 2/2/1 | – | – | – | 1 |
| `team-timeline` | 2 | story | 29 | grid | 0 | 4/2/2 | – | – | – | 1 |
| `team-grid` | 2 | team | 29 | grid | 0 | 4/2/2 | – | – | – | 2 |
| `team-values` | 2 | values | 17 | centered | 0 | – | – | – | – | 2 |
| `team-founder` | 2 | story | 11 | centered | 0 | – | – | – | – | 2 |
| `team-branches` | 2 | branches | 57 | grid | 0 | 3/2/1 | – | – | – | 4 |
| `team-press` | 2 | press | 13 | centered | 0 | – | – | – | – | 0 |
| `team-careers` | 2 | careers | 33 | grid | 0 | 5/1/1 | – | – | – | 0 |
| `team-numbers` | 2 | values | 15 | centered | 0 | – | – | – | – | 3 |
| `team-scenes` | 2 | team | 12 | grid | 4 (wide×1, square×3) | 3/2/2 | – | – | – | 0 |

## contact (11)

| Design | v | Subcategory | Nodes | Layout | Photos | Grids | Data | Interactive | Motion v2 | Templates |
|---|---|---|---|---|---|---|---|---|---|---|
| `contact-classic` | 1 | info | 40 | split | 1 (wide×1) | 2/-/1 | – | – | – | 0 |
| `contact-form` | 1 | form | 22 | stack | 0 | 2/-/1 | – | storeForm | – | 118 |
| `contact-visit` | 1 | address | 17 | overlap | 1 (wide×1) | – | – | – | – | 0 |
| `contact-branches` | 1 | address | 70 | grid | 0 | 4/2/1 | – | – | – | 0 |
| `contact-whatsapp` | 1 | whatsapp | 16 | stack | 0 | 2/-/1 | – | – | – | 0 |
| `contact-strip` | 1 | info | 31 | grid | 0 | 4/-/2 | – | – | – | 0 |
| `contact-hours` | 1 | address | 51 | stack | 0 | 2/-/1 | – | – | – | 0 |
| `contact-bento` | 1 | whatsapp | 28 | grid | 0 | 5/-/1 | – | – | – | 0 |
| `contact-big` | 1 | info | 22 | centered | 0 | – | – | – | – | 0 |
| `contact-router` | 1 | whatsapp | 37 | stack | 0 | 2/-/2 | – | – | – | 0 |
| `contact-team` | 1 | whatsapp | 26 | centered | 0 | – | – | – | – | 0 |

## tracking (6)

| Design | v | Subcategory | Nodes | Layout | Photos | Grids | Data | Interactive | Motion v2 | Templates |
|---|---|---|---|---|---|---|---|---|---|---|
| `track-ask` | 1 | help | 17 | centered | 0 | – | – | – | – | 2 |
| `track-steps` | 1 | status | 49 | grid | 0 | 4/2/1 | – | – | – | 0 |
| `track-returns` | 1 | returns | 38 | stack | 0 | 2/-/1 | – | storeForm | – | 0 |
| `track-reschedule` | 1 | delivery | 20 | centered | 0 | – | – | – | – | 0 |
| `track-rate` | 1 | feedback | 9 | centered | 0 | – | – | storeForm | – | 0 |
| `track-problem` | 1 | help | 38 | centered | 0 | – | – | – | – | 0 |

## rich-text (12)

| Design | v | Subcategory | Nodes | Layout | Photos | Grids | Data | Interactive | Motion v2 | Templates |
|---|---|---|---|---|---|---|---|---|---|---|
| `text-policy` | 1 | policy | 19 | pinned | 0 | 4/-/1 | – | – | – | 0 |
| `text-centered` | 1 | notice | 7 | centered | 0 | – | – | – | – | 1 |
| `text-callout` | 1 | callout | 12 | centered | 0 | – | – | – | – | 0 |
| `text-columns` | 1 | columns | 6 | grid | 0 | 3/-/1 | – | – | – | 1 |
| `text-quote` | 1 | quote | 6 | centered | 0 | – | – | – | – | 0 |
| `text-steps` | 1 | policy | 35 | centered | 0 | – | – | – | – | 9 |
| `text-lead` | 1 | columns | 7 | stack | 0 | 2/-/1 | – | – | – | 2 |
| `text-statement` | 1 | callout | 10 | centered | 0 | – | – | – | – | 1 |
| `text-terms` | 1 | policy | 16 | grid | 0 | 3/-/1, 3/-/1, 3/-/1, 3/-/1 | – | – | – | 3 |
| `text-note` | 1 | notice | 8 | centered | 0 | – | – | – | – | 0 |
| `text-brand-statement` | 1 | callout | 9 | centered | 0 | – | – | – | – | 0 |
| `text-big-marquee` | 1 | callout | 7 | centered | 0 | – | – | marquee | – | 1 |

## page-header (10)

| Design | v | Subcategory | Nodes | Layout | Photos | Grids | Data | Interactive | Motion v2 | Templates |
|---|---|---|---|---|---|---|---|---|---|---|
| `page-header` | 1 | title | 10 | centered | 0 | – | – | – | – | 118 |
| `page-banner` | 1 | category-banner | 15 | grid | 1 (square×1) | 3/-/3 | – | – | – | 0 |
| `page-image` | 1 | image-banner | 15 | overlap | 1 (wide×1) | – | – | – | – | 1 |
| `page-subcategories` | 1 | subcategories | 29 | stack | 5 (square×5) | – | – | – | – | 0 |
| `page-promo` | 1 | promo | 18 | stack | 3 (square×3) | 2/-/1 | – | – | – | 0 |
| `page-toolbar` | 1 | title | 24 | grid | 0 | 3/-/1 | – | – | – | 0 |
| `page-brand` | 1 | category-banner | 14 | data-grid | 0 | 3/-/- | productList:- | – | – | 0 |
| `page-split` | 1 | image-banner | 17 | data-grid | 0 | 2/-/1, 3/-/3 | productList:- | – | – | 0 |
| `page-centered` | 1 | subcategories | 15 | data-grid | 0 | 6/-/3 | categoryList:- | – | – | 0 |
| `page-count` | 1 | promo | 15 | centered | 0 | – | – | – | – | 0 |

## product-page (7)

| Design | v | Subcategory | Nodes | Layout | Photos | Grids | Data | Interactive | Motion v2 | Templates |
|---|---|---|---|---|---|---|---|---|---|---|
| `product-main` | 2 | buy-box | 13 | pinned | 0 | 12/1/- | – | – | – | 118 |
| `product-cross-sell` | 1 | details | 3 | centered | 0 | – | – | – | – | 0 |
| `product-content` | 1 | details | 3 | centered | 0 | – | – | – | – | 118 |
| `product-reviews` | 1 | details | 7 | centered | 0 | – | – | – | – | 118 |
| `product-related` | 1 | upsell | 22 | data-grid | 0 | 4/3/2 | productList:related | – | – | 118 |
| `product-perks` | 1 | details | 19 | grid | 0 | 4/-/2 | – | – | – | 71 |
| `product-shipping` | 1 | details | 11 | centered | 0 | – | – | accordion | – | 35 |

## cart (4)

| Design | v | Subcategory | Nodes | Layout | Photos | Grids | Data | Interactive | Motion v2 | Templates |
|---|---|---|---|---|---|---|---|---|---|---|
| `cart-extras` | 1 | upsell | 18 | data-grid | 0 | 3/2/1 | productList:best-sellers | – | – | 0 |
| `cart-empty` | 1 | empty | 13 | data-grid | 0 | 5/3/2 | categoryList:- | – | – | 0 |
| `cart-free-delivery` | 1 | delivery | 17 | centered | 0 | – | – | – | – | 0 |
| `cart-coupon` | 1 | coupon | 17 | centered | 0 | – | – | – | – | 0 |

## footers (13)

| Design | v | Subcategory | Nodes | Layout | Photos | Grids | Data | Interactive | Motion v2 | Templates |
|---|---|---|---|---|---|---|---|---|---|---|
| `footer-classic` | 1 | multi-column | 59 | grid | 0 | 4/2/1 | – | – | – | 9 |
| `footer-line` | 1 | minimal | 28 | centered | 0 | – | – | – | – | 0 |
| `footer-wordmark` | 1 | commerce | 45 | grid | 0 | 3/-/2 | – | – | – | 12 |
| `footer-signup` | 1 | newsletter | 52 | grid | 0 | 2/-/1, 3/-/1 | – | storeForm | – | 16 |
| `footer-centered` | 1 | payment-trust | 34 | centered | 0 | – | – | – | – | 8 |
| `footer-ruled` | 1 | multi-column | 49 | grid | 0 | 3/-/1 | – | – | – | 12 |
| `footer-signoff` | 1 | commerce | 41 | grid | 0 | 4/-/2 | – | – | – | 18 |
| `footer-panel` | 1 | newsletter | 38 | grid | 0 | 2/-/1, 4/-/2 | – | storeForm | – | 11 |
| `footer-help` | 1 | multi-column | 70 | grid | 0 | 3/-/1, 3/-/1 | – | – | – | 18 |
| `footer-links` | 1 | payment-trust | 40 | centered | 0 | – | – | – | – | 9 |
| `footer-columns-signup` | 1 | newsletter | 67 | grid | 0 | 2/2/1, 4/2/2 | – | storeForm | – | 1 |
| `footer-centered-light` | 1 | payment-trust | 36 | centered | 0 | – | – | – | – | 3 |
| `footer-dark-bar` | 1 | minimal | 15 | centered | 0 | – | – | – | – | 1 |

## Pairs with a structural score of 0.72 or more

Score = 0.6 × tree-shape overlap + 0.4 × feature overlap (grids, data, interactive elements, photo ratios, photo count, layout). Same category only. The card inside a data list is not compared yet, so two data sections that differ only in their card score too high; each pair is confirmed by eye in its category session.

| Category | A | B | Score |
|---|---|---|---|
| categories | `categories-chips` | `categories-portrait-labels` | 1 |
| statistics | `stats-classic` | `stats-strip` | 1 |
| headers | `header-inline` | `header-icons` | 0.96 |
| blog | `blog-feature` | `blog-headline` | 0.96 |
| categories | `categories-big-type` | `categories-counts` | 0.93 |
| categories | `categories-photo-tiles` | `categories-circles` | 0.93 |
| products | `products-classic` | `products-rail` | 0.93 |
| products | `products-carousel` | `products-boxed` | 0.93 |
| blog | `blog-classic` | `blog-index` | 0.93 |
| blog | `blog-classic` | `blog-tiles` | 0.93 |
| blog | `blog-classic` | `blog-rail` | 0.93 |
| blog | `blog-index` | `blog-tiles` | 0.93 |
| blog | `blog-index` | `blog-rail` | 0.93 |
| blog | `blog-tiles` | `blog-rail` | 0.93 |
| products | `products-classic` | `products-grid` | 0.9 |
| statistics | `stats-classic` | `stats-big-numbers` | 0.9 |
| statistics | `stats-big-numbers` | `stats-strip` | 0.9 |
| headers | `header-inline` | `header-announcement-strip` | 0.89 |
| testimonials | `testimonials-ruled` | `testimonials-bento` | 0.89 |
| headers | `header-icons` | `header-announcement-strip` | 0.86 |
| headers | `header-classic` | `header-search` | 0.83 |
| products | `products-grid` | `products-rail` | 0.83 |
| blog | `blog-index` | `blog-dated` | 0.83 |
| headers | `header-classic` | `header-inline` | 0.82 |
| gallery | `gallery-polaroids` | `gallery-prints` | 0.82 |
| footers | `footer-centered` | `footer-centered-light` | 0.82 |
| products | `products-classic` | `products-rows` | 0.81 |
| products | `products-grid` | `products-rows` | 0.81 |
| products | `products-rail` | `products-rows` | 0.81 |
| image-text | `about-inset` | `about-circle` | 0.81 |
| footers | `footer-line` | `footer-centered` | 0.81 |
| headers | `header-line` | `header-announcement` | 0.8 |
| headers | `header-topbar` | `header-icons` | 0.8 |
| products | `products-category-tabs` | `products-centered-row` | 0.8 |
| headers | `header-classic` | `header-icons` | 0.79 |
| headers | `header-topbar` | `header-announcement-strip` | 0.79 |
| blog | `blog-classic` | `blog-dated` | 0.79 |
| blog | `blog-tiles` | `blog-dated` | 0.79 |
| blog | `blog-dated` | `blog-rail` | 0.79 |
| headers | `header-inline` | `header-topbar` | 0.78 |
| hero | `hero-carousel` | `hero-thumbs` | 0.78 |
| payment | `pay-open-box` | `pay-days` | 0.78 |
| blog | `blog-lead` | `blog-index` | 0.77 |
| footers | `footer-line` | `footer-links` | 0.77 |
| footers | `footer-links` | `footer-centered-light` | 0.77 |
| headers | `header-classic` | `header-topbar` | 0.76 |
| bundles | `bundle-plus` | `bundle-tabs` | 0.76 |
| newsletter | `newsletter-classic` | `newsletter-ruled` | 0.76 |
| headers | `header-classic` | `header-announcement-strip` | 0.75 |
| blog | `blog-classic` | `blog-lead` | 0.75 |
| blog | `blog-lead` | `blog-tiles` | 0.75 |
| blog | `blog-lead` | `blog-rail` | 0.75 |
| newsletter | `newsletter-coupon` | `newsletter-ruled` | 0.75 |
| footers | `footer-signup` | `footer-columns-signup` | 0.75 |
| footers | `footer-classic` | `footer-wordmark` | 0.74 |
| footers | `footer-centered` | `footer-links` | 0.74 |
| headers | `header-search` | `header-pill` | 0.73 |
| headers | `header-pill` | `header-inline` | 0.73 |
| headers | `header-classic` | `header-line` | 0.72 |
| headers | `header-classic` | `header-announcement` | 0.72 |
| headers | `header-search` | `header-inline` | 0.72 |
| video | `video-split` | `video-vertical` | 0.72 |
| footers | `footer-wordmark` | `footer-signup` | 0.72 |
