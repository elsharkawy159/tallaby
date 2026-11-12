# Template photos: the source (ChatGPT)

ROADMAP F-90. **This file is the single source of every photo our store templates show** (owner, 2026-11-12): product packshots, heroes, category tiles, banners, story and about photos, and each template's own extra slots. Every photo is generated from a prompt here and checked by eye; no new Pexels or other stock photos go into a template. The Pexels photos templates still show are listed under "Live templates" with their replacements, and are swapped as the images arrive. A template that needs a photo not listed here gets its prompt added here first.

Generate them in **one ChatGPT chat per niche and kind**: paste the master prompt once, then send the short prompts one at a time.

## Where the files go

Save each image as **`<slug>.png`** (the slug is in bold before each prompt; scenes are `scene-<slot>.png`) in its wave's niche folder:

```
.editions-inbox/
  00-live-templates/<niche>/      the 21 live niches: their packshots, and the replacement scenes listed under "Live templates"
  01-wave-1/<niche>/              earbuds, kidswear, backpacks-travel, mobiles, audio, small-appliances, modest-wear, silver-jewelry, wearables
  02-wave-2-beauty/<niche>/       … one folder per wave below, up to
  13-wave-13-books-and-stationery/<niche>/
```

For example `.editions-inbox/01-wave-1/earbuds/white-wireless-earbuds.png` or `.editions-inbox/01-wave-1/earbuds/scene-hero-wide.png`. Every niche folder already exists. The folder is git-ignored. If renaming is a pain, download them **in the order of this list** into the niche's folder, and I will match them by order and check each one by eye.

When a niche folder is complete, tell me. I convert to WebP, upload them to the `library-media` bucket and build the pack.

Reject and regenerate any image with: text, a logo or brand name, a person, hand or foot, a grey or coloured background, a cut-off product, or two products when one was asked.

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
| **All** | **62** | **992** | **496** | **1,488** |

Start with wave 1's six; the later waves can be made in any order, an industry at a time.

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

## Make next

### 1. earbuds (16), template wasla

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
