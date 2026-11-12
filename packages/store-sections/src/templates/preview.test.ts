import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CODE_TEMPLATES } from "./catalog";
import { NICHE_TEMPLATES } from "./editions/niche-templates";
import { TEMPLATE_PREVIEW_DIR, TEMPLATE_PREVIEW_WIDTH, previewShot, templatePreview, templatePreviewUrl } from "./preview";

/** tallaby.com's public folder, where the shots are served from. */
const PUBLIC = join(__dirname, "../../../../apps/ecommerce/public");

/** The templates shot on 2026-11-12: every niche pack built from the owner's photos, on its template. */
const SHOT = [
  "arena",
  "fashion-bold",
  "fashion-luxe",
  "ghorza",
  "jewelry-luxe",
  "jewelry-warm",
  "kabl",
  "karat",
  "kasr",
  "kholkhal",
  "saat",
  "shanta",
  "sports-bold",
  "sports-luxe",
  "streetwear",
  "tasfya",
  "vella",
  "volt",
  "zahra",
  "zaki",
  "zay",
];

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

const withPreview = CODE_TEMPLATES.filter((template) => template.preview);

describe("template card screenshots", () => {
  it("covers exactly the templates shot, each a catalog template", () => {
    expect(withPreview.map((template) => template.key).sort()).toEqual(SHOT);
  });

  it("shows each template with its niche row's pack", () => {
    for (const template of withPreview) {
      const row = NICHE_TEMPLATES.find((r) => r.template === template.key);
      expect(row, template.key).toBeDefined();
      expect(row!.status, template.key).toBe("ready");
      expect(template.preview!.edition, template.key).toBe(row!.edition);
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

  it("leaves no file in the folder that no template declares", () => {
    const declared = new Set(withPreview.flatMap((template) => [template.preview!.ar.src, template.preview!.en.src].map((src) => src.split("/").pop())));
    const files = readdirSync(join(PUBLIC, TEMPLATE_PREVIEW_DIR));
    expect(files.filter((file) => !declared.has(file))).toEqual([]);
  });
});

describe("previewShot", () => {
  const preview = templatePreview("vella", "lingerie-sleepwear", { ar: 2000, en: 2100 });

  it("picks the card's language, Arabic by default", () => {
    expect(previewShot(preview, "en")).toEqual({ src: "/template-previews/vella.en.webp", width: 600, height: 2100, edition: "lingerie-sleepwear" });
    expect(previewShot(preview, "ar")?.height).toBe(2000);
    expect(previewShot(preview, "fr")?.src).toBe("/template-previews/vella.ar.webp");
  });

  it("shows only on a card drawing the same edition", () => {
    expect(previewShot(preview, "ar", "lingerie-sleepwear")).not.toBeNull();
    expect(previewShot(preview, "ar", null)).toBeNull();
    expect(previewShot(preview, "ar", "dresses")).toBeNull();
    expect(previewShot(null, "ar")).toBeNull();
  });

  it("builds another app's URL from the tallaby.com origin", () => {
    expect(templatePreviewUrl("/template-previews/vella.ar.webp", "https://tallaby.com/")).toBe("https://tallaby.com/template-previews/vella.ar.webp");
    expect(templatePreviewUrl("https://cdn.example/x.webp", "https://tallaby.com")).toBe("https://cdn.example/x.webp");
  });
});
