/**
 * The `{% schema %}` of a code section (ROADMAP F-101, code-sections design
 * §11.3): the keys `name tag class settings blocks max_blocks presets default`,
 * one level of section blocks, and the setting types below. Unknown keys and
 * unknown setting types are errors (the author sees them at save), never
 * silently ignored.
 *
 * `normalizeSettings` and `normalizeBlocks` clean stored values against a
 * schema: unknown keys go, wrong types fall back to the default, numbers are
 * clamped, URLs and colours are checked. They run on every save and before
 * every render, so a value that reaches Liquid always has its declared type.
 * Pure: no I/O, safe in the browser and on the server.
 */
import { z } from "zod";
import { hasDangerousScheme, isHttpOrRelativeUrl } from "../config/url";
import type { CodeIssue } from "./code-issues";

/** A setting id or block type. */
export const SETTING_ID = /^[a-z][a-z0-9_]{0,39}$/;
/** A stored block id: kept when it matches, replaced otherwise. */
export const BLOCK_ID = /^[A-Za-z0-9_-]{1,40}$/;
/** A product or category id inside a setting value (resolved later, same store only). */
const ENTITY_ID = /^[A-Za-z0-9_-]{1,64}$/;

export const MAX_SECTION_SETTINGS = 40;
export const MAX_BLOCK_SETTINGS = 20;
export const MAX_BLOCK_TYPES = 10;
export const MAX_BLOCKS = 50;
export const MAX_PRESETS = 5;
export const MAX_LIST_LIMIT = 24;

/** Longest value per language, by text type. Longer values are cut. */
export const TEXT_MAX_LENGTH = { text: 1000, textarea: 5000, inline_richtext: 2000, richtext: 20000 } as const;
const MAX_URL_LENGTH = 2048;

export const SETTING_TYPES = [
  "text", "textarea", "inline_richtext", "richtext", "number", "range", "checkbox", "select", "radio",
  "text_alignment", "color", "color_background", "image_picker", "url", "video_url",
  "product", "product_list", "collection", "collection_list", "header", "paragraph",
] as const;
export type SettingType = (typeof SETTING_TYPES)[number];

export const TEXT_ALIGNMENTS = ["left", "center", "right"] as const;
export const SECTION_TAGS = ["section", "div", "article", "aside", "header", "footer"] as const;

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------

const idSchema = z.string().regex(SETTING_ID, "must start with a lowercase letter and use only a–z, 0–9 and _ (up to 40 characters)");

const labelSchema = z.union([z.string().max(200), z.object({ ar: z.string().max(200), en: z.string().max(200) }).strict()]);
const longTextSchema = z.union([z.string().max(2000), z.object({ ar: z.string().max(2000), en: z.string().max(2000) }).strict()]);
const localizedDefault = z.union([z.string(), z.object({ ar: z.string(), en: z.string() }).strict()]);

const base = { id: idSchema, label: labelSchema, info: labelSchema.optional() };
const finite = z.number().refine(Number.isFinite, "must be a finite number");

const textDef = (type: "text" | "textarea" | "inline_richtext" | "richtext") =>
  z.object({ ...base, type: z.literal(type), default: localizedDefault.optional(), placeholder: labelSchema.optional() }).strict();

const optionSchema = z.object({ value: z.string().min(1).max(100), label: labelSchema }).strict();
const choiceDef = (type: "select" | "radio") =>
  z.object({ ...base, type: z.literal(type), options: z.array(optionSchema).min(1).max(100), default: z.string().optional() }).strict();

const listDef = (type: "product_list" | "collection_list") =>
  z.object({ ...base, type: z.literal(type), limit: z.number().int().min(1).max(MAX_LIST_LIMIT).optional() }).strict();

const settingDefSchema = z.discriminatedUnion("type", [
  textDef("text"),
  textDef("textarea"),
  textDef("inline_richtext"),
  textDef("richtext"),
  z.object({ ...base, type: z.literal("number"), default: finite.optional(), min: finite.optional(), max: finite.optional(), step: finite.positive().optional(), placeholder: labelSchema.optional() }).strict(),
  z.object({ ...base, type: z.literal("range"), min: finite, max: finite, step: finite.positive().optional(), unit: z.string().max(10).optional(), default: finite.optional() }).strict(),
  z.object({ ...base, type: z.literal("checkbox"), default: z.boolean().optional() }).strict(),
  choiceDef("select"),
  choiceDef("radio"),
  z.object({ ...base, type: z.literal("text_alignment"), default: z.enum(TEXT_ALIGNMENTS).optional() }).strict(),
  z.object({ ...base, type: z.literal("color"), default: z.string().optional() }).strict(),
  z.object({ ...base, type: z.literal("color_background"), default: z.string().optional() }).strict(),
  z.object({ ...base, type: z.literal("image_picker") }).strict(),
  z.object({ ...base, type: z.literal("url"), default: z.string().optional(), placeholder: labelSchema.optional() }).strict(),
  z.object({ ...base, type: z.literal("video_url"), accept: z.array(z.enum(["youtube", "vimeo"])).min(1).optional(), default: z.string().optional(), placeholder: labelSchema.optional() }).strict(),
  z.object({ ...base, type: z.literal("product") }).strict(),
  listDef("product_list"),
  z.object({ ...base, type: z.literal("collection") }).strict(),
  listDef("collection_list"),
  // Sidebar heading and help text: no value, so no id is needed.
  z.object({ type: z.literal("header"), content: longTextSchema, id: idSchema.optional(), info: labelSchema.optional() }).strict(),
  z.object({ type: z.literal("paragraph"), content: longTextSchema, id: idSchema.optional() }).strict(),
]);

export type SettingDef = z.infer<typeof settingDefSchema>;
export type ValueSettingDef = Exclude<SettingDef, { type: "header" | "paragraph" }>;
export type LocalizedText = { ar: string; en: string };

function settingsList(max: number) {
  return z
    .array(settingDefSchema)
    .max(max, `has more than ${max} settings`)
    .superRefine((defs, ctx) => {
      const seen = new Set<string>();
      defs.forEach((def, i) => {
        if (!def.id) return;
        if (seen.has(def.id)) ctx.addIssue({ code: "custom", path: [i, "id"], message: `"${def.id}" is used by another setting` });
        seen.add(def.id);
        if (!hasValue(def)) return;
        if (def.type === "range" && def.min >= def.max) ctx.addIssue({ code: "custom", path: [i, "max"], message: "must be greater than min" });
        if (def.type === "number" && def.min != null && def.max != null && def.min > def.max) ctx.addIssue({ code: "custom", path: [i, "max"], message: "must not be less than min" });
        if ("default" in def && def.default !== undefined && normalizeSettingValue(def, def.default) === undefined) {
          ctx.addIssue({ code: "custom", path: [i, "default"], message: `is not a valid ${def.type} value` });
        }
        if ((def.type === "select" || def.type === "radio") && new Set(def.options.map((o) => o.value)).size !== def.options.length) {
          ctx.addIssue({ code: "custom", path: [i, "options"], message: "has the same value twice" });
        }
      });
    });
}

const valuesRecord = z.record(z.string(), z.unknown());
const blockValue = z.object({ type: idSchema, settings: valuesRecord.optional() }).strict();

const blockDefSchema = z
  .object({ type: idSchema, name: labelSchema, settings: settingsList(MAX_BLOCK_SETTINGS).default([]) })
  .strict();

const presetSchema = z
  .object({ name: labelSchema, settings: valuesRecord.optional(), blocks: z.array(blockValue).max(MAX_BLOCKS).optional() })
  .strict();

export const sectionSchemaSchema = z
  .object({
    name: labelSchema.default("Custom section"),
    tag: z.enum(SECTION_TAGS).optional(),
    class: z.string().regex(/^[A-Za-z0-9_ -]{0,200}$/, "may only hold class names (letters, digits, _ and -)").optional(),
    settings: settingsList(MAX_SECTION_SETTINGS).default([]),
    blocks: z.array(blockDefSchema).max(MAX_BLOCK_TYPES, `has more than ${MAX_BLOCK_TYPES} block types`).default([]),
    max_blocks: z.number().int().min(1).max(MAX_BLOCKS).optional(),
    presets: z.array(presetSchema).max(MAX_PRESETS, `has more than ${MAX_PRESETS} presets`).optional(),
    default: z.object({ settings: valuesRecord.optional(), blocks: z.array(blockValue).max(MAX_BLOCKS).optional() }).strict().optional(),
  })
  .strict()
  .superRefine((schema, ctx) => {
    const types = new Set<string>();
    schema.blocks.forEach((block, i) => {
      if (types.has(block.type)) ctx.addIssue({ code: "custom", path: ["blocks", i, "type"], message: `"${block.type}" is used by another block` });
      types.add(block.type);
    });
    const checkBlocks = (list: { type: string }[] | undefined, path: (string | number)[]) =>
      list?.forEach((b, i) => {
        if (!types.has(b.type)) ctx.addIssue({ code: "custom", path: [...path, i, "type"], message: `"${b.type}" is not a block type of this section` });
      });
    schema.presets?.forEach((p, i) => checkBlocks(p.blocks, ["presets", i, "blocks"]));
    checkBlocks(schema.default?.blocks, ["default", "blocks"]);
  });

export type SectionSchema = z.infer<typeof sectionSchemaSchema>;
export type BlockDef = SectionSchema["blocks"][number];

const FALLBACK_SCHEMA: SectionSchema = { name: "Custom section", settings: [], blocks: [] };

export function parseSectionSchema(input: unknown): { schema: SectionSchema; issues: CodeIssue[] } {
  const result = sectionSchemaSchema.safeParse(input ?? {});
  if (result.success) return { schema: result.data, issues: [] };
  const issues = result.error.issues.map((issue): CodeIssue => {
    const path = formatPath(issue.path);
    let message = issue.message;
    if (issue.code === "invalid_union") {
      // zod points at the discriminator (…[i].type) or at the setting itself.
      const at = valueAt(input, issue.path);
      const type = issue.path.at(-1) === "type" ? at : (at as { type?: unknown } | undefined)?.type;
      message = typeof type === "string" ? `"${type}" isn't a supported setting type` : "needs a supported setting type";
    }
    // zod's (and our own) detail stays English; the editor shows it after a localized line.
    return { code: "schema_invalid", message: path ? `schema ${path}: ${message}` : `schema: ${message}`, params: { detail: path ? `${path}: ${message}` : message } };
  });
  return { schema: { ...FALLBACK_SCHEMA, settings: [], blocks: [] }, issues };
}

function formatPath(path: readonly PropertyKey[]): string {
  return path.map((p, i) => (typeof p === "number" ? `[${p}]` : i === 0 ? String(p) : `.${String(p)}`)).join("");
}

function valueAt(input: unknown, path: readonly PropertyKey[]): unknown {
  let v: unknown = input;
  for (const key of path) {
    if (v == null || typeof v !== "object") return undefined;
    v = (v as Record<PropertyKey, unknown>)[key as string];
  }
  return v;
}

// ---------------------------------------------------------------------------
// Value normalisation
// ---------------------------------------------------------------------------

export function hasValue(def: SettingDef): def is ValueSettingDef {
  return def.type !== "header" && def.type !== "paragraph";
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === "object" && !Array.isArray(v);
}

function own(obj: Record<string, unknown>, key: string): unknown {
  return Object.hasOwn(obj, key) ? obj[key] : undefined;
}

function localized(value: unknown, max: number): LocalizedText | undefined {
  if (typeof value === "string") {
    const v = value.slice(0, max);
    return { ar: v, en: v };
  }
  if (!isPlainObject(value)) return undefined;
  const ar = own(value, "ar");
  const en = own(value, "en");
  if (typeof ar !== "string" && typeof en !== "string") return undefined;
  return { ar: typeof ar === "string" ? ar.slice(0, max) : "", en: typeof en === "string" ? en.slice(0, max) : "" };
}

const HEX_COLOR = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const FUNC_COLOR = /^(?:rgba?|hsla?)\(\s*[0-9.+-]+(?:deg|%)?(?:\s*[,/\s]\s*[0-9.+-]+%?){2,3}\s*\)$/i;
/** linear/radial gradients of plain colours and stops: no url(), var(), nested functions other than colours. */
const GRADIENT = /^(?:linear|radial)-gradient\((?:[\s,#%./a-z0-9+-]|(?:rgba?|hsla?)\([0-9.,%/\s+-]*(?:deg)?[0-9.,%/\s+-]*\))*\)$/i;

export function isCssColor(value: string): boolean {
  const v = value.trim();
  return v.length <= 64 && (HEX_COLOR.test(v) || FUNC_COLOR.test(v));
}

function isCssBackground(value: string): boolean {
  const v = value.trim();
  if (isCssColor(v)) return true;
  // The only "(" GRADIENT lets through are its own and colour functions', so no url(), var() or calc().
  return v.length <= 512 && GRADIENT.test(v);
}

function isSafeUrl(value: string): boolean {
  return value.length <= MAX_URL_LENGTH && !hasDangerousScheme(value) && isHttpOrRelativeUrl(value);
}

/** A media-library URL, or a bare storage path (`seller/2026-11-26/a.webp`) the host turns into one. */
function isImageRef(value: string): boolean {
  if (value.length > MAX_URL_LENGTH || hasDangerousScheme(value)) return false;
  if (isHttpOrRelativeUrl(value)) return true;
  return /^[A-Za-z0-9][A-Za-z0-9_\-./]*$/.test(value) && !value.split("/").includes("..");
}

const VIDEO_HOSTS = {
  youtube: /^https:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)[A-Za-z0-9_-]{6,20}(?:[?&#][^\s<>"']*)?$/,
  vimeo: /^https:\/\/(?:www\.|player\.)?vimeo\.com\/(?:video\/)?\d{4,12}(?:[/?#][^\s<>"']*)?$/,
} as const;

function isVideoUrl(value: string, accept: readonly ("youtube" | "vimeo")[] | undefined): boolean {
  if (value.length > MAX_URL_LENGTH) return false;
  return (accept ?? (["youtube", "vimeo"] as const)).some((host) => VIDEO_HOSTS[host].test(value));
}

function clamp(n: number, min: number | undefined, max: number | undefined): number {
  let v = n;
  if (min != null && v < min) v = min;
  if (max != null && v > max) v = max;
  return v;
}

function idList(value: unknown, limit: number): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out: string[] = [];
  for (const id of value) {
    if (out.length >= limit) break;
    if (typeof id === "string" && ENTITY_ID.test(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

/** The cleaned value of one setting, or `undefined` when `value` isn't valid for it. */
export function normalizeSettingValue(def: SettingDef, value: unknown): unknown {
  switch (def.type) {
    case "header":
    case "paragraph":
      return undefined;
    case "text":
    case "textarea":
    case "inline_richtext":
    case "richtext":
      return localized(value, TEXT_MAX_LENGTH[def.type]);
    case "number":
      return typeof value === "number" && Number.isFinite(value) ? clamp(value, def.min, def.max) : undefined;
    case "range": {
      if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
      let v = clamp(value, def.min, def.max);
      if (def.step) v = clamp(Number((def.min + Math.round((v - def.min) / def.step) * def.step).toFixed(10)), def.min, def.max);
      return v;
    }
    case "checkbox":
      return typeof value === "boolean" ? value : undefined;
    case "select":
    case "radio":
      return typeof value === "string" && def.options.some((o) => o.value === value) ? value : undefined;
    case "text_alignment":
      return typeof value === "string" && (TEXT_ALIGNMENTS as readonly string[]).includes(value) ? value : undefined;
    case "color":
      return typeof value === "string" && isCssColor(value) ? value.trim() : undefined;
    case "color_background":
      return typeof value === "string" && isCssBackground(value) ? value.trim() : undefined;
    case "image_picker":
      return typeof value === "string" && value.trim() && isImageRef(value.trim()) ? value.trim() : undefined;
    case "url":
      return typeof value === "string" && value.trim() && isSafeUrl(value.trim()) ? value.trim() : undefined;
    case "video_url":
      return typeof value === "string" && isVideoUrl(value.trim(), def.accept) ? value.trim() : undefined;
    case "product":
    case "collection":
      return typeof value === "string" && ENTITY_ID.test(value) ? value : undefined;
    case "product_list":
    case "collection_list":
      return idList(value, def.limit ?? MAX_LIST_LIMIT);
  }
}

export type NormalizeSettingsOptions = {
  /** Fill missing or invalid values with the setting's default (default true). Off, they are left out. */
  applyDefaults?: boolean;
};

/**
 * Values for `defs` only: unknown keys are dropped, a value of the wrong type
 * falls back to the default (or is left out when there is none), text types
 * become `{ ar, en }`. `header` and `paragraph` hold no value.
 */
export function normalizeSettings(
  defs: readonly SettingDef[],
  values: unknown,
  opts: NormalizeSettingsOptions = {},
): Record<string, unknown> {
  const source = isPlainObject(values) ? values : {};
  const applyDefaults = opts.applyDefaults !== false;
  const out: Record<string, unknown> = {};
  for (const def of defs) {
    if (!hasValue(def)) continue;
    const raw = own(source, def.id);
    let v = raw === undefined ? undefined : normalizeSettingValue(def, raw);
    if (v === undefined && applyDefaults && "default" in def && def.default !== undefined) v = normalizeSettingValue(def, def.default);
    if (v !== undefined) out[def.id] = v;
  }
  return out;
}

export type StoredBlock = { id: string; type: string; settings: Record<string, unknown> };

function newBlockId(taken: Set<string>): string {
  let id: string;
  do id = `b_${globalThis.crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  while (taken.has(id));
  return id;
}

/**
 * Blocks of known types only, at most `max_blocks` (default and hard cap 50),
 * each with a stable id (kept when valid and unique, else a new `b_…` id) and
 * normalised settings.
 */
export function normalizeBlocks(
  schema: Pick<SectionSchema, "blocks" | "max_blocks">,
  blocks: unknown,
  opts: NormalizeSettingsOptions = {},
): StoredBlock[] {
  const defs = new Map(schema.blocks.map((b) => [b.type, b]));
  const max = Math.min(schema.max_blocks ?? MAX_BLOCKS, MAX_BLOCKS);
  const taken = new Set<string>();
  const out: StoredBlock[] = [];
  for (const item of Array.isArray(blocks) ? blocks : []) {
    if (out.length >= max) break;
    if (!isPlainObject(item)) continue;
    const type = own(item, "type");
    const def = typeof type === "string" ? defs.get(type) : undefined;
    if (!def) continue;
    const rawId = own(item, "id");
    const id = typeof rawId === "string" && BLOCK_ID.test(rawId) && !taken.has(rawId) ? rawId : newBlockId(taken);
    taken.add(id);
    out.push({ id, type: def.type, settings: normalizeSettings(def.settings, own(item, "settings"), opts) });
  }
  return out;
}
