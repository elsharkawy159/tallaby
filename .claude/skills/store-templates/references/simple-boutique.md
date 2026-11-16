# Simple boutique looks (owner, 2026-11-16)

The owner likes two very simple storefronts and wants some templates like them later:

- **romana.tallaby.com**: a one-product-line beauty brand (lip gloss), built by hand on 2026-11-16 for a real seller.
- **janelle-eg.com**: an Egyptian lip brand on Shopify, used as the reference for Romana.

They feel premium because they are small: one brand colour, lots of white space, real product photos, a founder story, and almost nothing else. This is a **direction for future templates**, not a change to existing ones. When you build one, it is still a niche template under every rule in SKILL.md (one template per niche, element trees, no offers, no fake facts, a real products grid, screenshots).

## Who it is for

A small brand with few products (about 3 to 12) in one line: lip and beauty, perfume, candles, handmade accessories, a single bakery item, skincare. The seller is often the founder and the face of the brand.

## The recipe (Romana, as built)

**Home, 3 sections only** between header and footer:

1. **Split hero.** Two equal halves, full width (container `maxWidth: 100%`, no side padding, no radius). One half is a brand-colour panel with an eyebrow (`Romana lip gloss`), a large serif display title, one subtitle line and one button; the other half is a single product photo on white, `objectFit: contain` so the whole product shows. Stacks on phones.
2. **Products grid.** One heading ("The gloss collection"), a bound products grid of every product: 5 across on desktop, 3 on tablet, 2 on phones, one shared square product stage (1:1, cover, white). No tabs, no filters, no "view all" rail.
3. **Founder story.** Two halves: the founder's photo (radius 12, natural aspect) and text: eyebrow "Meet the founder", a serif title, the story paragraph (max ~560 px wide), the tagline again in the heading font. Container ~1280 px, gap 80 px.

**Header:** a thin primary-colour bar with the tagline, centred, small; then a 3-column bar on the brand-colour background: menu at the start, **logo centred**, tools (cart, language) at the end. Menu: Shop, Our story, Contact.

**Footer:** brand-colour background; logo and tagline centred; a short link row (Shop, Our story, Contact, Privacy, Terms); the store's social icons (round, primary colour); a "Cash on delivery" badge; copyright.

**Inner pages:** a brand-colour page header (centred title + one-line subtitle). About = the same founder section. Contact = intro text + social icons on one side, the contact form in a bordered card on the other. Hide an empty FAQ from the menu.

**Design system:**

| Token | Romana | Rule for the look |
|---|---|---|
| `secondary` | `#ffd6d4` blush (the logo's background) | The soft brand colour: header, hero panel, footer, page headers. Never used as text. |
| `primary` | `#741825` wine (sampled from the logo) | Text accents, titles, buttons, icons. Must pass 4.5:1 on white and on `secondary`. |
| `background` / `foreground` | `#ffffff` / `#2a0c13` | White page, near-black tinted with the brand. |
| `muted` / `border` / `accent` | `#6b4650` / `#f2c6c4` / `#f4a7b0` | Tints of the brand pair. |
| Fonts | Amiri headings, IBM Plex Sans Arabic body | An elegant serif for headings, a clean sans for body (see design-system.md for the Arabic pairs). |
| Spacing | radius 10, container 2560, section padding 96 | Wide container, generous vertical rhythm. |

Why the light colour sits in `secondary`: the platform also uses `primary` as a text colour, so a pale brand colour in `primary` makes unreadable text. Put the pale colour in `secondary` and a dark one from the logo in `primary`.

The exact build script (element trees, design system, contrast checks) is kept at `docs/systems/simple-boutique/romana-site.ts.txt`. Reuse its trees as the starting point; it uses only `createTreeBuilder`, `premiumCard`, `productsHead` and `iconLink` from `packages/store-sections/src/designs`.

## What to take from janelle-eg.com, and what not

Take: the small-brand feel, the logo-led header, real product photos on white, a "Best sellers" grid of about 5 cards, a short "Meet us" founder statement signed by the founders, a newsletter as the last light section, a clean footer with social icons and policy links.

Do **not** copy (our template rules forbid them): the Black Friday hero, discount pop-up, sale tags and bundle-price sections (no offers), "loved by 30,000+ customers" and the 4.77 / 1,007 reviews line (no fake facts), the scrolling promo announcement bar with shipping promises (no service promises), payment card logos the seller may not accept. Never copy its photos, copy or brand.

## Rules when turning this into a template

- **Founder photo:** template photos may not show people (photos.md), so the template's founder slot uses a still-life of the product line or the workspace; the seller replaces it with their own photo. Say so in the slot's label.
- **Founder story copy:** generic and editable ("Hi, I'm the founder of …"), no invented names, dates or family stories (template-copywriter).
- Keep it at 3–5 home sections. Adding categories, campaigns or carousels breaks the look; if the niche needs categories, use one small category row under the hero.
- The quality bar's "categories second" home order does not fit a one-line brand; for this look the products grid comes second. Get the owner's OK per template if a reviewer flags it.
- Re-shoot screenshots (SKILL.md) and register the new look as usual (workflow.md).
