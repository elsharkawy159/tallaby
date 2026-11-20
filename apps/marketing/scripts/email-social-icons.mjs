/**
 * Renders the social icons used in the footer of every Tallaby email
 * (`packages/emails` → `EMAIL_SOCIAL_LINKS`): a white brand glyph on a teal
 * #145163 circle, 64×64 PNG (shown at 32×32), served from www.tallaby.com.
 *
 *   node apps/marketing/scripts/email-social-icons.mjs
 *
 * `sharp` is not a direct dependency: it is resolved through `next`, which
 * ships it for image optimisation.
 */
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { siFacebook, siInstagram, siTiktok, siX, siYoutube } from "simple-icons";

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const sharp = createRequire(require.resolve("next/package.json"))("sharp");

// Simple Icons removed LinkedIn; same path as @workspace/store-sections/social.
const LINKEDIN =
  "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z";

const ICONS = {
  facebook: siFacebook.path,
  instagram: siInstagram.path,
  tiktok: siTiktok.path,
  youtube: siYoutube.path,
  x: siX.path,
  linkedin: LINKEDIN,
};

const SIZE = 64;
const GLYPH = SIZE * 0.55;
const BG = "#145163";

const outDir = resolve(here, "../public/email/social");
mkdirSync(outDir, { recursive: true });

for (const [id, path] of Object.entries(ICONS)) {
  const offset = (SIZE - GLYPH) / 2;
  const scale = GLYPH / 24;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <circle cx="${SIZE / 2}" cy="${SIZE / 2}" r="${SIZE / 2}" fill="${BG}"/>
  <g transform="translate(${offset} ${offset}) scale(${scale})"><path d="${path}" fill="#ffffff"/></g>
</svg>`;
  const file = join(outDir, `${id}.png`);
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(file);
  console.log("wrote", file);
}
