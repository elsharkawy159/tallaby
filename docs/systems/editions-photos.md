# Edition packshots to generate (ChatGPT)

ROADMAP F-90. Product photos for the niche edition packs that are still missing (updated 2026-11-12). Generate them in **one ChatGPT chat per niche**: paste the master prompt once, then send the short prompts one at a time.

## Where the files go

Save each image as **`<slug>.png`** (the slug is in bold before each prompt) in:

```
.editions-inbox/<niche>/<slug>.png
```

For example `.editions-inbox/slippers-clogs/white-classic-clog.png`. The folder is git-ignored. If renaming is a pain, download them **in the order of this list**, one niche per folder, and I will match them by order and check each one by eye.

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

When a niche folder in `.editions-inbox/<niche>/` is complete (16 packshots + 8 scenes), tell me its name. I check every image by eye, convert and upload them, build the pack and redesign its template, then switch the industry once its last niche is in.

**Dropped:** the 6 extra watch packshots (Saat now uses four categories of four).

---

## Scene photos

Every new pack also needs **8 scene photos**, so its template looks premium: one more chat per niche with the scene master prompt below. Save scenes as `.editions-inbox/<niche>/scene-<slug>.png` (packshots stay `<slug>.png`).

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

## Later waves

Beauty, perfumes, home, kitchen, food, sweets, kids, sports, health, pets, auto, handmade and books: I add their lists when their wave starts (one template per niche, `docs/systems/one-template-per-niche.md` §4).
