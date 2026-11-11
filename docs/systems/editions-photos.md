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

## Already done (no need to generate)

- fashion-jewelry: all 16 (Canva, 2026-11-11)
- chargers-cables: white-20w-usb-c-charger, black-65w-gan-charger, white-dual-port-charger, black-car-charger, white-usb-c-cable-1m, black-braided-usb-c-cable-2m, white-usb-c-to-lightning-cable (Canva)
- watches: the 9 already in the bucket
- dresses, tshirts, glasses, pants-jeans, lighting-smart-home, pc-gaming: all uploaded
