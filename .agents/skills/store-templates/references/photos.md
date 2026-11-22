# Template photos

**`docs/systems/editions-photos.md` is the only source of template photos** (owner, 2026-11-12). Every photo is generated in ChatGPT from a prompt in that file and checked by eye. No new Pexels or other stock photo goes into a template; a Pexels photo already in a template stays only until its generated replacement arrives. A slot with no prompt gets its prompt added to that file first, then waits for the image. That file also holds the master prompts, every niche's list and the live status, so read it fresh; this page only summarises the rules.

## The essential set per niche

Make the essential set first (owner, 2026-11-15); everything else is "Later (optional)" in that file.

- **8 scenes:** `scene-hero-wide` (16:9, space for text on one side), `scene-hero-tall` (4:5, space at the top, the phone hero), `scene-tile-1` … `scene-tile-4` (3:4, one per category in category order), `scene-banner` (21:9, space in the middle), `scene-story` (4:5).
- **12 products** (three per category, white packshots). **16** when the template shows a row of four per category (`categoryRows`: `beauty-bold`, `beauty-luxe`, `furniture-luxe`, `gifts-luxe`, `gifts-warm`, `grocery-luxe`, `grocery-warm`, `kids-bold`, `kids-luxe`, `kids-warm`, `fashion-warm`, `electronics-luxe`); 13 for `perfumes-bold`.
- So 20 images per niche, 24 for the category-row templates. Why, in code: a pack must supply `hero.wide`, `hero.tall`, `tiles`, `banner`, `story` (`editions/types.ts`); no photo twice in a pack or across packs (`editions/validate.ts`); 4–8 categories, 12–24 products, ≥ 3 per category; the row rule (`editions/README.md` §3).

## Rules for every image

- **Packshots:** square 1:1, pure white seamless background, the product alone and whole, ~70 % of the frame, one soft shadow, one camera angle and light for the whole set. Clothing: a neat flat lay from above (no mannequin, model or hanger).
- **Scenes:** natural soft light, the niche's palette (one palette line per niche), real empty space where text sits, a quiet magazine look.
- **Never:** people, faces, hands, feet or any body part; mannequins; text, letters, numbers, logos, brand names, labels, price tags, packaging with print; screens showing anything; a copy of a known brand's design.
- Products look generic and unbranded. Sensitive trades (lingerie and sleepwear, modest wear) are shown as folded or flat-laid garments only, modest and non-suggestive.

## Files and folders

- **Inbox:** `.editions-inbox/<NN-wave-name>/<niche>/` (git-ignored; `.editions-inbox/README.md` lists every folder; live templates use `00-live-templates/<niche>/`, shared images `00-global/`). Each niche section of the photo doc starts with its **Save to** line.
- **Names:** packshots `<slug>.png` (the bold name before each prompt), scenes `scene-<slot>.png`, second angles `<slug>-2.png`. PNG or JPG at full resolution.
- **Never overwrite.** A file with that name (any extension) means the image is done; skip it. Re-makes are requested in the photo doc's status ("make again") and replace the file only after the owner sends the new one.

## Check by eye before using a photo

Open every image (the `Read` tool shows it). Reject or flag for "make again" when:

- a person, hand, foot, face, mannequin or body shape appears, even partly or reflected;
- any text, number, logo, label or brand-like mark shows (also on bottles, tags, screens, signs, number plates);
- a packshot's background isn't clean white, the product is cut off, or the angle or light breaks the set;
- a scene has a baked-in band, frame, circle or border (the templates add their own fades: watches' tiles came back as round pictures on a white page and must be remade);
- the product isn't what the slug says (rename the demo product to what the photo shows, as with `sheet-masks-set`, or ask for it again);
- the same image, or a near copy, is already used in this pack or another one.

Log what you found in the niche's section of `editions-photos.md` (the photo agent edits that file; keep your change to the niche's status line).

## Upload to `library-media`

Template photos live in the public Supabase bucket `library-media`, folder **`editions/<niche>/`**, one WebP per image: `<slug>.webp` and `scene-<slot>.webp`. The pack points at them with `editionPhoto(niche, slug)` (`editions/media.ts`); the host is the constant `EDITION_MEDIA_HOST`, the same for every environment.

- Convert to WebP. Observed on `editions/cookware/` (2026-11-15): packshots 1200 × 1200; scenes kept at their own ratio, about 1100–1900 px wide (hero wide 1664 × 936, hero tall 1120 × 1400, tile 1086 × 1448, banner 1911 × 819), 100–190 KB each. Match those sizes.
- Upload from a server-side script with the service-role key (never commit or print it; `CLAUDE.md` rule 10), **without upsert**: never overwrite an object that exists. Stores that applied the template copied these URLs into their own drafts and live sites, so overwriting a file silently changes those stores (and CDN caches keep the old bytes for a while). A re-made image goes up under a new name (for example `scene-tile-2-v2.webp`) and the pack points at the new name.
- After uploading, open one or two public URLs to check they load.

## Wiring into a pack

- Packs build URLs with a local helper: `const P = (slug) => editionPhoto(NICHE, slug)` and `const scene = (slot) => editionPhoto(NICHE, \`scene-${slot}\`)`.
- `photos.tiles` has one photo per category, in order, and the same URL is the category image in `demoStore` (or null).
- Write the photo provenance in the pack's header comment: generated from `editions-photos.md`, date received, checked by eye, which slots are what (see `packs/kitchen/cookware.ts`).
- Then re-shoot the template's card screenshots (SKILL.md, Screenshots).
