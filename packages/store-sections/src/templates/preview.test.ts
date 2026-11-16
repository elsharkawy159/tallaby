import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CODE_TEMPLATES, DEFAULT_TEMPLATE } from "./catalog";
import { NICHE_TEMPLATES } from "./editions/niche-templates";
import { TEMPLATE_PREVIEW_DIR, TEMPLATE_PREVIEW_WIDTH, previewShot, shotPreview, templatePreview, templatePreviewUrl } from "./preview";
import { PREVIEW_SHOTS } from "./preview-shots.generated";
import type { TemplatePreviewShots } from "./types";

/** tallaby.com's public folder, where the shots are served from. */
const PUBLIC = join(__dirname, "../../../../apps/ecommerce/public");

/**
 * The templates shot (2026-11-12; phone shots and re-shot 2026-11-15, `scripts/template-shots.mjs`;
 * every catalog template with a 1200 px desktop file since 2026-11-16, `--all`): each niche
 * template drawn with its row's pack (its own content when it has none), plus Tallaby Classic.
 * The script writes the manifest.
 */
const SHOT = Object.keys(PREVIEW_SHOTS).sort();

/** A WebP file's pixel size from its header (VP8, VP8L or VP8X). */
function webpSize(file: string): { width: number; height: number } {
  const b = readFileSync(file);
  if (b.toString("ascii", 0, 4) !== "RIFF" || b.toString("ascii", 8, 12) !== "WEBP") throw new Error(`${file} is not a WebP`);
  const chunk = b.toString("ascii", 12, 16);
  if (chunk === "VP8X") return { width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3) };
  if (chunk === "VP8L") {
    const bits = b.readUInt32LE(21);
    return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >> 14) & 0x3fff) };
  }
  return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
}

/** A phone shot's file size cap (it is taller than the desktop one). */
const MOBILE_MAX_KB = 300;

/** The 1200 px desktop file's width and size cap (tallaby.com's wide cards and template page). */
const LARGE_WIDTH = 1200;
const LARGE_MAX_KB = 450;

const withPreview = CODE_TEMPLATES.filter((template) => template.preview);

describe("template card screenshots", () => {
  it("covers exactly the templates shot, each a catalog template, and every catalog template", () => {
    expect(withPreview.map((template) => template.key).sort()).toEqual(SHOT);
    expect(SHOT).toEqual(CODE_TEMPLATES.map((template) => template.key).sort());
  });

  it("shows each niche template with its niche row's pack, and Tallaby Classic with its own content", () => {
    for (const template of withPreview) {
      const row = NICHE_TEMPLATES.find((r) => r.template === template.key);
      if (template.key === DEFAULT_TEMPLATE.key) {
        expect(row, template.key).toBeUndefined();
        expect(template.preview!.edition, template.key).toBeNull();
        continue;
      }
      expect(row, template.key).toBeDefined();
      expect(template.preview!.edition, template.key).toBe(row!.edition ?? null);
    }
  });

  it("has every file in tallaby.com's public folder, at its declared size and under 150 KB", () => {
    for (const template of withPreview) {
      for (const locale of ["ar", "en"] as const) {
        const shot = template.preview![locale];
        expect(shot.src).toBe(`${TEMPLATE_PREVIEW_DIR}/${template.key}.${locale}.webp`);
        const file = join(PUBLIC, shot.src);
        expect(existsSync(file), file).toBe(true);
        expect(webpSize(file), file).toEqual({ width: shot.width, height: shot.height });
        expect(shot.width).toBe(TEMPLATE_PREVIEW_WIDTH);
        expect(readFileSync(file).length, file).toBeLessThan(150 * 1024);
      }
    }
  });

  it("has a phone shot for every template shot, at its declared size and under MOBILE_MAX_KB", () => {
    for (const template of withPreview) {
      for (const locale of ["ar", "en"] as const) {
        const mobile = template.preview![locale].mobile;
        expect(mobile, `${template.key} ${locale}`).toBeDefined();
        expect(mobile!.src).toBe(`${TEMPLATE_PREVIEW_DIR}/${template.key}.${locale}.mobile.webp`);
        const file = join(PUBLIC, mobile!.src);
        expect(existsSync(file), file).toBe(true);
        expect(webpSize(file), file).toEqual({ width: mobile!.width, height: mobile!.height });
        expect(readFileSync(file).length, file).toBeLessThan(MOBILE_MAX_KB * 1024);
      }
    }
  });

  it("has a 1200 px desktop file for every template shot, the same page as the 600 px one", () => {
    for (const template of withPreview) {
      for (const locale of ["ar", "en"] as const) {
        const shot = template.preview![locale];
        const large = shot.large;
        expect(large, `${template.key} ${locale}`).toBeDefined();
        expect(large!.src).toBe(`${TEMPLATE_PREVIEW_DIR}/${template.key}.${locale}.lg.webp`);
        const file = join(PUBLIC, large!.src);
        expect(existsSync(file), file).toBe(true);
        expect(webpSize(file), file).toEqual({ width: large!.width, height: large!.height });
        expect(large!.width).toBe(LARGE_WIDTH);
        // Both files are resized from one screenshot: twice the height, give or take rounding.
        expect(Math.abs(large!.height - shot.height * 2), file).toBeLessThanOrEqual(2);
        expect(readFileSync(file).length, file).toBeLessThan(LARGE_MAX_KB * 1024);
      }
    }
  });

  it("takes every template's sizes from the generated manifest", () => {
    expect(SHOT.length).toBeGreaterThanOrEqual(22);
    for (const template of withPreview) expect(template.preview!.edition, template.key).toBe(PREVIEW_SHOTS[template.key]!.edition);
  });

  it("leaves no file in the folder that no template declares", () => {
    const declared = new Set(
      withPreview.flatMap((template) =>
        [template.preview!.ar, template.preview!.en].flatMap((shot) => [shot.src, shot.mobile?.src, shot.large?.src]).flatMap((src) => (src ? [src.split("/").pop()] : [])),
      ),
    );
    const files = readdirSync(join(PUBLIC, TEMPLATE_PREVIEW_DIR));
    expect(files.filter((file) => !declared.has(file))).toEqual([]);
  });
});

const SHOTS: Record<string, TemplatePreviewShots> = {
  vella: {
    edition: "lingerie-sleepwear",
    ar: { desktop: { width: 600, height: 2800 }, mobile: { width: 600, height: 9000 } },
    en: { desktop: { width: 600, height: 2810 }, mobile: { width: 600, height: 9100 } },
  },
  zay: { edition: "menswear", ar: { desktop: { width: 600, height: 2100 } }, en: { desktop: { width: 600, height: 2140 } } },
  fadda: { edition: null, ar: { desktop: { width: 600, height: 2500 }, mobile: { width: 600, height: 8000 } }, en: { desktop: { width: 600, height: 2510 }, mobile: { width: 600, height: 8010 } } },
};

describe("templatePreview with the generated sizes", () => {
  it("uses the generated sizes and phone shots when shot with the same edition", () => {
    const preview = templatePreview("vella", "lingerie-sleepwear", { ar: 2000, en: 2100 }, SHOTS);
    expect(preview.ar).toEqual({
      src: "/template-previews/vella.ar.webp",
      width: 600,
      height: 2800,
      mobile: { src: "/template-previews/vella.ar.mobile.webp", width: 600, height: 9000 },
    });
    expect(preview.en.mobile?.height).toBe(9100);
  });

  it("keeps the declared heights, desktop only, when the entry is missing or shot with another edition", () => {
    for (const shots of [{}, SHOTS]) {
      const preview = templatePreview("vella", "dresses", { ar: 2000, en: 2100 }, shots);
      expect(preview).toEqual({
        edition: "dresses",
        ar: { src: "/template-previews/vella.ar.webp", width: 600, height: 2000 },
        en: { src: "/template-previews/vella.en.webp", width: 600, height: 2100 },
      });
    }
  });

  it("adds the 1200 px desktop file when the entry has one", () => {
    const shots = { ...SHOTS, zay: { ...SHOTS.zay!, en: { desktop: { width: 600, height: 2140 }, large: { width: 1200, height: 4280 } } } };
    expect(templatePreview("zay", "menswear", { ar: 1, en: 1 }, shots).en).toEqual({
      src: "/template-previews/zay.en.webp",
      width: 600,
      height: 2140,
      large: { src: "/template-previews/zay.en.lg.webp", width: 1200, height: 4280 },
    });
    expect(templatePreview("zay", "menswear", { ar: 1, en: 1 }, shots).ar.large).toBeUndefined();
  });

  it("leaves out the phone shot when the entry has none", () => {
    expect(templatePreview("zay", "menswear", { ar: 1, en: 1 }, SHOTS).ar).toEqual({ src: "/template-previews/zay.ar.webp", width: 600, height: 2100 });
  });

  it("gives an undeclared template its generated preview, and none without an entry", () => {
    const declared = templatePreview("vella", "lingerie-sleepwear", { ar: 2000, en: 2100 }, {});
    expect(shotPreview("vella", declared, SHOTS)).toBe(declared);
    expect(shotPreview("fadda", undefined, SHOTS)).toEqual({
      edition: null,
      ar: { src: "/template-previews/fadda.ar.webp", width: 600, height: 2500, mobile: { src: "/template-previews/fadda.ar.mobile.webp", width: 600, height: 8000 } },
      en: { src: "/template-previews/fadda.en.webp", width: 600, height: 2510, mobile: { src: "/template-previews/fadda.en.mobile.webp", width: 600, height: 8010 } },
    });
    expect(shotPreview("kasr", undefined, SHOTS)).toBeUndefined();
  });
});

describe("previewShot", () => {
  const preview = templatePreview("vella", "lingerie-sleepwear", { ar: 2000, en: 2100 }, {});

  it("picks the card's language, Arabic by default, when no override is set", () => {
    expect(previewShot(preview, "en", undefined, null)).toEqual({ src: "/template-previews/vella.en.webp", width: 600, height: 2100, edition: "lingerie-sleepwear" });
    expect(previewShot(preview, "ar", undefined, null)?.height).toBe(2000);
    expect(previewShot(preview, "fr", undefined, null)?.src).toBe("/template-previews/vella.ar.webp");
  });

  it("shows the English shot in every language during the 2026-11-16 test", () => {
    expect(previewShot(preview, "ar")?.src).toBe("/template-previews/vella.en.webp");
    expect(previewShot(preview, "en")?.src).toBe("/template-previews/vella.en.webp");
  });

  it("shows only on a card drawing the same edition", () => {
    expect(previewShot(preview, "ar", "lingerie-sleepwear")).not.toBeNull();
    expect(previewShot(preview, "ar", null)).toBeNull();
    expect(previewShot(preview, "ar", "dresses")).toBeNull();
    expect(previewShot(null, "ar")).toBeNull();
  });

  it("carries the phone shot", () => {
    const shot = previewShot(templatePreview("vella", "lingerie-sleepwear", { ar: 1, en: 1 }, SHOTS), "en");
    expect(shot?.mobile).toEqual({ src: "/template-previews/vella.en.mobile.webp", width: 600, height: 9100 });
  });

  it("builds another app's URL from the tallaby.com origin", () => {
    expect(templatePreviewUrl("/template-previews/vella.ar.webp", "https://tallaby.com/")).toBe("https://tallaby.com/template-previews/vella.ar.webp");
    expect(templatePreviewUrl("https://cdn.example/x.webp", "https://tallaby.com")).toBe("https://cdn.example/x.webp");
  });
});
