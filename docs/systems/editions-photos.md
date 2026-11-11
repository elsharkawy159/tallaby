# Edition packshots to generate (ChatGPT)

ROADMAP F-90. Product photos for the niche edition packs that are still missing. Generate them in **one ChatGPT chat per niche**: paste the master prompt once, then send the short prompts one at a time.

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

## chargers-cables (9)

One product per image, three-quarter view unless stated.

1. **black-3-in-1-cable**: A black braided charging cable that splits into three tips (USB-C, micro-USB and a slim phone connector), laid flat in a loose loop.
2. **white-10000mah-power-bank**: A slim white 10000mAh power bank, three-quarter view showing its two ports and a small LED dot.
3. **black-20000mah-power-bank**: A chunky matte black 20000mAh power bank with a small LED charge indicator, three-quarter view.
4. **white-magnetic-power-bank**: A thin white magnetic wireless power bank, front three-quarter view.
5. **pink-mini-power-bank**: A small pastel pink pocket power bank with a built-in folding USB-C plug, three-quarter view.
6. **white-wireless-charging-pad**: A round flat white wireless charging pad with a short coiled white cable.
7. **black-3-in-1-wireless-stand**: A black foldable 3-in-1 wireless charging stand (phone, earbuds and watch spots), with no devices on it.
8. **black-magnetic-car-mount**: A black magnetic wireless car phone mount with an air-vent clip, no phone on it.
9. **white-wireless-charging-stand**: An upright white wireless phone charging stand, no phone on it.

## watches (7)

Add to the master prompt for this chat: *"Watches: shown upright, strap closed in a loop, dial facing the camera, no brand name or logo on the dial, time set to 10:10."*

1. **black-smartwatch-silicone-strap**: A black square-face smartwatch with a black silicone sport strap, screen off (black).
2. **pink-smartwatch**: A rose-pink square-face smartwatch with a soft pink silicone strap, screen off.
3. **silver-smartwatch-mesh-strap**: A silver round-face smartwatch with a silver mesh strap, screen off.
4. **brown-leather-chronograph**: A steel chronograph watch with a cream dial and a brown leather strap.
5. **navy-dial-steel-watch**: A stainless steel watch with a navy blue dial and a steel link bracelet.
6. **two-tone-steel-watch**: A two-tone steel and gold watch with a white dial and a link bracelet.
7. **white-ceramic-womens-watch**: A small white ceramic women's watch with a white dial and a white ceramic link bracelet.

## slippers-clogs (16)

Add to the master prompt for this chat: *"Footwear: show one pair, both shoes side by side, three-quarter top view, no logo on the strap or sole. Clogs must be generic, not a copy of any brand's design (no round side badge, no charms)."*

Clogs
1. **white-classic-clog**: A pair of white rubber clogs with ventilation holes on top and a back heel strap.
2. **black-classic-clog**: A pair of black rubber clogs with ventilation holes and a back heel strap.
3. **sage-green-clog**: A pair of sage green rubber clogs with ventilation holes and a back heel strap.
4. **pink-platform-clog**: A pair of pastel pink rubber platform clogs with a thick sole and a back strap.

Slides
5. **black-rubber-slide**: A pair of black rubber slides with one wide strap.
6. **beige-cushion-slide**: A pair of soft, chunky beige cushion slides.
7. **white-two-strap-slide**: A pair of white slides with two wide straps.
8. **brown-buckle-cork-slide**: A pair of brown leather slides with two buckled straps on a cork footbed.

Flip-flops
9. **navy-rubber-flip-flops**: A pair of navy blue rubber flip-flops.
10. **black-flip-flops**: A pair of black rubber flip-flops.
11. **tan-leather-flip-flops**: A pair of tan leather thong sandals with a flat sole.
12. **white-platform-flip-flops**: A pair of white platform flip-flops with a thick sole.

Home slippers
13. **grey-fluffy-home-slippers**: A pair of fluffy grey open-toe home slippers.
14. **pink-fur-slides**: A pair of soft pink faux-fur slides.
15. **navy-knit-home-slippers**: A pair of navy knitted closed-toe home slippers.
16. **beige-closed-toe-slippers**: A pair of beige felt closed-toe house slippers.

---

# Batch 2: niches whose templates are ready (16 each, 176 in all)

Same master prompt. Each niche gets its own chat and its own folder. For clothes add the clothing line, for shoes the footwear line (as in slippers-clogs), for bags and jewelry the line given below.

**Clothing line** (add to the master prompt in clothing chats): *"Clothes: no mannequin, no model, no hanger. Show the garment as a neat flat-lay seen from straight above, sleeves and legs arranged naturally, no labels or prints with words."*

## menswear (16), templates zay, fashion-luxe

Shirts
1. **white-oxford-shirt**: A white cotton oxford button-down shirt, folded neatly.
2. **light-blue-linen-shirt**: A light blue linen long-sleeve shirt, flat-lay.
3. **navy-striped-shirt**: A navy and white fine-striped cotton shirt, flat-lay.
4. **black-overshirt**: A black heavy cotton overshirt with two chest pockets, flat-lay.

Polos & knitwear
5. **navy-pique-polo**: A navy cotton piqué polo shirt, flat-lay.
6. **olive-knit-polo**: An olive green knitted short-sleeve polo, flat-lay.
7. **grey-crew-sweater**: A grey wool crew-neck sweater, folded.
8. **beige-quarter-zip-sweater**: A beige knit quarter-zip sweater, flat-lay.

Trousers
9. **charcoal-tailored-trousers**: Charcoal grey tailored wool trousers, flat-lay.
10. **stone-chino-trousers**: Stone-coloured cotton chino trousers, flat-lay.
11. **navy-drawstring-trousers**: Navy linen drawstring trousers, flat-lay.
12. **black-cargo-trousers**: Black cotton cargo trousers with side pockets, flat-lay.

Jackets
13. **navy-bomber-jacket**: A navy nylon bomber jacket, flat-lay.
14. **tan-suede-jacket**: A tan suede trucker jacket, flat-lay.
15. **black-leather-jacket**: A black leather biker jacket, flat-lay.
16. **olive-field-jacket**: An olive cotton field jacket with four pockets, flat-lay.

## lingerie-sleepwear (16), template vella

Sleepwear only, nothing revealing. Clothing line applies.

Pajama sets
1. **ivory-satin-pajama-set**: An ivory satin long-sleeve pajama set with piping, folded.
2. **navy-cotton-pajama-set**: A navy cotton pajama shirt and trousers set, flat-lay.
3. **pink-striped-pajama-set**: A soft pink and white striped short-sleeve pajama set, flat-lay.
4. **sage-modal-pajama-set**: A sage green modal pajama set, flat-lay.

Nightgowns
5. **champagne-satin-nightgown**: A long champagne satin nightgown with wide straps, flat-lay.
6. **white-cotton-nightgown**: A long white cotton nightgown with short sleeves and lace trim, flat-lay.
7. **dusty-rose-nightgown**: A mid-length dusty rose jersey nightgown, flat-lay.
8. **navy-printed-nightgown**: A long navy nightgown with a small white dot print, flat-lay.

Robes
9. **white-waffle-robe**: A white waffle-knit cotton robe with belt, folded.
10. **blush-satin-robe**: A blush pink satin kimono robe, flat-lay.
11. **grey-fleece-robe**: A soft grey fleece hooded robe, folded.
12. **beige-linen-robe**: A beige linen robe, flat-lay.

Loungewear
13. **oatmeal-knit-lounge-set**: An oatmeal ribbed knit sweater and wide trousers set, flat-lay.
14. **black-jersey-lounge-set**: A black jersey long-sleeve top and jogger set, flat-lay.
15. **lilac-fleece-lounge-set**: A lilac fleece hoodie and jogger set, flat-lay.
16. **cream-cotton-lounge-dress**: A long cream cotton lounge dress, flat-lay.

## sportswear (16), template streetwear

Clothing line applies.

Training tops
1. **black-training-tshirt**: A black quick-dry training t-shirt, flat-lay.
2. **white-mesh-tank-top**: A white breathable mesh tank top, flat-lay.
3. **grey-long-sleeve-training-top**: A heather grey long-sleeve training top with thumb holes, flat-lay.
4. **teal-sports-bra**: A teal medium-support sports bra, flat-lay.

Leggings & joggers
5. **black-high-waist-leggings**: Black high-waist sports leggings, flat-lay.
6. **navy-seamless-leggings**: Navy seamless ribbed leggings, flat-lay.
7. **grey-training-joggers**: Grey tapered training joggers with zip pockets, flat-lay.
8. **black-track-pants**: Black track pants with a white side stripe, flat-lay.

Shorts
9. **black-running-shorts**: Black lightweight running shorts with a liner, flat-lay.
10. **navy-training-shorts**: Navy knee-length training shorts, flat-lay.
11. **olive-cycling-shorts**: Olive green cycling shorts, flat-lay.
12. **grey-sweat-shorts**: Grey cotton sweat shorts with drawstring, flat-lay.

Jackets & hoodies
13. **black-zip-training-jacket**: A black full-zip training jacket, flat-lay.
14. **white-windbreaker**: A white lightweight windbreaker with hood, flat-lay.
15. **grey-zip-hoodie**: A grey zip-up hoodie, flat-lay.
16. **navy-quarter-zip-top**: A navy quarter-zip running top, flat-lay.

## sneakers (16), template streetwear

Footwear line applies (one pair, side by side, no logo on the side or tongue).

Everyday white
1. **white-leather-low-top**: A pair of plain white leather low-top sneakers.
2. **white-green-heel-low-top**: A pair of white leather low-tops with a green heel tab.
3. **cream-suede-low-top**: A pair of cream suede low-top sneakers with a gum sole.
4. **white-chunky-sneaker**: A pair of white chunky-sole sneakers.

Running
5. **black-mesh-runner**: A pair of black mesh running shoes with a white sole.
6. **grey-knit-runner**: A pair of light grey knit running shoes.
7. **navy-orange-runner**: A pair of navy running shoes with orange details.
8. **white-pink-runner**: A pair of white and pale pink running shoes.

High-tops
9. **black-canvas-high-top**: A pair of black canvas high-top sneakers with white soles.
10. **white-canvas-high-top**: A pair of white canvas high-top sneakers.
11. **brown-leather-high-top**: A pair of brown leather high-top sneakers.
12. **grey-suede-high-top**: A pair of grey suede high-top sneakers.

Slip-ons & canvas
13. **navy-canvas-slip-on**: A pair of navy canvas slip-on sneakers.
14. **black-checker-slip-on**: A pair of black and white checkered canvas slip-ons.
15. **beige-canvas-low-top**: A pair of beige canvas low-top lace-up sneakers.
16. **olive-canvas-low-top**: A pair of olive canvas low-top sneakers.

## womens-shoes (16), templates fashion-luxe, vella

Footwear line applies.

Heels
1. **black-pointed-pumps**: A pair of black patent pointed-toe pumps.
2. **nude-block-heels**: A pair of nude leather block-heel sandals with an ankle strap.
3. **gold-strappy-heels**: A pair of gold strappy high-heel sandals.
4. **burgundy-kitten-heels**: A pair of burgundy suede kitten-heel slingbacks.

Flats & ballerinas
5. **black-ballerina-flats**: A pair of black leather ballerina flats with a small bow.
6. **beige-pointed-flats**: A pair of beige pointed-toe flats.
7. **tan-leather-loafers-women**: A pair of tan leather women's loafers.
8. **silver-mary-janes**: A pair of silver metallic Mary Jane flats.

Sandals
9. **white-flat-sandals**: A pair of white leather flat sandals with two straps.
10. **tan-woven-sandals**: A pair of tan woven leather flat sandals.
11. **black-platform-sandals**: A pair of black platform sandals.
12. **beige-wedge-sandals**: A pair of beige espadrille wedge sandals.

Boots
13. **black-ankle-boots**: A pair of black leather heeled ankle boots.
14. **camel-suede-boots**: A pair of camel suede ankle boots.
15. **brown-knee-boots**: A pair of brown leather knee-high boots.
16. **white-chelsea-boots**: A pair of white leather chelsea boots.

## mens-shoes (16), template zay

Footwear line applies.

Loafers
1. **brown-penny-loafers**: A pair of brown leather penny loafers.
2. **black-tassel-loafers**: A pair of black leather tassel loafers.
3. **navy-suede-loafers**: A pair of navy suede loafers.
4. **tan-driving-moccasins**: A pair of tan suede driving moccasins.

Oxfords & derbies
5. **black-oxford-shoes**: A pair of black polished leather oxford shoes.
6. **brown-brogues**: A pair of brown leather brogues.
7. **dark-brown-derby-shoes**: A pair of dark brown leather derby shoes.
8. **burgundy-oxford-shoes**: A pair of burgundy leather oxford shoes.

Boots
9. **brown-chelsea-boots**: A pair of brown suede chelsea boots.
10. **black-chelsea-boots**: A pair of black leather chelsea boots.
11. **tan-desert-boots**: A pair of tan suede desert boots.
12. **dark-brown-lace-up-boots**: A pair of dark brown leather lace-up boots.

Sandals & casual
13. **brown-leather-sandals-men**: A pair of brown leather men's sandals with two straps.
14. **black-leather-slides-men**: A pair of black leather men's slides.
15. **white-leather-sneakers-men**: A pair of minimal white leather men's sneakers.
16. **navy-boat-shoes**: A pair of navy leather boat shoes.

## handbags (16), template fashion-luxe

Add: *"Bags: one bag, standing upright, handles or strap arranged neatly, no logo, no hardware lettering."*

Totes
1. **black-leather-tote**: A black leather tote bag.
2. **tan-leather-tote**: A tan leather tote bag.
3. **beige-canvas-tote**: A beige canvas tote with leather handles.
4. **woven-straw-tote**: A natural woven straw tote.

Crossbody
5. **black-crossbody-bag**: A small black leather crossbody bag with a chain strap.
6. **camel-crossbody-bag**: A camel leather crossbody camera bag.
7. **white-mini-crossbody**: A white mini crossbody bag.
8. **olive-saddle-bag**: An olive green leather saddle bag.

Clutches & evening
9. **gold-evening-clutch**: A gold metallic evening clutch.
10. **black-satin-clutch**: A black satin clutch with a small clasp.
11. **pearl-beaded-clutch**: A white pearl-beaded clutch.
12. **silver-chain-mini-bag**: A silver mini bag with a chain handle.

Shoulder bags
13. **black-shoulder-bag**: A black leather shoulder bag.
14. **brown-hobo-bag**: A brown leather hobo bag.
15. **burgundy-baguette-bag**: A burgundy baguette shoulder bag.
16. **cream-quilted-bag**: A cream quilted leather shoulder bag.

## gold-jewelry (16), template jewelry-luxe

Add: *"Jewelry: real yellow gold (18K/21K look), close-up, laid flat or standing, no hallmark lettering visible."*

Rings
1. **gold-wedding-band**: A plain polished yellow gold wedding band.
2. **gold-twist-ring**: A yellow gold twisted rope ring.
3. **gold-floral-ring**: A yellow gold ring with a small engraved flower motif.
4. **gold-wide-band-ring**: A wide yellow gold band ring with a brushed finish.

Chains & pendants
5. **gold-rope-chain**: A yellow gold rope chain necklace.
6. **gold-name-plate-pendant**: A yellow gold necklace with a blank rectangular pendant.
7. **gold-hand-pendant**: A yellow gold necklace with a small hand (khamsa) pendant.
8. **gold-cuban-chain**: A yellow gold cuban link chain.

Bracelets (غوايش)
9. **gold-bangle-set**: A set of three thin yellow gold bangles.
10. **gold-engraved-bangle**: A yellow gold bangle with an engraved pattern.
11. **gold-link-bracelet**: A yellow gold link bracelet.
12. **gold-charm-bracelet**: A yellow gold bracelet with small coin charms.

Earrings
13. **gold-small-hoops**: A pair of small yellow gold hoop earrings.
14. **gold-drop-earrings**: A pair of yellow gold teardrop earrings.
15. **gold-stud-earrings**: A pair of yellow gold ball stud earrings.
16. **gold-crescent-earrings**: A pair of yellow gold crescent-moon earrings.

## hair-accessories (16), template karat

Add: *"Hair accessories: shown alone, no hair, no head."*

Claw clips
1. **tortoise-claw-clip**: A large tortoiseshell hair claw clip.
2. **black-matte-claw-clip**: A matte black hair claw clip.
3. **cream-claw-clip**: A cream hair claw clip.
4. **pearl-mini-claw-clips**: A set of four small claw clips with pearl details.

Scrunchies
5. **silk-scrunchie-set**: A set of three silk scrunchies in ivory, blush and champagne.
6. **velvet-scrunchie-set**: A set of three velvet scrunchies in black, burgundy and green.
7. **satin-bow-scrunchie**: A pink satin scrunchie with a bow.
8. **cotton-scrunchie-pack**: A pack of five cotton scrunchies in neutral colours.

Headbands
9. **padded-black-headband**: A padded black velvet headband.
10. **pearl-headband**: A headband covered in small white pearls.
11. **knotted-satin-headband**: A knotted champagne satin headband.
12. **tortoise-thin-headband**: A thin tortoiseshell headband.

Pins & barrettes
13. **gold-hair-pins-set**: A set of gold minimal hair pins.
14. **pearl-barrette**: A pearl hair barrette.
15. **black-bow-barrette**: A black satin bow barrette.
16. **crystal-hair-slides**: A pair of crystal-studded hair slides.

## belts-wallets (16), template zay

Add: *"Leather goods: one item, no logo, no embossed lettering, buckle plain."*

Belts
1. **black-leather-belt**: A black leather belt with a silver buckle, coiled.
2. **brown-leather-belt**: A brown leather belt with a brass buckle, coiled.
3. **tan-braided-belt**: A tan braided leather belt, coiled.
4. **reversible-black-brown-belt**: A reversible black and brown leather belt, coiled.

Wallets
5. **black-bifold-wallet**: A black leather bifold wallet, closed.
6. **brown-bifold-wallet**: A brown leather bifold wallet, half open.
7. **navy-zip-wallet**: A navy leather zip-around wallet.
8. **tan-long-wallet**: A tan leather long wallet.

Card holders
9. **black-card-holder**: A slim black leather card holder.
10. **brown-card-holder**: A slim brown leather card holder.
11. **green-card-holder**: A dark green leather card holder.
12. **tan-money-clip-wallet**: A tan leather wallet with a money clip.

Key holders & small goods
13. **black-key-holder**: A black leather key holder pouch.
14. **brown-leather-keychain**: A brown leather loop keychain.
15. **tan-passport-cover**: A tan leather passport cover.
16. **black-coin-pouch**: A small black leather coin pouch.

## phone-cases (16), template volt

Add: *"Phone accessories: a generic modern smartphone shape, no brand, no logo, no camera branding; cases shown without a phone unless stated."*

Clear cases
1. **clear-slim-case**: A clear slim phone case with a camera cut-out.
2. **clear-magnetic-case**: A clear phone case with a white magnetic ring inside.
3. **clear-bumper-case**: A clear phone case with reinforced corners.
4. **frosted-black-case**: A frosted matte case with black edges.

Silicone cases
5. **black-silicone-case**: A black soft silicone phone case.
6. **sage-silicone-case**: A sage green silicone phone case.
7. **pink-silicone-case**: A pastel pink silicone phone case.
8. **navy-silicone-case**: A navy blue silicone phone case.

Wallet & leather cases
9. **brown-leather-case**: A brown leather phone case.
10. **black-wallet-flip-case**: A black leather flip wallet phone case, slightly open.
11. **tan-card-slot-case**: A tan leather phone case with a card slot on the back.
12. **black-rugged-case**: A black rugged armour phone case with a kickstand.

Protectors & straps
13. **tempered-glass-protector**: A tempered glass screen protector sheet, with its clear applicator frame.
14. **camera-lens-protector**: A camera lens protector piece.
15. **beaded-phone-strap**: A beaded phone wrist strap with pastel beads.
16. **crossbody-phone-lanyard**: A black crossbody phone lanyard strap.

---

## Later (templates need converting first; no photos yet)

These niches' templates are not edition-ready, so their packs need template work before photos are useful: modest-wear, kidswear, backpacks-travel, silver-jewelry, mobiles, audio, small-appliances, wearables, earbuds, and every niche in beauty, perfumes, home, kitchen, food, sweets, kids, sports (except sportswear), health, pets, auto, handmade and books. I will add their photo lists when their templates are converted.

---

## Already done (no need to generate)

- fashion-jewelry: all 16 (Canva, 2026-11-11)
- chargers-cables: white-20w-usb-c-charger, black-65w-gan-charger, white-dual-port-charger, black-car-charger, white-usb-c-cable-1m, black-braided-usb-c-cable-2m, white-usb-c-to-lightning-cable (Canva)
- watches: the 9 already in the bucket
- dresses, tshirts, glasses, pants-jeans, lighting-smart-home, pc-gaming: all uploaded
