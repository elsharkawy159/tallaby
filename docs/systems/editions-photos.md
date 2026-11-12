# Template photos: the source (ChatGPT)

ROADMAP F-90. **This file is the single source of every photo our store templates show** (owner, 2026-11-12): product packshots, heroes, category tiles, banners, story and about photos, and each template's own extra slots. Every photo is generated from a prompt here and checked by eye; no new Pexels or other stock photos go into a template. The Pexels photos templates still show are listed under "Live templates" with their replacements, and are swapped as the images arrive. A template that needs a photo not listed here gets its prompt added here first.

Generate them in **one ChatGPT chat per niche and kind**: paste the master prompt once, then send the short prompts one at a time.

## Where the files go

**Every niche section below starts with a "Save to:" line: that is its folder.** Paths are relative to the project folder `F:\Programming Projects\tallaby\`, so `.editions-inbox/01-wave-1/earbuds/` means `F:\Programming Projects\tallaby\.editions-inbox\01-wave-1\earbuds\`.

For each image (you, or ChatGPT with file access):

1. Generate it from its prompt.
2. **Download it into that niche's "Save to" folder**, nowhere else.
3. **Name it exactly as the bold name before its prompt**, plus `.png`: packshots `<slug>.png`, scenes `scene-<slot>.png`, second angles `<slug>-2.png`. Example: `.editions-inbox/01-wave-1/earbuds/white-wireless-earbuds.png` and `.editions-inbox/01-wave-1/earbuds/scene-hero-wide.png`.
4. Keep the full resolution ChatGPT gives (no screenshots, no compression); PNG or JPG.

```
.editions-inbox/
  00-global/                                  images every store shares (placeholders, empty states): see "Global images"
  00-live-templates/<niche>/                  the 22 live templates: their packshots and replacement scenes
  01-wave-1/<niche>/                          earbuds, kidswear, backpacks-travel, mobiles, audio, small-appliances, modest-wear, silver-jewelry, wearables
  02-wave-2-beauty/<niche>/                   … one folder per wave below, up to
  13-wave-13-books-and-stationery/<niche>/
```

Every folder already exists (`.editions-inbox/README.md` lists them). The folder is git-ignored. If renaming is a pain, download them **in the order of this list** into the niche's folder, and I will match them by order and check each one by eye.

---

## Master prompt (paste once at the start of each chat)

```
You are my product photographer for an online store demo catalog. For every product I send next, create ONE photorealistic studio packshot with these rules, every time, without asking me questions:

- Square image, 1:1, high resolution.
- Pure white seamless background (#FFFFFF), no gradient, no floor line, no props.
- The product alone, centered, filling about 70% of the frame, fully in view (nothing cut off).
- Soft, even studio lighting from the front and above; one soft natural shadow under the product.
- Real materials and true colours; sharp focus; e-commerce catalog style.
- NO people, hands, feet or body parts. NO text, NO logos, NO brand names, NO labels, NO price tags, NO packaging.
- Keep the same camera angle, lighting and size from image to image, so the set looks like one shoot.

Reply with the image only. I will now send the products one by one.
```

---

**Clothing line** (add to the master prompt in clothing chats, where a niche says "Clothing line applies"): *"Clothes: no mannequin, no model, no hanger. Show the garment as a neat flat-lay seen from straight above, sleeves and legs arranged naturally, no labels or prints with words."*

---

## Status (2026-11-12)

**Done and live:** every photo of the earlier lists. The 21 packs below use them, each on its own template: dresses, lingerie & sleepwear, t-shirts, menswear, pants & jeans, sportswear, handbags, women's shoes, men's shoes, slippers & clogs, sneakers, gold jewelry, glasses, watches, fashion jewelry, hair accessories, belts & wallets, phone cases, chargers & cables, PC & gaming, lighting & smart home. Accessories already shows one template per niche.

**Make next:** the six packs below, in this order. Each is **16 packshots** (master prompt above, one chat per niche) plus **8 scene photos** (scene master prompt below, a second chat per niche). The order follows what each one unlocks:

| # | Niche | Template | Unlocks |
|---|---|---|---|
| 1 | earbuds | Wasla | mobile accessories, one template per niche |
| 2 | kidswear | Nawl | fashion, one template per niche |
| 3 | backpacks-travel | Safar | shoes & bags, one template per niche |
| 4 | mobiles | TechHub | electronics (with 5 and 6) |
| 5 | audio | Atheer | electronics (with 4 and 6) |
| 6 | small-appliances | Shasha | electronics (with 4 and 5) |
| – | modest-wear, silver-jewelry, wearables | Sitara, Fadda, Saa | optional: these templates already serve their niche |

When a niche folder in `.editions-inbox/<wave>/<niche>/` is complete (16 packshots + 8 scenes), tell me its name. I check every image by eye, convert and upload them, build the pack and redesign its template, then switch the industry once its last niche is in.

**All photos I need, in one place:**

| Part | Niches | Packshots | Scenes | Images |
|---|---|---|---|---|
| Wave 1, make next (below) | 6 | 96 | 48 | 144 |
| Wave 1, optional (below) | 3 | 48 | 24 | 72 |
| Waves 2–13, every other industry (end of this file) | 53 | 848 | 424 | 1,272 |
| Live templates, replace their Pexels photos | 22 | 8 (Fadda) | 201 | 209 |
| **All core photos** | **83** (silver jewelry is in two rows) | **1,000** | **697** | **1,697** |
| Premium kit, 22 per niche (after each niche's core photos) | 83 | | 1,826 | 1,826 |
| Global images (placeholders and empty states) | | | 13 | 13 |
| Optional: a second angle of every product (`<slug>-2.png`) | | | | 336 listed for live packs; 16 per new niche |

Start with wave 1's six and the worst live photos (listed under "Live templates"); the later waves can be made in any order, an industry at a time. Second angles are optional: they give each product page its own extra photos.

**Dropped:** the 6 extra watch packshots (Saat now uses four categories of four).

---

## Scene photos

Every new pack also needs **8 scene photos**, so its template looks premium: one more chat per niche with the scene master prompt below. Save scenes as `.editions-inbox/<wave>/<niche>/scene-<slug>.png` (packshots stay `<slug>.png`).

### Scene master prompt (paste once at the start of each scene chat)

```
You are my art director and photographer for a premium online store. For every scene I send next, create ONE photorealistic editorial photograph with these rules, every time, without asking me questions:

- Use the aspect ratio I give with each scene (16:9, 4:5, 3:4 or 21:9).
- Natural, soft directional light (window light or late-afternoon sun), real materials, gentle shadows, shallow depth of field where it helps.
- A calm composition with real empty space where I say "space for text", so a headline can sit there.
- The palette I give with each niche; keep it the same for the whole set, so the photos look like one campaign.
- NO people, faces, hands, feet or body parts. NO mannequins. NO text, NO letters, NO numbers, NO logos, NO brand names, NO screens showing anything.
- Products must look generic and unbranded, never a copy of a known brand's design.
- Expensive, quiet, magazine look. Not cluttered, not cartoonish, no glossy CGI look.

Reply with the image only. I will now send the scenes one by one.
```

Every niche's scene set is the same eight slots:

- **scene-hero-wide** (16:9, space for text on one side) and **scene-hero-tall** (4:5, space for text at the top): the first screen.
- **scene-tile-1 … scene-tile-4** (3:4): one per category, in the category order of the packshot list.
- **scene-banner** (21:9, space for text in the middle): a wide break between product rows.
- **scene-story** (4:5): the shop's story photo.

---

## Premium kit (every niche, after its 8 scenes)

So a template looks premium and every section has a real, high-definition photo (carousel slides, call-to-action bands, offers, seasons, the about page, galleries, collection headers, the social card), each niche also gets these. Send them **in the same scene chat, after the niche's 8 scenes**, so ChatGPT already knows the shop, its products and its palette; start the first one with *"Same shop, same palette and light as the scenes above."* Save them in the niche's same "Save to" folder. Make a niche's core photos (packshots and 8 scenes) first; the kit comes after.

Heroes and calls to action
- **scene-hero-2** (16:9, space for text on the right): a second hero slide: the shop's best seller close up, in the setting it is used in.
- **scene-hero-3** (16:9, space for text on the left): a third hero slide: three or four of the shop's products together in one calm, wide still life.
- **scene-hero-tall-2** (4:5, space for text at the top): the phone version of scene-hero-2.
- **scene-cta-wide** (21:9, a calm empty middle for text, products only at the two ends): a call-to-action band.
- **scene-cta-tall** (4:5, space for text at the top): the same call to action for phones.

Offers and seasons
- **scene-offer** (16:9, space for text on one side): an offer banner: the products on a bold block of the palette's accent colour, crisp shadow. No text, no numbers, no percent signs.
- **scene-season-ramadan** (16:9, space for text on one side): the products on a Ramadan evening table: a brass lantern, dates in a small bowl, warm amber light.
- **scene-season-eid** (16:9, space for text on one side): the products gift-wrapped in plain paper with ribbon, beside unwrapped ones, festive but calm.
- **scene-season-summer** (16:9, space for text on one side): the products in bright summer light: sea-blue shadows, straw, sun.

About, delivery and newsletter
- **scene-about-2** (4:5): the shop's back room: shelves of the products and a packing table with tissue paper and plain boxes.
- **scene-about-3** (16:9): the shop's interior, wide: its products neatly displayed, no signs.
- **scene-packaging** (1:1): the shop's plain unbranded packaging: a box, tissue paper and ribbon around one product.
- **scene-delivery** (4:3): a plain parcel ready on a clean counter by a door, morning light. No labels.
- **scene-newsletter** (4:3, space for text on one side): a quiet close-up of the products' material or texture.

Gallery, collections and backgrounds
- **scene-gallery-1** … **scene-gallery-4** (1:1): four square details for a gallery or social row: the products in small, real moments, no people.
- **scene-collection-1** … **scene-collection-4** (21:9, space for text in the middle): a wide header per category for its collection page, in the category order of the packshot list.
- **scene-texture** (1:1, seamless, very low contrast): a background texture from the shop's world (its fabric, paper, stone or wood) in the palette, tileable.
- **scene-og** (1.91:1, 1200×630, products centred with wide margins all round): the social share card shown when the store's link is posted.

That is **22 more images per niche** (scene-gallery and scene-collection are four each).

---

## Global images (all stores)

**Save to: `.editions-inbox/00-global/`**

Placeholders and empty states every store shares: the default product photo, empty cart, no results, the store-offline page and others. One scene chat with the scene master prompt and this palette: *warm white, soft stone grey, sand, graphite.* Calm and neutral, never one trade's products.

- **product-placeholder** (1:1, pure white background): a soft embossed outline of a shopping bag on off-white paper, very subtle. Shown where a product has no photo yet.
- **category-placeholder** (3:4): plain warm-white paper with a soft diagonal window shadow. A category tile without a photo.
- **banner-placeholder** (21:9, space for text in the middle): soft daylight window shadows on a warm-white plaster wall.
- **hero-placeholder-wide** (16:9, space for text on one side) and **hero-placeholder-tall** (4:5, space for text at the top): a bright, empty shop corner: pale wood shelves, a plant, soft light.
- **empty-cart** (1:1): an empty woven shopping basket on a plain warm-white surface, soft shadow.
- **empty-wishlist** (1:1): an empty paper gift bag with a loose ribbon, standing on warm white.
- **no-results** (1:1): an empty pale-wood shelf against a warm-white wall, soft side light.
- **not-found** (16:9, space for text on one side): a quiet closed wooden door in a sunlit plaster wall, a potted plant beside it. No numbers.
- **store-offline** (16:9, space for text on one side): a shop doorway with a linen curtain drawn across it, warm late light. No signs.
- **order-confirmed** (1:1): a neatly wrapped parcel with a ribbon on a warm-white table.
- **order-tracking** (16:9): a delivery scooter parked alone on a quiet Cairo street in the morning, a plain box on its back. No rider, no logos, no plates.
- **og-default** (1.91:1, 1200×630): an abstract warm-white and sand composition of soft shadows: the default social card.

---

## Make next

### 1. earbuds (16), template wasla

**Save to: `.editions-inbox/01-wave-1/earbuds/`**

Last missing niche of **mobile accessories**: with it, that industry switches to one template per niche.

Palette for scenes: *light grey, white, pale mint, graphite.* Add: *"Audio gear: unbranded, smooth surfaces, no logos on the case or the earbuds, cases shown open with the earbuds inside unless stated."*

True wireless
1. **white-wireless-earbuds**: White true wireless earbuds in an open white oval charging case.
2. **black-anc-earbuds**: Black noise-cancelling earbuds in an open matte black case.
3. **mint-wireless-earbuds**: Pale mint wireless earbuds in an open matching case.
4. **graphite-sport-earbuds**: Graphite sport earbuds with ear hooks in an open case.

Over-ear & on-ear
5. **black-over-ear-headphones**: Black over-ear wireless headphones, three-quarter view.
6. **beige-over-ear-headphones**: Beige over-ear wireless headphones with soft cushions.
7. **white-on-ear-headphones**: White foldable on-ear headphones, folded.
8. **kids-volume-limited-headphones**: Pastel blue kids' on-ear headphones.

Neckband & wired
9. **black-neckband-earphones**: Black neckband wireless earphones laid in a curve.
10. **white-usb-c-earphones**: White wired earphones with a USB-C plug, coiled neatly.
11. **black-gaming-earbuds**: Black wired gaming earbuds with an inline microphone, coiled.
12. **white-open-ear-earbuds**: White open-ear clip earbuds in an open case.

Cases & accessories
13. **silicone-earbuds-case-cover**: A soft lilac silicone cover for an earbuds case, with a small clip.
14. **memory-foam-ear-tips**: A set of grey memory-foam ear tips in three sizes in a small clear tray.
15. **headphone-stand**: A minimal walnut wood headphone stand, empty.
16. **headphone-travel-case**: A grey hard-shell zip headphone travel case, closed.

Scenes
- **scene-hero-wide**: White earbuds in an open case on a pale mint desk next to a ceramic mug and a plant leaf shadow, space for text on the left.
- **scene-hero-tall**: Beige over-ear headphones resting on a stack of blank-covered books by a window, space for text at the top.
- **scene-tile-1**: An open earbuds case on a light grey stone tile.
- **scene-tile-2**: Over-ear headphones hanging on a walnut stand on a clean desk.
- **scene-tile-3**: Neckband earphones on a gym bench next to a towel.
- **scene-tile-4**: Ear tips, a silicone case cover and a travel case arranged on white linen, from above.
- **scene-banner**: A long white desk with earbuds, headphones and a closed laptop (lid down), wide and minimal.
- **scene-story**: A tidy shop counter with small boxes (no labels) and earbuds cases in rows, soft light.

---

### 2. kidswear (16), template fashion-warm

**Save to: `.editions-inbox/01-wave-1/kidswear/`**

Last missing niche of **fashion**: with it, fashion switches to one template per niche.

Palette for scenes: *butter yellow, sky blue, warm white, soft coral.* Clothing line applies. Add: *"Kids' clothes for ages 2–10, simple and colourful, no characters, no prints with words."*

Tops
1. **yellow-kids-tshirt**: A butter-yellow cotton kids' t-shirt, flat-lay.
2. **striped-kids-long-sleeve**: A navy and white striped long-sleeve kids' top, flat-lay.
3. **white-kids-polo**: A white piqué kids' polo shirt, flat-lay.
4. **sky-blue-kids-hoodie**: A sky blue kids' zip hoodie, flat-lay.

Bottoms
5. **denim-kids-jeans**: Mid-blue kids' jeans with an elastic waist, flat-lay.
6. **beige-kids-chinos**: Beige kids' chino trousers, flat-lay.
7. **grey-kids-joggers**: Grey marl kids' jogger trousers, flat-lay.
8. **coral-kids-shorts**: Coral cotton kids' shorts, flat-lay.

Dresses & sets
9. **floral-girls-dress**: A small floral cotton girls' dress with short puff sleeves, flat-lay.
10. **mint-tulle-party-dress**: A mint green girls' party dress with a tulle skirt, flat-lay.
11. **linen-boys-set**: A boys' linen shirt and shorts set in sand, flat-lay side by side.
12. **cotton-pajama-kids-set**: A kids' cotton pajama set with tiny star dots, flat-lay.

Outerwear
13. **yellow-kids-raincoat**: A yellow hooded kids' raincoat, flat-lay.
14. **navy-kids-puffer**: A navy kids' puffer jacket, flat-lay.
15. **denim-kids-jacket**: A light denim kids' jacket, flat-lay.
16. **knit-kids-cardigan**: A cream knit kids' cardigan with wooden buttons, flat-lay.

Scenes
- **scene-hero-wide**: A sunny kids' room with a low wooden clothes rail of small colourful clothes, a woven basket and a paper lamp, space for text on the right.
- **scene-hero-tall**: Tiny clothes on wooden hangers on a white wall rail, a small yellow raincoat in front, space for text at the top.
- **scene-tile-1**: Folded kids' t-shirts in yellow, blue and white stacked on a wooden stool.
- **scene-tile-2**: Small jeans and joggers folded in an open wicker basket on a light floor.
- **scene-tile-3**: A floral girls' dress hanging on a little wooden hanger by a window with sheer curtains.
- **scene-tile-4**: A yellow raincoat and small rain boots by a door with soft daylight.
- **scene-banner**: A long row of small clothes on a rail against a pale blue wall, seen straight on.
- **scene-story**: A sewing table with soft cotton fabrics in pastel colours, buttons in a small dish, and pattern paper.

---

### 3. backpacks-travel (16), template safar

**Save to: `.editions-inbox/01-wave-1/backpacks-travel/`**

Last missing niche of **shoes & bags**: with it, shoes & bags switches to one template per niche.

Palette for scenes: *stone grey, deep olive, sand, a little rust.* Add: *"Bags: shown standing upright, straps arranged neatly, zips closed, no logo patches."*

Backpacks
1. **black-laptop-backpack**: A black water-resistant laptop backpack with a padded back.
2. **olive-canvas-backpack**: An olive waxed-canvas roll-top backpack with brown leather straps.
3. **grey-everyday-backpack**: A grey minimalist everyday backpack with one front zip pocket.
4. **sand-kids-school-backpack**: A sand-coloured school backpack with two side pockets.

Luggage
5. **white-hard-cabin-suitcase**: A white hard-shell cabin suitcase on four wheels, handle down.
6. **navy-hard-medium-suitcase**: A navy hard-shell medium suitcase on four wheels.
7. **olive-soft-suitcase**: An olive fabric soft suitcase with a front pocket.
8. **grey-luggage-set**: Three nesting grey hard-shell suitcases, small, medium and large, standing side by side.

Duffels & weekenders
9. **brown-leather-weekender**: A brown leather weekender duffel bag with a shoulder strap.
10. **black-gym-duffel**: A black nylon gym duffel with a shoe pocket.
11. **canvas-tote-weekender**: A natural canvas weekender tote with leather handles.
12. **foldable-travel-duffel**: A navy foldable travel duffel, unfolded and standing.

Travel accessories
13. **grey-travel-pillow**: A grey memory-foam neck pillow.
14. **packing-cubes-set**: A set of four packing cubes in graduated sizes, stacked.
15. **black-toiletry-bag**: A black hanging toiletry bag, closed.
16. **passport-holder-wallet**: A tan leather passport holder wallet, closed.

Scenes
- **scene-hero-wide**: An olive backpack and a white cabin suitcase by a big airport-style window at sunrise, soft long shadows on a concrete floor, space for text on the left.
- **scene-hero-tall**: A backpack resting on a stone wall above a misty valley at dawn, space for text at the top.
- **scene-tile-1**: A grey backpack on a wooden bench in a sunlit entryway.
- **scene-tile-2**: A suitcase by a hotel window with sheer curtains and city light.
- **scene-tile-3**: A brown leather weekender on the back seat of a car with soft morning light.
- **scene-tile-4**: Packing cubes, a passport holder and a neck pillow laid out on white linen, from above.
- **scene-banner**: A desert road at golden hour with a backpack and duffel standing by a stone marker, wide and quiet.
- **scene-story**: A workshop table with canvas swatches, leather straps, brass buckles and a sewing awl.

---

### 4. mobiles (16), template techhub

**Save to: `.editions-inbox/01-wave-1/mobiles/`**

One of three missing niches of **electronics** (with audio and small appliances).

Palette for scenes: *cool white, slate blue, silver, a little warm wood.* Add: *"Phones: generic unbranded smartphones, not any real brand's design (no notch shape, camera layout or colour that copies a known model), screen off and black, shown upright at a slight angle with the back visible when asked."*

Smartphones
1. **black-flagship-phone**: A black glass flagship smartphone, front three-quarter view, screen off.
2. **silver-flagship-phone-back**: A silver smartphone shown from the back, a simple round triple-camera island.
3. **blue-midrange-phone**: A slate blue midrange smartphone, back view, a simple vertical dual camera.
4. **green-budget-phone**: A sage green budget smartphone, back view.

Foldables & compact
5. **black-folding-phone-open**: A black book-style folding phone, half open like a book, screens off.
6. **lavender-flip-phone**: A lavender flip phone, half folded, screen off.
7. **white-compact-phone**: A small white compact smartphone, front three-quarter view, screen off.
8. **rugged-outdoor-phone**: A black and orange rugged outdoor smartphone with rubber corners.

Tablets
9. **grey-tablet**: A grey 11-inch tablet, screen off, standing at a slight angle.
10. **tablet-with-keyboard-cover**: A tablet in a navy keyboard cover, opened like a laptop, screen off.
11. **kids-tablet-bumper**: A small tablet in a chunky pastel green kids' bumper case with a handle.
12. **stylus-pen**: A white stylus pen lying diagonally.

Basic phones & extras
13. **black-feature-phone**: A small black keypad feature phone with plain keys (no letters).
14. **dual-sim-tray-tool-set**: A small SIM tray tool and two empty SIM trays laid neatly.
15. **phone-desk-stand**: An aluminium adjustable phone desk stand, empty.
16. **phone-ring-holder**: A silver phone ring holder, open.

Scenes
- **scene-hero-wide**: A dark smartphone standing on a light oak desk with morning sun and long soft shadows, space for text on the right.
- **scene-hero-tall**: Two phones, one face down showing the camera island, on a slate blue surface with a sharp shadow, space for text at the top.
- **scene-tile-1**: A smartphone leaning on a ceramic cup on a white table.
- **scene-tile-2**: A folding phone half open on a linen tablecloth.
- **scene-tile-3**: A tablet on a sofa arm with a knitted throw, screen off.
- **scene-tile-4**: Small phone accessories laid out on a light wood tray, from above.
- **scene-banner**: A long counter with five phones standing in a row, screens off, soft studio side light.
- **scene-story**: A clean repair bench with small screwdrivers, a phone opened face down on an anti-static mat, no hands.

---

### 5. audio (16), template electronics-luxe

**Save to: `.editions-inbox/01-wave-1/audio/`**

One of three missing niches of **electronics** (with mobiles and small appliances).

Palette for scenes: *warm walnut, charcoal, cream, brushed aluminium.* Add: *"Audio gear: unbranded, premium materials (fabric, wood, aluminium), no logos, no screens."*

Speakers
1. **walnut-bookshelf-speakers**: A pair of walnut wood bookshelf speakers with charcoal fabric grilles.
2. **charcoal-portable-speaker**: A charcoal fabric portable cylinder speaker with a strap.
3. **cream-smart-speaker**: A round cream fabric home speaker.
4. **black-party-speaker**: A tall black party speaker with a top handle, lights off.

Headphones
5. **charcoal-studio-headphones**: Charcoal over-ear studio headphones with leather cushions.
6. **cream-wireless-headphones**: Cream wireless over-ear headphones with aluminium arms.
7. **walnut-headphones**: Over-ear headphones with walnut wood ear cups.
8. **black-dj-headphones**: Black folding DJ headphones with a coiled cable.

Soundbars & home audio
9. **black-soundbar**: A slim black fabric soundbar.
10. **soundbar-subwoofer-set**: A black soundbar with a matching square subwoofer.
11. **turntable**: A walnut and aluminium turntable with a blank black record (no label text).
12. **stereo-amplifier**: A brushed aluminium stereo amplifier with two plain knobs, no markings.

Mics & accessories
13. **usb-desk-microphone**: A black USB desk microphone on a short stand.
14. **wireless-lavalier-mics**: Two small black wireless clip microphones in an open charging case.
15. **speaker-stands-pair**: A pair of black speaker stands, empty.
16. **audio-cable-set**: A neatly coiled braided audio cable with gold-plated plugs.

Scenes
- **scene-hero-wide**: Walnut bookshelf speakers and a turntable on a low wooden cabinet in a warm living room at dusk, a lamp glowing, space for text on the left.
- **scene-hero-tall**: Cream headphones resting on a charcoal armchair arm with warm side light, space for text at the top.
- **scene-tile-1**: A portable speaker on a stone garden table at sunset.
- **scene-tile-2**: Studio headphones hanging on an aluminium stand on a dark desk.
- **scene-tile-3**: A soundbar under a blank wall-mounted TV with its screen off in a calm living room.
- **scene-tile-4**: A desk microphone on a walnut desk with soft window light.
- **scene-banner**: A long record shelf of blank-spined records with a turntable at the end, warm light.
- **scene-story**: A listening room with two speakers on stands, an armchair and acoustic wood panels.

---

### 6. small-appliances (16), template shasha

**Save to: `.editions-inbox/01-wave-1/small-appliances/`**

One of three missing niches of **electronics** (with mobiles and audio).

Palette for scenes: *white, pale sage, warm oak, brushed steel.* Add: *"Appliances: unbranded, no logos, no display digits or button labels, cables tidy."*

Kitchen
1. **steel-electric-kettle**: A brushed steel electric kettle on its base.
2. **white-air-fryer**: A white rounded air fryer, basket closed.
3. **sage-stand-blender**: A sage green countertop blender with a glass jar.
4. **cream-toaster**: A cream two-slice toaster.

Coffee
5. **steel-espresso-machine**: A compact brushed steel espresso machine.
6. **black-drip-coffee-maker**: A black drip coffee maker with a glass carafe.
7. **white-milk-frother**: A white electric milk frother jug.
8. **steel-coffee-grinder**: A brushed steel electric coffee grinder.

Home care
9. **white-steam-iron**: A white and grey steam iron, standing on its heel.
10. **grey-garment-steamer**: A grey handheld garment steamer.
11. **white-stick-vacuum**: A white cordless stick vacuum, standing upright.
12. **round-robot-vacuum**: A round grey robot vacuum, top three-quarter view.

Personal care
13. **pink-hair-dryer**: A blush pink hair dryer.
14. **black-hair-straightener**: A black hair straightener, closed.
15. **grey-beard-trimmer**: A grey beard trimmer with a comb attachment.
16. **white-electric-toothbrush**: A white electric toothbrush on its charging stand.

Scenes
- **scene-hero-wide**: A bright kitchen counter in pale sage and oak with a steel kettle, a toaster and a bowl of lemons, morning sun, space for text on the right.
- **scene-hero-tall**: An espresso machine on an oak shelf with two small cups, soft steam, space for text at the top.
- **scene-tile-1**: An air fryer and a blender on a white counter with herbs in a jar.
- **scene-tile-2**: A drip coffee maker beside coffee beans in a glass jar, warm light.
- **scene-tile-3**: A stick vacuum leaning against a white wall in a hallway with oak floors.
- **scene-tile-4**: A hair dryer and a straightener on a marble bathroom shelf with a folded towel.
- **scene-banner**: A long kitchen counter with appliances spaced out, clean and wide.
- **scene-story**: A tidy small shop with appliances on white shelves, no signs or labels.

---

## Optional

### modest-wear (16), template sitara

**Save to: `.editions-inbox/01-wave-1/modest-wear/`**

Optional: Sitara already serves this niche with its own photos. A pack makes it richer; it doesn't block anything.

Palette for scenes: *soft sand, dusty rose, warm white, a touch of olive.* Clothing line applies. Add: *"Modest wear: long, loose cuts, nothing tight or short. Abayas and dresses shown full length on a flat-lay."*

Abayas
1. **black-classic-abaya**: A plain black crepe abaya with wide sleeves, full length, flat-lay.
2. **beige-open-abaya**: A beige open-front linen abaya with a matching belt, full length, flat-lay.
3. **navy-embroidered-abaya**: A navy abaya with fine tone-on-tone embroidery on the cuffs, full length, flat-lay.
4. **rose-kimono-abaya**: A dusty rose kimono-style abaya, full length, flat-lay.

Hijabs & scarves
5. **folded-chiffon-hijab-set**: Three chiffon hijabs folded in a neat stack, in beige, dusty rose and white.
6. **black-jersey-hijab**: A black jersey hijab, folded neatly in a square.
7. **olive-modal-scarf**: An olive green modal scarf, loosely folded.
8. **printed-silk-scarf**: A square silk scarf with a soft abstract floral print (no letters), folded into a triangle.

Prayer & home sets
9. **white-prayer-isdal**: A white one-piece prayer isdal with a hood, flat-lay.
10. **grey-prayer-dress-set**: A soft grey two-piece prayer set, top and skirt, flat-lay.
11. **cotton-galabeya**: A long light-blue cotton galabeya with a simple neckline, flat-lay.
12. **satin-kaftan**: A long emerald satin kaftan with gold piping, flat-lay.

Dresses & sets
13. **long-pleated-skirt**: A long camel pleated maxi skirt, flat-lay.
14. **maxi-shirt-dress**: A long sage green shirt dress with long sleeves and a tie belt, flat-lay.
15. **wide-trousers-tunic-set**: A matching cream tunic and wide-leg trousers set, flat-lay side by side.
16. **long-cardigan**: A long oatmeal knit cardigan, flat-lay.

Scenes
- **scene-hero-wide**: Three abayas in sand, rose and black hanging on a pale wooden rail against a warm plaster wall, morning window light, space for text on the left.
- **scene-hero-tall**: One dusty rose abaya hanging on a wooden hanger against a plaster wall with soft arched-window shadow, space for text at the top.
- **scene-tile-1**: A black abaya draped over a cream armchair in a bright room.
- **scene-tile-2**: Folded hijabs in neutral colours stacked on a linen-covered table beside a small dried-flower vase.
- **scene-tile-3**: A white prayer isdal folded on a prayer rug with a geometric pattern, soft side light.
- **scene-tile-4**: A sage shirt dress laid on an unmade linen bed in morning light.
- **scene-banner**: A long linen tablecloth with folded scarves in a gradient from sand to rose, seen from above.
- **scene-story**: A tailor's table with fabric swatches, a measuring tape and scissors on cream linen.

---

### silver-jewelry (16), template fadda

**Save to: `.editions-inbox/01-wave-1/silver-jewelry/`**

Optional: Fadda already serves this niche (accessories is switched). A pack makes it richer; it doesn't block anything.

Palette for scenes: *cool white, pale grey stone, soft blue-grey, black velvet accents.* Add: *"Jewelry: sterling silver, shown on the white background from slightly above, small and centred with lots of white space, no gemstones unless asked."*

Rings
1. **plain-silver-band**: A plain polished sterling silver band ring.
2. **twisted-silver-ring**: A twisted rope sterling silver ring.
3. **silver-signet-ring**: A sterling silver signet ring with a blank flat oval top.
4. **stacking-rings-set**: Three thin stacking silver rings standing together.

Necklaces
5. **silver-snake-chain**: A fine sterling silver snake chain necklace laid in a soft curve.
6. **silver-coin-pendant**: A silver necklace with a small round hammered coin pendant (no engraving).
7. **silver-bar-necklace**: A silver necklace with a slim horizontal bar pendant, blank.
8. **silver-pearl-drop-necklace**: A silver chain with a single small white pearl drop.

Earrings
9. **small-silver-hoops**: A pair of small polished silver hoop earrings.
10. **silver-stud-earrings**: A pair of small silver ball stud earrings.
11. **silver-drop-earrings**: A pair of silver teardrop drop earrings.
12. **silver-ear-cuff**: A single silver ear cuff with a twisted texture.

Bracelets
13. **silver-chain-bracelet**: A silver curb chain bracelet laid in a loop.
14. **silver-bangle**: A plain open silver bangle.
15. **silver-beaded-bracelet**: A bracelet of small round silver beads on a fine chain.
16. **silver-cuff-bracelet**: A wide hammered silver cuff bracelet.

Scenes
- **scene-hero-wide**: A few silver rings and a chain on a pale grey stone slab, cool window light and a soft shadow, space for text on the right.
- **scene-hero-tall**: A silver chain hanging from a small piece of driftwood against a pale blue-grey wall, space for text at the top.
- **scene-tile-1**: Silver rings standing on a smooth river pebble on grey linen.
- **scene-tile-2**: A silver necklace in a shallow white ceramic dish.
- **scene-tile-3**: Silver earrings on a small square of black velvet on white marble.
- **scene-tile-4**: Silver bracelets around a stack of two linen-bound books with blank covers.
- **scene-banner**: A long grey stone ledge with silver pieces spaced along it, side light.
- **scene-story**: A silversmith's bench with a small anvil, files, a ring mandrel and silver wire, no hands.

---

### wearables (16), template saa

**Save to: `.editions-inbox/01-wave-1/wearables/`**

Optional: Saa already serves this niche. A pack makes it richer; it doesn't block anything.

Palette for scenes: *graphite, cool white, pale lilac, a hint of sport orange.* Add: *"Smartwatches and bands: unbranded, screens off (black), shown upright, strap closed in a loop, no logos."*

Smartwatches
1. **graphite-square-smartwatch**: A graphite square smartwatch with a graphite sport band.
2. **silver-round-smartwatch**: A silver round smartwatch with a white sport band.
3. **lilac-smartwatch**: A lilac square smartwatch with a matching band.
4. **rugged-outdoor-smartwatch**: A rugged black outdoor smartwatch with an orange band and a raised bezel.

Fitness bands & rings
5. **black-fitness-band**: A slim black fitness band.
6. **mint-fitness-band**: A slim mint fitness band.
7. **titanium-smart-ring**: A brushed titanium smart ring.
8. **kids-gps-watch**: A chunky pastel blue kids' smartwatch.

Straps
9. **milanese-loop-strap**: A silver mesh watch strap laid in a loop.
10. **leather-watch-strap**: A tan leather smartwatch strap laid flat.
11. **nylon-sport-loop**: A woven orange and grey nylon sport loop strap.
12. **link-bracelet-strap**: A black steel link bracelet strap.

Chargers & care
13. **magnetic-watch-charger**: A white magnetic smartwatch charging puck with a coiled cable.
14. **watch-charging-stand**: A small aluminium smartwatch charging stand, empty.
15. **watch-screen-protector**: Two clear smartwatch screen protector covers.
16. **watch-travel-case**: A grey zip watch travel case, closed.

Scenes
- **scene-hero-wide**: A graphite smartwatch on a dark stone ledge at dawn with a running track softly blurred behind, space for text on the left.
- **scene-hero-tall**: A smartwatch on a folded grey towel with a water bottle, cool light, space for text at the top.
- **scene-tile-1**: Three smartwatches on a light concrete block, side light.
- **scene-tile-2**: Fitness bands and a smart ring on a yoga mat, from above.
- **scene-tile-3**: Watch straps fanned out on cream linen.
- **scene-tile-4**: A smartwatch on its charging stand on a bedside table at night with a warm lamp.
- **scene-banner**: A long gym bench with a towel, a bottle and a smartwatch, wide and quiet.
- **scene-story**: A clean workbench with watch straps, spring-bar tools and small parts trays.

---

## Live templates: replace the Pexels photos

The 21 live niche templates (and Fadda for silver jewelry) still show Pexels photos for their heroes, tiles, banners, stories and their own extra slots. Each line below replaces one of them, slot by slot, as each template draws it (checked in its code, 2026-11-12): the ratio to generate, what must stay in frame when the template crops it, and what the photo shows now (and what is wrong with it). Scene chats use the scene master prompt (give the niche's palette once); product angles use the packshot master prompt (plus the clothing line for clothes).

Save into `.editions-inbox/00-live-templates/<niche>/`: scenes as `scene-<slot>.png`, angles as `<slug>-2.png`. A line marked *(not drawn by …)* is a pack photo no live template shows today: make it last. Fadda's 8 products are Pexels photos too, so its packshots are required, not optional. When a new photo shows a different subject, I update its alt text when I swap it in.

**Worst photos today, make these first:** sportswear's four tiles (lockers, a track: no garment); lingerie's pajama-sets tile (a sleep mask); slippers-clogs' hero (small flip-flops on a deck) and worn home-slippers tile; mens-shoes' about photo (scuffed boots); tshirts' story and gallery; Fadda's hero, Rings and Stacks tiles (one photo used three times); gold-jewelry's chains tile (a bust); belts-wallets' card-holder tile (leather rolls); pc-gaming's hero (lit screens); watches' women's and smart tiles.

### dresses — Hareer (`fashion-luxe`), live

**Save to: `.editions-inbox/00-live-templates/dresses/`**

Palette for scenes: *ivory white, soft taupe, warm stone grey, jet black (blush and sage as dress colours only).*

Scenes (replace the Pexels photos; save as `scene-<slot>.png`)
- **scene-hero-wide** (16:9, full-bleed under a 28% dim with the headline centred: keep the middle calm, dresses at both sides; phones crop the centre): A bright boutique fitting corner, a pale oak rail of dresses on the left (sage wrap, navy shirt dress, black satin, ivory linen, mocha pleated), a cream linen curtain and a tall plant on the right, a plain warm-white wall in the middle, soft window light, no mirror. *Now: Pexels 3965551, a boutique fitting corner with a rail, plants and cream curtains.*
- **scene-tile-1** (3:4, category: Casual dresses; the name sits on a dark fade at the foot, keep the bottom fifth simple): A sage green wrap midi dress and a navy belted shirt dress on wooden hangers on a pale oak rail against a warm-white wall, morning light. *Now: Pexels 8030176, a mixed rail of white, black and rust dresses and coats: reads as a general rail, not casual dresses.*
- **scene-tile-2** (3:4, category: Evening dresses): A burgundy velvet evening dress on a padded ivory hanger from a picture rail, its hem falling to a pale stone floor, side light on the velvet. *Now: Pexels 15893780, blush tulle and gold sequin gowns on white hangers: reads bridal.*
- **scene-tile-3** (3:4, category: Summer dresses): A yellow floral sundress on a wooden hanger on a whitewashed wall peg beside a straw hat, a soft palm-leaf shadow. *Now: Pexels 17151139, a yellow cotton dress on a hook beside a straw hat (good subject; regenerate so the set matches).*
- **scene-tile-4** (3:4, category: Modest maxi dresses): A long dusty rose crepe maxi dress with long sleeves on a wooden hanger against a cream fitting-room door, the whole length to the hem in view. *Now: Pexels 10689510, a mocha tiered midi on a fitting-room door with other clothes and a gold mirror around it: busy, and not a maxi.*
- **scene-banner** (generate 4:3: drawn as one half of a two-tone block, 3:4 on tablets, so keep the subject centred): Blush satin and ivory silk crepe in soft folds on a stone-grey surface, a thin taupe ribbon across them, low raking window light. *Now: Pexels 8793891, blush satin folds.*
- **scene-story** (4:5, the about page beside "Few styles, well chosen"): A coral and a yellow summer dress on wooden hangers on a whitewashed wall hook, a woven basket on the floor below, warm afternoon light. *Now: Pexels 9788969, two summer dresses on hangers.*
- **scene-look** (3:4, shop the look; the three dots point at the store's three newest dresses, at x/y % of the photo: yellow sundress 20/44, sky blue striped dress 45/52, white linen tiered dress 68/54): Three summer dresses on wooden hangers hanging from a pergola beam on a sunny terrace, left to right a yellow floral sundress (its body about 20% across, 44% down), a sky blue striped dress (about 45% across, 52% down) and a white linen tiered dress (about 68% across, 54% down), a whitewashed wall and a soft bougainvillea shadow behind. *Now: Pexels 8916600, three summer dresses on hangers on a terrace, yellow, light blue and white.*

Product angles (optional, one more view each, save as `<slug>-2.png`, same master prompt, "show the same product from <angle>")
1. **yellow-floral-sundress**: Yellow Floral Sundress — the back, as the same flat-lay.
2. **sky-blue-striped-dress**: Sky Blue Striped Dress — the back.
3. **white-linen-tiered-dress**: White Linen Tiered Dress — a close detail of the linen tiers and seams.
4. **sage-green-wrap-midi-dress**: Sage Green Wrap Midi Dress — the side, showing the wrap and tie.
5. **navy-belted-shirt-dress**: Navy Belted Shirt Dress — the back.
6. **beige-knit-midi-dress**: Beige Ribbed Knit Midi Dress — a close detail of the rib knit.
7. **terracotta-tshirt-dress**: Terracotta Cotton T-Shirt Dress — the back.
8. **burgundy-velvet-evening-dress**: Burgundy Velvet Evening Dress — the back.
9. **black-satin-slip-dress**: Black Satin Slip Evening Dress — the back, showing the straps.
10. **emerald-one-shoulder-gown**: Emerald Satin One-Shoulder Gown — the back.
11. **champagne-sequin-evening-dress**: Champagne Sequin Evening Dress — a close detail of the sequins.
12. **coral-off-shoulder-summer-dress**: Coral Off-Shoulder Summer Dress — the back.
13. **dusty-rose-maxi-dress**: Dusty Rose Crepe Maxi Dress — the back.
14. **olive-maxi-shirt-dress**: Olive Maxi Shirt Dress — a close detail of the collar and buttons.
15. **black-floral-chiffon-maxi-dress**: Black Floral Chiffon Maxi Dress — the back.
16. **mocha-pleated-maxi-dress**: Mocha Satin Pleated Maxi Dress — a close detail of the pleats.

---

### lingerie-sleepwear — Vella (`vella`), live

**Save to: `.editions-inbox/00-live-templates/lingerie-sleepwear/`**

Palette for scenes: *white, pale zinc grey, soft charcoal, one small signal-red accent (an object, never a garment).* Add: *"Sleepwear: modest, nothing revealing; garments folded, hung or laid on furniture."*

Scenes (replace the Pexels photos; save as `scene-<slot>.png`)
- **scene-hero-wide** (16:9, full-bleed under a 30% dim with the headline centred: keep the middle calm; phones crop the centre): A made bed in white and pale grey linen seen from the side, an ivory satin pajama set folded on the pillow on the left, a white waffle robe over the footboard on the right, a small red ceramic cup on the bedside table, soft morning window light. *Now: Pexels 5629138, a rumpled blush duvet and a white pillow: no garment in view.*
- **scene-tile-1** (3:4, category: Pajama sets; the name sits under the photo): A navy cotton pajama set with white piping folded neatly on a white bed, the top laid over the trousers, seen from slightly above. *Now: Pexels 7445030, a plush sleep mask on pale blue bedding: no pajamas at all.*
- **scene-tile-2** (3:4, category: Nightgowns): A long white cotton puff-sleeve nightgown on a wooden hanger on a white wardrobe door, full length in view, soft rainy-window light. *Now: Pexels 3932950, a long white embroidered dress on a hanger by a rainy window (good subject).*
- **scene-tile-3** (3:4, category: Robes): A white waffle robe and a grey hooded fleece robe on two wall hooks in a white dressing room, a folded towel on a stool below. *Now: Pexels 31145149, two white waffle robes on wall hooks.*
- **scene-tile-4** (3:4, category: Loungewear): An oatmeal knit lounge set folded on a pale grey armchair with a knitted throw, a black jersey set folded beside it on the armrest. *Now: Pexels 18797320, taupe tops on a wooden rail beside baskets and a plant: reads as a shop rail, not loungewear.*
- **scene-banner** (generate 1:1: drawn square beside the story text, 4:3 on phones, so keep the stack centred): Folded lounge sets stacked on the arm of a cream sofa, oatmeal knit, black jersey and lilac fleece, a mug on a side table, soft window light. *Now: Pexels 7691347, folded knits on a cream sofa.*
- **scene-story** (4:5, the about page): A calm white bedroom corner, two robes on a wall rail, a green armchair with a folded pajama set on the seat, linen curtains, no books. *Now: Pexels 20065482, a white bedroom with two robes, a green armchair and a closed book.*

Product angles (optional, one more view each, save as `<slug>-2.png`, same master prompt, "show the same product from <angle>")
1. **ivory-satin-pajama-set**: Ivory Satin Long-Sleeve Pajama Set — the top's back, laid flat.
2. **navy-cotton-pajama-set**: Navy Cotton Long-Sleeve Pajama Set — a close detail of the collar and piping.
3. **pink-striped-pajama-set**: Pink Striped Cotton Short Pajama Set — the back, laid flat.
4. **sage-modal-pajama-set**: Sage Modal Pajama Set — a close detail of the modal fabric and buttons.
5. **champagne-satin-nightgown**: Champagne Satin Long Nightgown — the back, laid flat.
6. **white-cotton-nightgown**: White Cotton Puff-Sleeve Nightgown — a close detail of the puff sleeve.
7. **dusty-rose-nightgown**: Dusty Rose Cotton Nightgown — the back, laid flat.
8. **navy-printed-nightgown**: Navy Dotted Cotton Long-Sleeve Nightgown — a close detail of the dotted cotton.
9. **white-waffle-robe**: White Waffle Cotton Robe — the back, laid flat.
10. **blush-satin-robe**: Blush Satin Belted Robe — folded neatly with the belt on top.
11. **grey-fleece-robe**: Grey Hooded Fleece Robe — the back, showing the hood.
12. **beige-linen-robe**: Beige Linen Long Robe — a close detail of the linen and the belt loop.
13. **oatmeal-knit-lounge-set**: Oatmeal Knit Lounge Set — folded as a neat stack.
14. **black-jersey-lounge-set**: Black Jersey Lounge Set — folded as a neat stack.
15. **lilac-fleece-lounge-set**: Lilac Hooded Fleece Lounge Set — the hoodie's back, laid flat.
16. **cream-cotton-lounge-dress**: Cream Cotton Long-Sleeve Lounge Dress — the back, laid flat.

---

### tshirts — Streetwear (`streetwear`), live

**Save to: `.editions-inbox/00-live-templates/tshirts/`**

Palette for scenes: *white, raw concrete grey, acid lime, pure black.*

Scenes (replace the Pexels photos; save as `scene-<slot>.png`)
- **scene-hero-wide** (16:9 poster photo, all copy sits on the black band under it, a round sticker overlaps the photo's top edge: keep the top strip plain; 4:3 on phones, so keep the tees in the middle): A black steel rail against a raw concrete wall holding a row of crisp tees on black hangers, white, black, grey melange, sand, olive and one acid-lime tee in the middle, hard afternoon light and a long shadow. *Now: Pexels 40450765, tees in many colours on a rail.*
- **scene-tile-1** (generate 4:3: wide cards, square on phones, so centre the subject; category: Basics): Three folded basic tees stacked, white, black and grey melange, on a bare concrete bench. *Now: Pexels 7319172, a white tee on a hanger in a shop.*
- **scene-tile-2** (4:3, category: Oversized): A washed black oversized tee laid loose and flat on concrete, sleeves dropped wide, a stripe of sun across it. *Now: Pexels 37704842, a loose cream tee in sunlight (tiny neck label and hem tag).*
- **scene-tile-3** (4:3, category: Stripes & prints): A navy and white striped tee and a blue tie-dye tee folded side by side on pale concrete, seen from above. *Now: Pexels 7640756, a close-up of a striped weave: fabric, not a tee.*
- **scene-tile-4** (4:3, category: Polos): Three piqué polos with tipped collars on black hangers, burgundy, white and forest green, against a grey concrete wall. *Now: Pexels 28460164, a pile of tipped polo collars.*
- **scene-banner** (16:9 band, a paper title plate covers its bottom start corner, which flips with the language: keep the bottom third quiet; 4:3 on phones): A long tight row of white tees on black hangers on a black rail, receding into the frame, concrete wall, one acid-lime painted band low on the wall. *Now: Pexels 2112648, white tees on black hangers.*
- **scene-story** (4:5, the about page's store photo): A small streetwear shop corner, folded tees stacked on a raw plywood table, a black rail of tees behind, concrete floor, one acid-lime stool. *Now: Pexels 9702241, a cotton branch on white: no shop and no tee.*
- **scene-lookbook-1** (1:1, the large bento photo): A black tee and an acid-lime tee hanging side by side on a black rail, close on the necklines, concrete behind. *Now: Pexels 8146450, a yellow and a red tee on a rail: off the palette, a small label inside the red neck.*
- **scene-lookbook-2** (1:1): A white basic tee laid perfectly flat on pale grey concrete, from straight above. *Now: Pexels 12039633, a white tee flat on pale grey (reads as a mock-up).*
- **scene-lookbook-3** (1:1): A close row of black tee sleeves on hangers with one acid-lime sleeve breaking the row. *Now: Pexels 9940948, a row of red tee sleeves: red is off the palette.*
- **scene-lookbook-4** (1:1): Raw cotton bolls on a concrete ledge beside a folded white tee. *Now: Pexels 13924869, a close-up of raw cotton fibre.*
- **scene-lookbook-5** (1:1): A rolled grey melange tee and a rolled black tee in a black wire basket on concrete, from above. *Now: Pexels 4440651, a steam iron on marble beside a grey tee: an appliance with a brand-like badge.*

Product angles (optional, one more view each, save as `<slug>-2.png`, same master prompt, "show the same product from <angle>")
1. **burgundy-tipped-polo**: Burgundy Tipped Polo — a close detail of the tipped collar and placket.
2. **white-pique-polo**: White Pique Polo — the back, laid flat.
3. **navy-pique-polo**: Navy Pique Polo — a close detail of the piqué knit.
4. **navy-white-striped-tshirt**: Navy and White Striped Tee — the back, laid flat.
5. **washed-black-oversized-tshirt**: Washed Black Oversized Tee — folded neatly.
6. **white-basic-cotton-tshirt**: White Basic Cotton Tee — a close detail of the neck rib.
7. **blue-tie-dye-tshirt**: Blue Tie-Dye Tee — the back, laid flat.
8. **sand-beige-oversized-tshirt**: Sand Beige Oversized Tee — the back, laid flat.
9. **black-basic-cotton-tshirt**: Black Basic Cotton Tee — folded neatly.
10. **forest-green-pique-polo**: Forest Green Pique Polo — the back, laid flat.
11. **black-chest-stripe-tshirt**: Black Tee with a White Chest Stripe — the back, laid flat.
12. **brown-oversized-tshirt**: Chocolate Brown Oversized Tee — folded neatly.
13. **dusty-blue-basic-tshirt**: Dusty Blue Basic Cotton Tee — folded neatly.
14. **green-white-colour-block-tshirt**: Green and White Colour-Block Tee — the back, laid flat.
15. **olive-oversized-tshirt**: Olive Oversized Tee — the back, laid flat.
16. **grey-melange-basic-tshirt**: Grey Melange Basic Tee — a close detail of the melange cotton.

---

### menswear — Zay (`zay`), live

**Save to: `.editions-inbox/00-live-templates/menswear/`**

Palette for scenes: *cool pale grey, light steel grey, periwinkle, deep navy.*

Zay draws only the hero collage, the small category thumbs and the about photo. The pack's `hero`, `banner` and `look` are shown only by its second look (fashion-luxe), so they are not listed here.

Scenes (replace the Pexels photos; save as `scene-<slot>.png`)
- **scene-hero-piece-1** (4:5, the collage's large photo, caption "The full outfit"): A full smart-casual outfit laid flat on pale grey linen from straight above, a navy bomber jacket, a white Oxford shirt, a folded grey crew sweater, stone chinos and brown penny loafers. *Now: Pexels 36910113, a checked blazer, chambray shirt, rust trousers, a tie and loafers: the rust and check fight the navy and grey palette, and the shop sells no ties.*
- **scene-hero-piece-2** (1:1, caption "Shirts"): A folded light blue linen shirt lying on a folded white Oxford shirt, collars and buttons crisp, on pale grey. *Now: Pexels 6276002, a navy shirt collar and buttons.*
- **scene-hero-piece-3** (4:3, caption "Knitwear"): A stack of folded knits, grey crew neck, beige quarter-zip and olive knit polo, on a pale steel-grey shelf, soft side light. *Now: Pexels 3633039, a navy knit texture close-up: fabric only.*
- **scene-tile-1** (1:1, category: Shirts; a small round-cropped thumb, hidden on phones: one centred piece, tight framing): A white Oxford shirt folded with the collar up, centred on pale grey. *Now: Pexels 35150391, a light blue placket over a grey pinstripe.*
- **scene-tile-2** (1:1, category: Polos & knitwear): A folded navy piqué polo resting on a folded grey sweater, centred on pale grey. *Now: Pexels 13889763, a stack of cream, beige and brown knits.*
- **scene-tile-3** (1:1, category: Trousers): Stone chinos folded in thirds, waistband up, centred on pale grey. *Now: Pexels 6045283, trousers hanging close together.*
- **scene-tile-4** (1:1, category: Jackets): A navy bomber jacket folded with its collar forward, centred on pale grey. *Now: Pexels 615003, brown and navy jackets on a rail.*
- **scene-story** (4:5, the about page): A navy steel rail of shirts, knits and jackets in white, grey, navy and olive, a pair of brown loafers on the floor below, pale grey wall, window light. *Now: Pexels 7794265, the neck of a grey crew knit.*

Product angles (optional, one more view each, save as `<slug>-2.png`, same master prompt, "show the same product from <angle>")
1. **grey-crew-sweater**: Grey Crew-Neck Sweater — folded neatly.
2. **olive-field-jacket**: Olive Field Jacket — the back, laid flat.
3. **navy-bomber-jacket**: Navy Bomber Jacket — the back, laid flat.
4. **white-oxford-shirt**: White Oxford Shirt — a close detail of the collar and buttons.
5. **stone-chino-trousers**: Stone Chino Trousers — the back, laid flat.
6. **navy-pique-polo**: Navy Piqué Polo — folded neatly.
7. **light-blue-linen-shirt**: Light Blue Linen Shirt — folded neatly.
8. **charcoal-tailored-trousers**: Charcoal Tailored Trousers — a close detail of the waistband and crease.
9. **tan-suede-jacket**: Tan Faux Suede Jacket — the back, laid flat.
10. **olive-knit-polo**: Olive Knit Polo — a close detail of the knit collar.
11. **navy-striped-shirt**: Navy Striped Shirt — folded neatly.
12. **navy-drawstring-trousers**: Navy Drawstring Trousers — a close detail of the drawstring waist.
13. **black-leather-jacket**: Black Leather Jacket — the back, laid flat.
14. **beige-quarter-zip-sweater**: Beige Quarter-Zip Sweater — a close detail of the zip collar.
15. **black-overshirt**: Black Overshirt — the back, laid flat.
16. **black-cargo-trousers**: Black Cargo Trousers — the side, showing the cargo pocket.

---

### pants-jeans — Alwan (`fashion-bold`), live

**Save to: `.editions-inbox/00-live-templates/pants-jeans/`**

Palette for scenes: *white, pale chambray blue, deep indigo, top-stitch gold.*

Scenes (replace the Pexels photos; save as `scene-<slot>.png`)
- **scene-hero-wide** (16:9, slide 1 of the carousel: copy sits on a dark fade along the bottom, so keep the lower third quiet and the jeans in the upper two thirds): Rolled jeans in every wash, from bleached light to raw indigo, lined up in a neat row on a pale chambray surface, seen from slightly above, gold top-stitching showing on the cuffs. *Now: Pexels 19824259, rolled jeans.*
- **scene-slide-2** (16:9, slide 2 "best sellers", same bottom fade): Jeans hanging from wooden hangers on a white wall rail, dark indigo on one end to light wash on the other, waistbands at the top. *Now: Pexels 16390580, jeans on wooden hangers, dark to light.*
- **scene-banner** (16:9, used as slide 3 "tell us your length, we hem", same bottom fade): Indigo denim folded in heavy layers on chambray, a raw hem beside a neat gold-stitched hem, plain steel tailor's scissors closed beside them. *Now: Pexels 10133275, indigo denim folded.*
- **scene-tile-1** (3:4, category: Jeans; name under the photo): A tall stack of folded jeans, light to dark wash, on a white table, the side seams and gold stitching facing the camera. *Now: Pexels 6764122, a close stack of folded jeans.*
- **scene-tile-2** (3:4, category: Wide-leg trousers): One pair of beige linen wide-leg trousers hanging full length from a wooden hanger against a white wall, the legs falling straight. *Now: Pexels 31842963, many coloured trousers on white hangers with a drawstring pair in front: the busiest of the four tiles.*
- **scene-tile-3** (3:4, category: Chinos & tailored): Beige chinos and navy tailored trousers folded over a wooden valet bar, a brown leather belt coiled below, chambray wall. *Now: Pexels 33633245, taupe trousers, a knit, a belt and boots laid out on navy.*
- **scene-tile-4** (3:4, category: Joggers & sweatpants): Grey melange and black joggers folded with the cuffs forward on a white bench, soft cotton texture. *Now: Pexels 10348923, soft cotton and knit folded in earth tones.*
- **scene-story** (3:4, set into the indigo panel, 4:3 on phones; also the about page, so keep the subject centred): Folded jeans stacked on a white table under a window, one pair opened across the top to show the gold top-stitched pocket seams, no patches or rivet marks. *Now: Pexels 4546763, folded jeans on white.*
- **scene-fit-1** (1:1, step "measure a pair you love"): Mid blue jeans laid flat on pale chambray, a coiled cloth tape measure beside them with its blank back facing up so no markings show. *Now: Pexels 10895045, a tape measure on blue with its printed numbers in view.*
- **scene-fit-2** (1:1, step "pick the cut and wash"): Five folded denim strips fanned out like a swatch book, bleached light to charcoal, on white. *Now: Pexels 30828508, denim bands, light to charcoal.*
- **scene-fit-3** (1:1, step "we hem to your length"): A close-up of a fresh jeans hem with gold top-stitching, a gold thread spool and a pin cushion beside it on indigo denim. *Now: Pexels 4109765, an indigo hem with gold top-stitching.*

Product angles (optional, one more view each, save as `<slug>-2.png`, same master prompt, "show the same product from <angle>")
1. **light-wash-mom-jeans**: Light Wash Mom Jeans — the back, laid flat, showing the pockets.
2. **blue-wide-leg-jeans**: Blue Wide-Leg Jeans — the back, laid flat.
3. **mid-blue-straight-jeans**: Mid Blue Straight Jeans — folded neatly, the waistband on top.
4. **beige-chino-trousers**: Beige Chino Trousers — the back, laid flat.
5. **grey-melange-joggers**: Grey Melange Joggers — a close detail of the cuff and drawstring.
6. **beige-linen-wide-leg-trousers**: Beige Linen Wide-Leg Trousers — a close detail of the linen and waistband.
7. **black-slim-jeans**: Black Slim Jeans — the back, laid flat.
8. **navy-tailored-trousers**: Navy Tailored Trousers — folded over in half, showing the crease.
9. **black-tapered-joggers**: Black Tapered Joggers — the back, laid flat.
10. **black-wide-leg-trousers**: Black Wide-Leg Trousers — the back, laid flat.
11. **grey-straight-jeans**: Grey Straight Jeans — folded neatly, the waistband on top.
12. **olive-cargo-trousers**: Olive Cargo Trousers — the side, showing the cargo pocket.
13. **navy-side-stripe-joggers**: Navy Side-Stripe Joggers — the side, showing the stripe.
14. **terracotta-palazzo-trousers**: Terracotta Palazzo Trousers — a close detail of the belt.
15. **brown-corduroy-trousers**: Brown Corduroy Trousers — a close detail of the cord.
16. **beige-straight-sweatpants**: Beige Straight Sweatpants — the back, laid flat.

---

### sportswear — Madar (`sports-luxe`), live

**Save to: `.editions-inbox/00-live-templates/sportswear/`**

Palette for scenes: *white, ice blue, cobalt, graphite (steel blue as a soft extra).* Add: *"Training wear: unbranded, no stripes, swooshes or logos, no gym machines or plates."*

Scenes (replace the Pexels photos; save as `scene-<slot>.png`)
- **scene-hero-wide** (16:9, full-bleed, the headline and button sit on a dark fade at the bottom start, which flips with the language: keep the bottom third and both lower corners calm, the garments centred and high): Folded training pieces stacked crisp on a graphite bench, a slate quick-dry tee, cobalt leggings and a graphite zip jacket, close enough that the weave and mesh read, cool daylight. *Now: Pexels 1487809, a slate performance weave in folds: fabric only, no garment.*
- **scene-tile-1** (3:4, category: Training tops): A black quick-dry training tee and a white mesh tank top folded side by side on a pale ice-blue bench, soft side light. *Now: Pexels 37496664, an open red locker with a key tag: no garment, red is off the palette.*
- **scene-tile-2** (3:4, category: Leggings & joggers): Black high-waist leggings and grey training joggers folded with the waistbands forward on white. *Now: Pexels 36717697, a rolled mat, a dumbbell and a band: equipment, not garments.*
- **scene-tile-3** (3:4, category: Shorts): Black running shorts, navy training shorts and olive cycling shorts folded in a column on ice blue, from above. *Now: Pexels 8454925, the curve of an orange running track: no garment.*
- **scene-tile-4** (3:4, category: Jackets & hoodies): A graphite zip training jacket and a grey zip hoodie hanging from steel hooks on a clean white changing-room wall. *Now: Pexels 12255816, a wall of pale grey lockers: no garment.*
- **scene-story** (1:1: cropped to a circle inside a steel ring on the home page, and used again on the about page, so the subject must sit in the centre): A pale wood changing-room bench with a folded cobalt training set and a plain steel water bottle in the middle, ice-blue tiled wall behind. *Now: Pexels 4162550, charcoal lockers and slatted benches: no garment.*
- **scene-fabric-1** (1:1 macro, row "Quick-dry polyester"): Macro of pale grey perforated quick-dry polyester mesh in soft folds, cool side light. *Now: Pexels 10221743, pale perforated sports mesh.*
- **scene-fabric-2** (1:1 macro, row "Nylon with elastane"): Macro of teal stretch nylon-elastane jersey with a gentle sheen, slightly stretched. *Now: Pexels 4863009, teal stretch jersey, crumpled.*
- **scene-fabric-3** (1:1 macro, row "Cotton fleece"): Macro of heather grey cotton fleece on a folded edge, the soft brushed inside showing. *Now: Pexels 34860712, heather grey cotton jersey: jersey, not fleece.*
- **scene-newsletter** (1:1: the sign-up card's start half, a 16:9 band on phones, so centre the subject): A cobalt technical knit training top folded flat on white, the ribbed collar and a zip pull in view, from above. *Now: Pexels 18372335, a cobalt technical knit, flat.*

Product angles (optional, one more view each, save as `<slug>-2.png`, same master prompt, "show the same product from <angle>")
1. **black-training-tshirt**: Black Quick-Dry Training Tee — the back, laid flat.
2. **black-high-waist-leggings**: Black High-Waist Leggings — a close detail of the high waistband.
3. **black-running-shorts**: Black Running Shorts with Liner — the back, laid flat.
4. **black-zip-training-jacket**: Black Zip Training Jacket — the back, laid flat.
5. **teal-sports-bra**: Teal Sports Bra — the back, laid flat.
6. **grey-training-joggers**: Grey Training Joggers — a close detail of the cuff.
7. **navy-training-shorts**: Navy Training Shorts — the back, laid flat.
8. **grey-zip-hoodie**: Grey Zip Hoodie — the back, showing the hood.
9. **white-mesh-tank-top**: White Mesh Tank Top — a close detail of the mesh.
10. **navy-seamless-leggings**: Navy Seamless Leggings — a close detail of the seamless knit.
11. **olive-cycling-shorts**: Olive Cycling Shorts — the back, laid flat.
12. **white-windbreaker**: White Windbreaker — folded neatly.
13. **grey-long-sleeve-training-top**: Grey Long-Sleeve Training Top — the back, laid flat.
14. **black-track-pants**: Black Track Pants — the side, laid flat.
15. **grey-sweat-shorts**: Grey Sweat Shorts — the back, laid flat.
16. **navy-quarter-zip-top**: Navy Quarter-Zip Top — a close detail of the zip collar.

---

### sneakers — Nabd (`sports-bold`), live

**Save to: `.editions-inbox/00-live-templates/sneakers/`**

Palette for scenes: *white, concrete grey, infrared red, navy ink (periwinkle as a small extra).* Add: *"Sneakers: unbranded, no side stripes, swooshes, logos or sole lettering."*

Scenes (replace the Pexels photos; save as `scene-<slot>.png`)
- **scene-hero-tall** (1:1: the hero bento's photo tile, 4:3 on tablets, so keep the pair centred with room on every side): A pair of white canvas low-top sneakers with white laces, three-quarter view, standing on stacked sheets of infrared red and concrete grey paper, hard sunlight and a crisp shadow. *Now: Pexels 4296075, white canvas low-tops on red, orange and green paper.*
- **scene-tile-1** (1:1, category: Everyday white; cropped to a circle inside a ring: centre the pair with a small margin): A pair of white leather low-tops from above on pale concrete, toes pointing down, centred. *Now: Pexels 7193625, cream leather low-tops from above (served as a 4:3 crop from the top so the ring keeps the toes).*
- **scene-tile-2** (1:1, category: Running): A pair of grey knit runners side by side in profile on a concrete step, centred. *Now: Pexels 9207813, mint knit runners against a coral wall.*
- **scene-tile-3** (1:1, category: High-tops): A pair of black canvas high-tops with white laces standing on a concrete ledge, centred. *Now: Pexels 29253011, black canvas mid-tops pegged on a clothesline.*
- **scene-tile-4** (1:1, category: Slip-ons & canvas): A pair of navy canvas slip-ons on infrared red paper, from above, centred. *Now: Pexels 5488660, burgundy canvas low-tops on orange and blue paper.*
- **scene-banner** (16:9 across the page, a white text card overlaps its bottom end corner, which flips with the language: keep both lower corners plain; 4:3 on phones): A sneaker shop wall, three rows of pale oak shelves with single sneakers in white, cream, olive, navy and grey evenly spaced, concrete wall, the bottom shelf empty. *Now: Pexels 13807630, white and olive pairs on oak shop shelves.*
- **scene-story** (4:5, the about page): One white and navy chunky sneaker alone on a concrete plinth against an infrared red wall, large in the frame, hard side light. *Now: Pexels 11827147, one chunky sneaker on an orange shelf: the shoe fills about a tenth of the frame.*

Product angles (optional, one more view each, save as `<slug>-2.png`, same master prompt, "show the same product from <angle>")
1. **white-leather-low-top**: White Leather Low-Top — the sole, seen from below.
2. **black-mesh-runner**: Black Mesh Runner — the side profile of one shoe.
3. **black-canvas-high-top**: Black Canvas High-Top — the heel, from behind.
4. **navy-canvas-slip-on**: Navy Canvas Slip-On — the pair from straight above.
5. **white-chunky-sneaker**: White Chunky Sneaker — the side profile, showing the thick sole.
6. **grey-knit-runner**: Grey Knit Runner — a close detail of the knit upper.
7. **brown-leather-high-top**: Brown Leather High-Top — the heel, from behind.
8. **black-checker-slip-on**: Black and White Checkerboard Slip-On — the pair from straight above.
9. **white-green-heel-low-top**: White Leather Low-Top with a Green Heel — the heel, from behind.
10. **navy-orange-runner**: Navy and Orange Runner — the sole, seen from below.
11. **white-canvas-high-top**: White Canvas High-Top — the side profile of one shoe.
12. **beige-canvas-low-top**: Beige Canvas Low-Top — the pair from straight above.
13. **cream-suede-low-top**: Cream Suede Low-Top on a Gum Sole — the gum sole, seen from below.
14. **white-pink-runner**: White and Pink Runner — the side profile of one shoe.
15. **grey-suede-high-top**: Grey Suede High-Top — a close detail of the suede and laces.
16. **olive-canvas-low-top**: Olive Canvas Low-Top — the heel, from behind.

---

### womens-shoes — Kasr (`kasr`), live

**Save to: `.editions-inbox/00-live-templates/womens-shoes/`**

Palette for scenes: *white, porcelain grey, bordeaux, powder blue.* Add: *"Shoes: one pair or one shoe, the whole shoe in frame, no insole or sole lettering."*

Scenes (replace the Pexels photos; save as `scene-<slot>.png`)
- **scene-hero-wide** (16:9 shelf photo, a label card covers the top start corner, which flips with the language: keep the top third plain wall and the pair on the lower middle): One pair of nude block-heel ankle-strap sandals on a white floating shelf against a porcelain-grey wall, the upper third empty wall, soft gallery light. *Now: Pexels 14928875, gold block-heel sandals on a white floating shelf.*
- **scene-hero-side-1** (4:3 plinth tile "boots": the whole boot centred with room above the shaft): A black leather block-heel ankle boot on a white plinth against powder blue, the whole boot in frame with space above it. *Now: Pexels 27274309, a black ankle boot on a white plinth: the 4:3 crop trims the boot's top.*
- **scene-hero-side-2** (4:3 plinth tile "heels": the whole shoe centred, toe included): A bordeaux suede kitten-heel slingback on a pale wooden block against porcelain grey, toe to heel in frame. *Now: Pexels 15792209, a coral strappy heel on a wooden block: the crop trims the toe, and coral is off the palette.*
- **scene-tile-1** (3:4, category: Heels; drawn large at 4:3, so centre the pair): A pair of black patent pointed pumps on a white gallery plinth, powder-blue wall, sharp focus across both shoes. *Now: Pexels 13788573, blue suede heels on a cowhide bench: soft focus at the top.*
- **scene-tile-2** (3:4, category: Flats & ballerinas; drawn as a small thumb, so one centred pair): Black bow ballerina flats side by side on a pale shelf, seen from slightly above. *Now: Pexels 37853534, tan cross-strap ballerinas on a shop shelf.*
- **scene-tile-3** (3:4, category: Sandals; small thumb): Tan woven leather sandals on pale limestone in sunlight, centred. *Now: Pexels 38583189, tan sandals in white sand.*
- **scene-tile-4** (3:4, category: Boots; small thumb): Camel suede ankle boots standing on a porcelain-grey step, centred. *Now: Pexels 5863649, rows of ankle boots on shop shelves: too busy for a small thumb.*
- **scene-story** (16:9 wide rounded photo under the fit headline, 4:3 on phones): A long white gallery shelf against porcelain grey with four pairs spaced evenly, beige flats, bordeaux slingbacks, black pumps and camel ankle boots, soft light. *Now: Pexels 40773101, green polka-dot slingbacks on a boutique shelf: green is off the palette.*
- **scene-about** (optional, 4:5: fills `photos.about`, which Kasr's about page reads before the story, so the about page gets an upright photo): An open powder-blue shoe box with plain white tissue and a pair of nude block heels inside, on a white table, no print on the box. *Now: the about page reuses the story photo, 40773101.*
- **scene-banner** (generate 4:3: drawn 4:3 beside the sandals row and 3:4 on tablets and phones, headline on a dark fade at the foot: pair centred, bottom quiet): A pair of nude block-heel sandals on pale limestone steps in strong summer sun, a palm-frond shadow across the steps. *Now: Pexels 16217395, orange block-heel sandals on cracked concrete: orange is off the palette.*

Product angles (optional, one more view each, save as `<slug>-2.png`, same master prompt, "show the same product from <angle>")
1. **burgundy-kitten-heels**: Burgundy Suede Kitten-Heel Slingbacks — the heel and strap, from behind.
2. **beige-pointed-flats**: Beige Pointed Flats — the pair from straight above.
3. **black-pointed-pumps**: Black Patent Pointed Pumps — the side profile of one shoe.
4. **nude-block-heels**: Nude Block-Heel Ankle-Strap Sandals — the side profile of one shoe.
5. **gold-strappy-heels**: Gold Metallic Strappy Heels — a close detail of the straps.
6. **black-ballerina-flats**: Black Bow Ballerina Flats — a close detail of the bow.
7. **tan-leather-loafers-women**: Women's Tan Leather Loafers — the side profile of one shoe.
8. **silver-mary-janes**: Silver Metallic Mary Janes — the pair from straight above.
9. **white-flat-sandals**: White Two-Strap Flat Sandals — the pair from straight above.
10. **tan-woven-sandals**: Tan Woven Leather Sandals — a close detail of the weave.
11. **black-platform-sandals**: Black Platform Buckle Sandals — the side profile, showing the platform.
12. **beige-wedge-sandals**: Beige Canvas Jute Wedge Sandals — the side profile, showing the jute wedge.
13. **black-ankle-boots**: Black Leather Block-Heel Ankle Boots — the side profile of one boot.
14. **camel-suede-boots**: Camel Suede Ankle Boots — the heel, from behind.
15. **brown-knee-boots**: Brown Leather Knee Boots — the side profile of one boot.
16. **white-chelsea-boots**: White Leather Chelsea Boots — a close detail of the elastic side panel.

---

### mens-shoes — Ghorza (`ghorza`), live

**Save to: `.editions-inbox/00-live-templates/mens-shoes/`**

Palette for scenes: *white, cool steel grey, pale shoe-horn steel, espresso brown.* Add: *"Shoes: polished and new, never worn or scuffed; no insole or sole lettering; plain unlabelled tins and tools."*

Scenes (replace the Pexels photos; save as `scene-<slot>.png`)
- **scene-hero-tall** (1:1 stage, cut to 4:3 from the foot on phones, a price tag overlaps a top corner: keep the whole shoe, sole included, in the lower three quarters): One black leather cap-toe oxford, three-quarter side view, on a matte black stage under one soft top light, deep black background, a mirror shine on the toe, the shoe large in the frame. *Now: Pexels 4161710, a black cap-toe shoe on a black stage (good; regenerate so the set matches).*
- **scene-tile-1** (3:4 rounded tile, category: Loafers & moccasins): Brown leather penny loafers on a pale steel-grey shelf, three-quarter view. *Now: Pexels 19335787, brown moccasin loafers on a cream rug.*
- **scene-tile-2** (3:4, category: Oxfords & derbies): Brown wingtip brogues with cedar shoe trees on a steel-grey stand. *Now: Pexels 6765524, brown brogues with shoe trees on a shop stand.*
- **scene-tile-3** (3:4, category: Boots): A pair of brown suede Chelsea boots on a lit oak shelf, centred. *Now: Pexels 37595187, a row of Chelsea boots with blurred price tags.*
- **scene-tile-4** (3:4, category: Sandals & casual): A pair of brown leather two-strap sandals on pale planks beside a small succulent. *Now: Pexels 35059665, two-buckle suede sandals by a succulent (fine; regenerate so the set matches).*
- **scene-story** (3:4, the shine-bench story beside three ticked points, 4:3 on phones): A shoe-shine bench, black oxfords on wooden shoe trees on an espresso leather mat, plain unlabelled polish tins, horsehair brushes and a soft cloth, warm lamp light. *Now: Pexels 19165536, black oxfords on shoe trees on a cutting mat, black and white: ruler figures at the mat's edge, blurred jar labels.*
- **scene-banner** (3:4 tall photo beside the oxfords row, a 16:9 band on tablets and 4:3 on phones, copy on a dark fade at the foot: pair in the upper middle): A pair of dark brown perforated derbies on a polished walnut block, espresso background, a soft spotlight, the lower third falling into shadow. *Now: Pexels 9992898, derbies on a log in a blurred room: on phones the copy covers the shoes.*
- **scene-about** (4:5, the about page): Polished dark brown lace-up boots standing under a steel shelf with neat shoe trees and a folded cloth, cool grey wall. *Now: Pexels 5710709, worn, scuffed brown lace-up boots with dried wheat and a notebook.*

Product angles (optional, one more view each, save as `<slug>-2.png`, same master prompt, "show the same product from <angle>")
1. **brown-penny-loafers**: Brown Leather Penny Loafers — the side profile of one shoe.
2. **black-oxford-shoes**: Black Leather Oxford Shoes — the pair from straight above.
3. **brown-chelsea-boots**: Brown Suede Chelsea Boots — a close detail of the elastic side panel.
4. **white-leather-sneakers-men**: White Leather Sneakers — the sole, seen from below.
5. **navy-suede-loafers**: Navy Suede Loafers — the heel, from behind.
6. **brown-brogues**: Brown Leather Brogues — a close detail of the brogue punching.
7. **black-chelsea-boots**: Black Leather Chelsea Boots — the side profile of one boot.
8. **navy-boat-shoes**: Navy Leather Boat Shoes — a close detail of the laces and stitching.
9. **black-tassel-loafers**: Black Leather Tassel Loafers — a close detail of the tassels.
10. **dark-brown-derby-shoes**: Dark Brown Leather Derby Shoes — the side profile of one shoe.
11. **tan-desert-boots**: Tan Suede Desert Boots — the crepe sole, seen from below.
12. **brown-leather-sandals-men**: Brown Leather Sandals — the pair from straight above.
13. **tan-driving-moccasins**: Tan Suede Driving Moccasins — the pebbled sole and heel, from behind.
14. **burgundy-oxford-shoes**: Burgundy Leather Oxford Shoes — the side profile of one shoe.
15. **dark-brown-lace-up-boots**: Dark Brown Leather Lace-Up Boots — the heel, from behind.
16. **black-leather-slides-men**: Black Leather Slides — the pair from straight above.

---

### slippers-clogs — Tasfya (`tasfya`), live

**Save to: `.editions-inbox/00-live-templates/slippers-clogs/`**

Palette for scenes: *white, shallow-water aqua, pool-float pink, deep teal.* Add: *"Footwear: new and clean, unbranded, no rivet emblems, no charms, no lettering on footbeds or straps."*

Scenes (replace the Pexels photos; save as `scene-<slot>.png`)
- **scene-hero-wide** (16:9 on phones, cut to a 21:9 band on desktop: keep the pair large inside the middle band; all copy sits on the teal under the photo, and a round pink sticker overlaps its top edge): A pair of pool-float pink rubber clogs side by side on pale pool-deck concrete at the water's edge, close and low, the pair large and centred, aqua water with sun ripples behind. *Now: Pexels 9308418, blue polka-dot flip-flops on a pool deck: the pair is small even after a 1.4× zoom.*
- **scene-tile-1** (3:4 rounded tile, category: Clogs): A pair of sage green clogs on a pale pink tile, seen from slightly above. *Now: Pexels 8801134, pink clogs on pink.*
- **scene-tile-2** (3:4, category: Slides): A pair of beige cushion slides on aqua pool tiles with a wet sheen. *Now: Pexels 13836590, sage slides on dark sand.*
- **scene-tile-3** (3:4, category: Flip-flops): A pair of navy rubber flip-flops standing in white sand at the water's edge, the sea behind. *Now: Pexels 27719438, pink jelly flip-flops in sand by the sea.*
- **scene-tile-4** (3:4, category: Home slippers): A pair of new grey fluffy home slippers with clean pale soles on a light oak floor beside a white rug, window light. *Now: Pexels 12969102, fluffy slippers that look worn, with grey soles.*
- **scene-banner** (generate 4:3: one half of the two-tone block "Beach days", 3:4 on tablets, so centre the subject): Pink and teal striped beach towels on sand with a pair of black rubber slides and a pair of white flip-flops resting on them, from above. *Now: Pexels 18674213, striped towels on sand: no footwear in the photo.*
- **scene-story** (4:5, the about page): White waffle home slippers beside a woven mat on a light floor, a deep teal door ajar behind. *Now: Pexels 34667259, white waffle slippers by a woven mat.*

Product angles (optional, one more view each, save as `<slug>-2.png`, same master prompt, "show the same product from <angle>")
1. **sage-green-clog**: Sage Green Clog — the side profile of one clog.
2. **beige-cushion-slide**: Beige Cushion Slide — the side profile, showing the thick sole.
3. **white-platform-flip-flops**: White Platform Flip-Flops — the side profile, showing the platform.
4. **grey-fluffy-home-slippers**: Grey Fluffy Home Slippers — the sole, seen from below.
5. **white-classic-clog**: White Classic Clog — the heel strap, from behind.
6. **black-rubber-slide**: Black Rubber Slide — the pair from straight above.
7. **navy-rubber-flip-flops**: Navy Rubber Flip-Flops — the side profile of one flip-flop.
8. **pink-fur-slides**: Pink Fur Slides — a close detail of the fur strap.
9. **black-classic-clog**: Black Classic Clog — the pair from straight above.
10. **white-two-strap-slide**: White Two-Strap Slide — the side profile of one slide.
11. **black-flip-flops**: Black Flip-Flops — the sole, seen from below.
12. **navy-knit-home-slippers**: Navy Knit Home Slippers — a close detail of the knit.
13. **pink-platform-clog**: Pink Platform Clog — the side profile, showing the platform.
14. **brown-buckle-cork-slide**: Brown Buckle Cork Slide — a close detail of the buckles and cork.
15. **tan-leather-flip-flops**: Tan Leather Flip-Flops — the pair from straight above.
16. **beige-closed-toe-slippers**: Beige Closed-Toe Slippers — the side profile of one slipper.

---

### handbags — Shanta (`shanta`), live

**Save to: `.editions-inbox/00-live-templates/handbags/`**

Palette for scenes: *white, mineral sage grey, camel, bottle green.* Add: *"Bags: unbranded, plain clasps and hardware, no embossed marks, charms or tags."*

Scenes (replace the Pexels photos; save as `scene-<slot>.png`)
- **scene-hero-tall** (1:1 beside the copy panel, 3:4 on tablets, zooms slowly on scroll: bag centred with margin all round): One cognac leather top-handle bag on a white plinth against a mineral sage wall, dried palm leaves in a beige vase to one side, soft daylight. *Now: Pexels 5706272, one cognac bag on a plinth.*
- **scene-tile-1** (3:4, category: Totes; the name and count sit on a dark fade at the foot, keep the bottom fifth simple): A black leather tote and a beige canvas tote standing on a pale oak bench. *Now: Pexels 36367487, a taupe pebbled tote on a pale blue canvas tote.*
- **scene-tile-2** (3:4, category: Crossbody bags): A camel crossbody bag with its strap curled beside it on a sage-grey shelf, upright framing. *Now: Pexels 20591024, a black quilted chain bag on dark: a landscape shot cropped tall.*
- **scene-tile-3** (3:4, category: Clutches & evening): A gold evening clutch and a faux pearl beaded clutch on a bottle-green velvet tray. *Now: Pexels 31551512, a beaded bag with a disco ball and dried flowers behind.*
- **scene-tile-4** (3:4, category: Shoulder bags): A brown leather hobo bag hanging from a brass wall peg against a mineral sage wall. *Now: Pexels 4830929, a teal and a cognac top-handle bag among plants.*
- **scene-story** (4:5 tall photo beside the story, zooms slowly on scroll; also the about page): A close-up of camel leather with cream double stitching and a brass D-ring, the edge of a bottle-green leather strap in one corner. *Now: Pexels 12105084, dark leather, cream stitching and a steel D-ring up close.*
- **scene-anatomy** (3:4, one bag with four note dots at x/y % of the photo: the handles 63/31, the zip and pockets 75/47, the hardware 71/74, the size 42/66): One burgundy structured top-handle dome bag, front three-quarter view, a little right of centre on a plain mineral sage backdrop, its two rolled handles arching up to about a third from the top, a zip running over the top and down the right side, gold ring fittings at the handle bases and small gold metal feet at the lower right, the plain front panel filling the lower left. *Now: Pexels 22434764, a burgundy dome bag on a faintly lavender backdrop.*

Product angles (optional, one more view each, save as `<slug>-2.png`, same master prompt, "show the same product from <angle>")
1. **camel-crossbody-bag**: Camel Faux Leather Crossbody Bag — the back, with the strap laid out.
2. **white-mini-crossbody**: White Mini Crossbody Bag — open, showing the inside.
3. **olive-saddle-bag**: Olive Faux Leather Saddle Bag — the side, showing its depth.
4. **black-leather-tote**: Black Genuine Leather Tote — open from above, showing the inside.
5. **gold-evening-clutch**: Gold Evening Clutch — a close detail of the clasp.
6. **black-shoulder-bag**: Black Faux Leather Shoulder Bag — the back.
7. **beige-canvas-tote**: Beige Canvas Tote — open from above, showing the inside.
8. **black-crossbody-bag**: Black Crossbody Bag with Chain Strap — a close detail of the chain and quilting.
9. **black-satin-clutch**: Black Satin Clutch — the back.
10. **brown-hobo-bag**: Brown Genuine Leather Hobo Bag — the side, showing its depth.
11. **tan-leather-tote**: Tan Genuine Leather Tote — a close detail of the handle stitching.
12. **pearl-beaded-clutch**: Faux Pearl Beaded Clutch — a close detail of the beading.
13. **burgundy-baguette-bag**: Burgundy Faux Leather Baguette Bag — the back.
14. **woven-straw-tote**: Woven Straw Tote — a close detail of the weave.
15. **silver-chain-mini-bag**: Silver Mini Bag with Chain — open, showing the inside.
16. **cream-quilted-bag**: Cream Quilted Shoulder Bag — the side, showing its depth.

---

### glasses — Karat (`karat`), live

**Save to: `.editions-inbox/00-live-templates/glasses/`**

Palette for scenes: *blush pink paper, deep plum, mustard gold, warm white.* Add: *"Eyewear: frames unbranded, temples plain with no printing, lenses clean, reflections soft."*

Scenes (replace the Pexels photos; save as `scene-<slot>.png`)
- **scene-hero-wide** (16:9, the poster: the copy sits over a dark fade on the left and bottom; phones crop it landscape from the centre): Three frames (round tortoiseshell, a mustard-gold aviator and a plum cat-eye) on blush paper, a plum paper fold casting a crisp sun shadow, the frames centre-right, calm blush space on the left for text. *Now: Pexels 26682030, two tortoiseshell frames on pink; clean but bare, only one colour of frame.*
- **scene-hero-tall** (4:5, space for text at the top) *(not drawn by Karat)*: One red cat-eye pair standing open on a blush paper step, a soft plum shadow behind. *Now: Pexels 12693047.*
- **scene-tile-1** (3:4, category: Sunglasses; also story ring 1, shown as a small circle, so keep the subject centred): A round tortoiseshell pair, a red cat-eye pair and a gold aviator with green lenses fanned on blush paper in hard summer sun, the tinted lens shadows on the paper. *Now: Pexels 20093375.*
- **scene-tile-2** (3:4, category: Optical frames; story ring 2, centred): A thin gold round optical frame and a clear crystal frame folded side by side on plum linen beside a small folded lens cloth. *Now: Pexels 13697735.*
- **scene-tile-3** (3:4, category: Blue-light glasses; story ring 3, centred): A rose-gold cat-eye and a black round pair of clear-lens glasses resting on a closed plain laptop lid next to a white mug, cool morning light. *Now: Pexels 35597800.*
- **scene-tile-4** (3:4, category: Sport and kids; story ring 4, centred): Small pink round kids' sunglasses, a sky-blue flexible kids' frame and a white cycling shield pair on mustard-yellow paper, bright and playful. *Now: Pexels 5713793.*
- **scene-banner** (21:9, space for text in the middle) *(not drawn by Karat)*: A long blush paper sweep with five frames spaced along it, plum and mustard shadows. *Now: Pexels 1313064.*
- **scene-story** (4:5, the about page): Black and purple frames on blush paper beside a straw hat and a rolled plum beach towel, afternoon sun. *Now: Pexels 10154994, the same subject; keep it so the alt still fits.*
- **scene-lookbook-1** (1:1, the bento's large photo): Black round glasses on the seat of a beige upholstered chair, a plum cushion edge, soft window light. *Now: Pexels 7602873.*
- **scene-lookbook-2** (1:1, small, subject centred): A black rectangular frame standing open on a mustard plinth against blush. *Now: Pexels 25389282, a bare frame on white that reads like a packshot.*
- **scene-lookbook-3** (1:1, small, centred): A black double-bridge frame on pale grey-pink paper with a hard window shadow. *Now: Pexels 32398468.*
- **scene-lookbook-4** (1:1, small, centred): A black cat-eye frame lying on deep plum paper, one lens catching the light. *Now: Pexels 5752242, a frame on white, packshot-like.*
- **scene-lookbook-5** (1:1, small, centred): Mirrored sunglasses lying lenses-up, reflecting a blue summer sky with soft clouds, on warm white sand. *Now: Pexels 4696100.*
- **scene-stories-5** (1:1, shown as a small circle, centred, "Mirror lens"): Round sunglasses with blue mirrored lenses on blush paper, filling the middle of the frame. *Now: Pexels 36090899.*
- **scene-stories-6** (1:1, circle, centred, "Black frame"): A dark round frame on pale linen, folded, seen close. *Now: Pexels 30336929.*
- **scene-stories-7** (1:1, circle, centred, "Round"): Round black glasses on a beige seat seen from straight above. *Now: Pexels 7602881.*
- **scene-stories-8** (1:1, circle, centred, "Desk days"): A thin gold frame on a light wood desk beside a closed blank notebook and a pencil. *Now: Pexels 7107485, a keyboard blurred behind it.*

Product angles (optional, one more view each, save as `<slug>-2.png`, same master prompt, "show the same product from <angle>")
1. **gold-round-optical-frame**: Gold Round Optical Frame — folded, three-quarter view from above.
2. **round-tortoise-sunglasses**: Round Tortoiseshell Sunglasses — side view showing the temple.
3. **rose-gold-cat-eye-blue-light-glasses**: Rose Gold Cat-Eye Blue-Light Glasses — folded, from the front.
4. **gold-aviator-sunglasses**: Gold Aviator Sunglasses — side view showing the double bridge and the temple.
5. **kids-sky-blue-flexible-frame**: Kids Sky Blue Flexible Frame — temples folded, from above.
6. **black-square-sunglasses**: Black Square Sunglasses — three-quarter view, temples open.
7. **clear-crystal-optical-frame**: Clear Crystal Optical Frame — side view showing the clear temple and its hinge.
8. **black-round-blue-light-glasses**: Black Round Blue-Light Glasses — folded, from the front.
9. **black-red-sport-sunglasses**: Black Sport Sunglasses with Red Lenses — side view showing the wrap.
10. **black-rectangle-optical-frame**: Black Rectangular Optical Frame — folded, three-quarter view.
11. **tortoise-square-blue-light-glasses**: Tortoiseshell Square Blue-Light Glasses — side view.
12. **white-shield-cycling-sunglasses**: White Cycling Sunglasses with Blue Shield Lens — three-quarter view from above.
13. **red-cat-eye-sunglasses**: Red Cat-Eye Sunglasses — folded, from the front.
14. **tortoise-browline-optical-frame**: Tortoiseshell Browline Optical Frame — side view showing the browline and the metal rim.
15. **navy-rectangle-blue-light-glasses**: Navy Rectangular Blue-Light Glasses — folded, three-quarter view.
16. **kids-pink-round-sunglasses**: Kids Pink Round Sunglasses — side view, temples open.

---

### watches — Saat (`saat`), live

**Save to: `.editions-inbox/00-live-templates/watches/`**

Palette for scenes: *white, brushed steel grey, midnight blue, a small touch of seconds-hand red.* Add: *"Watches: unbranded, dials plain with simple baton marks and no numerals, words or logos; smartwatch screens off (black glass)."*

Scenes (replace the Pexels photos; save as `scene-<slot>.png`)
- **scene-hero-wide** (16:9, `hero-halves`: shown square on desktop beside the midnight copy half, landscape first on phones, and it zooms slowly as the page scrolls, so put the watch dead centre with room around it; no text space needed): A steel chronograph with a plain midnight-blue dial and a red seconds hand lying on dark walnut wood, raking window light along the bracelet. *Now: Pexels 190819, a steel chronograph on dark wood; strong, keep the subject.*
- **scene-hero-tall** (4:5, space for text at the top) *(not drawn by Saat)*: Watchmaker's tweezers and a case knife on a white bench, an open steel watch out of focus behind. *Now: Pexels 8327595.*
- **scene-tile-1** (3:4, category: Men's watches; shown in a round bezel ring, so centre the dial): A steel watch with a speckled navy dial standing on a small steel block on oak, window-blind shadows across it. *Now: Pexels 34069486.*
- **scene-tile-2** (3:4, category: Women's watches; round crop, centred): A slim rose-gold mesh watch and a silver mother-of-pearl dial watch laid crossed on brushed steel over midnight-blue linen, crisp light. *Now: Pexels 34833638, a small square watch on a pearl bracelet among white petals; soft, pink, off the steel and midnight palette.*
- **scene-tile-3** (3:4, category: Smart and sport; round crop, centred): A black smartwatch, screen off, and a black rubber-strap sport watch on a midnight-blue rubber mat with a steel water bottle edge, cool clean light. *Now: Pexels 13610157, a rose-gold smartwatch on a quilted cream bag; soft, reads as fashion, not sport.*
- **scene-tile-4** (3:4, category: Classic and dress; round crop, centred): A white-dial watch on a brown leather strap and a gold watch with a black dial lying on an oak bench, warm side light. *Now: Pexels 5058216, one white-dial watch on oak; keep the mood.*
- **scene-banner** (21:9, the smartwatch campaign beside the Smart and sport row: landscape on desktop, portrait on phones, so keep both watches close together in the centre; "hands or smart?"): A black smartwatch with its screen off and a steel analogue watch with a midnight dial side by side on pale grey stone, one red seconds hand the only colour. *Now: Pexels 437037, a smartwatch with an analogue face on its screen (a lit screen).*
- **scene-story** (4:5 slot, shown wide in `about-wide` and landscape on phones, so keep the movement in the centre band): An open pocket-watch movement, a case knife, a spare crystal and a spring-bar tool on a white bench, cool daylight. *Now: Pexels 8327593; a tiny stamp on the case knife.*
- **scene-about** (4:5, the about page): A watchmaker's staking set and its punches on a worn wooden bench, a loupe beside it. *Now: Pexels 8327579.*

Product angles (optional, one more view each, save as `<slug>-2.png`, same master prompt, "show the same product from <angle>")
1. **black-smartwatch-silicone-strap**: Black Smartwatch with Silicone Strap — side view showing the crown button, screen off.
2. **navy-dial-steel-watch**: Navy Dial Steel Watch — side view showing the crown.
3. **rose-gold-mesh-womens-watch**: Rose Gold Mesh Women's Watch — strap open, seen from above.
4. **brown-leather-chronograph**: Brown Leather Chronograph — side view showing the crown and pushers.
5. **black-mesh-minimal-watch**: Black Mesh Minimal Watch — the plain caseback, no engraving.
6. **silver-pearl-dial-womens-watch**: Silver Mother-of-Pearl Dial Women's Watch — three-quarter view.
7. **pink-smartwatch**: Pink Smartwatch — side view, screen off.
8. **gold-black-dial-leather-watch**: Gold Watch with Black Dial and Leather Strap — the buckle and the strap's back.
9. **silver-steel-white-dial-watch**: Silver Steel Watch with White Dial — the folding clasp, bracelet open.
10. **gold-oval-womens-watch**: Gold Oval Women's Watch — side view.
11. **black-silicone-sport-watch**: Black Sport Watch with Rubber Strap — side view showing the buttons.
12. **rose-gold-brown-leather-watch**: Rose Gold Watch with Brown Leather Strap — three-quarter view.
13. **two-tone-steel-watch**: Two-Tone Steel Watch — side view showing the crown.
14. **burgundy-leather-womens-watch**: Burgundy Leather Women's Watch — strap open, seen from above.
15. **silver-smartwatch-mesh-strap**: Round Silver Smartwatch with Mesh Strap — side view, screen off.
16. **white-ceramic-womens-watch**: White Ceramic Watch — the plain caseback, no engraving.

---

### gold-jewelry — Jewelry Luxe (`jewelry-luxe`), live

**Save to: `.editions-inbox/00-live-templates/gold-jewelry/`**

Palette for scenes: *porcelain white, ink black, champagne gold, warm stone grey.* Add: *"Jewelry: 21K yellow gold, never on skin, no hallmarks, stamps or engraved words, no price tags."*

Scenes (replace the Pexels photos; save as `scene-<slot>.png`)
- **scene-hero-wide** (16:9, the `hero-video` poster, shown alone since the pack has no video: full width under a 35% dark veil, the copy centred; phones crop it from the centre): Two granulated 21K gold bangles and a rope chain on ink-black silk, warm low side light, the pieces low in the frame, calm dark space above the centre for the copy. *Now: Pexels 20493839, two granulated bangles with a green stone on dark cloth; good, keep the mood.*
- **scene-hero-tall** (4:5, space for text at the top) *(not drawn by Jewelry Luxe)*: Two-tone gold hoops on black glass with their reflection. *Now: Pexels 3266700.*
- **scene-tile-1** (3:4, category: Bands and rings; portrait tile): Two plain gold wedding bands and a twisted ring standing on a porcelain-white stone block, champagne light. *Now: Pexels 34372573, two thin bands on white pebbles beside linen; the bands are tiny in the frame.*
- **scene-tile-2** (3:4, category: Chains and pendants): A rope chain and a Cuban link chain laid in soft curves on black velvet, a small plain gold disc pendant on one, lit from the side. *Now: Pexels 29013500, rope chains hung on a bust in a shop window: a bust reads as a mannequin and the window is busy.*
- **scene-tile-3** (3:4, category: Bangles and bracelets): Three 21K bangles stacked with a link bracelet in a shallow black lacquer tray on warm stone. *Now: Pexels 40315331, woven bangles stacked in a tray.*
- **scene-tile-4** (3:4, category: Earrings): Small gold hoops and crescent earrings on a rippled porcelain-white ceramic dish, soft shadows. *Now: Pexels 16935587, twisted hoops on rippled white.*
- **scene-banner** (21:9, space for text in the middle) *(not drawn by Jewelry Luxe)*: A long ink-black velvet counter with gold chains and bangles spaced along it, warm side light. *Now: Pexels 4295007, a coin necklace on a black bust (a bust again).*
- **scene-story** (4:5, `about-inset`: portrait on desktop, landscape on phones, so keep the balance in the centre; "gold is weighed in front of you"): A brass beam balance on a goldsmith's counter with a black weight in one pan and a small gold chain in the other, warm grey wall. *Now: Pexels 8431786, a beam balance with a black weight on grey; no gold on it.*
- **scene-about** (4:5, the about page): Two gold wedding bands in an open ink-black velvet box on porcelain silk, three dark red rose petals beside it. *Now: Pexels 29612233, bands in a red box among petals; the red takes the frame.*
- **scene-spot-photo** (4:5, `products-spotlight`: portrait on desktop, wide on tablets, landscape on phones under a 60% dark shade, so keep the pieces centred): A gold bangle, a ring and an open black ring box on champagne silk over porcelain, soft directional light. *Now: Pexels 30311749, on red and white, with an out-of-focus dark mark at the top edge.*

Product angles (optional, one more view each, save as `<slug>-2.png`, same master prompt, "show the same product from <angle>")
1. **gold-wedding-band**: Plain Wedding Band, 21K, about 2.8 g — standing on edge, side view (inside plain, no engraving).
2. **gold-rope-chain**: Rope Chain, 21K, about 8 g — clasp detail, close.
3. **gold-bangle-set**: Set of Three Bangles, 21K, about 11.5 g — the three stacked, side view.
4. **gold-small-hoops**: Small Hoop Earrings, 18K, about 1.4 g — side view showing the hinge.
5. **gold-twist-ring**: Twisted Ring, 18K, about 2.2 g — three-quarter view.
6. **gold-name-plate-pendant**: Name Plate Pendant, 21K, about 2.5 g — the plate blank, close and slightly from the side.
7. **gold-engraved-bangle**: Engraved Bangle, 21K, about 7 g — standing, side view of the pattern (no letters).
8. **gold-drop-earrings**: Drop Earrings, 18K, about 2.4 g — side view.
9. **gold-floral-ring**: Engraved Flower Ring, 21K, about 2.6 g — top view of the flower.
10. **gold-hand-pendant**: Hand Pendant, 21K, about 1.8 g — the back of the pendant, plain.
11. **gold-link-bracelet**: Link Bracelet, 18K, about 5 g — clasp detail.
12. **gold-stud-earrings**: Small Stud Earrings, 18K, about 0.9 g — side view showing the post and back.
13. **gold-wide-band-ring**: Wide Brushed Band, 21K, about 4.3 g — standing on edge, three-quarter view.
14. **gold-cuban-chain**: Cuban Link Chain, 21K, about 10.5 g — the links close, with the clasp.
15. **gold-charm-bracelet**: Coin Charm Bracelet, 21K, about 6 g — the coins close (blank, no faces or words).
16. **gold-crescent-earrings**: Crescent Earrings, 21K, about 2 g — side view.

---

### fashion-jewelry — Zahra (`zahra`), live

**Save to: `.editions-inbox/00-live-templates/fashion-jewelry/`**

Palette for scenes: *white, blush plaster, dusty rose, deep petrol blue.* Add: *"Fashion jewelry: gold-tone and silver-tone, crystals and pearls; the piece fills at least half the frame, props (stones, dried flowers) stay small."*

Scenes (replace the Pexels photos; save as `scene-<slot>.png`)
- **scene-hero-wide** (16:9, `hero-fullbleed`: copy on the photo, which drifts on scroll; phones crop it tall from the centre, so keep the pieces in the middle third, calm blush on the left and right): Gold-tone rings, a layered coin necklace and two pearl drops on blush plaster with two small dusty-rose stones, soft window light, no flowers. *Now: Pexels 9430992, silver rings, speckled stones and dried limonium; silver in a gold-led shop, and the sprigs compete with the pieces.*
- **scene-hero-tall** (4:5, space for text at the top) *(not drawn by Zahra)*: A gold chain draped over a smooth blush stone. *Now: Pexels 9430468.*
- **scene-tile-1** (3:4, category: Necklaces; tile with a caption under it): A gold layered coin necklace and a herringbone chain laid in curves on white marble, a petrol shadow edge. *Now: Pexels 4735887, two coin necklaces on marble (already fixed; this keeps it in one set).*
- **scene-tile-2** (3:4, category: Earrings): Chunky gold hoops and a pair of pearl drop earrings on white satin folds. *Now: Pexels 13081070, chunky hoops on white satin.*
- **scene-tile-3** (3:4, category: Bracelets): A gold paperclip chain bracelet, a pink beaded bracelet and a crystal tennis bracelet on a white cloud-shaped ceramic dish on blush. *Now: Pexels 36823002, one pearl bracelet on a cloud dish; small.*
- **scene-tile-4** (3:4, category: Rings): A gold signet ring, a pearl cocktail ring and a stack of thin silver rings in a pearly clay dish on white sheets, close. *Now: Pexels 9714276, rings in a clay dish; the rings sit small.*
- **scene-banner** (21:9, space for text in the middle) *(not drawn by Zahra)*: Stone-bead and gold bracelets spaced along white painted boards. *Now: Pexels 11185142.*
- **scene-story** (4:5 slot, shown square in `about-fullbleed` on desktop and landscape on phones; the gift-wrapping story): A small blush gift box half-wrapped in dusty-rose silk ribbon, an open petrol velvet ring box with a gold ring, two ribbon spools, on white linen. *Now: Pexels 4714615, vintage earrings, a velvet ring box and ribbon spools.*
- **scene-about** (landscape, the about page): Silver-tone and gold-tone rings and a fine chain around a pale shell on blush plaster. *Now: Pexels 9430429, silver rings and a chain around a shell on blush.*
- **scene-anatomy** (4:5, shown portrait at most 480 px wide, with four note dots): One gold-tone crystal necklace laid in a soft U on a pale pebble before a blush paper roll. The dots point at, in percent from the left and top: the plated clasp or bail near the top centre (51, 27), the chain running down the left (35, 43), the crystal pendant cluster low and right of centre (60, 66), and a small folded polishing cloth just left of the pendant (46, 70) for the care note. *Now: Pexels 27357178, a gold-tone crystal necklace on a pebble before pink paper; regenerate so each dot lands on its part.*

Product angles (optional, one more view each, save as `<slug>-2.png`, same master prompt, "show the same product from <angle>")
1. **gold-coin-layered-necklace**: Gold Layered Coin Necklace — the coins close (blank, no faces or words).
2. **gold-hoop-earrings**: Chunky Gold Hoop Earrings — side view showing the thickness.
3. **gold-chain-bracelet**: Gold Paperclip Chain Bracelet — clasp detail.
4. **gold-signet-ring**: Gold Signet Ring — three-quarter view, the top plain.
5. **pearl-pendant-necklace**: Pearl Pendant Necklace — the pendant close.
6. **pearl-drop-earrings**: Pearl Drop Earrings — side view.
7. **beaded-charm-bracelet**: Pink Beaded Charm Bracelet — the charms close.
8. **pearl-cocktail-ring**: Pearl Cocktail Ring — side view.
9. **gold-herringbone-necklace**: Gold Herringbone Necklace — the chain close, showing its flat sheen.
10. **crystal-stud-earrings**: Crystal Stud Earrings — side view showing the post.
11. **silver-cuff-bracelet**: Silver Cuff Bracelet — standing, side view of the opening.
12. **crystal-solitaire-ring**: Crystal Solitaire Ring — side view of the setting.
13. **silver-heart-pendant-necklace**: Silver Heart Pendant Necklace — the pendant close.
14. **silver-chain-drop-earrings**: Silver Chain Drop Earrings — hanging straight, front view.
15. **gold-tennis-bracelet**: Gold Crystal Tennis Bracelet — the clasp and a few stones close.
16. **stackable-silver-rings**: Stackable Silver Rings Set — the rings fanned apart.

---

### hair-accessories — Kholkhal (`kholkhal`), live

**Save to: `.editions-inbox/00-live-templates/hair-accessories/`**

Palette for scenes: *white, pale lilac, cherry red, butter yellow.* Add: *"Hair accessories: on paper, fabric or boxes only, never in hair or on a head; colours bright and clean."*

Scenes (replace the Pexels photos; save as `scene-<slot>.png`)
- **scene-hero-wide** (16:9, carousel slide 1, everyday clips: full width with the copy on the photo; phones crop it tall from the centre, so keep the clips in the middle third, calm paper at both sides): Pastel snap clips and small claw clips scattered on white and pale lilac paper, one cherry clip as the accent, soft top light. *Now: Pexels 8468179, pastel snap clips on white, peach and pink paper; peach and pink drift off the lilac palette.*
- **scene-hero-2** (16:9, carousel slide 2, claw clips; same crop): A large tortoise claw clip, a matte black one and a cream one in a row on a white chunky knit, window light. *Now: Pexels 20178660, one gold shell claw clip on a white knit; a single small clip.*
- **scene-hero-3** (16:9, carousel slide 3, gifts under EGP 250; same crop): An open lilac gift box holding a satin scrunchie set, a pearl barrette and gold hair pins, a cherry satin ribbon loose beside it on white. *Now: Pexels 31702117, embroidered snap clips in two rows; it doesn't say "gift".*
- **scene-hero-tall** (4:5, space for text at the top) *(not drawn by Kholkhal)*: Pearl hair pins beside a small glass jewelry box and a few peony petals. *Now: Pexels 4515450.*
- **scene-tile-1** (3:4, category: Claw clips; `categories-chips` crops it landscape on desktop and square on phones, so keep the subject in the centre): An amber tortoise claw clip on white faux fur, close. *Now: Pexels 20166053.*
- **scene-tile-2** (3:4, category: Scrunchies; centred): Three satin scrunchies in ivory, blush and champagne stacked on a round lilac box. *Now: Pexels 6044137, scrunchies on a linen box with limonium; the sprig competes.*
- **scene-tile-3** (3:4, category: Headbands; centred): A padded black velvet headband and a pearl headband on butter-yellow paper. *Now: Pexels 27592172, a fluffy teddy headband on butter yellow; not one the shop sells.*
- **scene-tile-4** (3:4, category: Pins & barrettes; centred): A pearl barrette, a black satin bow barrette and a pair of crystal slides on blush-lilac sand. *Now: Pexels 9750766, one mother-of-pearl slide on sand; small.*
- **scene-banner** (21:9 slot, the campaign beside the Scrunchies row: landscape on desktop, portrait on tablets and phones, so keep the subject in the centre): A big soft pile of velvet scrunchies (black, burgundy, green) and satin ones (ivory, blush) on pale lilac fabric, filling the middle. It carries the row, since the row's packshot thumbnails read small. *Now: Pexels 15130427, three spools of silk ribbon beside a white rose; no scrunchie in it.*
- **scene-story** (4:5, `about-split-story`, "every order tied with a bow"): A small white box tied with a cherry satin bow, a cream claw clip resting on the lid, on white paper. *Now: Pexels 30056548, a cream satin bow on white paper.*
- **scene-about** (landscape, the about page): A shop table with clips, scrunchies and headbands sorted into lilac trays, gift boxes stacked at the side. *Now: Pexels 4491555, a flower crown on gold polka-dot paper; the shop sells no flower crowns.*

Product angles (optional, one more view each, save as `<slug>-2.png`, same master prompt, "show the same product from <angle>")
1. **tortoise-claw-clip**: Large Tortoise Claw Clip — open, side view showing the spring and teeth.
2. **silk-scrunchie-set**: Satin Scrunchie Set of 3 (Ivory, Blush, Champagne) — the three in a row from above.
3. **padded-black-headband**: Padded Black Velvet Headband — side view showing the padding.
4. **pearl-barrette**: Pearl Barrette — the back with its clasp.
5. **black-matte-claw-clip**: Matte Black Claw Clip — open, side view.
6. **velvet-scrunchie-set**: Velvet Scrunchie Set of 3 (Black, Burgundy, Green) — stacked, three-quarter view.
7. **pearl-headband**: Pearl Headband — top view of the pearl band.
8. **black-bow-barrette**: Black Satin Bow Barrette — the back with its clip.
9. **cream-claw-clip**: Cream Claw Clip — open, side view.
10. **satin-bow-scrunchie**: Pink Satin Bow Scrunchie — side view of the bow.
11. **knotted-satin-headband**: Champagne Knotted Satin Headband — the knot close.
12. **gold-hair-pins-set**: Gold-Tone Hair Pin Set — the pins fanned out.
13. **pearl-mini-claw-clips**: Pearl Mini Claw Clips, Set of 4 — one open, side view.
14. **cotton-scrunchie-pack**: Cotton Scrunchie Pack of 5 (Neutrals) — stacked into a short tower.
15. **tortoise-thin-headband**: Thin Tortoise Headband — side view.
16. **crystal-hair-slides**: Crystal Hair Slides, Pair — one slide open, from the side.

---

### belts-wallets — Tibr (`jewelry-warm`), live

**Save to: `.editions-inbox/00-live-templates/belts-wallets/`**

Palette for scenes: *cordovan brown, canvas grey, brass, white paper.* Add: *"Leather goods: genuine leather, no stamped maker's marks, no printed boxes or tags; finished pieces, not just raw hides."*

Scenes (replace the Pexels photos; save as `scene-<slot>.png`)
- **scene-hero-wide** (16:9, `hero-fullbleed`: the copy on the photo, parallax and fade on scroll; phones crop it tall from the centre, so keep the subject in the middle third): A leatherworker's bench: a tan hide, a round knife, an awl and a stitching wheel, with a finished brown belt coiled and a bifold wallet at the centre, warm workshop light, a calm darker area at one side for text. *Now: Pexels 6653239, tools on a tan hide; no finished piece in it.*
- **scene-hero-tall** (4:5, space for text at the top) *(not drawn by Tibr)*: The edge of a tan hide over pale weathered planks. *Now: Pexels 4452397.*
- **scene-tile-1** (3:4, category: Belts): Three rolled leather belts, black, brown and tan braided, with silver and brass buckles on canvas-grey cloth. *Now: Pexels 31323080, three rolled belts with gunmetal buckles; good, keep.*
- **scene-tile-2** (3:4, category: Wallets): A tan grained bifold wallet, half open, and a navy zip wallet on folds of black cloth. *Now: Pexels 6127090, one tan wallet on black cloth.*
- **scene-tile-3** (3:4, category: Card holders & clips): A brown card holder with plain blank cards half out, a green card holder and a tan money clip wallet fanned on cordovan leather. *Now: Pexels 4452516, rolls of brown, burgundy and teal leather; no card holder in it (the weakest tile).*
- **scene-tile-4** (3:4, category: Key holders & small goods): A black key case with its snap open, a brown leather key ring on a plain brass ring and a black coin pouch on light wood. *Now: Pexels 37326800, snap-flap pouches with contrast stitching.*
- **scene-banner** (21:9 slot, the workshop band in `about-overlap`: shown wide on desktop and landscape on phones with a text card overlapping one side, so keep the subject in the other two thirds): Leather tools, a waxed thread spool and cut wallet pieces on a green cutting mat with no printing, under a brass work lamp. *Now: Pexels 4452611; the stamps on the blades are blurred but there.*
- **scene-story** (4:5, the care block beside four care steps: portrait on desktop, landscape on phones; also the about page): A brown belt and a black wallet beside an unlabelled tin of leather balm, a soft cloth and a horsehair brush on canvas grey. *Now: Pexels 4452395, a cognac hide over darker hides; it shows no care and no finished piece.*

Product angles (optional, one more view each, save as `<slug>-2.png`, same master prompt, "show the same product from <angle>")
1. **brown-leather-belt**: Brown Leather Belt, Brass Buckle — the buckle close, three-quarter view.
2. **black-bifold-wallet**: Black Leather Bifold Wallet — open flat, showing the card slots.
3. **brown-card-holder**: Brown Leather Card Holder — the back, plain.
4. **tan-passport-cover**: Tan Leather Passport Cover — open flat, the inside pockets.
5. **black-leather-belt**: Black Leather Belt, Silver Buckle — the buckle close.
6. **navy-zip-wallet**: Navy Leather Zip-Around Wallet — open, showing the inside.
7. **green-card-holder**: Green Leather Card Holder — side view showing the edges and stitching.
8. **black-key-holder**: Black Leather Key Case — open, the key hooks showing.
9. **tan-braided-belt**: Tan Braided Leather Belt — the weave and the buckle close.
10. **brown-bifold-wallet**: Brown Leather Bifold Wallet — open flat.
11. **tan-money-clip-wallet**: Tan Leather Money Clip Wallet — the back, showing the steel clip.
12. **brown-leather-keychain**: Brown Leather Key Ring — side view.
13. **reversible-black-brown-belt**: Reversible Black and Brown Leather Belt — the brown back turned out, the swivel buckle close.
14. **tan-long-wallet**: Tan Leather Long Wallet — open flat.
15. **black-card-holder**: Black Leather Card Holder — side view showing the edges.
16. **black-coin-pouch**: Black Leather Coin Pouch — snap open, three-quarter view.

---

### silver-jewelry — Fadda (`fadda`), live (native: no pack)

**Save to: `.editions-inbox/00-live-templates/silver-jewelry/`**

Palette for scenes: *cool grey paper, pale stone grey, polished silver, graphite.* Add: *"Sterling silver, polished or brushed, no hallmarks or engraved words; on stone, linen or boxes, never on skin."*

Fadda has no pack: its photos are in `templates/fadda/index.ts` (`PHOTOS`), and **its eight products are Pexels photos too**. One photo (1378705) is the hero, the Rings tile and a product. These scenes replace them. The silver-jewelry pack planned in the main file (16 packshots, 8 scenes) can come later.

Scenes (replace the Pexels photos; save as `scene-<slot>.png`)
- **scene-hero** (1:1, `hero-split`: square on desktop at 620 px or taller, portrait on tablets, square on phones; the copy sits in the other half, so the ring sits centred): One sculpted, organic sterling silver ring standing on dark graphite stone, a single cool light raking across its surface, deep soft shadow. *Now: Pexels 1378705, a sculpted ring on a dark surface; good, but it is also the Rings tile and the ring's product photo.*
- **scene-tile-1** (3:4, category: Rings; portrait tile): Three different sterling silver rings (sculpted, plain and twisted) standing on a pale grey river stone on grey linen. *Now: Pexels 1378705, the hero photo again.*
- **scene-tile-2** (3:4, category: Stacks): A stack of five thin silver rings on a slim silver cone (a ring stand), cool window light on pale stone. *Now: Pexels 1378706, the hero's own shoot.*
- **scene-tile-3** (3:4, category: Bridal): A silver ring with a single clear stone in an open graphite velvet box on pale grey silk. *Now: Pexels 27405174.*
- **scene-tile-4** (3:4, category: Bands): Two plain sterling silver bands, one brushed and one polished, leaning together on a pale grey stone slab. *Now: Pexels 35205571, also a product photo here and already used by another template.*
- **scene-tile-5** (3:4, category: Selections): Eight silver rings set in a shallow grey linen ring tray, from slightly above. *Now: Pexels 16063791, a ring tray; also the Ring Selection product photo.*
- **scene-about** (4:5, the about page): A silversmith's bench in a small Downtown Cairo studio: a bench pin, files, a ring mandrel, silver wire and small dishes of pieces, cool daylight from a tall window. *Now: Pexels 33873069, a silversmith's bench with tools and dishes; already used elsewhere.*

Product photos and angles. The **main packshot is required** here, since each one replaces a Pexels photo: save as `<slug>.png` with the packshot master prompt. The angle is optional, as `<slug>-2.png`.
1. **sculpted-silver-ring**: Sculpted Silver Ring. Packshot: a sculpted organic sterling silver ring, three-quarter view. Angle: side view.
2. **leaf-pair-rings**: Silver Ring Pair. Packshot: two slim silver rings with a leaf texture, side by side. Angle: the two rings interlocked, from above.
3. **everyday-stack**: Everyday Stack of Five. Packshot: five thin silver rings stacked, front view. Angle: the five rings fanned apart.
4. **eternity-stack**: Stone-set Stack. Packshot: three thin silver rings set with small clear stones, stacked. Angle: the stones close, from the side.
5. **promise-ring**: Gem-set Promise Ring. Packshot: a fine silver ring with one small pale blue stone. Angle: the setting from the side.
6. **engagement-ring-box**: Engagement Ring in a Box. Packshot: a silver solitaire ring in an open grey velvet box, no lettering. Angle: the ring out of the box, three-quarter view.
7. **engraved-bands**: Engraved Band Pair. Packshot: two plain silver bands, the inside blank (no letters). Angle: both bands standing on edge, side view.
8. **ring-tray-set**: Ring Selection. Packshot: six assorted silver rings laid in a small row. Angle: the six rings in a loose circle, from above.

---

### phone-cases — Volt (`volt`), live

**Save to: `.editions-inbox/00-live-templates/phone-cases/`**

Palette for scenes: *white, navy, electric blue, lime.* Add: *"Phones and cases: unbranded, no logo or camera-maker mark on the back, screens off (black glass) or blank white."*

Volt draws only the category tiles and the about page photo. Its hero is a big word with the first featured product's packshot.

Scenes (replace the Pexels photos; save as `scene-<slot>.png`)
- **scene-hero-wide** (16:9, space for text on one side) *(not drawn by Volt)*: A lilac silicone case on light wood beside two small plants. *Now: Pexels 2718446.*
- **scene-hero-tall** (4:5, space for text at the top) *(not drawn by Volt)*: A red matte case on dry autumn leaves. *Now: Pexels 11059612.*
- **scene-tile-1** (3:4, category: Clear cases; `categories-chips` crops it landscape on desktop and square on phones, so keep it centred): A phone in a clear magnetic case lying back-up on white, a navy phone body showing through the case, an electric-blue shadow edge, close on the corners. *Now: Pexels 13780411, a clear case on a blush phone on dark granite.*
- **scene-tile-2** (3:4, category: Silicone cases; centred): Sage, pink, navy and black silicone cases stacked in a loose fan on white, a lime accent paper beneath. *Now: Pexels 32912373, purple, blue and white cases on black; dark against Volt's white page.*
- **scene-tile-3** (3:4, category: Leather, wallet & rugged; centred): A brown leather case, a black faux-leather wallet flip case open with blank cards, and a black rugged case on its kickstand, on navy cloth. *Now: Pexels 19784109, one black rugged case with a ring stand on a desk.*
- **scene-tile-4** (3:4, category: Protectors & straps; centred): A sheet of tempered glass with its fitting frame, a camera lens protector and a beaded phone strap beside a phone (screen off) on white. *Now: Pexels 11028408, a phone under a palm shadow; you can't see the protector.*
- **scene-banner** (21:9, space for text in the middle) *(not drawn by Volt)*: A phone, screen off, on dark grained leather. *Now: Pexels 1350462.*
- **scene-story** (4:5, the about page): A phone in a white bumper case, screen off, beside round glasses and a plain notebook on navy linen. *Now: Pexels 8100970, the same subject on black linen with a blank white screen.*

Product angles (optional, one more view each, save as `<slug>-2.png`, same master prompt, "show the same product from <angle>")
1. **clear-magnetic-case**: Clear Magnetic Case — the inside, showing the magnetic ring.
2. **sage-silicone-case**: Sage Silicone Case — side view showing the buttons.
3. **brown-leather-case**: Brown Genuine Leather Case — the inside, the soft lining.
4. **tempered-glass-protector**: Tempered Glass Protector with Fitting Frame — the glass lifted out of its frame.
5. **clear-slim-case**: Clear Slim Case — side view showing the thin edge.
6. **black-silicone-case**: Black Silicone Case — the inside, the soft lining.
7. **black-wallet-flip-case**: Black Faux Leather Wallet Flip Case — open flat, the card slots.
8. **camera-lens-protector**: Camera Lens Protector — the protector beside its applicator, from above.
9. **clear-bumper-case**: Clear Bumper Case with Reinforced Corners — a corner close.
10. **pink-silicone-case**: Pink Silicone Case — side view.
11. **tan-card-slot-case**: Tan Faux Leather Card Slot Case — the slot with a blank card half in.
12. **beaded-phone-strap**: Beaded Phone Strap — laid in a loop, from above.
13. **frosted-black-case**: Frosted Case with Black Edges — side view showing the black edge.
14. **navy-silicone-case**: Navy Silicone Case — the inside.
15. **black-rugged-case**: Black Rugged Case with Kickstand — the kickstand open, side view.
16. **crossbody-phone-lanyard**: Black Crossbody Phone Lanyard — the clip and the strap coiled.

---

### chargers-cables — Kabl (`kabl`), live

**Save to: `.editions-inbox/00-live-templates/chargers-cables/`**

Palette for scenes: *cool grey, navy, electric blue, soft yellow.* Add: *"Chargers and cables: unbranded, no printed watts, specs or marks on the plugs, phone screens off."*

Kabl draws the category tiles and the about page photo. Its hero is a search bar with no photo.

Scenes (replace the Pexels photos; save as `scene-<slot>.png`)
- **scene-hero-wide** (16:9, space for text on the right) *(not drawn by Kabl)*: A laptop corner, a black phone and a white charger with its cable coiled on beige. *Now: Pexels 5208870.*
- **scene-hero-tall** (4:5, space for text at the top) *(not drawn by Kabl)*: A phone, screen off, on a bamboo stand beside a notebook on marble. *Now: Pexels 6373172.*
- **scene-tile-1** (3:4, category: Chargers; portrait tile): A black GaN charger, a white 20 W charger and a black car charger standing in a row on cool grey, plugs facing the light. *Now: Pexels 16886336, white chargers in a power strip; faint embossed marks.*
- **scene-tile-2** (3:4, category: Cables): A black braided USB-C cable, a white USB-C cable and a 3-in-1 cable coiled neatly side by side on navy cloth. *Now: Pexels 5208819, two white chargers with coiled cables on beige; it looks like the Chargers tile.*
- **scene-tile-3** (3:4, category: Power banks): A black 20000 mAh power bank, a white magnetic one and a small pink one stacked on cool grey stone with a cable looped in front. *Now: Pexels 947407, a black battery on red leather; the red fights the palette.*
- **scene-tile-4** (3:4, category: Wireless charging): A phone, screen off, lying on a round white charging pad beside a black 3-in-1 stand on a soft-yellow desk. *Now: Pexels 5083491, a phone on a pad; its screen shows a faint battery line.*
- **scene-banner** (21:9, space for text in the middle) *(not drawn by Kabl)*: Two phones, screens off, charging side by side with white braided cables. *Now: Pexels 1028674.*
- **scene-story** (4:5, the about page): A white charger, a braided USB-C cable and a grey power bank on pale marble, soft daylight. *Now: Pexels 3921706, the same subject; keep it so the alt still fits.*

Product angles (optional, one more view each, save as `<slug>-2.png`, same master prompt, "show the same product from <angle>")
1. **black-65w-gan-charger**: Black 65W GaN Charger (2× USB-C + USB-A) — the ports side, close.
2. **black-braided-usb-c-cable-2m**: Black Braided USB-C Cable, 2 m — the plug and braid close.
3. **black-20000mah-power-bank**: Black 20000mAh Power Bank — the ports end.
4. **black-3-in-1-wireless-stand**: Black 3-in-1 Wireless Charging Stand — side view.
5. **white-20w-usb-c-charger**: White 20W USB-C Fast Charger — the port side and the pins.
6. **white-usb-c-cable-1m**: White USB-C Cable, 1 m — the two plugs close.
7. **white-10000mah-power-bank**: White 10000mAh Power Bank — the ports end.
8. **white-wireless-charging-pad**: White Wireless Charging Pad — side view showing its thin profile.
9. **white-dual-port-charger**: White Dual-Port Charger (USB-C + USB-A) — the ports close.
10. **white-usb-c-to-lightning-cable**: White USB-C to Lightning Cable (for iPhone) — the two plugs close.
11. **white-magnetic-power-bank**: White Magnetic Wireless Power Bank — the back, showing the magnetic ring.
12. **white-wireless-charging-stand**: White Wireless Charging Stand — side view.
13. **black-car-charger**: Black Car Charger — the ports end.
14. **black-3-in-1-cable**: Black 3-in-1 Braided Cable — the three tips fanned out.
15. **pink-mini-power-bank**: Pink Mini Power Bank — the port end.
16. **black-magnetic-car-mount**: Black Magnetic Wireless Car Mount — side view showing the vent clip.

---

### pc-gaming — Arena (`arena`), live

**Save to: `.editions-inbox/00-live-templates/pc-gaming/`**

Palette for scenes: *near-black, violet light, lime accent, cool graphite.* Add: *"Gaming gear: unbranded, RGB glow soft and violet, no logos on mice, headsets or controllers, monitors off or showing a plain dark gradient."*

Arena's page is dark, so its about page shows `photos.dark.story`. The light `story` is shown by no look.

Scenes (replace the Pexels photos; save as `scene-<slot>.png`)
- **scene-hero-wide** (16:9, `hero-fullbleed` on the dark page: the copy reads over the dark upper half; phones crop it tall from the centre): A dark gaming desk in the lower third: a plain keyboard, a mouse, a headset on a stand and one wide curved monitor that is off, with a soft violet wall glow, a calm near-black space above for text. *Now: Pexels 1820328, three monitors showing a mountain dawn (lit screens with content).*
- **scene-hero-tall** (4:5, space for text at the top) *(not drawn by Arena)*: A white and red mechanical keyboard on navy. *Now: Pexels 13728045.*
- **scene-tile-1** (3:4, category: Keyboards; portrait tile): A black mechanical keyboard, keycaps lit from below in violet to lime, close and angled on a dark desk mat. *Now: Pexels 37722338, keycaps lit blue to pink.*
- **scene-tile-2** (3:4, category: Mice): A black honeycomb lightweight mouse side-on on a dark mat, a violet glow behind it. *Now: Pexels 19120448, a black mouse with a red monitor glow.*
- **scene-tile-3** (3:4, category: Headsets & audio): A black gaming headset with a boom mic on a headset stand, a dark desk, violet rim light, nothing behind it. *Now: Pexels 7858756, a black and red headset with a blurred screen behind it.*
- **scene-tile-4** (3:4, category: Controllers & desk gear): A black wireless gamepad and a USB desk microphone on a dark desk mat, a lime light edge. *Now: Pexels 27271924, one pale grey controller on a dark mat.*
- **scene-banner** (21:9, space for text in the middle) *(not drawn by Arena)*: A black controller in low violet light. *Now: Pexels 14205160.*
- **scene-story** (4:5, space for text at the top) *(not drawn by Arena, the light story)*: A light corner desk by a window: a curved monitor that is off, a headset on a stand, a controller and plants. *Now: Pexels 28350931.*
- **scene-story-dark** (4:5, Arena's about page, `photos.dark.story`): An empty dark game lounge with two low armchairs and two white controllers on a small lime table, violet ceiling light. *Now: Pexels 7862237, two white controllers on a yellow table.*
- **scene-video-poster** (16:9, the `video-shop` player; with no video file the poster shows as a still above the product row, so keep the subject centred): A white wireless mouse and a white compact keyboard on a black desk mat, a soft violet glow from one side. *Now: Pexels 17821147, a lone white mouse on black.*

Product angles (optional, one more view each, save as `<slug>-2.png`, same master prompt, "show the same product from <angle>")
1. **black-full-size-gaming-keyboard**: Black Full-Size Gaming Keyboard with Wrist Rest — side profile showing the key height.
2. **white-wireless-gaming-mouse**: White Wireless Gaming Mouse — side view showing the thumb buttons.
3. **black-gaming-headset-boom-mic**: Black Gaming Headset with Boom Mic — side view with the mic lowered.
4. **black-wireless-gamepad**: Black Wireless Gamepad — the top edge, showing the triggers.
5. **pink-compact-mechanical-keyboard**: Pink Compact Mechanical Keyboard — side profile.
6. **black-honeycomb-lightweight-mouse**: Black Honeycomb Lightweight Mouse — from above, the honeycomb shell.
7. **black-red-gaming-headset**: Black and Red Gaming Headset — the ear cushions from the inside.
8. **black-usb-desk-microphone**: Black USB Desk Microphone — side view on its stand.
9. **black-mechanical-keyboard-white-keycaps**: Black Mechanical Keyboard with White Keycaps — a corner close, the switches showing.
10. **black-wired-gaming-mouse**: Black Wired Gaming Mouse — side view with the cable.
11. **white-gaming-headset-boom-mic**: White Gaming Headset with Boom Mic — side view.
12. **black-xl-desk-mousepad**: Black Large Desk Mousepad — rolled half open, showing the stitched edge.
13. **white-compact-mechanical-keyboard**: White Compact Mechanical Keyboard — side profile.
14. **black-vertical-ergonomic-mouse**: Black Vertical Ergonomic Mouse — the side where the thumb rests.
15. **black-gaming-earbuds-case**: Black Gaming Earbuds — the case open with the earbuds inside, from above.
16. **black-headset-stand**: Black Headset Stand — side view, empty.

---

### lighting-smart-home — Zaki (`zaki`), live

**Save to: `.editions-inbox/00-live-templates/lighting-smart-home/`**

Palette for scenes: *pale green-grey walls, deep green, teal, warm yellow lamplight; bright daytime rooms.* Add: *"Lighting: lamps lit softly even in daylight, no visible brand on bulbs or plugs, phone and hub screens off; Egyptian flats, tiled or wood floors, no clutter."*

Zaki shows the pack's **`perLook.zaki`** store (Nawwara) and its photos. The pack's own photos (Dayy: hero 7045363 and 11125319, tiles 20056503, 13806238, 34771394, 29099976, banner 5400775, story 38014632, dark story 14161060) belong to `nour`, the other look, so they are not listed here.

Scenes (replace the Pexels photos; save as `scene-<slot>.png`)
- **scene-hero-wide** (16:9, `hero-halves`: cropped square from the centre on desktop beside the copy half, landscape on phones; no text space needed, centre the lights): A bright white kitchen in a Cairo flat, three black dome pendants lit warm over a pale green-grey island, morning daylight. *Now: Pexels 6283972, a white kitchen with three black pendants over the island; keep the subject.*
- **scene-hero-tall** (4:5, space for text at the top) *(not drawn by Zaki)*: A pale floor lamp lit in a bright corner by a window. *Now: Pexels 6508354.*
- **scene-tile-1** (3:4, category: Pendants & chandeliers; `categories-feature-list` crops it landscape, so keep the lights in the middle band): Two clear glass globe pendants and a rattan dome lit over a wooden dining table in daylight. *Now: Pexels 12202390, clear glass pendants over a kitchen.*
- **scene-tile-2** (3:4, category: Floor lamps): A wooden tripod floor lamp lit beside a deep green armchair against a pale panelled wall. *Now: Pexels 11545385, a pale floor lamp by a blue panelled wall; the blue is off palette.*
- **scene-tile-3** (3:4, category: Table & desk lamps): A black metal desk lamp and a terracotta mushroom lamp, both lit, on a light wood desk in sunlit leaf shadows. *Now: Pexels 31410610, a wooden desk lamp in leaf shadows.*
- **scene-tile-4** (3:4, category: Smart lighting): Warm teal-to-amber LED strip glowing under a floating shelf, a smart bulb lit in a white ceramic lamp and a phone face-down beside it. *Now: Pexels 28940512, bulbs, a plug and a camera on white; flat, and the camera isn't sold.*
- **scene-banner** (21:9, space for text in the middle) *(not drawn by Zaki)*: A long bright living room with three lamps lit at different heights. *Now: Pexels 5849392.*
- **scene-story** (4:5, the about page): A lit white ceramic table lamp beside a potted plant on a light wooden desk against a pale green-grey wall, warm afternoon light. *Now: Pexels 32543097, a lit table lamp beside a plant on a wooden desk.*

Product angles (optional, one more view each, save as `<slug>-2.png`, same master prompt, "show the same product from <angle>")
1. **brass-table-lamp-linen-shade**: Brass Table Lamp with Linen Shade — lit, three-quarter view.
2. **gold-three-ring-chandelier**: Gold Three-Ring Chandelier — from below, the rings stacked.
3. **black-arc-floor-lamp**: Black Arc Floor Lamp — side view showing the full arc.
4. **smart-led-strip-5m**: 5 m Smart LED Strip — the reel half unrolled, lit warm.
5. **glass-globe-pendant-light**: Glass Globe Pendant Light — lit.
6. **white-smart-led-bulb**: White Smart LED Bulb — lit warm, side view.
7. **wood-tripod-floor-lamp**: Wooden Tripod Floor Lamp — lit, three-quarter view.
8. **black-metal-desk-lamp**: Black Metal Desk Lamp — side view with the arm raised.
9. **rattan-dome-pendant-light**: Rattan Dome Pendant Light — lit, from slightly below.
10. **amber-filament-smart-bulb**: Amber Filament Smart Bulb — lit, the filament glowing.
11. **gold-slim-floor-lamp**: Slim Gold Floor Lamp — the shade close, lit.
12. **white-ceramic-table-lamp**: White Ceramic Table Lamp — lit.
13. **black-gold-dome-pendant-light**: Black and Gold Dome Pendant Light — from below, the gold inside lit.
14. **white-smart-night-lamp**: White Smart Night Lamp — lit soft warm.
15. **paper-column-floor-lamp**: Paper Column Floor Lamp — lit, the paper glowing.
16. **terracotta-mushroom-table-lamp**: Terracotta Mushroom Table Lamp — lit, side view.

---

## Later waves: every other niche (2026-11-12)

The rest of the platform's niches, so you can make photos ahead of time. Same rules: one ChatGPT chat per niche with the master prompt for the 16 packshots (numbered in the order to save them), a second chat with the scene master prompt for the 8 scenes, files in `.editions-inbox/<wave>/<niche>/`. Each wave is one industry; I pick and redesign one template per niche when its photos arrive (`docs/systems/one-template-per-niche.md` §4), and switch the industry when all its niches are in.

| Wave | Industry | Niches | Niche ids | Images |
|---|---|---|---|---|
| 2 | Beauty | 5 | skincare, makeup, perfumes, haircare, mens-grooming | 120 |
| 3 | Home | 5 | furniture, bedding-textiles, decor, plants-garden, home-organisation | 120 |
| 4 | Kitchen | 4 | cookware, tableware, coffee-gear, kitchen-appliances | 96 |
| 5 | Food | 6 | grocery, fresh-produce, meat-poultry, bakery, spices-herbs, fast-food | 144 |
| 6 | Sweets | 4 | oriental-sweets, chocolate-cakes, coffee-beans, dates-nuts | 96 |
| 7 | Kids | 4 | toys, baby-essentials, kids-gifts, school-supplies | 96 |
| 8 | Sports | 6 | gym-fitness, football, running, cycling, outdoor-camping, yoga | 144 |
| 9 | Health | 3 | vitamins-supplements, pharmacy-care, medical-devices | 72 |
| 10 | Pets | 3 | pet-food, pet-accessories, fish-birds | 72 |
| 11 | Auto | 6 | car-accessories, car-care, tyres-batteries, motorcycle, car-interior, ev-charging | 144 |
| 12 | Handmade | 4 | handmade-gifts, ceramics, candles-soap, crochet-embroidery | 96 |
| 13 | Books & stationery | 3 | books, stationery, kids-books | 72 |

## Wave 2: Beauty (5 niches)

### skincare (16)

**Save to: `.editions-inbox/02-wave-2-beauty/skincare/`**

Palette for scenes: *milky white, pale peach, soft clay, sea-glass green.* Add: *"Skincare: plain unlabelled bottles, jars and tubes in frosted glass or soft matte plastic, caps closed, no text, no printed lines or logos on any container."*

Cleansers & toners
1. **foaming-face-cleanser**: A plain unlabelled white pump bottle of foaming face cleanser.
2. **gel-cleanser-tube**: A plain unlabelled soft peach squeeze tube of gel cleanser, standing on its cap.
3. **rose-water-toner**: A plain unlabelled clear glass bottle of pale pink rose water toner with a white cap.
4. **micellar-water-bottle**: A plain unlabelled tall clear bottle of micellar water with a flip cap.

Serums
5. **vitamin-c-serum**: A plain unlabelled amber glass dropper bottle of serum.
6. **hyaluronic-serum**: A plain unlabelled frosted glass dropper bottle of clear serum.
7. **niacinamide-serum**: A plain unlabelled white dropper bottle of serum with a matte white bulb.
8. **night-repair-oil**: A plain unlabelled small dark green glass bottle of face oil with a dropper.

Moisturisers
9. **day-cream-jar**: A plain unlabelled round white jar of moisturiser, lid closed.
10. **open-gel-cream-jar**: A plain unlabelled frosted glass jar of light gel cream, lid off beside it, the cream smooth.
11. **eye-cream-tube**: A small plain unlabelled peach tube of eye cream with a metal tip.
12. **shea-body-lotion**: A plain unlabelled cream pump bottle of body lotion.

Sunscreen & masks
13. **sunscreen-spf-tube**: A plain unlabelled white squeeze tube of sunscreen with an orange cap.
14. **clay-face-mask-jar**: A plain unlabelled shallow jar of green clay mask, lid off, the clay surface smooth.
15. **sheet-masks-set**: Three plain unlabelled pastel foil sachets of sheet masks fanned out.
16. **lip-balm-tin**: A small plain unlabelled round silver tin of lip balm, open, the balm inside.

Scenes
- **scene-hero-wide**: Frosted serum bottles and a cream jar on a pale clay stone ledge with water ripples of light and a sprig of eucalyptus, space for text on the left.
- **scene-hero-tall**: One amber dropper bottle on a wet sea-glass green tile with soft morning light, space for text at the top.
- **scene-tile-1**: A cleanser bottle and a rose water toner by a white basin with a folded linen towel.
- **scene-tile-2**: Three dropper bottles standing in a row on a peach plaster shelf, side light.
- **scene-tile-3**: An open cream jar on a round travertine tray with a little dried flower.
- **scene-tile-4**: A sunscreen tube and a clay mask jar on a sunny balcony ledge with a palm leaf shadow.
- **scene-banner**: A long white marble bathroom shelf with skincare bottles spaced out, calm and wide.
- **scene-story**: A small clean workshop bench with glass beakers, empty bottles, aloe leaves and clay powder in bowls.

---

### makeup (16)

**Save to: `.editions-inbox/02-wave-2-beauty/makeup/`**

Palette for scenes: *deep rose, warm nude, black lacquer, soft gold.* Add: *"Makeup: generic unbranded cases in plain colours, no embossing, no logo on caps or compacts; lipsticks shown with the bullet up, compacts open when asked."*

Lips
1. **red-matte-lipstick**: A red matte lipstick in a plain gold case, cap off beside it, the bullet up.
2. **nude-lipstick**: A warm nude lipstick in a plain black case, cap off, the bullet up.
3. **pink-lip-gloss**: A plain unlabelled clear tube of pink lip gloss with its wand lying beside it.
4. **lip-liner-trio**: Three wooden lip liner pencils in nude, rose and berry, laid diagonally.

Face
5. **liquid-foundation-bottle**: A plain unlabelled frosted glass bottle of beige liquid foundation with a black pump.
6. **pressed-powder-compact**: A round black compact of pressed powder, open, the mirror showing only white.
7. **blush-compact**: A square plain compact of rose blush, open.
8. **concealer-wand**: A plain unlabelled concealer tube with its doe-foot applicator beside it.

Eyes
9. **nude-eyeshadow-palette**: An open plain black eyeshadow palette of twelve nude and bronze shades, smooth pans.
10. **black-mascara**: A plain unlabelled black mascara tube with the wand lying beside it.
11. **liquid-eyeliner-pen**: A plain black liquid eyeliner pen, cap off.
12. **kohl-pencil**: A black kohl eye pencil in plain wood, sharpened.

Brushes & tools
13. **makeup-brush-set**: Seven makeup brushes with black handles and gold ferrules fanned out.
14. **beauty-sponge-trio**: Three teardrop makeup sponges in pink, nude and black.
15. **brush-roll-case**: A black faux-leather brush roll case, partly unrolled with brushes inside.
16. **eyelash-curler**: A plain gold eyelash curler lying flat.

Scenes
- **scene-hero-wide**: Lipsticks, an open palette and a powder compact on a deep rose satin cloth with soft gold light, space for text on the right.
- **scene-hero-tall**: A single red lipstick standing on a black lacquer tray with a strong soft shadow, space for text at the top.
- **scene-tile-1**: Lipsticks and glosses standing in a small brass cup on a nude plaster table.
- **scene-tile-2**: A foundation bottle and an open compact on a vanity with a round mirror showing only a plain wall.
- **scene-tile-3**: An open eyeshadow palette beside mascara and eyeliner on rose silk, from above.
- **scene-tile-4**: Makeup brushes in a ceramic cup on a vanity table by a window.
- **scene-banner**: A long dressing table with makeup spaced along it, warm gold side light.
- **scene-story**: A calm makeup studio counter with clean brushes drying on a towel, empty palettes and swatch cards with plain colour.

---

### perfumes (16)

**Save to: `.editions-inbox/02-wave-2-beauty/perfumes/`**

Palette for scenes: *deep amber, smoked oud brown, ivory, antique brass.* Add: *"Perfume: plain unlabelled glass bottles in simple generic shapes (cylinder, square, round), no engraving, never a copy of a known perfume bottle or cap; liquid colour visible."*

Eau de parfum
1. **amber-square-perfume**: A plain unlabelled square glass bottle of amber perfume with a black cap.
2. **clear-cylinder-perfume**: A plain unlabelled tall clear glass cylinder bottle of pale perfume with a silver cap.
3. **rose-round-perfume**: A plain unlabelled round flat glass bottle of pale pink perfume with a gold cap.
4. **dark-oud-perfume**: A plain unlabelled heavy dark smoked-glass bottle of perfume with a wooden cap.

Oud & oils
5. **oud-oil-vial**: A small plain unlabelled cut-glass vial of oud oil with a gold stopper.
6. **musk-roll-on-oil**: A plain unlabelled slim glass roll-on of white musk oil.
7. **attar-oil-set**: Three small plain unlabelled glass attar bottles with gold tops on a wooden tray.
8. **oud-wood-chips-jar**: A plain unlabelled glass jar of dark oud wood chips, lid off.

Bakhoor & burners
9. **brass-incense-burner**: A brass mabkhara incense burner with a domed perforated lid, unlit.
10. **wood-incense-burner**: A dark wood and brass square incense burner, unlit.
11. **bakhoor-tin**: A plain unlabelled round brass tin of bakhoor pieces, open.
12. **incense-charcoal-tongs**: A small brass tongs and a pack of round charcoal tablets in a plain white box.

Body mists & gift sets
13. **body-mist-spray**: A plain unlabelled tall frosted spray bottle of peach body mist.
14. **body-splash-bottle**: A plain unlabelled clear flip-cap bottle of pale blue body splash.
15. **perfume-gift-box**: A plain black gift box, lid off, with two unlabelled perfume bottles in ivory satin.
16. **travel-perfume-atomiser**: A plain gold refillable travel perfume atomiser.

Scenes
- **scene-hero-wide**: An amber perfume bottle on an antique brass tray with curls of incense smoke and warm evening light, space for text on the left.
- **scene-hero-tall**: A dark oud bottle on a carved wood box against an ivory wall with a mashrabiya shadow, space for text at the top.
- **scene-tile-1**: Three perfume bottles on an ivory marble plinth, soft side light.
- **scene-tile-2**: Oud oil vials and wood chips on a brass plate on dark wood.
- **scene-tile-3**: A brass incense burner with gentle smoke in a dim room with warm lamp light.
- **scene-tile-4**: A perfume gift box open on ivory satin with dried rose petals.
- **scene-banner**: A long dark wood shelf with perfume bottles spaced out and soft amber backlight.
- **scene-story**: An old perfumer's counter in a souk without signs, rows of plain glass bottles and brass funnels.

---

### haircare (16)

**Save to: `.editions-inbox/02-wave-2-beauty/haircare/`**

Palette for scenes: *olive green, warm cream, honey, pale terracotta.* Add: *"Hair care: plain unlabelled bottles, jars and tubes, no text; tools unbranded with cables neatly coiled."*

Shampoo & conditioner
1. **olive-shampoo-bottle**: A plain unlabelled olive green pump bottle of shampoo.
2. **cream-conditioner-bottle**: A plain unlabelled cream flip-cap bottle of conditioner.
3. **curly-hair-shampoo**: A plain unlabelled honey-coloured squeeze bottle of curl shampoo.
4. **shampoo-bar**: A round honey-coloured solid shampoo bar on a small wooden dish.

Oils & serums
5. **argan-hair-oil**: A plain unlabelled amber glass bottle of hair oil with a dropper.
6. **rosemary-hair-oil**: A plain unlabelled clear glass bottle of golden oil with a rosemary sprig inside.
7. **hair-serum-pump**: A plain unlabelled small frosted pump bottle of hair serum.
8. **leave-in-spray**: A plain unlabelled cream spray bottle of leave-in conditioner.

Masks & treatments
9. **hair-mask-jar**: A plain unlabelled wide cream jar of hair mask, lid off, the mask smooth.
10. **keratin-treatment-kit**: Two plain unlabelled white bottles and a tub of a keratin kit, standing together.
11. **henna-powder-bag**: A clear unlabelled bag of green henna powder, sealed.
12. **hair-cream-bath-tub**: A plain unlabelled terracotta tub of hair cream bath, lid on.

Tools
13. **cream-hair-dryer**: A cream and gold hair dryer with a nozzle.
14. **ceramic-curling-wand**: A black ceramic curling wand with its cable coiled.
15. **wooden-paddle-brush**: A wooden paddle hair brush with rubber pins.
16. **wide-tooth-comb**: A honey-coloured wide-tooth wooden comb.

Scenes
- **scene-hero-wide**: Shampoo and oil bottles on a pale terracotta bathroom shelf with olive branches and soft sun, space for text on the right.
- **scene-hero-tall**: One amber hair oil bottle beside a rosemary sprig on cream linen, warm light, space for text at the top.
- **scene-tile-1**: Shampoo and conditioner bottles on the edge of a cream tiled bath with water droplets.
- **scene-tile-2**: Hair oil bottles on a honey wood tray with olives and rosemary.
- **scene-tile-3**: An open hair mask jar beside a folded towel and a wooden comb.
- **scene-tile-4**: A hair dryer and a curling wand resting on a terracotta vanity.
- **scene-banner**: A long sunlit bathroom counter with haircare bottles spaced along it.
- **scene-story**: A small mixing room with copper pots, glass jars of oils, dried herbs and henna powder in bowls.

---

### mens-grooming (16)

**Save to: `.editions-inbox/02-wave-2-beauty/mens-grooming/`**

Palette for scenes: *charcoal, cognac leather, slate, brushed chrome.* Add: *"Grooming: plain unlabelled bottles, tins and jars, tools unbranded, no blades exposed beyond what is normal for the product."*

Shaving
1. **chrome-safety-razor**: A brushed chrome double-edge safety razor, standing.
2. **shaving-brush**: A shaving brush with a dark wood handle and soft bristles.
3. **shaving-cream-jar**: A plain unlabelled black jar of shaving cream, lid off, the cream white.
4. **aftershave-bottle**: A plain unlabelled square glass bottle of blue aftershave with a black cap.

Beard care
5. **beard-oil-dropper**: A plain unlabelled dark glass dropper bottle of beard oil.
6. **beard-balm-tin**: A plain unlabelled round black tin of beard balm, open.
7. **beard-comb-wood**: A dark wood beard comb.
8. **boar-bristle-beard-brush**: An oval boar-bristle beard brush with a walnut back.

Clippers & trimmers
9. **cordless-hair-clipper**: A black cordless hair clipper with a guard on, standing.
10. **foil-shaver**: A charcoal foil shaver with its cap on.
11. **nose-ear-trimmer**: A slim silver nose and ear trimmer.
12. **clipper-guards-set**: A set of eight black clipper guards in graduated sizes laid in a row.

Hair styling
13. **matte-hair-clay-tin**: A plain unlabelled round slate tin of hair clay, open.
14. **pomade-jar**: A plain unlabelled amber glass jar of pomade with a black lid.
15. **barber-comb-set**: Three black barber combs in different sizes.
16. **grooming-travel-bag**: A cognac leather grooming travel bag, closed.

Scenes
- **scene-hero-wide**: A safety razor, a shaving brush and an aftershave on a slate counter in a dark barber-style bathroom with warm side light, space for text on the left.
- **scene-hero-tall**: A beard oil bottle on a cognac leather tray against a charcoal wall, space for text at the top.
- **scene-tile-1**: A shaving set on a chrome stand by a basin with a folded towel.
- **scene-tile-2**: Beard oil, balm and a comb on a walnut board.
- **scene-tile-3**: A clipper and trimmer resting on a charcoal stone shelf.
- **scene-tile-4**: Open clay and pomade tins on a slate tray, from above.
- **scene-banner**: A long barber counter with grooming tools lined up, a big empty chair softly blurred.
- **scene-story**: An empty classic barber shop in Cairo with a leather chair, chrome tools on a tray and a mirror reflecting only the room.

---

## Wave 3: Home (5 niches)

### furniture (16)

**Save to: `.editions-inbox/03-wave-3-home/furniture/`**

Palette for scenes: *warm walnut, oatmeal bouclé, travertine beige, deep forest green.* Add: *"Furniture: one piece alone, three-quarter view from slightly above, the whole piece in frame, no cushions with prints, no objects on it unless stated, unbranded."*

Living room
1. **oatmeal-three-seat-sofa**: An oatmeal fabric three-seat sofa with low wooden legs.
2. **green-velvet-armchair**: A deep forest green velvet armchair with a rounded back.
3. **l-shape-corner-sofa**: A light grey L-shaped corner sofa (rokna) with a chaise on the right.
4. **round-travertine-coffee-table**: A round travertine stone coffee table on a thick pedestal.

Bedroom
5. **upholstered-queen-bed**: A beige upholstered queen bed with a tall padded headboard, made with plain white bedding.
6. **walnut-nightstand**: A walnut two-drawer nightstand with brass knobs.
7. **oak-sliding-wardrobe**: A light oak two-door sliding wardrobe, doors closed.
8. **cane-dresser**: A walnut chest of six drawers with woven cane fronts.

Dining
9. **oval-oak-dining-table**: An oval light oak dining table for six on tapered legs, bare.
10. **boucle-dining-chair**: An oatmeal bouclé dining chair with walnut legs.
11. **walnut-sideboard**: A long low walnut sideboard with fluted doors.
12. **rattan-bar-stool**: A rattan counter stool with a black metal frame.

Office & storage
13. **oak-writing-desk**: A slim light oak writing desk with one drawer.
14. **ergonomic-office-chair**: A black mesh ergonomic office chair on castors.
15. **open-oak-bookcase**: A tall open light oak bookcase, empty.
16. **tv-unit-walnut**: A low walnut TV unit with two closed cabinets, nothing on top.

Scenes
- **scene-hero-wide**: A sunlit Cairo apartment living room with an oatmeal sofa, a travertine coffee table and tall windows with sheer curtains, space for text on the left.
- **scene-hero-tall**: A green velvet armchair by an arched window with a long afternoon light patch on a terrazzo floor, space for text at the top.
- **scene-tile-1**: A corner sofa in a calm living room with a jute rug.
- **scene-tile-2**: A made bed with a walnut nightstand and a linen lamp in morning light.
- **scene-tile-3**: An oak dining table with bouclé chairs under a paper pendant lamp.
- **scene-tile-4**: An oak desk and an office chair by a window with a plant.
- **scene-banner**: A wide open-plan room with sofa, dining table and sideboard in soft daylight, seen straight on.
- **scene-story**: A carpentry workshop in Damietta with wood planks, clamps, a half-finished chair frame and sawdust in the sunlight.

---

### bedding-textiles (16)

**Save to: `.editions-inbox/03-wave-3-home/bedding-textiles/`**

Palette for scenes: *crisp white, dusty blue, sand linen, soft sage.* Add: *"Textiles: neatly folded and stacked, or laid flat seen from straight above, edges straight, no labels or tags, no prints with words."*

Bed sheets & sets
1. **white-cotton-sheet-set**: A white cotton bed sheet set folded in a neat stack with two pillowcases on top.
2. **dusty-blue-sheet-set**: A dusty blue percale sheet set, folded and stacked.
3. **sand-linen-duvet-cover**: A sand washed-linen duvet cover set, folded and stacked.
4. **striped-sheet-set**: A white and sage fine-striped sheet set, folded and stacked.

Duvets & blankets
5. **white-quilted-duvet**: A thick white quilted duvet, folded in thirds.
6. **sage-knit-throw**: A sage chunky knit throw blanket, loosely folded.
7. **grey-fleece-blanket**: A soft grey fleece blanket, folded in a square.
8. **sand-bed-coverlet**: A sand quilted coverlet with diamond stitching, folded.

Pillows & towels
9. **white-bed-pillow**: A plump white rectangular bed pillow, lying flat.
10. **linen-cushion-cover**: A sand linen cushion with a plain piped edge.
11. **white-towel-stack**: Three white cotton bath towels folded and stacked by size.
12. **blue-bath-towel-set**: A dusty blue bath towel, hand towel and face cloth, folded and stacked.

Curtains & rugs
13. **sheer-white-curtain**: A sheer white curtain panel, folded with its top tape showing.
14. **blackout-curtain-blue**: A dusty blue blackout curtain panel, folded.
15. **jute-round-rug**: A round natural jute rug, seen from above.
16. **cream-shaggy-rug**: A rectangular cream shaggy rug, seen from above.

Scenes
- **scene-hero-wide**: A freshly made bed in white and dusty blue linens in a bright bedroom with tall windows and sheer curtains moving slightly, space for text on the right.
- **scene-hero-tall**: Folded sheets stacked on a wooden stool by a window with soft morning light, space for text at the top.
- **scene-tile-1**: A bed made with sand linen, softly rumpled, seen from the side.
- **scene-tile-2**: A sage knit throw draped over the end of a bed.
- **scene-tile-3**: White towels folded on a wooden bathroom ladder by a basin.
- **scene-tile-4**: Sheer curtains in sunlight over a jute rug on a terrazzo floor.
- **scene-banner**: A long linen cupboard with open shelves of folded sheets in white, blue, sand and sage.
- **scene-story**: A textile workshop with bolts of cotton and linen, a sewing machine and folded samples on a long table.

---

### decor (16)

**Save to: `.editions-inbox/03-wave-3-home/decor/`**

Palette for scenes: *terracotta, ivory plaster, black iron, dried-grass gold.* Add: *"Decor: unbranded objects; wall art shows abstract shapes or landscapes only, no faces, no letters or calligraphy; mirrors reflect only plain white; clocks have plain faces with simple marks, no numbers."*

Wall art & frames
1. **abstract-canvas-print**: A framed canvas of soft terracotta and ivory abstract shapes, front view.
2. **desert-landscape-print**: A framed print of a minimal desert dune landscape in a thin oak frame.
3. **black-frame-set**: Three empty thin black picture frames of different sizes, leaning together.
4. **woven-wall-hanging**: A cream macramé wall hanging on a wooden rod.

Vases & pottery
5. **terracotta-amphora-vase**: A tall terracotta vase with a matte unglazed finish.
6. **ivory-ribbed-vase**: An ivory ceramic ribbed vase.
7. **black-bud-vase-trio**: Three small black ceramic bud vases of different heights.
8. **dried-pampas-bunch**: A bunch of dried pampas grass in a clear glass vase.

Mirrors & clocks
9. **round-arched-mirror**: A tall arched wall mirror in a thin black iron frame, reflecting only plain white.
10. **rattan-sunburst-mirror**: A round rattan sunburst mirror, reflecting only plain white.
11. **wood-wall-clock**: A round walnut wall clock with a plain face, simple marks and black hands, no numbers.
12. **iron-wall-clock**: A large black iron open-frame wall clock with no numbers.

Candles & accents
13. **brass-ramadan-lantern**: A brass fanoos lantern with coloured glass panes, unlit.
14. **ceramic-candle-holders**: Two terracotta candle holders with ivory pillar candles, unlit.
15. **marble-decor-bowl**: A shallow white marble decorative bowl, empty.
16. **wooden-bead-garland**: A natural wooden bead garland with a tassel, laid in a curve.

Scenes
- **scene-hero-wide**: An ivory plaster wall with an arched mirror, a terracotta vase of dried grass and a low wooden bench, warm afternoon sun, space for text on the left.
- **scene-hero-tall**: A brass lantern on a terracotta floor with patterned light cast on an ivory wall, space for text at the top.
- **scene-tile-1**: An abstract canvas above a low console in a calm living room.
- **scene-tile-2**: Vases of different heights on a plaster shelf with dried grass.
- **scene-tile-3**: A rattan mirror and a wall clock on an ivory wall above a cane chair.
- **scene-tile-4**: Lanterns and candle holders grouped on a wooden tray at dusk.
- **scene-banner**: A long plaster niche shelf with pottery and dried flowers spaced along it.
- **scene-story**: A pottery studio with a wheel, unglazed terracotta vases drying on shelves and clay dust in sunlight.

---

### plants-garden (16)

**Save to: `.editions-inbox/03-wave-3-home/plants-garden/`**

Palette for scenes: *leaf green, sun-baked terracotta, whitewash, warm sand.* Add: *"Plants: healthy, real, shown in a plain pot fully in frame; seed packets, soil and fertiliser in plain unlabelled paper or clear bags with no text."*

Indoor plants
1. **monstera-in-pot**: A monstera plant in a white ceramic pot.
2. **snake-plant-pot**: A tall snake plant in a terracotta pot.
3. **fiddle-leaf-fig**: A small fiddle-leaf fig tree in a woven basket pot.
4. **pothos-hanging-pot**: A trailing pothos in a white hanging pot with a rope hanger.

Succulents & cacti
5. **succulent-trio**: Three small succulents in matching terracotta pots.
6. **barrel-cactus**: A round barrel cactus in a sand-coloured concrete pot.
7. **aloe-vera-pot**: An aloe vera plant in a whitewashed clay pot.
8. **jade-plant-pot**: A small jade plant with thick round leaves in a white pot.

Pots & planters
9. **terracotta-pot-set**: Three empty terracotta pots in graduated sizes with saucers.
10. **white-ceramic-planter**: An empty white ceramic planter on short wooden legs.
11. **rattan-plant-basket**: An empty woven rattan plant basket.
12. **balcony-rail-planter**: An empty long green balcony rail planter.

Seeds & garden tools
13. **seed-packets-set**: Four plain unlabelled kraft paper seed packets fanned out.
14. **potting-soil-bag**: A plain unlabelled clear bag of dark potting soil, sealed.
15. **garden-hand-tools**: A trowel, a hand fork and pruning shears with wooden handles laid side by side.
16. **metal-watering-can**: A sage green metal watering can with a long spout.

Scenes
- **scene-hero-wide**: A sunny whitewashed Cairo rooftop with potted plants, terracotta pots and a bougainvillea on the wall, space for text on the right.
- **scene-hero-tall**: A monstera by a tall window with leaf shadows on a whitewashed wall, space for text at the top.
- **scene-tile-1**: Indoor plants grouped on a wooden plant stand in a bright living room.
- **scene-tile-2**: Succulents and cacti on a sunny windowsill.
- **scene-tile-3**: Empty terracotta pots stacked on a garden bench.
- **scene-tile-4**: Garden tools and seed packets on a potting table with spilled soil.
- **scene-banner**: A long garden path lined with potted plants in late-afternoon sun.
- **scene-story**: A plant nursery greenhouse with rows of seedlings in trays, a hose coiled and warm filtered light.

---

### home-organisation (16)

**Save to: `.editions-inbox/03-wave-3-home/home-organisation/`**

Palette for scenes: *clean white, pale grey, light birch, soft butter.* Add: *"Storage: unbranded, empty unless stated, shown closed and square to the camera at a slight angle, no labels or label holders with writing."*

Storage boxes & bins
1. **clear-stacking-boxes**: Three clear plastic stacking storage boxes with white lids, stacked.
2. **fabric-storage-cube**: A pale grey fabric storage cube with side handles.
3. **underbed-storage-bag**: A white zip under-bed storage bag with a clear window, empty and flat.
4. **birch-lidded-box**: A light birch wooden box with a lid.

Baskets
5. **seagrass-basket-handles**: A round seagrass basket with handles, empty.
6. **white-laundry-hamper**: A tall white woven laundry hamper with a lid.
7. **wire-basket-set**: Two white metal wire baskets, nested.
8. **cotton-rope-basket**: A butter yellow cotton rope basket, empty.

Closet & hangers
9. **velvet-hangers-set**: Ten slim grey velvet hangers stacked neatly.
10. **drawer-divider-set**: A set of pale grey fabric drawer organiser trays of different sizes.
11. **over-door-hook-rack**: A white metal over-door rack with six hooks.
12. **shoe-rack-birch**: A three-tier light birch shoe rack, empty.

Kitchen & bathroom
13. **spice-rack-tiered**: An empty white three-tier spice rack.
14. **pantry-jars-set**: Four clear unlabelled pantry jars with bamboo lids.
15. **under-sink-organiser**: A two-tier white under-sink sliding organiser, empty.
16. **bathroom-caddy**: A pale grey corner bathroom shelf caddy, empty.

Scenes
- **scene-hero-wide**: A calm white walk-in closet with birch shelves, folded clothes in grey boxes and soft daylight, space for text on the left.
- **scene-hero-tall**: A tidy pantry shelf with clear jars of rice, lentils and pasta, space for text at the top.
- **scene-tile-1**: Stacked storage boxes on a birch shelf in a bright room.
- **scene-tile-2**: Baskets of folded towels under a white console.
- **scene-tile-3**: An open drawer with organiser trays and folded scarves, from above.
- **scene-tile-4**: A white bathroom with a caddy holding plain unlabelled bottles.
- **scene-banner**: A long wall of open white shelves with matching boxes and baskets, perfectly ordered.
- **scene-story**: A small stockroom with neat rows of baskets and boxes on metal shelves, soft light.

---

## Wave 4: Kitchen (4 niches)

### cookware (16)

**Save to: `.editions-inbox/04-wave-4-kitchen/cookware/`**

Palette for scenes: *charcoal granite, copper, warm cream, olive wood.* Add: *"Cookware: unbranded, no logos stamped on handles or bases, lids on unless stated, shown empty and clean at a slight three-quarter angle from above."*

Pots & sets
1. **granite-pot-set**: A set of three charcoal granite-coated pots with glass lids, nested in a pyramid.
2. **cream-granite-casserole**: A cream granite-coated casserole pot with a glass lid.
3. **stainless-stock-pot**: A tall stainless steel stock pot with a lid.
4. **pressure-cooker**: A stainless steel pressure cooker with a black handle, lid locked.

Pans
5. **granite-frying-pan**: A charcoal granite-coated frying pan with a wood-look handle.
6. **cast-iron-skillet**: A black cast iron skillet.
7. **copper-saute-pan**: A copper sauté pan with a brass handle.
8. **granite-grill-pan**: A square charcoal grill pan with ridges.

Ovenware & tagines
9. **clay-tagine-pot**: A traditional Egyptian unglazed clay tagine (tajin) dish, round and shallow.
10. **enamel-baking-tray**: A cream enamel rectangular baking tray with handles.
11. **round-oven-tray-sinia**: A large round aluminium oven tray (sinia).
12. **glass-oven-dish**: A rectangular clear glass oven dish, empty.

Utensils & knives
13. **olive-wood-utensils**: Four olive wood cooking utensils: a spoon, a spatula, a slotted spoon and a fork, laid side by side.
14. **silicone-utensil-set**: A black silicone utensil set standing in a round holder.
15. **chef-knife-block**: A wooden knife block holding five kitchen knives, handles up.
16. **wooden-chopping-board**: A thick olive wood chopping board with a handle.

Scenes
- **scene-hero-wide**: A warm cream kitchen with a granite pot on the hob, copper pans hanging on a rail and soft steam in morning light, space for text on the left.
- **scene-hero-tall**: A clay tagine on an olive wood board with tomatoes and herbs around it, space for text at the top.
- **scene-tile-1**: A set of pots stacked on a cream tiled counter.
- **scene-tile-2**: A cast iron skillet and a frying pan on a black stone hob.
- **scene-tile-3**: A round oven tray of roast potatoes on a rustic table, from above.
- **scene-tile-4**: Olive wood utensils in a ceramic jar beside a chopping board.
- **scene-banner**: A long kitchen counter with pots, pans and a knife block spaced out, warm side light.
- **scene-story**: An old Cairo metalwork shop with copper pots on shelves, a hammer and a small anvil on a worn bench.

---

### tableware (16)

**Save to: `.editions-inbox/04-wave-4-kitchen/tableware/`**

Palette for scenes: *porcelain white, cobalt blue, linen beige, gold rim.* Add: *"Tableware: unbranded, no stamps or text on the base, plain or simple geometric patterns only, clean and empty unless stated."*

Dinnerware
1. **white-porcelain-dinner-set**: A white porcelain dinner set: a dinner plate, a side plate and a bowl, stacked.
2. **gold-rim-dinner-set**: A white dinner set with a thin gold rim, stacked.
3. **cobalt-pattern-plates**: Two plates with a cobalt blue geometric border pattern, one leaning on the other.
4. **stoneware-bowl-set**: Four beige speckled stoneware bowls, stacked.

Glassware & mugs
5. **clear-water-glasses**: Six clear tumblers in a neat group.
6. **gold-rim-juice-glasses**: Four tall glasses with a gold rim, in a row.
7. **ceramic-mug-pair**: Two white ceramic mugs with cobalt handles.
8. **glass-water-jug**: A clear glass water jug with a slim neck.

Tea & coffee sets
9. **egyptian-tea-glasses-set**: Six small clear Egyptian tea glasses on matching saucers with small spoons.
10. **porcelain-tea-set**: A white porcelain teapot with four cups and saucers, gold rim.
11. **turkish-coffee-cups-set**: Six small white Turkish coffee cups on saucers with gold detail.
12. **brass-serving-tray**: A round engraved brass serving tray, empty, plain geometric pattern.

Cutlery & serving
13. **gold-cutlery-set**: A gold cutlery set for one: fork, knife, spoon and teaspoon, laid side by side.
14. **steel-cutlery-set**: A brushed steel cutlery set for one, laid side by side.
15. **wooden-serving-board**: A long acacia wood serving board with a handle, empty.
16. **porcelain-serving-platter**: A large oval white porcelain serving platter, empty.

Scenes
- **scene-hero-wide**: A long dining table set for a family meal with white and gold plates, linen napkins and tea glasses, warm sunset light, space for text on the right.
- **scene-hero-tall**: A stack of white plates and cobalt-patterned bowls on a linen cloth, space for text at the top.
- **scene-tile-1**: A single place setting on a beige linen tablecloth, from above.
- **scene-tile-2**: Glasses and a water jug on a sunny windowsill with light through them.
- **scene-tile-3**: Tea glasses with tea on a brass tray on a balcony table at golden hour.
- **scene-tile-4**: Cutlery and a serving board on a white table with a folded napkin.
- **scene-banner**: A wide Ramadan iftar table with dishes, dates and tea glasses, seen straight on, no people.
- **scene-story**: A porcelain workshop with plain white plates drying on racks and a brush and cobalt paint pots on a bench.

---

### coffee-gear (16)

**Save to: `.editions-inbox/04-wave-4-kitchen/coffee-gear/`**

Palette for scenes: *espresso brown, brushed steel, sand ceramic, matte black.* Add: *"Coffee gear: unbranded, no logos, no dials with numbers, scales with the display off; never a copy of a known brand's iconic design."*

Turkish coffee
1. **copper-kanaka**: A small copper Turkish coffee pot (kanaka) with a long brass handle.
2. **steel-kanaka-set**: Three brushed steel kanakas in graduated sizes.
3. **brass-hand-grinder**: A tall brass Turkish manual coffee grinder.
4. **sand-coffee-heater**: A small copper tray of hot sand for brewing Turkish coffee, with one kanaka in it.

Pour-over & brewers
5. **ceramic-v-dripper**: A sand ceramic cone coffee dripper on a glass server.
6. **glass-french-press**: A glass and steel French press, plunger up.
7. **steel-moka-pot**: An octagonal steel stovetop moka pot.
8. **gooseneck-kettle**: A matte black gooseneck pour-over kettle.

Espresso & machines
9. **black-espresso-machine**: A compact matte black espresso machine with one portafilter, no labels.
10. **capsule-coffee-machine**: A small simple matte black capsule coffee machine, generic box shape.
11. **steel-portafilter**: A steel espresso portafilter with a wooden handle.
12. **milk-frothing-pitcher**: A brushed steel milk frothing pitcher.

Grinders & tools
13. **burr-coffee-grinder-black**: A matte black electric burr coffee grinder with a clear bean hopper.
14. **coffee-scale-off**: A slim black coffee scale with its display off.
15. **espresso-tamper**: A steel espresso tamper with a walnut handle.
16. **coffee-canister**: A matte black airtight coffee canister, closed.

Scenes
- **scene-hero-wide**: A home coffee corner on a sand stone counter with an espresso machine, a grinder and two cups, early morning light, space for text on the left.
- **scene-hero-tall**: A copper kanaka with foamy Turkish coffee next to a small cup on a brass tray, space for text at the top.
- **scene-tile-1**: Kanakas and a brass grinder on a wooden shelf.
- **scene-tile-2**: A ceramic dripper brewing into a glass server with soft steam, side light.
- **scene-tile-3**: A portafilter and a frothing pitcher beside an espresso machine on a black counter.
- **scene-tile-4**: A grinder, scale and tamper on a walnut board, from above.
- **scene-banner**: A long specialty coffee bar counter with brewers lined up, no screens, soft light.
- **scene-story**: A small roastery-style workbench with green beans in a sack, a hand grinder and brewing tools.

---

### kitchen-appliances (16)

**Save to: `.editions-inbox/04-wave-4-kitchen/kitchen-appliances/`**

Palette for scenes: *soft white, terracotta red, pale oat, stainless steel.* Add: *"Appliances: unbranded, no logos, no display digits or button labels, cables tidy, doors and lids closed unless stated."*

Food prep
1. **food-processor-white**: A white food processor with a clear bowl and lid.
2. **terracotta-stand-mixer**: A terracotta red stand mixer with a steel bowl, head down.
3. **steel-hand-blender**: A stainless steel hand blender with a whisk and a chopper bowl beside it.
4. **electric-hand-mixer**: A white electric hand mixer with two beaters.

Juicers & blenders
5. **slow-juicer**: A white vertical slow juicer.
6. **citrus-press**: A stainless steel electric citrus press with a cone on top.
7. **personal-blender-bottle**: A small oat-coloured personal blender with a travel bottle.
8. **high-power-blender**: A steel high-power blender with a tall clear jar.

Cooking
9. **countertop-electric-oven**: A stainless steel countertop electric oven with a glass door, empty.
10. **white-microwave**: A white microwave oven with a plain door and no display numbers.
11. **multi-rice-cooker**: A white electric rice cooker with a lid.
12. **contact-grill**: A black contact grill with ridged plates, closed.

Breakfast & snacks
13. **sandwich-maker**: A terracotta red sandwich maker, closed.
14. **waffle-maker**: A round black waffle maker, closed.
15. **egg-boiler**: A small white electric egg boiler with a clear dome.
16. **popcorn-maker**: A red hot-air popcorn maker.

Scenes
- **scene-hero-wide**: A bright oat-and-white kitchen with a terracotta stand mixer, a food processor and fresh ingredients in bowls, morning sun, space for text on the right.
- **scene-hero-tall**: A stand mixer with a bowl of dough on a pale oat counter, flour dusted, space for text at the top.
- **scene-tile-1**: A food processor and a hand blender on a counter with chopped vegetables.
- **scene-tile-2**: A juicer beside a bowl of oranges and a glass of juice.
- **scene-tile-3**: A countertop oven with a golden baked tray inside, warm light.
- **scene-tile-4**: A sandwich maker and a waffle maker on a breakfast table with fruit.
- **scene-banner**: A long white kitchen counter with appliances spaced out and a window of daylight.
- **scene-story**: A tidy appliance shop with boxes without labels on shelves and appliances displayed on white plinths.

---

## Wave 5: Food (6 niches)

### grocery (16)

**Save to: `.editions-inbox/05-wave-5-food/grocery/`**

Palette for scenes: *wheat beige, market red, kraft brown, fresh green.* Add: *"Grocery: every pack is a plain unlabelled clear bag, jar, bottle, tin or carton with no text, no printed design and no brand; the food inside clearly visible where the pack is clear."*

Rice, pasta & pulses
1. **egyptian-rice-bag**: A plain unlabelled clear bag of short-grain Egyptian rice, sealed.
2. **pasta-penne-bag**: A plain unlabelled clear bag of penne pasta, sealed.
3. **brown-lentils-bag**: A plain unlabelled clear bag of brown lentils, sealed.
4. **fava-beans-bag**: A plain unlabelled clear bag of dried fava beans (ful), sealed.

Oils, jars & tins
5. **sunflower-oil-bottle**: A plain unlabelled clear bottle of sunflower oil with a yellow cap.
6. **tahini-jar**: A plain unlabelled glass jar of tahini with a white lid.
7. **black-honey-jar**: A plain unlabelled glass jar of Egyptian black honey (molasses).
8. **plain-food-tins**: Three plain unlabelled silver food tins stacked.

Dairy & cheese
9. **white-cheese-block**: A block of Egyptian white cheese (gebna beida) on a plain white plate.
10. **roumy-cheese-wedge**: A wedge of aged roumy cheese on a plain white plate.
11. **milk-bottle-plain**: A plain unlabelled clear bottle of fresh milk.
12. **plain-yogurt-cups**: Four plain unlabelled white yogurt cups.

Tea, sugar & breakfast
13. **loose-black-tea-tin**: A plain unlabelled round tin of loose black tea, lid off, tea leaves visible.
14. **white-sugar-bag**: A plain unlabelled clear bag of white sugar, sealed.
15. **halawa-tahiniya-tub**: A plain unlabelled clear tub of halawa tahiniya.
16. **mixed-jam-jars**: Three plain unlabelled small glass jars of apricot, strawberry and fig jam.

Scenes
- **scene-hero-wide**: A neat neighbourhood grocery shelf of plain jars, sacks of rice and lentils and baskets of eggs in warm light, no signs, space for text on the left.
- **scene-hero-tall**: Open kraft sacks of rice, lentils and beans with wooden scoops, from slightly above, space for text at the top.
- **scene-tile-1**: Clear jars of rice, pasta and lentils lined up on a wooden shelf.
- **scene-tile-2**: Oil bottles and tahini jars on a sunny pantry shelf.
- **scene-tile-3**: White cheese, roumy and olives on a wooden board on a breakfast table.
- **scene-tile-4**: A tea glass, sugar bowl and jam jars on a white tablecloth in morning light.
- **scene-banner**: A wide pantry with neatly ordered plain jars and baskets, seen straight on.
- **scene-story**: A small family grocery counter with a scale (display off), sacks of grains and an old wooden drawer cabinet.

---

### fresh-produce (16)

**Save to: `.editions-inbox/05-wave-5-food/fresh-produce/`**

Palette for scenes: *leaf green, tomato red, crate wood, sunshine yellow.* Add: *"Produce: fresh, raw, washed and neat, the real colours, piled in a small group or alone on white, no stickers, no crates or baskets unless stated."*

Vegetables
1. **ripe-tomatoes**: A small pile of ripe red tomatoes.
2. **baladi-cucumbers**: A group of small Egyptian baladi cucumbers.
3. **green-bell-peppers**: Three green bell peppers.
4. **purple-eggplants**: Two round purple eggplants.

Fruits
5. **egyptian-mangoes**: Three ripe Egyptian mangoes, yellow-green with a red blush.
6. **fresh-guavas**: A small pile of ripe yellow-green guavas, one cut in half showing pink flesh.
7. **navel-oranges**: A small pile of navel oranges, one with a leaf.
8. **red-grapes-bunch**: A bunch of red grapes.

Greens & herbs
9. **molokhia-leaves-bunch**: A fresh bunch of molokhia leaves.
10. **parsley-dill-bunch**: A bunch of flat parsley and a bunch of dill, side by side.
11. **fresh-mint-bunch**: A fresh bunch of mint.
12. **arugula-gargeer-bunch**: A bunch of fresh arugula (gargeer).

Boxes & bundles
13. **salad-veg-box**: A plain white box filled with tomatoes, cucumbers, lettuce and lemons, seen from above.
14. **fruit-mix-basket**: A small woven basket of mixed fruit: mango, oranges, bananas and grapes.
15. **potatoes-onions-pack**: A clear unlabelled net bag of potatoes and a net bag of red onions side by side.
16. **lemons-limes-pile**: A small pile of yellow lemons and small green limes.

Scenes
- **scene-hero-wide**: A morning market stall of crates of tomatoes, mangoes and greens under a canvas shade in soft sun, no signs, space for text on the right.
- **scene-hero-tall**: A wooden crate of mangoes with leaves in sunlight on a green background, space for text at the top.
- **scene-tile-1**: Tomatoes and cucumbers in a wooden crate with water drops.
- **scene-tile-2**: Mangoes and guavas in a straw basket on a farm table.
- **scene-tile-3**: Bunches of herbs and molokhia standing in a jar of water on a kitchen sill.
- **scene-tile-4**: A white produce box open on a doorstep in morning light.
- **scene-banner**: A long farm field row at golden hour with crates of produce at the edge.
- **scene-story**: A Nile Delta farm field with rows of greens, a wooden cart of crates and palm trees behind.

---

### meat-poultry (16)

**Save to: `.editions-inbox/05-wave-5-food/meat-poultry/`**

Palette for scenes: *deep burgundy, butcher-paper white, slate grey, rosemary green.* Add: *"Meat: raw, fresh and neatly trimmed, laid on a plain white tray or white butcher paper, no blood pooling, no packaging labels, appetising and clean."*

Beef & veal
1. **beef-ribeye-steaks**: Two raw ribeye steaks side by side.
2. **beef-cubes**: Raw beef cubes for stew in a neat pile.
3. **minced-beef**: A neat mound of fresh minced beef.
4. **veal-escalope**: Thin raw veal escalopes laid overlapping.

Lamb
5. **lamb-chops**: Raw lamb chops (rack cut) laid in a row.
6. **lamb-leg**: A raw bone-in leg of lamb.
7. **lamb-shoulder-cubes**: Raw lamb shoulder pieces on the bone.
8. **lamb-liver**: Fresh raw lamb liver slices, neat.

Poultry
9. **whole-chicken**: A whole raw chicken, trussed.
10. **chicken-breast-fillets**: Raw skinless chicken breast fillets.
11. **chicken-thighs**: Raw chicken thighs, skin on.
12. **whole-duck**: A whole raw duck.

Ready to cook
13. **raw-kofta-skewers**: Raw kofta on four wooden skewers.
14. **sogo-sausages**: A coil of raw Egyptian sausage (sogo').
15. **marinated-shish-tawook**: Raw marinated chicken cubes (shish tawook) on skewers.
16. **hawawshi-meat-mix**: Raw spiced minced meat with onions and peppers for hawawshi in a plain white bowl.

Scenes
- **scene-hero-wide**: Raw steaks on butcher paper on a slate board with rosemary, coarse salt and garlic, moody side light, space for text on the left.
- **scene-hero-tall**: A rack of lamb on a slate board with rosemary sprigs, space for text at the top.
- **scene-tile-1**: Raw beef cuts on butcher paper with peppercorns, from above.
- **scene-tile-2**: Lamb chops on a dark stone board with herbs.
- **scene-tile-3**: A whole raw chicken in a white ceramic dish with lemons and thyme.
- **scene-tile-4**: Kofta and shish tawook skewers ready on a grill tray, unlit.
- **scene-banner**: A long clean butcher counter with cuts laid neatly on white trays behind glass, no signs.
- **scene-story**: A clean butcher shop back room with hanging hooks (empty), a wooden block and knives on a magnetic rail, white tiles.

---

### bakery (16)

**Save to: `.editions-inbox/05-wave-5-food/bakery/`**

Palette for scenes: *golden crust, flour white, oven black, warm wheat.* Add: *"Bakery: freshly baked, golden, shown on a plain white plate, a plain white paper bag or alone on white; no printed bags, no text."*

Breads
1. **aish-baladi-loaves**: Three round Egyptian baladi bread loaves, puffed.
2. **fino-bread-rolls**: Four long soft fino bread rolls.
3. **sourdough-loaf**: A round crusty sourdough loaf with a scored top.
4. **sliced-toast-bread**: A loaf of white toast bread with a few slices leaning.

Pastries
5. **butter-croissants**: Three golden butter croissants.
6. **pain-au-chocolat**: Two pain au chocolat on a plain white plate.
7. **cheese-pate**: Three golden cheese-filled pastry triangles (pate) on a plain white plate.
8. **cinnamon-rolls**: Four glazed cinnamon rolls on a plain white plate.

Savoury pies
9. **feteer-meshaltet**: A round flaky feteer meshaltet on a plain white plate.
10. **meat-sambousek**: Six crescent meat sambousek on a plain white plate.
11. **spinach-fatayer**: Four triangle spinach fatayer on a plain white plate.
12. **zaatar-manakish**: A round zaatar manakish flatbread on a plain white plate.

Biscuits & rusks
13. **date-qurs**: Four round date-filled qurs biscuits.
14. **boksomat-rusks**: A clear unlabelled bag of golden boksomat rusks, sealed.
15. **sesame-ring-biscuits**: A small pile of sesame ring biscuits.
16. **butter-cookies-box**: A plain white box, lid off, of round butter cookies.

Scenes
- **scene-hero-wide**: A rustic bakery counter with fresh loaves, croissants and baladi bread on wooden boards, flour dust in warm morning light, space for text on the right.
- **scene-hero-tall**: Baladi bread loaves stacked on a woven palm tray, steam rising, space for text at the top.
- **scene-tile-1**: Bread loaves in a basket on a flour-dusted table.
- **scene-tile-2**: Croissants on a cooling rack by a window.
- **scene-tile-3**: A feteer and sambousek on a wooden board with a bowl of honey.
- **scene-tile-4**: Biscuits and rusks in a glass jar with a tea glass beside it.
- **scene-banner**: A long wooden bread shelf with loaves in rows, warm light.
- **scene-story**: A traditional bakery with a glowing brick oven, a long wooden peel and dough resting on trays.

---

### spices-herbs (16)

**Save to: `.editions-inbox/05-wave-5-food/spices-herbs/`**

Palette for scenes: *saffron orange, cumin brown, dried-rose pink, old brass.* Add: *"Spices: shown as a neat mound on a plain white plate or in a plain unlabelled clear jar; honey and oils in plain unlabelled glass jars and bottles; no text anywhere."*

Ground spices
1. **ground-cumin-jar**: A plain unlabelled clear jar of ground cumin.
2. **black-pepper-jar**: A plain unlabelled clear jar of whole black peppercorns.
3. **ground-coriander**: A neat mound of ground coriander on a plain white plate.
4. **turmeric-powder**: A neat mound of bright turmeric powder on a plain white plate.

Blends & whole spices
5. **kofta-spice-blend**: A neat mound of red-brown kofta spice blend on a plain white plate.
6. **cinnamon-sticks-bundle**: A bundle of cinnamon sticks tied with twine.
7. **dukkah-mix-jar**: A plain unlabelled clear jar of Egyptian dukkah.
8. **saffron-threads-jar**: A tiny plain unlabelled glass jar of saffron threads.

Herbs & herbal teas
9. **dried-hibiscus-karkade**: A clear unlabelled bag of dried hibiscus flowers (karkadeh).
10. **dried-mint-jar**: A plain unlabelled clear jar of dried mint.
11. **chamomile-flowers**: A neat mound of dried chamomile flowers on a plain white plate.
12. **fenugreek-seeds-helba**: A plain unlabelled clear jar of fenugreek seeds (helba).

Honey & natural oils
13. **clover-honey-jar**: A plain unlabelled glass jar of golden honey with a wooden dipper on top.
14. **black-seed-oil-bottle**: A plain unlabelled amber glass bottle of black seed oil.
15. **black-seeds-jar**: A plain unlabelled clear jar of black seeds (habbet el baraka).
16. **olive-oil-bottle**: A plain unlabelled tall glass bottle of green olive oil.

Scenes
- **scene-hero-wide**: Mounds of colourful spices in brass bowls on an old wooden souk counter with warm light, no signs, space for text on the left.
- **scene-hero-tall**: A brass scoop in a sack of dried hibiscus with saffron threads scattered, space for text at the top.
- **scene-tile-1**: Small heaps of cumin, turmeric and coriander on a slate board.
- **scene-tile-2**: Cinnamon sticks, star anise and dukkah in small dishes, from above.
- **scene-tile-3**: A glass of red karkadeh beside dried hibiscus and mint.
- **scene-tile-4**: A honey jar with a dripping dipper beside a bottle of oil on a wooden table.
- **scene-banner**: A long row of open spice sacks on a souk counter, seen straight on.
- **scene-story**: An old attar shop with wooden drawers, glass jars, a brass mortar and pestle and hanging dried herbs.

---

### fast-food (16)

**Save to: `.editions-inbox/05-wave-5-food/fast-food/`**

Palette for scenes: *ketchup red, mustard yellow, kraft brown, char black.* Add: *"Food: freshly made, appetising and neat, served on a plain white plate, in a plain white box or wrapped in plain kraft paper; no printed packaging, no cups with logos, no drinks with brands."*

Egyptian breakfast
1. **ful-medames-plate**: A plain white bowl of ful medames topped with olive oil, cumin and a little parsley.
2. **taameya-falafel-plate**: Six green Egyptian taameya patties with sesame on a plain white plate.
3. **ful-taameya-sandwiches**: Two baladi bread sandwiches of ful and taameya on plain kraft paper.
4. **egg-shakshuka-pan**: A small black pan of eggs with tomatoes and peppers.

Sandwiches & shawarma
5. **chicken-shawarma-wrap**: A chicken shawarma wrap cut in half on plain kraft paper.
6. **beef-shawarma-plate**: Beef shawarma with tahini, pickles and fries on a plain white plate.
7. **hawawshi-baladi**: A crispy hawawshi in baladi bread cut into quarters on a plain white plate.
8. **liver-sandwich-alexandrian**: Two fino sandwiches of Alexandrian liver with peppers on plain kraft paper.

Burgers & fried chicken
9. **classic-beef-burger**: A classic beef burger with cheese, lettuce and tomato.
10. **fried-chicken-bucket**: Crispy fried chicken pieces in a plain white bucket.
11. **crispy-chicken-sandwich**: A crispy chicken sandwich in a soft bun.
12. **fries-box**: Golden fries in a plain white paper box.

Koshari, pizza & crepes
13. **koshari-bowl**: A plain white bowl of koshari topped with tomato sauce and crispy onions.
14. **margherita-pizza**: A round margherita pizza in an open plain white box.
15. **sweet-feteer-plate**: A sweet feteer with powdered sugar on a plain white plate.
16. **savoury-crepe-roll**: A rolled savoury crepe cut in half showing a chicken and cheese filling.

Scenes
- **scene-hero-wide**: A wooden table with a burger, fries, shawarma and a bowl of koshari under warm restaurant light, no cups with logos, space for text on the right.
- **scene-hero-tall**: A juicy burger on kraft paper with fries on a dark table, dramatic side light, space for text at the top.
- **scene-tile-1**: A spread of ful, taameya, baladi bread and pickles on a metal tray, from above.
- **scene-tile-2**: A shawarma spit glowing in a clean open kitchen, softly blurred.
- **scene-tile-3**: Fried chicken and fries on a tray with dipping sauces.
- **scene-tile-4**: A koshari bowl and a pizza on a rustic table.
- **scene-banner**: A long counter of finished dishes lined up under warm pendant lights, no signs.
- **scene-story**: A clean Egyptian street-food kitchen with a big pot of ful, a frying pan of taameya and stacks of baladi bread.

---

## Wave 6: Sweets (4 niches)

### oriental-sweets (16)

**Save to: `.editions-inbox/06-wave-6-sweets/oriental-sweets/`**

Palette for scenes: *syrup gold, pistachio green, copper, warm ivory.* Add: *"Sweets: freshly made, glossy and neat, shown on a plain white plate, in a plain white box or a round metal tray as stated; no printed boxes, no text."*

Trays & syrup sweets
1. **basbousa-tray**: A round tray of basbousa cut in diamonds, each with an almond on top.
2. **konafa-nabulsi**: A round golden konafa with a cut slice showing the cream inside, on a plain white plate.
3. **konafa-with-mango**: A square of konafa topped with mango cream on a plain white plate.
4. **qatayef-assafiri**: Five folded qatayef filled with cream and pistachio on a plain white plate.

Baklava & goulash
5. **pistachio-baklava**: Diamond-cut pistachio baklava in a neat grid on a plain white plate.
6. **cashew-baklava-fingers**: Rolled baklava fingers with cashews in a plain white box, lid off.
7. **goulash-with-nuts**: A square of golden layered goulash pastry with nuts on a plain white plate.
8. **bird-nest-baklava**: Six round bird-nest kunafa rolls with whole pistachios.

Kahk & biscuits
9. **eid-kahk-sugar**: A small pile of Egyptian Eid kahk dusted with powdered sugar.
10. **ghorayeba-biscuits**: Round ghorayeba biscuits each with a pistachio, in a neat group.
11. **petit-four-mix**: A plain white box, lid off, of mixed petit four biscuits.
12. **date-maamoul**: Four patterned date maamoul cookies.

Warm & Ramadan sweets
13. **om-ali-dish**: A clay dish of baked om ali with nuts and raisins.
14. **zalabia-luqmat-el-qadi**: Golden luqmat el qadi balls glazed with syrup on a plain white plate.
15. **meshabek-spirals**: Bright orange meshabek spirals on a plain white plate.
16. **roz-bel-laban-cups**: Three clear cups of rice pudding (roz bel laban) with cinnamon on top.

Scenes
- **scene-hero-wide**: Copper trays of basbousa, konafa and baklava on a sweets shop counter under warm light, no signs, space for text on the left.
- **scene-hero-tall**: A round konafa with one slice cut out and set on a small plate beside it, syrup shine, space for text at the top.
- **scene-tile-1**: A big round tray of basbousa on a carved wood table.
- **scene-tile-2**: Baklava stacked in a brass dish with crushed pistachios.
- **scene-tile-3**: A plate of kahk and ghorayeba with a tea glass for Eid morning.
- **scene-tile-4**: Om ali steaming in a clay dish on a Ramadan table with a lantern.
- **scene-banner**: A long glass display of oriental sweets in neat rows, warm light.
- **scene-story**: A traditional sweets kitchen with big copper trays, a pot of syrup and konafa dough threads on a table.

---

### chocolate-cakes (16)

**Save to: `.editions-inbox/06-wave-6-sweets/chocolate-cakes/`**

Palette for scenes: *cocoa brown, blush pink, cream, gold leaf.* Add: *"Cakes and chocolate: freshly made, neat and glossy, on a plain white cake stand, a plain white plate or in a plain white box; no writing or numbers on cakes, no candles, no toppers, no printed wrappers."*

Cakes
1. **chocolate-fudge-cake**: A round chocolate fudge cake with glossy ganache, one slice cut.
2. **red-velvet-cake**: A round red velvet cake with cream cheese frosting on a plain white stand.
3. **blush-birthday-cake**: A two-tier blush pink buttercream cake with fresh flowers, no writing.
4. **caramel-biscuit-cheesecake**: A round caramel biscuit cheesecake on a plain white plate.

Cupcakes & small cakes
5. **vanilla-cupcakes**: Four vanilla cupcakes with swirled cream frosting.
6. **chocolate-cupcakes**: Four chocolate cupcakes with chocolate swirls.
7. **macarons-set**: Twelve pastel macarons in neat rows in a plain white box.
8. **eclairs-trio**: Three chocolate éclairs on a plain white plate.

Chocolates
9. **truffles-box**: A plain white box, lid off, of sixteen dusted chocolate truffles.
10. **dark-chocolate-bar**: A plain unwrapped dark chocolate bar with a few squares broken off.
11. **chocolate-dates**: Chocolate-covered dates in a neat group.
12. **hazelnut-pralines**: Six gold-dusted hazelnut pralines on a plain white plate.

Cookies & brownies
13. **chocolate-chip-cookies**: A stack of five chocolate chip cookies.
14. **fudge-brownies**: Six square fudge brownies on a plain white plate.
15. **molten-lava-cake**: A chocolate molten lava cake cut open on a plain white plate.
16. **tiramisu-cup**: A clear cup of tiramisu dusted with cocoa.

Scenes
- **scene-hero-wide**: A chocolate fudge cake on a cake stand on a marble table with cocoa dust and gold leaf, soft window light, space for text on the right.
- **scene-hero-tall**: A blush cake with fresh flowers on a cream stand against a blush wall, space for text at the top.
- **scene-tile-1**: A slice of chocolate cake on a plate with a fork, side light.
- **scene-tile-2**: Cupcakes and macarons on a tiered stand.
- **scene-tile-3**: Truffles and broken chocolate on parchment, from above.
- **scene-tile-4**: Brownies and cookies on a wooden board with a glass of milk.
- **scene-banner**: A long patisserie counter with cakes under glass domes, warm light, no signs.
- **scene-story**: A pastry kitchen with melted chocolate in a bowl, piping bags and a cake on a turntable.

---

### coffee-beans (16)

**Save to: `.editions-inbox/06-wave-6-sweets/coffee-beans/`**

Palette for scenes: *roasted brown, cardamom green, kraft beige, matte black.* Add: *"Coffee: beans or ground coffee in plain unlabelled kraft bags with a clear window, clear jars or as a neat mound on a plain white plate; capsules plain and generic, never a known brand's shape; no text anywhere."*

Turkish coffee
1. **turkish-coffee-medium**: A plain unlabelled kraft bag of medium-roast ground Turkish coffee with a clear window.
2. **turkish-coffee-cardamom**: A plain unlabelled kraft bag of Turkish coffee with cardamom (mohawag) and a clear window.
3. **dark-turkish-coffee-ground**: A neat mound of dark ground Turkish coffee on a plain white plate.
4. **green-cardamom-pods**: A plain unlabelled clear jar of green cardamom pods.

Espresso & specialty beans
5. **espresso-blend-beans**: A plain unlabelled black stand-up bag of espresso beans with a clear window.
6. **brazilian-beans**: A neat mound of medium-roast Brazilian coffee beans on a plain white plate.
7. **ethiopian-single-origin**: A plain unlabelled kraft bag of light-roast Ethiopian beans, open, beans visible.
8. **yemeni-mocha-beans**: A plain unlabelled clear jar of Yemeni mocha beans.

Arabic & flavoured coffee
9. **arabic-coffee-light**: A plain unlabelled clear jar of light-roast Arabic (Saudi) coffee with cardamom.
10. **hazelnut-flavoured-coffee**: A plain unlabelled kraft bag of hazelnut flavoured ground coffee.
11. **french-coffee-blend**: A plain unlabelled kraft bag of French coffee blend with a clear window.
12. **green-coffee-beans**: A plain unlabelled clear bag of raw green coffee beans.

Capsules & instant
13. **coffee-capsules-plain**: Ten plain generic round coffee capsules in brown and black, no marks.
14. **drip-coffee-bags**: Five plain white drip coffee bags fanned out.
15. **instant-coffee-jar**: A plain unlabelled glass jar of instant coffee granules.
16. **coffee-sampler-box**: A plain kraft box, lid off, with four small unlabelled coffee bags.

Scenes
- **scene-hero-wide**: Freshly roasted beans pouring into a copper cooling tray in a roastery with warm light and soft smoke, no signs, space for text on the left.
- **scene-hero-tall**: A kraft bag of coffee spilling beans onto a dark wood table beside a finjan of Turkish coffee, space for text at the top.
- **scene-tile-1**: Ground Turkish coffee in a brass dish with cardamom pods.
- **scene-tile-2**: Espresso beans in a black bowl beside a small espresso cup, side light.
- **scene-tile-3**: An Arabic dallah coffee pot with small cups and dates on a brass tray.
- **scene-tile-4**: Capsules and drip bags arranged on kraft paper, from above.
- **scene-banner**: A long roastery counter with sacks of beans and glass jars in a row, seen straight on.
- **scene-story**: An old Cairo coffee roaster with a drum roaster, burlap sacks and a brass scale (display-free).

---

### dates-nuts (16)

**Save to: `.editions-inbox/06-wave-6-sweets/dates-nuts/`**

Palette for scenes: *date brown, pistachio green, almond cream, Ramadan gold.* Add: *"Dates and nuts: shown as a neat mound on a plain white plate, in a plain white box or a clear unlabelled jar or bag; dried fruit glossy and neat; no text."*

Dates
1. **siwi-dates**: A neat mound of soft Siwi dates on a plain white plate.
2. **medjool-dates**: Large Medjool dates in a neat row in a plain white box.
3. **ajwa-dates**: A neat mound of dark Ajwa dates on a plain white plate.
4. **stuffed-dates-almond**: Dates stuffed with almonds arranged in a plain white box.

Nuts
5. **roasted-cashews**: A neat mound of roasted cashews on a plain white plate.
6. **salted-pistachios**: A plain unlabelled clear jar of salted pistachios in the shell.
7. **raw-almonds**: A neat mound of raw almonds on a plain white plate.
8. **mixed-nuts-jar**: A plain unlabelled clear jar of mixed nuts.

Seeds & snacks
9. **roasted-peanuts-soudani**: A neat mound of roasted peanuts (soudani) in their shells.
10. **white-melon-seeds-lib**: A neat mound of white melon seeds (lib abyad) on a plain white plate.
11. **walnuts-in-shell**: A small pile of walnuts in the shell, one cracked.
12. **hazelnuts-roasted**: A neat mound of roasted hazelnuts on a plain white plate.

Dried fruits & yameesh
13. **qamar-el-din-sheet**: A folded sheet of orange qamar el din apricot paste, unwrapped.
14. **dried-apricots**: A neat mound of dried apricots on a plain white plate.
15. **dried-figs-raisins**: Dried figs and golden raisins in two small piles side by side.
16. **ramadan-yameesh-box**: A plain white box, lid off, divided into sections of dates, nuts, raisins and apricots.

Scenes
- **scene-hero-wide**: Brass bowls of dates, pistachios and dried apricots on a Ramadan table with a lit lantern at dusk, space for text on the right.
- **scene-hero-tall**: A mound of Medjool dates on a gold tray with dried palm fronds, space for text at the top.
- **scene-tile-1**: Dates on a woven palm-leaf tray in sunlight.
- **scene-tile-2**: Cashews, almonds and pistachios in small ceramic bowls, from above.
- **scene-tile-3**: Roasted peanuts and seeds in paper cones on a wooden table.
- **scene-tile-4**: Qamar el din, apricots and figs on a cream linen cloth.
- **scene-banner**: A long souk counter of open sacks of nuts and dates in a row, no signs.
- **scene-story**: A Siwa palm grove at golden hour with crates of fresh dates under the palms.

---

## Wave 7: Kids (4 niches)

### toys (16)

**Save to: `.editions-inbox/07-wave-7-kids/toys/`**

Palette for scenes: *primary red, sunshine yellow, natural beech, sky blue.* Add: *"Toys: generic and unbranded, no characters from films or shows, no dolls with human faces, no letters or numbers on blocks or boxes; plush animals have simple stitched eyes."*

Wooden & building toys
1. **wooden-stacking-rainbow**: A wooden stacking rainbow of seven painted arches.
2. **plain-wooden-blocks**: A set of plain beech wooden building blocks in mixed shapes, stacked loosely.
3. **colour-building-bricks**: A small pile of plain coloured plastic building bricks, no logos on the studs.
4. **wooden-shape-sorter**: A wooden shape sorter box with coloured shapes beside it.

Puzzles & games
5. **wooden-animal-puzzle**: A wooden jigsaw puzzle of a simple elephant and tree, one piece out.
6. **floor-puzzle-landscape**: A finished floor puzzle of a simple landscape, seen from above.
7. **wooden-board-game-set**: A wooden tic-tac-toe board with red and blue pieces.
8. **stacking-cups**: Ten bright plastic stacking cups in a tower.

Plush toys
9. **beige-teddy-bear**: A soft beige teddy bear sitting, simple stitched eyes, no bow tag.
10. **grey-plush-elephant**: A grey plush elephant sitting.
11. **plush-camel**: A sand-coloured plush camel sitting.
12. **knitted-bunny**: A cream knitted bunny with long ears, sitting.

Cars & ride-ons
13. **wooden-toy-train**: A wooden toy train with three coloured carriages.
14. **red-toy-car**: A red toy car with rubber wheels, no markings.
15. **kids-balance-bike**: A sky blue wooden balance bike for toddlers.
16. **three-wheel-scooter**: A yellow three-wheel kids' scooter, standing.

Scenes
- **scene-hero-wide**: A sunny playroom with a wooden stacking rainbow, a teddy bear and a toy train on a soft rug, low shelves of toys, space for text on the left.
- **scene-hero-tall**: Wooden blocks stacked into a little tower on a beech table by a window, space for text at the top.
- **scene-tile-1**: Building blocks and a shape sorter on a playroom rug.
- **scene-tile-2**: A half-finished puzzle on a wooden floor, from above.
- **scene-tile-3**: Plush animals sitting in a row on a window seat.
- **scene-tile-4**: A balance bike and a scooter by a sunny balcony door.
- **scene-banner**: A long low toy shelf with toys spaced out in baskets, seen straight on.
- **scene-story**: A toymaker's bench with wooden parts, non-toxic paint pots, brushes and a half-painted train.

---

### baby-essentials (16)

**Save to: `.editions-inbox/07-wave-7-kids/baby-essentials/`**

Palette for scenes: *powder blue, milk white, soft sand, pale sage.* Add: *"Baby products: generic and unbranded; diapers, wipes and formula in plain unlabelled packs and tins with no text and no printed babies; gear shown empty, no baby in it."*

Feeding
1. **glass-baby-bottle**: A clear glass baby bottle with a soft sage nipple and cap.
2. **anti-colic-bottle-set**: Three plain clear baby bottles with white caps in a row.
3. **silicone-bib-and-bowl**: A sage silicone bib and a suction bowl with a spoon.
4. **formula-tin-plain**: A plain unlabelled white tin of baby formula with a scoop on top.

Diapering & bath
5. **diaper-pack-plain**: A plain unlabelled white pack of baby diapers.
6. **baby-wipes-pack**: A plain unlabelled white pack of baby wipes with a flip lid.
7. **hooded-baby-towel**: A powder blue hooded baby towel, folded.
8. **baby-bath-tub**: A white baby bath tub, empty.

Sleep & soothing
9. **muslin-swaddle-set**: Three muslin swaddles in sand, sage and blue, folded and stacked.
10. **silicone-pacifier-pair**: Two silicone pacifiers in sage and sand.
11. **wooden-baby-crib**: A white wooden baby crib with plain white bedding, empty.
12. **sleeping-bag-baby**: A powder blue baby sleeping bag, laid flat.

Gear & outings
13. **sand-stroller**: A sand-coloured baby stroller with the canopy open, empty.
14. **infant-car-seat**: A grey infant car seat carrier, empty.
15. **diaper-changing-bag**: A sage diaper changing backpack, closed.
16. **baby-carrier**: A powder blue soft baby carrier, empty, straps arranged neatly.

Scenes
- **scene-hero-wide**: A calm nursery in milk white and powder blue with a wooden crib, a soft rug and sheer curtains in morning light, space for text on the right.
- **scene-hero-tall**: Folded muslin swaddles and a baby bottle on a white dresser, soft light, space for text at the top.
- **scene-tile-1**: Bottles and a bib on a sunny kitchen counter.
- **scene-tile-2**: A changing table with folded towels and plain unlabelled packs.
- **scene-tile-3**: An empty crib with a muslin blanket and a knitted bunny.
- **scene-tile-4**: An empty stroller parked by a garden gate with soft afternoon light.
- **scene-banner**: A long white nursery shelf with baskets, folded clothes and bottles spaced out.
- **scene-story**: A small baby shop with soft blankets folded on white shelves and an empty stroller on display, no signs.

---

### kids-gifts (16)

**Save to: `.editions-inbox/07-wave-7-kids/kids-gifts/`**

Palette for scenes: *party pink, mint, confetti gold, white.* Add: *"Gifts: unbranded, no printed names, letters or numbers anywhere (no number balloons, no name cards); gift boxes plain or with a simple ribbon."*

Sebou' & newborn gifts
1. **sebou-ibreeq-jug**: A decorated white and gold sebou' ibreeq jug for a baby boy, with a mint ribbon.
2. **sebou-olla-jar**: A decorated pink and gold sebou' olla jar for a baby girl, with a ribbon.
3. **sebou-favour-bags**: Six small white organza favour bags with candied almonds, tied with gold ribbon.
4. **newborn-gift-basket**: A woven basket with a folded blanket, a plush bunny and a baby bottle.

Birthday gifts
5. **wrapped-gift-box-pink**: A gift box wrapped in pink paper with a big white satin bow.
6. **mint-gift-box-trio**: Three mint gift boxes of different sizes stacked, with gold ribbon.
7. **kids-surprise-box**: An open white gift box filled with small wooden toys and crayons.
8. **music-box-carousel**: A small pastel carousel music box with horses, no characters.

Party supplies
9. **pastel-balloon-bunch**: A bunch of plain pastel pink, mint and white balloons with ribbons.
10. **gold-foil-star-balloons**: Three gold foil star balloons.
11. **paper-party-plates-set**: A stack of plain pink and mint paper party plates with matching cups.
12. **paper-garland-pompoms**: Pastel tissue paper pompoms and a fan garland.

Party favours
13. **favour-boxes-set**: Six small white favour boxes with pink ribbons.
14. **candy-jar-favours**: Four small clear unlabelled jars of pastel sweets with ribbons.
15. **party-hats-set**: Four plain pastel paper party hats.
16. **bubble-wands-set**: Six bubble wands in pastel bottles with no labels.

Scenes
- **scene-hero-wide**: A kids' party table with pastel balloons, a white cake on a stand (no writing, no candles), gift boxes and paper garlands, space for text on the left.
- **scene-hero-tall**: A pile of wrapped gifts in pink and mint with gold ribbons on a white floor, space for text at the top.
- **scene-tile-1**: A sebou' table with decorated jugs and jars, candles unlit and favour bags.
- **scene-tile-2**: A wrapped gift box on a white chair with a balloon tied to it.
- **scene-tile-3**: Balloons floating near the ceiling of a sunny room with garlands.
- **scene-tile-4**: Favour boxes and candy jars lined up on a white table.
- **scene-banner**: A long dessert table with pastel garlands and balloons, seen straight on.
- **scene-story**: A gift-wrapping table with ribbon spools, tissue paper, scissors and plain boxes.

---

### school-supplies (16)

**Save to: `.editions-inbox/07-wave-7-kids/school-supplies/`**

Palette for scenes: *notebook blue, pencil yellow, eraser pink, chalkboard green.* Add: *"Stationery: unbranded; notebooks and covers plain with no printing, no letters or numbers on rulers (plain tick marks only), pencils plain with no stamps; bottles and boxes unlabelled."*

Notebooks & paper
1. **plain-spiral-notebooks**: Three spiral notebooks with plain blue, yellow and pink covers, stacked.
2. **kraft-exercise-books**: A stack of five plain kraft-cover exercise books.
3. **drawing-sketchbook**: A plain black hardcover sketchbook, closed.
4. **coloured-paper-pack**: A fan of coloured craft paper sheets.

Writing & colouring
5. **yellow-pencils-set**: Six plain yellow pencils with pink erasers, sharpened.
6. **school-colour-pencils-tin**: An open plain tin of twenty-four coloured pencils.
7. **wax-crayons-set**: A set of twelve plain wax crayons in a row.
8. **school-eraser-sharpener-pair**: Two pink erasers and a plain metal sharpener.

Pencil cases & desk
9. **blue-zip-school-pencil-case**: A blue zip fabric pencil case, closed.
10. **hard-pencil-box**: A yellow two-layer hard pencil box, open, empty.
11. **plain-ruler-set**: A plain clear ruler, a set square and a protractor with tick marks only, no numbers.
12. **school-glue-scissors**: A plain unlabelled white glue stick and a pair of kids' safety scissors.

Lunch & bottles
13. **bento-lunch-box**: A pink bento lunch box with three compartments, lid off.
14. **kids-water-bottle**: A blue kids' water bottle (zamzamiya) with a flip straw.
15. **insulated-lunch-bag**: A green insulated lunch bag, closed.
16. **snack-containers-set**: Three small stacking snack containers in blue, yellow and pink.

Scenes
- **scene-hero-wide**: A sunny kids' study desk by a window with notebooks, a pencil cup and a lunch box, a chalkboard-green wall, space for text on the right.
- **scene-hero-tall**: Coloured pencils standing in a jar on a wooden desk, morning light, space for text at the top.
- **scene-tile-1**: Plain notebooks stacked on a school desk.
- **scene-tile-2**: Coloured pencils and crayons spread on white paper, from above.
- **scene-tile-3**: An open pencil box with a ruler and erasers on a desk.
- **scene-tile-4**: A packed bento lunch box of sandwiches and fruit beside a water bottle.
- **scene-banner**: A long classroom table with supplies spaced out in front of a blank chalkboard.
- **scene-story**: A small stationery shop with neat shelves of notebooks, pencil cups and boxes without labels.

---

## Wave 8: Sports (6 niches)

### gym-fitness (16)

**Save to: `.editions-inbox/08-wave-8-sports/gym-fitness/`**

Palette for scenes: *charcoal, iron black, chalk white, signal red.* Add: *"Gym gear: unbranded, plain matte finishes, no numbers or weight markings on plates, dumbbells or kettlebells, no logos, bands and ropes coiled neatly."*

Weights
1. **black-hex-dumbbells-pair**: A pair of black rubber hex dumbbells with chrome handles, side by side.
2. **adjustable-dial-dumbbell**: A single grey adjustable dumbbell resting in its black tray.
3. **cast-iron-kettlebell**: A matte black cast-iron kettlebell.
4. **red-bumper-plate**: A red rubber bumper weight plate standing upright, no markings.

Home gym
5. **adjustable-weight-bench**: A black adjustable weight bench, back slightly raised, side view.
6. **folding-home-treadmill**: A compact grey folding treadmill, unfolded, side view, console blank.
7. **doorway-pull-up-bar**: A black steel doorway pull-up bar with foam grips, lying flat.
8. **ab-roller-wheel**: A black ab roller wheel with two foam handles.

Bands & mobility
9. **resistance-bands-set**: Five resistance tube bands in graded colours with two handles, coiled neatly.
10. **fabric-loop-bands**: Three fabric booty loop bands in grey, black and red, stacked.
11. **textured-foam-roller**: A black textured foam roller standing on its end.
12. **speed-jump-rope**: A black speed jump rope with aluminium handles, coiled.

Gym accessories
13. **weightlifting-gloves**: A pair of black padded weightlifting gloves.
14. **leather-lifting-belt**: A brown leather weightlifting belt, closed in a loop.
15. **plain-shaker-bottle**: A plain black shaker bottle with a flip cap, no print.
16. **wrist-wraps-pair**: A pair of black and red wrist wraps, rolled.

Scenes
- **scene-hero-wide**: A quiet home gym corner with a rack of black hex dumbbells on a concrete floor, high window light and long shadows, space for text on the right.
- **scene-hero-tall**: A cast-iron kettlebell on a chalk-dusted black rubber floor with a hard side light, space for text at the top.
- **scene-tile-1**: A row of dumbbells on a steel rack, close and low angle.
- **scene-tile-2**: A weight bench by a large window in an empty loft gym.
- **scene-tile-3**: Resistance bands and a foam roller on a grey mat, from above.
- **scene-tile-4**: Lifting gloves, a belt and a shaker bottle on a wooden bench.
- **scene-banner**: A long empty gym floor with plates stacked against a charcoal wall, wide and calm.
- **scene-story**: A small Cairo fitness-equipment showroom with benches, racks and kettlebells in rows, no signs.

---

### football (16)

**Save to: `.editions-inbox/08-wave-8-sports/football/`**

Palette for scenes: *pitch green, white, floodlight silver, night navy.* Clothing line applies to jerseys and kits. Add: *"Football gear: plain jerseys with no crests, numbers, sponsors or club stripes; balls and boots unbranded with no logos or printed words; boots shown as a pair side by side."*

Balls
1. **white-match-football**: A white size-5 match football with plain green panels.
2. **futsal-low-bounce-ball**: A white and navy low-bounce futsal ball.
3. **orange-training-football**: A bright orange training football.
4. **mini-skills-football**: A small white skills football with plain black panels.

Jerseys & kits
5. **plain-white-football-jersey**: A plain white short-sleeve football jersey, flat-lay.
6. **navy-green-collar-jersey**: A plain navy football jersey with a green collar, flat-lay.
7. **lime-goalkeeper-jersey**: A plain lime long-sleeve goalkeeper jersey with padded elbows, flat-lay.
8. **kids-football-kit-set**: A plain sky blue kids' football shirt and white shorts, flat-lay side by side.

Boots
9. **black-firm-ground-boots**: A pair of black firm-ground football boots with white studs.
10. **white-turf-boots**: A pair of white turf football boots with rubber pimple soles.
11. **indoor-futsal-shoes**: A pair of navy indoor futsal shoes with flat gum soles.
12. **kids-football-boots**: A pair of small green kids' football boots with velcro straps.

Training gear
13. **goalkeeper-gloves-pair**: A pair of lime and black goalkeeper gloves.
14. **shin-guards-pair**: A pair of white and navy shin guards with ankle sleeves.
15. **training-cones-stack**: A stack of orange training marker cones.
16. **ball-carry-net-bag**: A black mesh net bag holding three plain white footballs.

Scenes
- **scene-hero-wide**: An empty floodlit five-a-side pitch at dusk with a white ball on the centre spot, space for text on the left.
- **scene-hero-tall**: A pair of boots resting on fresh green grass with a goal net softly blurred behind, space for text at the top.
- **scene-tile-1**: Footballs in a mesh bag on the touchline of a green pitch.
- **scene-tile-2**: Plain jerseys hanging on hooks in a clean white changing room.
- **scene-tile-3**: Football boots on a wooden changing-room bench.
- **scene-tile-4**: Cones, shin guards and goalkeeper gloves on artificial turf, from above.
- **scene-banner**: A wide empty stadium stand in night navy with silver floodlights, quiet.
- **scene-story**: A neighbourhood sports shop wall with boots on shelves and plain jerseys on a rail, no signs.

---

### running (16)

**Save to: `.editions-inbox/08-wave-8-sports/running/`**

Palette for scenes: *dawn peach, asphalt grey, white, electric blue.* Clothing line applies to apparel. Add: *"Running gear: unbranded, shoes shown as a single shoe in side view with laces tied, no logos, stripes or printed words."*

Running shoes
1. **blue-road-running-shoe**: An electric blue road running shoe with a white foam sole.
2. **white-cushioned-running-shoe**: A white cushioned running shoe with a thick sole.
3. **grey-trail-running-shoe**: A grey trail running shoe with an orange lugged sole.
4. **black-racing-flat**: A light black racing shoe with a thin sole.

Apparel
5. **running-shorts-with-liner**: Black lightweight running shorts with a liner, flat-lay.
6. **white-running-tshirt**: A white breathable mesh running t-shirt, flat-lay.
7. **peach-running-jacket**: A peach ultralight running jacket, flat-lay.
8. **grey-running-tights**: Grey full-length running tights, flat-lay.

Accessories
9. **running-waist-belt**: A slim black running waist belt with a zip pocket.
10. **phone-armband**: A grey running phone armband, empty, strap closed.
11. **hydration-running-vest**: A blue hydration running vest with two soft flasks in the front pockets.
12. **white-running-cap**: A white lightweight running cap.

Hydration & recovery
13. **soft-flask-handheld**: A clear handheld soft flask with a blue hand strap, empty.
14. **insulated-sports-bottle**: A white insulated sports bottle with a blue lid.
15. **massage-balls-set**: Two massage balls, one spiky and one smooth, side by side.
16. **compression-socks-pair**: A pair of blue compression running socks, flat-lay.

Scenes
- **scene-hero-wide**: An empty Corniche promenade at sunrise with a pair of running shoes on the stone edge and the Nile softly blurred, space for text on the right.
- **scene-hero-tall**: A running shoe on wet asphalt with peach dawn light, space for text at the top.
- **scene-tile-1**: Running shoes on a white wooden step by a door.
- **scene-tile-2**: Folded running clothes on a grey stool with soft window light.
- **scene-tile-3**: A hydration vest hanging on a hook against a white wall.
- **scene-tile-4**: Bottles, a soft flask and massage balls on a concrete ledge.
- **scene-banner**: A long empty running track at dawn, lanes in perspective, no numbers.
- **scene-story**: A running shop wall of single shoes on floating shelves, soft light, no signs.

---

### cycling (16)

**Save to: `.editions-inbox/08-wave-8-sports/cycling/`**

Palette for scenes: *olive green, cream, burnt orange, steel grey.* Clothing line applies to the jersey. Add: *"Bikes and scooters: shown alone, side view, fully in frame, standing on a kickstand or upright, no decals, logos or frame lettering; parts and gear unbranded."*

Bikes
1. **olive-mountain-bike**: An olive green hardtail mountain bike with knobby tyres, side view.
2. **grey-road-bike**: A steel grey road bike with drop handlebars, side view.
3. **cream-city-bike-basket**: A cream city bike with a front wicker basket, side view.
4. **kids-bike-training-wheels**: An orange kids' bike with training wheels, side view.

Scooters & e-bikes
5. **grey-electric-scooter**: A grey electric kick scooter, standing upright, side view.
6. **olive-city-e-bike**: An olive step-through electric city bike with a rear rack, side view.
7. **adult-kick-scooter**: A black adult kick scooter with large wheels, side view.
8. **kids-three-wheel-scooter**: A pastel orange kids' three-wheel scooter.

Helmets & gear
9. **matte-cycling-helmet**: A matte olive cycling helmet with vents, three-quarter view.
10. **cycling-gloves-pair**: A pair of grey fingerless cycling gloves.
11. **cycling-sport-glasses**: Wraparound cycling glasses with a smoked lens, folded open.
12. **orange-cycling-jersey**: A plain burnt orange short-sleeve cycling jersey, flat-lay.

Accessories & parts
13. **steel-u-lock**: A black steel bike U-lock with its key.
14. **bike-light-set**: A front white and rear red bike light pair.
15. **mini-bike-pump**: A small silver aluminium bike pump.
16. **bottle-cage-and-bottle**: A black bottle cage holding a cream cycling bottle.

Scenes
- **scene-hero-wide**: An olive mountain bike leaning on a stone wall on an empty desert road near Fayoum at golden hour, space for text on the left.
- **scene-hero-tall**: A cream city bike parked against a pastel wall in a quiet Zamalek street, space for text at the top.
- **scene-tile-1**: A road bike on a wall hook in a bright workshop.
- **scene-tile-2**: An electric scooter parked in a quiet paved courtyard.
- **scene-tile-3**: A helmet, gloves and glasses on a wooden bench.
- **scene-tile-4**: A lock, lights and a pump laid out on a steel workbench, from above.
- **scene-banner**: A long row of bikes parked along a sunlit wall, side view, no signs.
- **scene-story**: A bike repair workshop with a bike on a stand, tools on a pegboard and spare tyres hanging, no people.

---

### outdoor-camping (16)

**Save to: `.editions-inbox/08-wave-8-sports/outdoor-camping/`**

Palette for scenes: *desert sand, terracotta, deep teal, charcoal.* Add: *"Camping gear: unbranded, plain fabrics with no logos or printed words, tents and chairs shown set up and fully in frame."*

Tents & sleeping
1. **teal-dome-tent**: A deep teal four-person dome tent, set up, three-quarter view.
2. **sand-sleeping-bag**: A sand mummy sleeping bag, rolled and strapped.
3. **inflatable-sleeping-pad**: A terracotta inflatable sleeping pad, flat.
4. **camping-pillow**: A small grey compressible camping pillow.

Camp furniture
5. **folding-camp-chair**: A charcoal folding camp chair with a cup holder, open.
6. **folding-camp-table**: An aluminium folding camp table with a slatted top, open.
7. **camping-cot**: A teal folding camping cot, open, side view.
8. **teal-hammock**: A teal parachute hammock, folded with its straps.

Cooking & grills
9. **portable-charcoal-grill**: A black portable charcoal grill with folding legs.
10. **single-burner-gas-stove**: A compact single-burner camping gas stove.
11. **nesting-cookware-set**: A nesting aluminium camping cookware set, stacked.
12. **steel-vacuum-thermos**: A tall steel vacuum thermos flask with a cup lid.

Lights, tools & fishing
13. **led-camp-lantern**: A charcoal LED camping lantern with a handle, unlit.
14. **folding-multi-tool**: A steel folding multi-tool, half open.
15. **spinning-fishing-rod**: A spinning fishing rod with a reel, lying diagonally.
16. **fishing-tackle-box**: A teal fishing tackle box, closed.

Scenes
- **scene-hero-wide**: A teal dome tent on a Red Sea beach campsite at sunset, a folding chair beside it, space for text on the right.
- **scene-hero-tall**: A lantern glowing on a rock above a quiet Sinai valley at dusk, space for text at the top.
- **scene-tile-1**: A tent and a rolled sleeping bag in white desert sand near rock formations.
- **scene-tile-2**: Two camp chairs and a table facing a calm sea.
- **scene-tile-3**: A charcoal grill and a thermos on a flat rock with soft smoke.
- **scene-tile-4**: A fishing rod and tackle box on a wooden jetty at dawn.
- **scene-banner**: A wide desert campsite at blue hour with a small campfire and an empty tent, quiet.
- **scene-story**: A gear shop storeroom with tents, chairs and lanterns on wooden shelves, no signs.

---

### yoga (16)

**Save to: `.editions-inbox/08-wave-8-sports/yoga/`**

Palette for scenes: *sage, oat, blush clay, warm white.* Clothing line applies to yoga wear. Add: *"Yoga gear: natural matte materials (cork, cotton, natural rubber), mats shown rolled or partly unrolled, no prints, patterns with words or logos."*

Mats
1. **sage-yoga-mat-rolled**: A sage green yoga mat, rolled and tied with a cotton strap.
2. **cork-yoga-mat**: A natural cork yoga mat, partly unrolled.
3. **foldable-travel-yoga-mat**: A thin oat-coloured travel yoga mat, folded square.
4. **thick-pilates-mat**: A thick blush clay pilates mat, rolled.

Props
5. **cork-blocks-pair**: A pair of cork yoga blocks, one standing and one lying.
6. **cotton-yoga-strap**: An oat cotton yoga strap with a metal buckle, coiled.
7. **round-yoga-bolster**: A sage round yoga bolster with a carry handle.
8. **meditation-cushion**: A round blush clay meditation cushion.

Yoga wear
9. **sage-high-waist-leggings**: Sage high-waist yoga leggings, flat-lay.
10. **oat-sports-bra**: An oat seamless sports bra, flat-lay.
11. **wide-leg-yoga-pants**: Loose warm white wide-leg yoga pants, flat-lay.
12. **long-sleeve-wrap-top**: A blush clay long-sleeve wrap top, flat-lay.

Pilates & calm
13. **pilates-ring**: A grey pilates ring with soft pads.
14. **mini-pilates-ball**: A small sage pilates ball.
15. **canvas-yoga-mat-bag**: An oat canvas yoga mat bag, closed.
16. **brass-singing-bowl**: A brass singing bowl on a small cushion with its wooden striker.

Scenes
- **scene-hero-wide**: A sunlit studio with a sage mat unrolled on pale wood, a plant and soft leaf shadows on a warm white wall, space for text on the left.
- **scene-hero-tall**: A rolled mat and cork blocks by an arched window with sheer curtains, space for text at the top.
- **scene-tile-1**: Rolled mats standing in a woven basket.
- **scene-tile-2**: A bolster, blocks and a strap on an oat rug.
- **scene-tile-3**: Folded yoga wear stacked on a wooden stool.
- **scene-tile-4**: A singing bowl and a meditation cushion on a linen floor cloth.
- **scene-banner**: A long empty studio floor with mats laid in a row, morning light.
- **scene-story**: A rooftop studio in Cairo at sunrise with mats, plants and a low wooden shelf of props.

---

## Wave 9: Health (3 niches)

### vitamins-supplements (16)

**Save to: `.editions-inbox/09-wave-9-health/vitamins-supplements/`**

Palette for scenes: *citrus orange, cream, leaf green, white.* Add: *"Supplements: plain unlabelled tubs, bottles, jars and pouches with no text, numbers, pictures or printed labels; capsules or powder only when asked, in a small neat dish, never spilled."*

Vitamins & minerals
1. **white-vitamin-bottle**: A plain unlabelled white vitamin bottle with an orange cap.
2. **amber-vitamin-d-bottle**: A plain unlabelled amber glass dropper bottle.
3. **effervescent-tablet-tube**: A plain unlabelled white effervescent tablet tube with an orange lid.
4. **gummy-vitamins-jar**: A plain unlabelled clear jar of orange and green gummy vitamins.

Protein & sports nutrition
5. **protein-powder-tub**: A large plain unlabelled black protein powder tub with a screw lid.
6. **creatine-powder-tub**: A small plain unlabelled white powder tub.
7. **pre-workout-tub**: A plain unlabelled orange powder tub with a scoop resting on the lid.
8. **protein-bars-row**: Three protein bars in plain unprinted silver wrappers, in a row.

Omega & collagen
9. **omega-3-softgel-bottle**: A plain unlabelled amber bottle beside a small white dish of golden softgels.
10. **collagen-powder-pouch**: A plain unlabelled cream stand-up powder pouch with a zip top.
11. **collagen-sachets-box**: A plain unlabelled white box with a few blank sachets in front.
12. **liquid-collagen-vials**: Four small plain glass vials with orange caps in a row.

Wellness
13. **probiotic-capsule-bottle**: A plain unlabelled leaf green capsule bottle.
14. **herbal-tea-tin**: A plain unlabelled cream tea tin, closed.
15. **weekly-pill-organizer**: A clear weekly pill organiser with seven blank compartments, empty.
16. **glass-supplement-jars-set**: Three plain unlabelled glass jars with wooden lids, in a row.

Scenes
- **scene-hero-wide**: A bright kitchen counter with plain supplement bottles, a bowl of oranges and a glass of water, morning sun, space for text on the right.
- **scene-hero-tall**: A plain white bottle and a sliced orange on a cream stone surface with leaf shadows, space for text at the top.
- **scene-tile-1**: Plain vitamin bottles on a white shelf with a small plant.
- **scene-tile-2**: A protein tub and a plain shaker on a gym bench beside a towel.
- **scene-tile-3**: A collagen pouch and a glass of juice on a light wood tray.
- **scene-tile-4**: A tea tin and a pill organiser on a bedside table at morning light.
- **scene-banner**: A long counter with plain bottles and tubs spaced out, citrus and leaves between them, wide and clean.
- **scene-story**: A tidy health shop with plain bottles on white shelves and a wooden counter, no signs or labels.

---

### pharmacy-care (16)

**Save to: `.editions-inbox/09-wave-9-health/pharmacy-care/`**

Palette for scenes: *clinical white, pale aqua, soft blue, silver.* Add: *"Pharmacy products: plain unlabelled tubes, bottles, jars and boxes in white and soft colours, no text, numbers, crosses or brand marks, no pills or syringes."*

Oral care
1. **soft-toothbrushes-pair**: Two soft toothbrushes, white and aqua, side by side.
2. **plain-toothpaste-tube**: A plain unlabelled white toothpaste tube with a blue cap.
3. **mouthwash-bottle**: A plain unlabelled pale aqua mouthwash bottle.
4. **dental-floss-case**: A small white dental floss case.

First aid
5. **first-aid-kit-box**: A plain white zipped first aid pouch, closed, no symbols.
6. **gauze-bandage-roll**: A white gauze bandage roll.
7. **fabric-plasters-fanned**: A few plain skin-tone fabric plasters fanned out.
8. **elastic-bandage-roll**: A beige elastic bandage roll with a metal clip.

Hygiene & sanitizers
9. **hand-sanitizer-pump**: A plain unlabelled clear hand sanitizer pump bottle with a blue gel.
10. **surgical-masks-stack**: A neat stack of pale blue surgical face masks.
11. **wet-wipes-pack**: A plain unlabelled white soft pack of wet wipes.
12. **antiseptic-spray-bottle**: A plain unlabelled white spray bottle.

Skin & body care
13. **moisturiser-cream-jar**: A plain unlabelled white cream jar, lid on.
14. **sunscreen-tube**: A plain unlabelled soft blue sunscreen tube.
15. **lip-balm-stick**: A plain unlabelled white lip balm stick.
16. **body-lotion-pump**: A plain unlabelled pale aqua body lotion pump bottle.

Scenes
- **scene-hero-wide**: A clean white bathroom shelf with plain toothbrushes, a lotion pump and a folded towel, soft morning light, space for text on the left.
- **scene-hero-tall**: A plain cream jar and a lotion bottle on pale aqua tiles with a soft shadow, space for text at the top.
- **scene-tile-1**: Toothbrushes in a glass cup by a white basin.
- **scene-tile-2**: A plain first aid pouch, gauze and a bandage on a white table, from above.
- **scene-tile-3**: A sanitizer bottle and masks by a front door on a small tray.
- **scene-tile-4**: Plain skin care tubes and jars on a silver tray beside a folded linen towel.
- **scene-banner**: A long white bathroom counter with plain bottles spaced along it, wide and calm.
- **scene-story**: A bright neighbourhood pharmacy counter with plain white boxes on shelves behind it, no signs, labels or crosses.

---

### medical-devices (16)

**Save to: `.editions-inbox/09-wave-9-health/medical-devices/`**

Palette for scenes: *cool grey, white, pale teal, graphite.* Add: *"Medical devices: generic and unbranded, every display blank (dark grey, no digits or symbols), cuffs and cables coiled neatly, no logos, printed scales or markings."*

Monitors
1. **upper-arm-bp-monitor**: A white upper-arm blood pressure monitor with its grey cuff coiled beside it, blank screen.
2. **wrist-bp-monitor**: A white wrist blood pressure monitor with the cuff closed, blank screen.
3. **glucometer-kit**: A small grey glucometer with a blank screen and a plain unlabelled test strip tube.
4. **fingertip-pulse-oximeter**: A white and teal fingertip pulse oximeter, closed, blank display.

Thermometers & breathing
5. **digital-stick-thermometer**: A white digital stick thermometer, blank display.
6. **infrared-forehead-thermometer**: A white infrared forehead thermometer, side view, blank display.
7. **compressor-nebulizer**: A white compressor nebulizer with its tubing and a clear mask, coiled.
8. **dual-head-stethoscope**: A graphite stethoscope laid in a neat loop.

Mobility
9. **folding-wheelchair**: A black and silver folding wheelchair, open, three-quarter view.
10. **aluminium-crutches-pair**: A pair of silver aluminium crutches, standing side by side.
11. **adjustable-walking-cane**: A graphite adjustable walking cane with a quad base.
12. **folding-rollator-walker**: A grey folding rollator walker with a seat, open, side view.

Supports & scales
13. **knee-support-brace**: A grey knee support brace with side straps.
14. **lumbar-back-belt**: A grey lumbar back support belt, closed.
15. **wrist-splint**: A black wrist splint with velcro straps.
16. **digital-bathroom-scale**: A white glass bathroom scale, blank display, no markings.

Scenes
- **scene-hero-wide**: A calm bright living room with a blood pressure monitor and a glass of water on a white side table, soft daylight, space for text on the right.
- **scene-hero-tall**: A pulse oximeter and a thermometer on a pale teal surface with a soft shadow, space for text at the top.
- **scene-tile-1**: A blood pressure monitor and glucometer on a wooden bedside table.
- **scene-tile-2**: A nebulizer on a white shelf beside a folded blanket.
- **scene-tile-3**: A folding wheelchair by a sunny window in a quiet hallway.
- **scene-tile-4**: A knee brace and a back belt on a grey linen bed.
- **scene-banner**: A long clean white counter with devices spaced along it, blank screens, wide and calm.
- **scene-story**: A tidy medical supplies shop with wheelchairs and boxed devices on white shelves, no signs or labels.

---

## Wave 10: Pets (3 niches)

### pet-food (16)

**Save to: `.editions-inbox/10-wave-10-pets/pet-food/`**

Palette for scenes: *warm biscuit, cream, sage, terracotta.* Add: *"Pet food: plain unlabelled bags, pouches, tins and jars with no text, numbers or pictures of animals; kibble shown only in a bowl when asked; no animals in the image."*

Cat food
1. **cat-dry-food-bag**: A plain unlabelled kraft stand-up bag of dry cat food, closed.
2. **cat-kibble-ceramic-bowl**: A small cream ceramic bowl filled with dry cat kibble.
3. **cat-wet-food-pouches**: Three plain unlabelled sage wet food pouches standing in a row.
4. **cat-wet-food-tins**: A stack of three small plain silver pet food tins.

Dog food
5. **dog-dry-food-sack**: A large plain unlabelled terracotta dry dog food bag, standing.
6. **dog-kibble-steel-bowl**: A steel bowl filled with dry dog kibble.
7. **dog-wet-food-cans**: Three plain unlabelled tall silver dog food cans in a row.
8. **puppy-food-bag**: A small plain unlabelled cream bag of puppy food, closed.

Treats & chews
9. **dog-chew-sticks-jar**: A glass jar of natural dog chew sticks with a wooden lid.
10. **bone-biscuits-jar**: A glass jar of bone-shaped dog biscuits.
11. **creamy-cat-treat-tubes**: Five plain unprinted cat treat tubes fanned out.
12. **dental-chews-pouch**: A plain unlabelled sage pouch with a few green dental chews in front.

Feeding
13. **airtight-food-container**: A plain cream airtight pet food storage bin with a lid.
14. **steel-measuring-scoop**: A steel pet food measuring scoop with no markings.
15. **slow-feeder-bowl**: A terracotta slow feeder bowl with a maze pattern, empty.
16. **automatic-pet-feeder**: A white automatic pet feeder, blank display.

Scenes
- **scene-hero-wide**: A sunny kitchen floor with a ceramic bowl of kibble by a window and a plain food bin beside it, no animals, space for text on the left.
- **scene-hero-tall**: A cream bowl of kibble on terracotta tiles with soft morning shadows, space for text at the top.
- **scene-tile-1**: A plain kraft food bag and a small bowl on a wooden kitchen shelf.
- **scene-tile-2**: A steel bowl of kibble on a doormat by a garden door.
- **scene-tile-3**: Jars of treats on an open shelf with soft light.
- **scene-tile-4**: A slow feeder and a scoop on a sage mat, from above.
- **scene-banner**: A long kitchen counter with plain jars of kibble and treats spaced out, wide and warm.
- **scene-story**: A small pet food shop with plain sacks on wooden pallets and glass jars of treats on the counter, no signs or labels.

---

### pet-accessories (16)

**Save to: `.editions-inbox/10-wave-10-pets/pet-accessories/`**

Palette for scenes: *soft grey, mustard, denim blue, cream.* Add: *"Pet accessories: unbranded, plain fabrics, no prints with words, no paw-print logos, empty beds and carriers, no animal in the image."*

Beds & homes
1. **round-plush-pet-bed**: A round soft grey plush pet bed, empty.
2. **sisal-cat-tree**: A cream three-level cat tree with sisal posts.
3. **felt-cat-cave**: A grey felt cat cave with a round opening.
4. **wooden-dog-house**: A small natural wood dog house with a pitched roof.

Litter & grooming
5. **covered-litter-box**: A grey covered cat litter box with a swing door.
6. **litter-scoop**: A mustard plastic litter scoop.
7. **slicker-grooming-brush**: A pet slicker brush with a wooden handle.
8. **pet-nail-clipper**: A pet nail clipper with mustard grips.

Walking & travel
9. **denim-dog-collar**: A denim blue dog collar with a brass buckle, closed in a loop.
10. **rope-dog-leash**: A cream rope dog leash with a brass clip, coiled.
11. **padded-dog-harness**: A mustard padded dog harness, laid flat.
12. **pet-travel-carrier**: A grey hard pet travel carrier with a wire door, closed and empty.

Toys
13. **cotton-rope-toy**: A knotted cotton rope dog toy in cream and blue.
14. **feather-wand-toy**: A cat feather wand toy lying diagonally.
15. **rubber-chew-ball**: A mustard rubber chew ball.
16. **cardboard-cat-scratcher**: A wave-shaped cardboard cat scratcher.

Scenes
- **scene-hero-wide**: An empty grey pet bed in a patch of sunlight on a wooden floor beside a sofa, space for text on the right.
- **scene-hero-tall**: A cat tree by a tall window with sheer curtains, empty, space for text at the top.
- **scene-tile-1**: An empty felt cat cave on a cream rug.
- **scene-tile-2**: A covered litter box in a clean laundry corner.
- **scene-tile-3**: A leash and collar hanging on a hook by a front door.
- **scene-tile-4**: Toys scattered on a mustard blanket, from above.
- **scene-banner**: A long living room floor with a pet bed, a basket of toys and a carrier spaced out, calm.
- **scene-story**: A cosy pet shop with beds stacked on shelves and leashes hanging on a pegboard, no signs.

---

### fish-birds (16)

**Save to: `.editions-inbox/10-wave-10-pets/fish-birds/`**

Palette for scenes: *aqua, sand, leaf green, pale wood.* Add: *"Aquariums and cages: shown with no fish or birds, clean water and live plants in tanks, plain glass and wire, unbranded equipment with no labels; food in plain unlabelled tubs or jars."*

Aquariums
1. **rimless-planted-aquarium**: A rimless glass aquarium with green plants, sand and a stone, no fish.
2. **desktop-nano-aquarium**: A small cube aquarium with moss and pebbles, no fish.
3. **glass-betta-bowl**: A round glass bowl with a single plant and pebbles, no fish.
4. **aquarium-with-wood-cabinet**: A medium planted aquarium on a pale wood cabinet, no fish.

Aquarium equipment
5. **hang-on-back-filter**: A black hang-on-back aquarium filter.
6. **aquarium-air-pump**: A small grey air pump with clear tubing and an air stone, coiled.
7. **aquarium-heater**: A glass submersible aquarium heater with a black cap, no markings.
8. **led-aquarium-light-bar**: A slim black LED aquarium light bar on extendable brackets.

Bird cages
9. **white-wire-bird-cage**: A white wire bird cage with a domed top, empty.
10. **black-parrot-cage**: A tall black parrot cage on wheels, empty, side view.
11. **bird-travel-cage**: A small sand-coloured bird travel cage with a handle, empty.
12. **wooden-bird-nest-box**: A pale wood bird nest box with a round hole.

Food & care
13. **bird-seed-mix-jar**: A glass jar of mixed bird seed with a wooden lid.
14. **fish-flakes-tub**: A small plain unlabelled aqua fish food tub.
15. **wooden-perch-swing**: A natural wood bird perch swing.
16. **bird-feeder-cups**: Two white ceramic bird feeder cups with clips.

Scenes
- **scene-hero-wide**: A planted aquarium glowing softly in a calm living room at dusk, no fish, space for text on the left.
- **scene-hero-tall**: An empty white bird cage by a sunny window with green plants, space for text at the top.
- **scene-tile-1**: A rimless planted tank on a pale wood shelf.
- **scene-tile-2**: Filters, heaters and tubing on an aqua mat, from above.
- **scene-tile-3**: An empty bird cage on a balcony with potted plants and morning light.
- **scene-tile-4**: A jar of seed and feeder cups on a wooden table.
- **scene-banner**: A long wall of planted aquariums in a row, soft blue-green light, no fish.
- **scene-story**: A neighbourhood aquarium shop with glass tanks of plants on shelves and cages hanging above, no signs.

---

## Wave 11: Auto (6 niches)

### car-accessories (16)

**Save to: `.editions-inbox/11-wave-11-auto/car-accessories/`**

Palette for scenes: *graphite, gloss black, amber, cool white.* Add: *"Car gadgets: unbranded, screens and displays off (black), cables coiled neatly, no logos, button labels or printed markings."*

Car tech
1. **front-dash-cam**: A small black front dash cam with a windshield mount, screen off.
2. **android-car-screen**: A black 9-inch car multimedia screen in its dash frame, screen off.
3. **reverse-parking-camera**: A small black reverse parking camera with its cable coiled.
4. **parking-sensors-kit**: Four black parking sensors and a small control box, laid neatly.

Phone holders & chargers
5. **car-vent-phone-holder**: A black clip-on air vent phone holder with adjustable arms.
6. **suction-dashboard-holder**: A black suction-cup dashboard phone holder with a telescopic arm.
7. **dual-usb-c-car-charger**: A small aluminium dual USB-C car charger plug.
8. **wireless-charging-car-mount**: A black wireless charging car mount with clamping arms.

Car lights
9. **led-headlight-bulbs-pair**: A pair of LED headlight bulbs with small cooling fans.
10. **ambient-led-strip-kit**: A coiled ambient LED strip kit with a small control box.
11. **round-fog-lamps-pair**: A pair of round black fog lamps with clear lenses.
12. **led-interior-dome-light**: A flat white LED interior dome light panel.

Car audio
13. **door-speakers-pair**: A pair of round black car door speakers with grilles.
14. **under-seat-subwoofer**: A slim black under-seat subwoofer box.
15. **car-amplifier**: A compact black car amplifier with a brushed aluminium top.
16. **bluetooth-fm-transmitter**: A small black FM transmitter plug, display off.

Scenes
- **scene-hero-wide**: A clean modern car interior at night with soft amber ambient lights and a dash cam on the windshield, screen off, space for text on the right.
- **scene-hero-tall**: A phone holder on a graphite dashboard with city lights blurred through the windshield, space for text at the top.
- **scene-tile-1**: A car screen glowing faintly blank in a dark dashboard.
- **scene-tile-2**: A vent phone holder and a charger in a car's centre console.
- **scene-tile-3**: Headlights of a parked car glowing in a dim Cairo garage.
- **scene-tile-4**: A door speaker and a subwoofer on a black workshop mat.
- **scene-banner**: A wide dark underground car park with one car's lights on, calm and cinematic.
- **scene-story**: A car accessories shop counter with boxed gadgets (no labels) and a fitting bay behind, no people.

---

### car-care (16)

**Save to: `.editions-inbox/11-wave-11-auto/car-care/`**

Palette for scenes: *ocean blue, foam white, chrome silver, citrus yellow.* Add: *"Car care products: plain unlabelled bottles, spray bottles, jugs and tins with no text, numbers or printed labels; towels, mitts and pads plain."*

Wash
1. **car-shampoo-bottle**: A plain unlabelled blue car shampoo bottle with a flip cap.
2. **snow-foam-lance**: A snow foam lance with a clear bottle and a brass fitting.
3. **chenille-wash-mitt**: A blue chenille microfibre wash mitt.
4. **wash-bucket-grit-guard**: A white wash bucket with a black grit guard inside.

Polish & protection
5. **carnauba-wax-tin**: A plain unlabelled round silver wax tin, lid off, yellow wax inside.
6. **ceramic-coating-kit**: A small plain glass coating bottle with a foam applicator block.
7. **car-polish-bottle**: A plain unlabelled white polish bottle.
8. **dual-action-polisher**: A grey dual-action polisher machine with a yellow foam pad.

Interior cleaning
9. **dashboard-shine-spray**: A plain unlabelled white trigger spray bottle.
10. **microfiber-towels-stack**: A stack of folded microfibre towels in blue, grey and yellow.
11. **detailing-brushes-set**: Three soft detailing brushes with wooden handles, in a row.
12. **vent-clip-air-freshener**: A small chrome vent clip air freshener, no markings.

Oils & fluids
13. **engine-oil-jug**: A plain unlabelled black four-litre engine oil jug.
14. **coolant-jug**: A plain unlabelled translucent jug of green coolant.
15. **windshield-washer-fluid**: A plain unlabelled translucent jug of blue washer fluid.
16. **oil-funnel-and-filter**: A yellow funnel beside a plain blue oil filter.

Scenes
- **scene-hero-wide**: A gleaming dark blue car covered in white foam in a clean detailing bay, soft light, space for text on the left.
- **scene-hero-tall**: Water beads on a freshly waxed blue car bonnet, close and glossy, space for text at the top.
- **scene-tile-1**: A wash bucket and mitt beside a wet car wheel.
- **scene-tile-2**: A polisher and a wax tin on a car bonnet under bright lamps.
- **scene-tile-3**: A clean car interior with folded microfibre towels on the seat.
- **scene-tile-4**: Plain oil and coolant jugs on a garage shelf.
- **scene-banner**: A long detailing studio with a car under strip lights, chrome reflections, wide.
- **scene-story**: A tidy detailing garage in Cairo with plain bottles on steel shelves and hoses coiled on the wall, no signs.

---

### tyres-batteries (16)

**Save to: `.editions-inbox/11-wave-11-auto/tyres-batteries/`**

Palette for scenes: *asphalt black, rubber grey, safety yellow, white.* Add: *"Tyres and wheels: plain sidewalls with no lettering, numbers or logos, clean tread; batteries in plain cases with no text, stickers or symbols."*

Car tyres
1. **passenger-car-tyre**: A black passenger car tyre standing upright, three-quarter view.
2. **all-terrain-suv-tyre**: A chunky all-terrain SUV tyre, three-quarter view.
3. **low-profile-sport-tyre**: A low-profile sport tyre with a directional tread, standing.
4. **tyre-set-of-four**: Four car tyres stacked in a neat column.

Batteries
5. **black-car-battery**: A plain black car battery with red and black terminal covers.
6. **grey-agm-battery**: A plain grey AGM car battery, three-quarter view.
7. **motorcycle-battery**: A small plain black motorcycle battery.
8. **portable-jump-starter**: A compact black and yellow jump starter with clamps coiled beside it.

Rims
9. **silver-five-spoke-rim**: A silver five-spoke alloy rim, front three-quarter view.
10. **black-multi-spoke-rim**: A gloss black multi-spoke alloy rim.
11. **steel-wheel-rim**: A plain black steel wheel rim.
12. **mounted-alloy-wheel**: A silver alloy wheel with a tyre fitted, standing.

Tools & care
13. **portable-tyre-inflator**: A compact black tyre inflator with a coiled hose, blank display.
14. **cross-lug-wrench**: A steel cross lug wrench.
15. **jumper-cables-set**: Red and black jumper cables with copper clamps, coiled.
16. **tyre-pressure-gauge**: A chrome dial tyre pressure gauge, dial face blank.

Scenes
- **scene-hero-wide**: A neat stack of new tyres in a clean workshop with yellow floor lines and soft daylight from a roller door, space for text on the right.
- **scene-hero-tall**: A single tyre standing on wet asphalt with a low sun behind, space for text at the top.
- **scene-tile-1**: Tyres on a steel rack in rows, low angle.
- **scene-tile-2**: A car battery on a workshop bench beside a toolbox.
- **scene-tile-3**: A row of alloy rims leaning on a white wall.
- **scene-tile-4**: An inflator, gauge and lug wrench on a rubber mat, from above.
- **scene-banner**: A wide tyre shop interior with a car on a lift and wheels lined up, no signs.
- **scene-story**: A Cairo tyre and battery shop front at morning with stacked tyres and an open roller shutter, no signs or text.

---

### motorcycle (16)

**Save to: `.editions-inbox/11-wave-11-auto/motorcycle/`**

Palette for scenes: *rust red, matte black, khaki, cream.* Clothing line applies to the jacket. Add: *"Motorcycle gear: unbranded, no decals, numbers or logos, helmets empty with clear or smoked visors; motorcycles and scooters shown alone, side view, fully in frame, on the kickstand, no rider."*

Bikes & scooters
1. **black-commuter-motorcycle**: A black 150cc commuter motorcycle, side view, on its kickstand.
2. **cream-retro-scooter**: A cream retro scooter with a round headlight, side view.
3. **khaki-adventure-motorcycle**: A khaki adventure motorcycle with tall suspension, side view.
4. **electric-moped**: A matte grey electric moped, side view.

Helmets
5. **matte-full-face-helmet**: A matte black full-face motorcycle helmet with a smoked visor, three-quarter view.
6. **cream-open-face-helmet**: A cream open-face retro helmet with a short brown peak.
7. **grey-modular-helmet**: A grey modular helmet with the chin bar raised.
8. **rust-half-helmet**: A rust red half helmet with a leather strap.

Riding gear
9. **brown-leather-riding-jacket**: A brown leather riding jacket with padded shoulders, flat-lay.
10. **mesh-riding-gloves**: A pair of black mesh riding gloves with knuckle guards.
11. **leather-riding-boots**: A pair of black leather ankle riding boots.
12. **two-piece-rain-suit**: A khaki two-piece riding rain suit, folded.

Parts & accessories
13. **motorcycle-top-box**: A matte black motorcycle top box, closed.
14. **handlebar-mirrors-pair**: A pair of round chrome handlebar mirrors.
15. **disc-brake-lock**: A yellow and black disc brake lock with its key.
16. **chain-lube-spray**: A plain unlabelled black spray can.

Scenes
- **scene-hero-wide**: A cream retro scooter parked alone on an empty Alexandria seafront road at sunset, space for text on the left.
- **scene-hero-tall**: A matte black helmet resting on a motorcycle seat in a dim garage with warm light, space for text at the top.
- **scene-tile-1**: A commuter motorcycle parked alone in a quiet old Cairo street at dawn.
- **scene-tile-2**: Helmets on a wooden shelf against a brick wall.
- **scene-tile-3**: A leather jacket and gloves on a workshop bench.
- **scene-tile-4**: Mirrors, a top box and a disc lock on a concrete floor, from above.
- **scene-banner**: An adventure motorcycle parked alone on a long desert road, wide and quiet.
- **scene-story**: A small motorcycle workshop with a bike on a stand, tools on a pegboard and helmets on shelves, no people.

---

### car-interior (16)

**Save to: `.editions-inbox/11-wave-11-auto/car-interior/`**

Palette for scenes: *tan leather, espresso brown, cream, smoke grey.* Add: *"Interior accessories: shown alone and off the car unless stated, unbranded, plain stitching, no logos, emblems or printed patterns."*

Seat covers
1. **tan-leather-seat-cover**: A tan leather seat cover fitted on a single detached car seat, three-quarter view.
2. **grey-fabric-seat-cover-set**: A smoke grey fabric seat cover set, folded in a neat stack.
3. **black-quilted-seat-cover**: A black diamond-quilted seat cover fitted on a single detached car seat.
4. **wooden-bead-seat-cushion**: A natural wooden bead seat cushion.

Floor mats
5. **diamond-stitched-floor-mats**: A set of espresso brown diamond-stitched leather floor mats, laid out.
6. **black-rubber-floor-mats**: A set of four black rubber floor mats, laid out.
7. **trunk-boot-liner**: A black rubber trunk liner with raised edges.
8. **carpet-floor-mats-set**: A set of grey carpet floor mats with a heel pad.

Steering & dashboard
9. **tan-steering-wheel-cover**: A tan stitched leather steering wheel cover, on its own.
10. **carpet-dashboard-cover**: A black carpet dashboard cover, laid flat.
11. **folding-windshield-sunshade**: A silver folding windshield sunshade, folded.
12. **memory-foam-neck-pillow**: A cream memory-foam headrest neck pillow.

Organisers & comfort
13. **leather-seat-back-organiser**: A tan leather seat-back organiser with pockets, laid flat.
14. **folding-trunk-organiser**: A grey folding trunk organiser box, open.
15. **lumbar-support-cushion**: An espresso brown lumbar support cushion.
16. **leather-tissue-box-holder**: A tan leather tissue box holder, closed.

Scenes
- **scene-hero-wide**: A warm car interior with tan leather seats and soft afternoon light through the windows, space for text on the right.
- **scene-hero-tall**: A close view of a stitched tan leather seat with a cream cushion, space for text at the top.
- **scene-tile-1**: Front seats in a quilted black cover, door open, soft light.
- **scene-tile-2**: Diamond-stitched floor mats inside a clean car footwell.
- **scene-tile-3**: A leather steering wheel cover in a cream and brown cabin.
- **scene-tile-4**: A tidy trunk with a folding organiser and a liner.
- **scene-banner**: A long upholstery workshop table with rolls of leather and fabric, wide and warm.
- **scene-story**: A car upholstery workshop with a seat on a stand, leather swatches and a sewing machine, no people.

---

### ev-charging (16)

**Save to: `.editions-inbox/11-wave-11-auto/ev-charging/`**

Palette for scenes: *cool white, electric teal, graphite, pale concrete.* Add: *"EV chargers: generic unbranded wall units, cables and plugs, displays and LEDs off or a soft plain teal glow with no symbols, connectors clean, cables coiled neatly, no text or logos."*

Home chargers
1. **white-wallbox-charger**: A white rounded home wallbox charger with a coiled cable.
2. **graphite-smart-wallbox**: A graphite square smart wallbox, untethered, with a socket.
3. **wallbox-with-holster**: A white wallbox with its plug resting in a side holster.
4. **compact-three-phase-charger**: A compact grey three-phase wall charger.

Portable chargers
5. **portable-type-2-charger**: A portable EV charger with an inline control box and a Type 2 plug, coiled.
6. **portable-gb-t-charger**: A portable EV charger with a GB/T plug and a wall plug, coiled.
7. **ev-charger-carry-case**: A grey hard carry case for a portable charger, closed.
8. **blue-industrial-plug-adapter**: A blue industrial socket adapter with a short cable.

Cables & adapters
9. **type-2-charging-cable**: A black Type 2 to Type 2 charging cable, coiled neatly.
10. **gb-t-to-type-2-adapter**: A short GB/T to Type 2 charging adapter.
11. **ccs-dc-adapter**: A black CCS fast-charging adapter.
12. **cable-storage-bag**: A grey zip charging cable storage bag, closed.

Mounts & accessories
13. **wall-cable-holster**: A white wall-mounted cable hook with a plug dock.
14. **charging-pedestal-post**: A slim white and graphite charging pedestal post, standing.
15. **connector-dust-cap**: A black rubber connector dust cap.
16. **cable-reel-organiser**: A graphite wall cable reel organiser, empty.

Scenes
- **scene-hero-wide**: A modern villa carport in New Cairo with a white wallbox on a pale concrete wall and a cable coiled, an unbranded electric car parked, space for text on the left.
- **scene-hero-tall**: A wallbox glowing softly teal on a concrete wall at dusk, space for text at the top.
- **scene-tile-1**: A wallbox and holster on a white garage wall with soft daylight.
- **scene-tile-2**: A portable charger in its open case in a car trunk.
- **scene-tile-3**: Charging cables coiled on a concrete floor, from above.
- **scene-tile-4**: A charging pedestal in a quiet landscaped parking lot.
- **scene-banner**: A wide row of charging posts in an empty modern car park at blue hour.
- **scene-story**: An installer's workbench with wallboxes, cable reels and tools on a pegboard, no people.

---

## Wave 12: Handmade (4 niches)

### handmade-gifts (16)

**Save to: `.editions-inbox/12-wave-12-handmade/handmade-gifts/`**

Palette for scenes: *dusty pink, kraft brown, cream, soft gold.* Add: *"Handmade gifts: clearly handmade, unbranded, no names, initials, letters or messages on anything; gift boxes closed with plain ribbon."*

Gift boxes
1. **kraft-gift-box-ribbon**: A kraft gift box tied with a dusty pink satin ribbon, closed.
2. **wooden-box-dried-flowers**: An open wooden gift box filled with dried flowers and a small candle.
3. **velvet-gift-box**: A small dusty pink velvet gift box, closed.
4. **wicker-gift-hamper**: A wicker gift hamper with cream tissue paper and a closed lid.

Resin art
5. **resin-coasters-set**: Four round resin coasters with pressed flowers and gold flakes, stacked.
6. **resin-serving-tray**: An oval resin tray with soft pink swirls and gold handles.
7. **resin-flower-keychain**: A clear resin keychain with a tiny pressed flower.
8. **resin-bookmark**: A clear resin bookmark with dried petals and a tassel.

Macrame & wall decor
9. **macrame-wall-hanging**: A cream macrame wall hanging on a wooden dowel.
10. **macrame-plant-hanger**: A cream macrame plant hanger holding an empty clay pot.
11. **dried-flower-frame**: A wooden frame with pressed dried flowers behind glass.
12. **woven-wall-basket**: A round woven wall basket in kraft and pink.

Keepsakes
13. **wooden-keepsake-box**: A small carved wooden keepsake box, closed.
14. **leather-card-holder**: A hand-stitched tan leather card holder.
15. **hand-painted-wooden-tray**: A small wooden tray hand-painted with pink flowers.
16. **beaded-bracelet-set**: Three handmade beaded bracelets in pink, cream and gold, stacked.

Scenes
- **scene-hero-wide**: A wrapped kraft gift box with a pink ribbon and dried flowers on a cream linen table, soft window light, space for text on the left.
- **scene-hero-tall**: An open wooden gift box with dried flowers on a pale pink wall shelf, space for text at the top.
- **scene-tile-1**: Stacked gift boxes with ribbons on a wooden table.
- **scene-tile-2**: Resin coasters and a tray on white marble with soft sunlight.
- **scene-tile-3**: A macrame hanging on a cream plaster wall above a plant.
- **scene-tile-4**: A keepsake box and bracelets on kraft paper, from above.
- **scene-banner**: A long crafting table with ribbons, kraft paper and dried flowers laid out, wide and calm.
- **scene-story**: A small home studio with shelves of handmade gifts, rolls of ribbon and a wrapping table, no people.

---

### ceramics (16)

**Save to: `.editions-inbox/12-wave-12-handmade/ceramics/`**

Palette for scenes: *terracotta, sand, cobalt blue, off-white.* Add: *"Ceramics: clearly handmade with small irregularities and real glaze, empty unless stated, no stamps, letters or painted words."*

Mugs & cups
1. **speckled-stoneware-mug**: An off-white speckled stoneware mug.
2. **cobalt-glazed-mug**: A cobalt blue glazed mug with a dripping glaze edge.
3. **espresso-cups-set**: Three small sand-coloured espresso cups with saucers, in a row.
4. **handleless-tea-cups**: Four small handle-less terracotta tea cups, stacked two by two.

Plates & bowls
5. **rimmed-dinner-plate**: An off-white rimmed stoneware dinner plate with a blue edge.
6. **large-serving-bowl**: A large sand-glazed serving bowl.
7. **dip-bowls-set**: Three small cobalt dip bowls.
8. **oval-ceramic-platter**: An oval off-white ceramic platter.

Pots & tagines
9. **terracotta-tagine**: A terracotta tagine with its conical lid.
10. **clay-cooking-pot**: A round unglazed clay cooking pot with a lid.
11. **clay-water-qolla**: A traditional unglazed clay water jug (qolla) with a narrow neck.
12. **glazed-oven-casserole**: A cobalt glazed oven casserole dish with two handles.

Decor
13. **terracotta-vase**: A tall terracotta vase with a narrow neck.
14. **clay-incense-burner**: A small clay incense burner on a short pedestal, empty.
15. **ceramic-planter**: A round off-white ceramic planter with a drainage saucer, empty.
16. **ceramic-candle-holder**: A sand ceramic candle holder.

Scenes
- **scene-hero-wide**: Handmade mugs and bowls on a rough wooden table in a sunlit pottery studio, space for text on the right.
- **scene-hero-tall**: A terracotta vase on a sand plaster ledge with an arched shadow, space for text at the top.
- **scene-tile-1**: Mugs drying on a wooden shelf by a window.
- **scene-tile-2**: Stacked plates and bowls on an off-white linen cloth.
- **scene-tile-3**: A tagine on a stone kitchen counter with soft warm light.
- **scene-tile-4**: Vases and a planter on a terracotta tiled floor.
- **scene-banner**: A long kiln room shelf of glazed pieces in a row, wide and warm.
- **scene-story**: A pottery workshop in Fustat with a wheel, clay, tools and drying pots on wooden boards, no people.

---

### candles-soap (16)

**Save to: `.editions-inbox/12-wave-12-handmade/candles-soap/`**

Palette for scenes: *honey, ivory, lavender grey, olive.* Add: *"Candles and soaps: handmade look, unbranded, plain jars, tins and wrapping with no labels, stickers or stamped words; candles unlit unless stated."*

Candles
1. **amber-jar-soy-candle**: A soy candle in a plain amber glass jar with a wooden wick.
2. **ivory-pillar-candles-set**: Three ivory pillar candles of different heights.
3. **travel-tin-candle**: A small plain silver tin candle, lid off.
4. **beeswax-taper-candles**: A pair of honey beeswax taper candles.

Soap
5. **olive-oil-soap-bar**: A green olive oil soap bar, rough-cut.
6. **goat-milk-soap-bar**: An ivory goat milk soap bar.
7. **black-soap-jar**: A small plain glass jar of dark Moroccan black soap paste.
8. **soap-on-wooden-dish**: A lavender soap bar on a slatted wooden soap dish.

Bath
9. **bath-bombs-set**: Five round bath bombs in ivory, lavender and olive.
10. **bath-salt-jar**: A plain glass jar of pink and white bath salts.
11. **natural-loofah**: A natural dried loofah sponge.
12. **sugar-scrub-jar**: A plain glass jar of honey sugar body scrub with a wooden spoon.

Home fragrance
13. **reed-diffuser**: A plain glass reed diffuser bottle with natural reeds.
14. **wax-melt-cubes**: A tray of six honey wax melt cubes.
15. **ceramic-wax-warmer**: An ivory ceramic wax warmer, unlit.
16. **brass-bakhoor-burner**: A small brass bakhoor burner with a domed lid.

Scenes
- **scene-hero-wide**: A lit soy candle and soap bars on a stone bath ledge with soft evening light, space for text on the left.
- **scene-hero-tall**: Pillar candles glowing on a lavender grey windowsill at dusk, space for text at the top.
- **scene-tile-1**: Candles on a wooden tray with dried lavender.
- **scene-tile-2**: Stacked soap bars on olive leaves on a marble slab.
- **scene-tile-3**: Bath bombs and salts by a white bath with soft steam.
- **scene-tile-4**: A reed diffuser and a wax warmer on a bedside table.
- **scene-banner**: A long workshop table with cooling soap bars and candle jars in rows, wide and calm.
- **scene-story**: A small soap and candle workshop with a melting pot, moulds and drying racks, no people.

---

### crochet-embroidery (16)

**Save to: `.editions-inbox/12-wave-12-handmade/crochet-embroidery/`**

Palette for scenes: *mustard, sage, rose, natural ecru.* Add: *"Crochet and embroidery: clearly handmade stitches, natural yarns, no letters, names or characters; amigurumi as simple plants and fruit."*

Crochet bags
1. **crochet-tote-bag**: An ecru crochet tote bag with long handles.
2. **round-crochet-bag**: A round mustard crochet shoulder bag with a wooden ring handle.
3. **crochet-market-net-bag**: A sage crochet net market bag, empty.
4. **crochet-zip-pouch**: A small rose crochet zip pouch.

Home crochet
5. **crochet-table-runner**: An ecru crochet lace table runner, laid straight.
6. **crochet-coasters-set**: Four round crochet coasters in mustard, sage, rose and ecru, stacked.
7. **granny-square-cushion**: A square cushion covered in colourful granny squares.
8. **crochet-storage-basket**: A chunky ecru crochet storage basket, empty.

Embroidery
9. **floral-embroidery-hoop**: A wooden embroidery hoop with a stitched floral design.
10. **embroidered-cushion**: A linen cushion with rose and sage embroidered flowers.
11. **embroidered-napkins-set**: Four linen napkins with small embroidered flowers, folded and stacked.
12. **cross-stitch-kit**: A cross-stitch kit with a geometric pattern half stitched in a hoop and threads beside it.

Amigurumi & yarn
13. **amigurumi-cactus**: A small crochet cactus in a crochet pot.
14. **amigurumi-strawberry**: A small crochet strawberry with a green top.
15. **yarn-skeins-set**: Five skeins of yarn in mustard, sage, rose, ecru and white, in a row.
16. **crochet-hooks-roll**: A fabric roll of crochet hooks, open.

Scenes
- **scene-hero-wide**: A crochet tote and yarn balls on a wooden chair by a sunny window, space for text on the right.
- **scene-hero-tall**: An embroidery hoop on a cream wall above a basket of yarn, space for text at the top.
- **scene-tile-1**: Crochet bags hanging on wooden pegs against an ecru wall.
- **scene-tile-2**: A crochet runner and coasters on a dining table with a vase.
- **scene-tile-3**: Embroidered cushions on a linen sofa.
- **scene-tile-4**: Yarn skeins and amigurumi on a woven tray, from above.
- **scene-banner**: A long table with a gradient of yarn balls and hooks laid out, wide and soft.
- **scene-story**: A cosy craft corner with a basket of yarn, a half-made granny square on the chair arm and threads on a shelf, no people.

---

## Wave 13: Books & stationery (3 niches)

### books (16)

**Save to: `.editions-inbox/13-wave-13-books-and-stationery/books/`**

Palette for scenes: *deep green, cream, oxblood, walnut.* Add: *"Books: closed, with plain cloth or paper covers and blank spines, no titles, letters, numbers or pictures; cream page edges."*

Novels & fiction
1. **green-cloth-hardcover**: A closed deep green cloth hardcover book, standing at a slight angle.
2. **paperback-stack-pastel**: A stack of five closed paperbacks in pastel plain covers.
3. **boxed-novel-set**: Three plain oxblood hardcovers in a matching plain slipcase.
4. **pocket-paperbacks-row**: Four small closed pocket paperbacks standing in a row.

Non-fiction & self-development
5. **cream-hardcover-dust-jacket**: A closed hardcover with a plain cream dust jacket.
6. **oxblood-linen-hardcover**: A closed oxblood linen hardcover lying flat.
7. **non-fiction-stack**: A stack of three closed hardcovers in green, cream and oxblood.
8. **gift-edition-book**: A closed hardcover with gilded page edges and a ribbon marker.

Religious books
9. **large-book-on-rehal**: A large closed hardcover with a plain gold geometric border, on a carved wooden rehal stand.
10. **leather-pocket-book**: A small closed brown leather-bound book with a plain cover.
11. **religious-books-set**: Four closed matching dark green volumes with plain gold-edged covers, standing.
12. **velvet-gift-book-box**: A closed oxblood velvet book box, plain.

Study & reference
13. **thick-reference-book**: A thick closed reference book with a plain dark blue cover.
14. **encyclopaedia-set**: Six closed matching walnut-brown volumes standing in a row, blank spines.
15. **textbook-stack**: A stack of three large closed softcover textbooks in plain colours.
16. **used-books-bundle**: A bundle of four worn closed books tied with string.

Scenes
- **scene-hero-wide**: A warm reading corner with a deep green armchair, a walnut side table and a stack of closed plain books, lamp light, space for text on the left.
- **scene-hero-tall**: Closed plain books on a walnut shelf with soft window light, space for text at the top.
- **scene-tile-1**: A stack of plain paperbacks on a café table with a cup of tea.
- **scene-tile-2**: A closed hardcover on a linen armchair with reading glasses.
- **scene-tile-3**: A closed book on a carved wooden rehal on a patterned rug, soft light.
- **scene-tile-4**: Reference volumes on a desk in a quiet study.
- **scene-banner**: A long wall of shelves with blank-spined books in green, cream and oxblood, wide and warm.
- **scene-story**: An old downtown Cairo bookshop with wooden shelves of blank-spined books and a ladder, no people or signs.

---

### stationery (16)

**Save to: `.editions-inbox/13-wave-13-books-and-stationery/stationery/`**

Palette for scenes: *paper white, cobalt, sunflower yellow, kraft.* Add: *"Stationery: unbranded, plain covers, pens capped, no printed letters, numbers, measurement marks or stickers with words."*

Pens & writing
1. **gel-pens-set**: Six coloured gel pens fanned out, capped.
2. **cobalt-fountain-pen**: A cobalt blue fountain pen, capped, lying diagonally.
3. **highlighters-set**: Five pastel highlighters in a row, capped.
4. **wooden-pencils-set**: Six sharpened natural wood pencils in a row.

Notebooks & planners
5. **hardcover-a5-notebook**: A closed cobalt hardcover A5 notebook with an elastic band.
6. **kraft-spiral-notebook**: A closed kraft spiral notebook.
7. **leather-planner**: A closed tan leather planner with a strap.
8. **sticky-notes-pads**: Four pads of sticky notes in yellow, blue, pink and white, stacked.

Desk & office
9. **metal-stapler**: A cobalt metal stapler, closed.
10. **mesh-desk-organiser**: A black mesh desk organiser, empty.
11. **kraft-file-folders**: Three kraft file folders stacked, slightly fanned.
12. **paper-clips-dish**: Gold paper clips in a small white ceramic dish.

School supplies
13. **zip-pencil-case**: A sunflower yellow zip pencil case, closed.
14. **coloured-pencils-tin**: An open tin of coloured pencils in a rainbow row.
15. **eraser-sharpener-set**: A white eraser and a cobalt pencil sharpener side by side.
16. **watercolour-paint-set**: An open watercolour paint palette with a brush.

Scenes
- **scene-hero-wide**: A tidy white desk with a cobalt notebook, a fountain pen and a yellow mug, morning sun, space for text on the right.
- **scene-hero-tall**: Pencils in a kraft cup on a white shelf with soft shadows, space for text at the top.
- **scene-tile-1**: Pens and highlighters on a white desk, from above.
- **scene-tile-2**: Closed notebooks and a planner stacked on a wooden table.
- **scene-tile-3**: A desk organiser, stapler and folders on a clean office desk.
- **scene-tile-4**: A pencil case, coloured pencils and paints on a kids' desk.
- **scene-banner**: A long desk with stationery laid out in a colour gradient, from above.
- **scene-story**: A neighbourhood stationery shop with pens in glass jars and notebooks on wooden shelves, no signs or labels.

---

### kids-books (16)

**Save to: `.editions-inbox/13-wave-13-books-and-stationery/kids-books/`**

Palette for scenes: *tomato red, sunshine yellow, sky blue, cream.* Add: *"Children's books: closed, chunky and colourful, covers with simple abstract shapes (circles, waves, stars), no titles, letters, numbers, characters, animals or faces."*

Picture books
1. **square-picture-book**: A closed square hardcover picture book with big yellow and red circles.
2. **landscape-picture-book**: A closed wide landscape picture book with blue wave shapes.
3. **picture-books-stack**: A stack of four closed picture books in bright plain colours.
4. **picture-books-slipcase**: Three closed picture books in a sky blue slipcase.

Board books
5. **chunky-board-books-set**: Four small chunky board books with rounded corners, standing.
6. **soft-cloth-book**: A soft fabric baby book with coloured shapes, closed.
7. **vinyl-bath-book**: A small vinyl bath book in sky blue and yellow, closed.
8. **lift-the-flap-book**: A closed board book with a small die-cut flap on the cover.

Colouring & activity
9. **colouring-book**: A closed colouring book with simple outlined shapes on the cover.
10. **sticker-activity-book**: A closed activity book with a sheet of plain shape stickers peeking out.
11. **wipe-clean-activity-book**: A closed spiral wipe-clean activity book with a marker clipped to it.
12. **activity-pad**: A thick spiral activity pad with a red cover.

Bedtime stories
13. **moon-stars-hardcover**: A closed navy hardcover with a simple yellow moon and stars.
14. **story-books-box**: A box of six small closed story books in bright spines.
15. **padded-storybook**: A padded closed storybook with rounded corners in cream and red.
16. **bedtime-stories-treasury**: A thick closed storybook treasury with a sky blue cloth cover.

Scenes
- **scene-hero-wide**: A sunny children's reading nook with floor cushions, a low wooden shelf and colourful closed books, space for text on the left.
- **scene-hero-tall**: Closed picture books leaning on a low shelf against a pale yellow wall, space for text at the top.
- **scene-tile-1**: Picture books spread on a cream rug, from above.
- **scene-tile-2**: Board books in a woven basket on a playroom floor.
- **scene-tile-3**: A colouring book and crayons on a small wooden table.
- **scene-tile-4**: A storybook on a bed with a soft blanket and a night lamp glowing.
- **scene-banner**: A long low bookshelf with colourful books facing out, seen straight on.
- **scene-story**: A cosy children's bookshop corner with low wooden shelves, a small rug and floor cushions, no people or signs.
