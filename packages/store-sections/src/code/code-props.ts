/**
 * Reads a stored `code` node for rendering (ROADMAP F-101, code-sections
 * design §4.3). Props are untrusted JSON even after the save-time normaliser:
 * the schema is parsed again, settings and blocks are cleaned against it, and
 * anything of the wrong shape is dropped. Pure and browser-safe (no Liquid
 * engine, no `node:crypto`), so the catalog collector (`elements/data.ts`)
 * can use it too.
 */
import { LIQUID_API_VERSION } from "./liquid-objects";
import {
  BLOCK_ID,
  MAX_BLOCKS,
  hasValue,
  normalizeSettings,
  parseSectionSchema,
  type SectionSchema,
  type SettingDef,
  type StoredBlock,
} from "./section-schema";

/** Same caps as the save path (`code-node.ts`): longer values are never rendered. */
const MAX_SOURCE_LENGTH = 64 * 1024;
const MAX_CSS_LENGTH = 32 * 1024;

export type RenderableCodeProps = {
  source: string;
  /** The node's own stylesheet (`{% stylesheet %}`), scoped at render; "" when none. */
  css: string;
  schema: SectionSchema;
  /** Section settings, cleaned against `schema.settings` (text values are `{ ar, en }`). */
  settings: Record<string, unknown>;
  /** Blocks of known types with valid unique ids, settings cleaned against their block type. */
  blocks: StoredBlock[];
};

const isPlainObject = (v: unknown): v is Record<string, unknown> => v != null && typeof v === "object" && !Array.isArray(v);
const own = (obj: Record<string, unknown>, key: string): unknown => (Object.hasOwn(obj, key) ? obj[key] : undefined);

/** The renderable props of a code node, or null when it can't render (wrong API version, no source). */
export function readCodeProps(props: unknown): RenderableCodeProps | null {
  if (!isPlainObject(props)) return null;
  if (own(props, "apiVersion") !== LIQUID_API_VERSION) return null;
  const source = own(props, "source");
  if (typeof source !== "string" || !source.trim() || source.length > MAX_SOURCE_LENGTH) return null;
  const rawCss = own(props, "css");
  const css = typeof rawCss === "string" && rawCss.length <= MAX_CSS_LENGTH ? rawCss : "";
  const { schema } = parseSectionSchema(own(props, "schema"));
  const settings = normalizeSettings(schema.settings, own(props, "settings"));
  const types = new Map(schema.blocks.map((b) => [b.type, b]));
  const max = Math.min(schema.max_blocks ?? MAX_BLOCKS, MAX_BLOCKS);
  const taken = new Set<string>();
  const blocks: StoredBlock[] = [];
  const rawBlocks = own(props, "blocks");
  for (const item of Array.isArray(rawBlocks) ? rawBlocks : []) {
    if (blocks.length >= max) break;
    if (!isPlainObject(item)) continue;
    const id = own(item, "id");
    const type = own(item, "type");
    const def = typeof type === "string" ? types.get(type) : undefined;
    // Unlike the save path, a bad id is dropped rather than replaced, so the output stays deterministic.
    if (!def || typeof id !== "string" || !BLOCK_ID.test(id) || taken.has(id)) continue;
    taken.add(id);
    blocks.push({ id, type: def.type, settings: normalizeSettings(def.settings, own(item, "settings")) });
  }
  return { source, css, schema, settings, blocks };
}

/** The setting definitions of a block type (empty for an unknown type). */
export function blockSettingDefs(schema: SectionSchema, type: string): readonly SettingDef[] {
  return schema.blocks.find((b) => b.type === type)?.settings ?? [];
}

/** Product and category ids the settings of a code node pick, in order, deduplicated. */
export function codeNodeRefs(code: RenderableCodeProps): { productIds: string[]; collectionIds: string[] } {
  const productIds: string[] = [];
  const collectionIds: string[] = [];
  const add = (list: string[], value: unknown) => {
    for (const id of Array.isArray(value) ? value : [value]) if (typeof id === "string" && !list.includes(id)) list.push(id);
  };
  const visit = (defs: readonly SettingDef[], values: Record<string, unknown>) => {
    for (const def of defs) {
      if (!hasValue(def)) continue;
      const value = own(values, def.id);
      if (def.type === "product" || def.type === "product_list") add(productIds, value);
      if (def.type === "collection" || def.type === "collection_list") add(collectionIds, value);
    }
  };
  visit(code.schema.settings, code.settings);
  for (const block of code.blocks) visit(blockSettingDefs(code.schema, block.type), block.settings);
  return { productIds, collectionIds };
}
