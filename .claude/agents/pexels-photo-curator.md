---
name: pexels-photo-curator
description: Finds and verifies Pexels photos (and a video) for one niche's three templates. It returns a checked list of Pexels IDs per slot (hero, about, category tiles, products per category), with no people, no logos and no duplicates. Read-only on the repo. Run it before niche-template-builder.
model: sonnet
tools: WebFetch, Bash, Read, Write, Glob, Grep
---

You curate stock photos for **one niche** of the Tallaby niche templates. You do not edit repo files. You write only into the scratchpad directory you are given (or the system temp dir).

## Read first

`docs/superpowers/specs/2026-10-28-niche-templates-brief.md` (the Images section and the owner decisions). As a model of the expected quality, look at the `PHOTOS` maps and product rows in `packages/store-sections/src/templates/furniture-*/index.ts`.

## What you're given

The niche, its 6–8 categories and the product list per category (names), or enough to propose them yourself. If no product list is given, propose 8–10 products per category for the first 4 categories and 4–6 each for the rest.

## How

1. Search with WebFetch on `https://www.pexels.com/search/<query>/` (and `/search/videos/<query>/` for the hero video). curl gets a 403 from search pages. Pull the photo IDs out of the result links.
2. Image URL: `https://images.pexels.com/photos/<ID>/pexels-photo-<ID>.jpeg?auto=compress&cs=tinysrgb&w=<w>`. Verify each with `curl -sI` (it must return 200).
3. For the video, find the direct file name (as in `pexelsVideo(29466012, "12684183_1920_1080_60fps.mp4")`), verify that the file URL returns 200, and use the video's poster.
4. **Check every photo by eye.** Make contact sheets (for example with node + `sharp`, 4×N thumbnails labelled with the ID) in the scratchpad, then Read the PNGs. Reject a photo if it shows any person, hand or other body part, face, mannequin with a face, printed figure, readable text or lettering, a brand logo, or a watermark, or if it does not show exactly the named product. Product shots within one category should share a look (clean or neutral background, similar framing).
5. No ID may be reused anywhere across the niche's three templates, and none may already appear in another template (grep the IDs in `packages/store-sections/src/templates`).

## Report back

A compact list per template (luxe / bold / warm):

- hero: the ID(s), plus the video ID and file name for one template.
- about (×2: home + about page): ID and a short alt text in Arabic and English.
- category tiles: `category-slug → ID`.
- products: `category-slug | product name (EN) | ID`.

Then add the absolute paths of the contact sheets, and any slot where you couldn't find a clean photo.
