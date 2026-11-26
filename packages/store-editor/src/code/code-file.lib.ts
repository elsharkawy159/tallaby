/**
 * Code sections in the editor (ROADMAP F-101e): the joined section file, a
 * defensive read of a code node's schema, and the pure edits the Content tab
 * makes to `settings` and `blocks`. The editor never parses or renders Liquid:
 * the host's `code.preview` checks the file and returns the normalised props.
 *
 * The file format itself comes from `@workspace/store-sections/code-file`
 * (browser-safe: no Liquid engine, no postcss).
 */
import type { ComponentNode, SiteLocale } from "@workspace/store-sections";
import { DEFAULT_SECTION_SCHEMA, joinSectionFile } from "@workspace/store-sections/code-file";

export { joinSectionFile };

export type CodeLabel = string | { ar?: string; en?: string };

/** One schema setting, as stored after the host's normaliser (read structurally). */
export type CodeSettingDef = {
  type: string;
  id?: string;
  label?: CodeLabel;
  info?: CodeLabel;
  content?: CodeLabel;
  placeholder?: CodeLabel;
  default?: unknown;
  options?: { value: string; label: CodeLabel }[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  limit?: number;
};

export type CodeBlockDef = { type: string; name: CodeLabel; settings: CodeSettingDef[] };
export type CodeSchemaView = { name?: CodeLabel; settings: CodeSettingDef[]; blocks: CodeBlockDef[]; maxBlocks: number };
export type CodeBlock = { id: string; type: string; settings: Record<string, unknown> };
export type LocalizedValue = { ar: string; en: string };

/** Hard caps of the schema (same as `section-schema.ts`). */
export const MAX_CODE_BLOCKS = 50;
const MAX_LIST_LIMIT = 24;
const BLOCK_ID = /^[A-Za-z0-9_-]{1,40}$/;


/** Text settings stored per language (`{ ar, en }`). */
export const LOCALIZED_SETTING_TYPES: ReadonlySet<string> = new Set(["text", "textarea", "inline_richtext", "richtext"]);
/** Settings that hold no value (a heading or help text in the sidebar). */
export const LABEL_SETTING_TYPES: ReadonlySet<string> = new Set(["header", "paragraph"]);

const isPlainObject = (v: unknown): v is Record<string, unknown> => v != null && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown) => (typeof v === "string" ? v : "");

/** The Code tab's file for a code node's props. */
export function codeFileOf(props: Record<string, unknown>): string {
  return joinSectionFile({ source: str(props.source), css: str(props.css), schema: props.schema ?? DEFAULT_SECTION_SCHEMA });
}

/** A schema label in the editor's UI language (a plain string is the same in both). */
export function labelText(value: CodeLabel | undefined, locale: string): string {
  if (typeof value === "string") return value;
  if (!value) return "";
  return (locale === "en" ? value.en : value.ar) || value.ar || value.en || "";
}

function readSettingDefs(raw: unknown): CodeSettingDef[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((d): d is CodeSettingDef => isPlainObject(d) && typeof d.type === "string" && (LABEL_SETTING_TYPES.has(d.type) || typeof d.id === "string"));
}

/** The schema of a code node's props, read defensively (the host already validated it). */
export function readCodeSchema(raw: unknown): CodeSchemaView {
  const schema = isPlainObject(raw) ? raw : {};
  const blocks = Array.isArray(schema.blocks)
    ? schema.blocks
        .filter((b): b is Record<string, unknown> => isPlainObject(b) && typeof b.type === "string")
        .map((b) => ({ type: b.type as string, name: (b.name as CodeLabel) ?? (b.type as string), settings: readSettingDefs(b.settings) }))
    : [];
  const max = typeof schema.max_blocks === "number" && schema.max_blocks >= 1 ? Math.floor(schema.max_blocks) : MAX_CODE_BLOCKS;
  return { name: schema.name as CodeLabel | undefined, settings: readSettingDefs(schema.settings), blocks, maxBlocks: Math.min(max, MAX_CODE_BLOCKS) };
}

export function readSettings(raw: unknown): Record<string, unknown> {
  return isPlainObject(raw) ? raw : {};
}

export function readBlocks(raw: unknown): CodeBlock[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((b): b is Record<string, unknown> => isPlainObject(b) && typeof b.id === "string" && typeof b.type === "string")
    .map((b) => ({ id: b.id as string, type: b.type as string, settings: readSettings(b.settings) }));
}

/** `{ ar, en }` from a stored or default text value (a plain string is both). */
export function asLocalized(value: unknown): LocalizedValue {
  if (typeof value === "string") return { ar: value, en: value };
  if (isPlainObject(value)) return { ar: str(value.ar), en: str(value.en) };
  return { ar: "", en: "" };
}

/** The value a setting shows: the stored value, else its default. */
export function settingValue(def: CodeSettingDef, values: Record<string, unknown>): unknown {
  const own = def.id && Object.hasOwn(values, def.id) ? values[def.id] : undefined;
  const value = own === undefined ? def.default : own;
  return LOCALIZED_SETTING_TYPES.has(def.type) && value !== undefined ? asLocalized(value) : value;
}

/** A text setting with one language changed (the other kept). */
export function withLocaleText(value: unknown, locale: SiteLocale, text: string): LocalizedValue {
  return { ...asLocalized(value), [locale]: text };
}

/** Values with one setting set; `undefined` or `null` removes it (the host then applies the default). */
export function setSetting(values: Record<string, unknown>, id: string, value: unknown): Record<string, unknown> {
  const next = { ...values };
  if (value === undefined || value === null) delete next[id];
  else next[id] = value;
  return next;
}

/** How many ids a list setting holds at most. */
export function listLimit(def: CodeSettingDef): number {
  return Math.min(typeof def.limit === "number" && def.limit >= 1 ? def.limit : MAX_LIST_LIMIT, MAX_LIST_LIMIT);
}

/** Defaults of a list of settings (new blocks start with them). */
export function defaultSettings(defs: readonly CodeSettingDef[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const def of defs) {
    if (!def.id || LABEL_SETTING_TYPES.has(def.type) || def.default === undefined) continue;
    out[def.id] = LOCALIZED_SETTING_TYPES.has(def.type) ? asLocalized(def.default) : def.default;
  }
  return out;
}

export function newBlockId(taken: ReadonlySet<string>, random: () => string = () => globalThis.crypto.randomUUID()): string {
  for (let attempt = 0; attempt < 20; attempt++) {
    const id = `b_${random().replace(/-/g, "").slice(0, 12)}`;
    if (!taken.has(id) && BLOCK_ID.test(id)) return id;
  }
  // A random source that keeps repeating itself: count up instead of looping forever.
  let n = taken.size + 1;
  while (taken.has(`b_${n}`)) n++;
  return `b_${n}`;
}

/** Blocks with a new block of `def`'s type at the end, or unchanged when the section is full. */
export function addBlock(blocks: readonly CodeBlock[], def: CodeBlockDef, max: number, random?: () => string): CodeBlock[] {
  if (blocks.length >= Math.min(max, MAX_CODE_BLOCKS)) return [...blocks];
  const id = newBlockId(new Set(blocks.map((b) => b.id)), random);
  return [...blocks, { id, type: def.type, settings: defaultSettings(def.settings) }];
}

export function moveBlock(blocks: readonly CodeBlock[], from: number, to: number): CodeBlock[] {
  const next = [...blocks];
  if (from < 0 || from >= next.length || to < 0 || to >= next.length || from === to) return next;
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item!);
  return next;
}

export function removeBlock(blocks: readonly CodeBlock[], id: string): CodeBlock[] {
  return blocks.filter((b) => b.id !== id);
}

export function setBlockSetting(blocks: readonly CodeBlock[], blockId: string, key: string, value: unknown): CodeBlock[] {
  return blocks.map((b) => (b.id === blockId ? { ...b, settings: setSetting(b.settings, key, value) } : b));
}

/** The node with new props from the host's preview; the Layers name is the seller's and is kept. */
export function withPreviewProps(node: ComponentNode, props: Record<string, unknown>): ComponentNode {
  const { name: _ignored, ...rest } = props;
  const name = typeof node.props.name === "string" && node.props.name ? node.props.name : undefined;
  return { ...node, props: { ...rest, ...(name && { name }) } };
}

// ---------------------------------------------------------------------------
// Starter file (Add › Code section). Written for Tallaby; both languages set.
// ---------------------------------------------------------------------------

const STARTER_SOURCE = `<div class="intro" style="--accent: {{ section.settings.accent }}">
  <h2 class="intro__title">{{ section.settings.title }}</h2>
  <div class="intro__text">{{ section.settings.text }}</div>
  {% if section.blocks.size > 0 %}
    <ul class="intro__items">
      {% for block in section.blocks %}
        <li class="intro__item" {{ block.attributes }}>{{ block.settings.label }}</li>
      {% endfor %}
    </ul>
  {% endif %}
</div>`;

const STARTER_CSS = `.intro { padding: 48px 24px; text-align: center; }
.intro__title { margin: 0 0 12px; font-size: 32px; color: var(--accent); }
.intro__text { max-width: 640px; margin: 0 auto; opacity: 0.8; }
.intro__items { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; margin: 24px 0 0; padding: 0; list-style: none; }
.intro__item { padding: 8px 16px; border: 1px solid var(--accent); border-radius: 999px; }`;

const STARTER_TITLE = { ar: "عنوان القسم", en: "Section heading" };
const STARTER_TEXT = {
  ar: "<p>نص قصير يظهر تحت العنوان. يمكنك تغييره من المحتوى أو من الكود.</p>",
  en: "<p>A short text under the heading. Change it in Content or in Code.</p>",
};
const STARTER_ITEMS = [
  { ar: "النقطة الأولى", en: "First point" },
  { ar: "النقطة الثانية", en: "Second point" },
  { ar: "النقطة الثالثة", en: "Third point" },
];

/** The props of a new code node: a heading and text from settings, a list of blocks, a little CSS. */
export function starterCodeProps(random?: () => string): Record<string, unknown> {
  const schema = {
    name: { ar: "قسم بالكود", en: "Code section" },
    settings: [
      { type: "text", id: "title", label: { ar: "العنوان", en: "Heading" }, default: STARTER_TITLE },
      { type: "richtext", id: "text", label: { ar: "النص", en: "Text" }, default: STARTER_TEXT },
      { type: "color", id: "accent", label: { ar: "لون التمييز", en: "Accent colour" }, default: "#145163" },
    ],
    blocks: [
      {
        type: "item",
        name: { ar: "نقطة", en: "Point" },
        settings: [{ type: "text", id: "label", label: { ar: "النص", en: "Text" }, default: { ar: "نقطة جديدة", en: "New point" } }],
      },
    ],
    max_blocks: 12,
  };
  const taken = new Set<string>();
  const blocks = STARTER_ITEMS.map((label) => {
    const id = newBlockId(taken, random);
    taken.add(id);
    return { id, type: "item", settings: { label } };
  });
  return {
    apiVersion: 1,
    source: STARTER_SOURCE,
    css: STARTER_CSS,
    schema,
    settings: { title: STARTER_TITLE, text: STARTER_TEXT, accent: "#145163" },
    blocks,
  };
}
