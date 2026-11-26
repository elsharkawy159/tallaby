/**
 * Section operations of the website editor's AI agent (ROADMAP F-83c, F-101g/j).
 * The agent never writes to the database: a turn returns these operations,
 * the editor applies them to its drafts (the seller sees them on the canvas
 * and can undo), and they are saved and published only through the normal,
 * fully validated draft save and publish.
 *
 * `applySectionOps` is pure and browser-safe, never mutates its input and
 * never throws. The server runs it with the full code checks and the page
 * validator (`turn.server.ts`); the editor runs it again on its own draft with
 * the normalised ops the server returned.
 *
 * Rules (also in the agent prompt):
 * - Ids always name existing sections and elements; new ids are made by code
 *   (the server writes them into the normalised ops, so the editor makes the
 *   same section). The model's own output can't carry ids for new things.
 * - An op touches only the section it names; when the turn targets one
 *   section, ops on any other section are refused. The shared header and
 *   footer are edited only by a turn that targets them, and their section
 *   itself can't be added, moved, removed, duplicated or replaced.
 * - At most `MAX_OPS_PER_TURN` ops and `MAX_CODE_OPS_PER_TURN` code ops a turn.
 * - No op can create product, money or store data. Product and category
 *   picks of a code section keep only the seller's own values: the seller
 *   picks the items in the sidebar.
 * - `set_image` puts a photo the store owns into an image element (or as the
 *   section's background photo): one already in that section, or one the
 *   host's `allowImage` accepts. Any other link is refused.
 */
import { z } from "zod";
import { sanitizeRichText } from "../config/sanitize";
import {
  MAX_CUSTOM_CSS_BYTES,
  MAX_SECTIONS_PER_PAGE,
  type ComponentNode,
  type SectionInstance,
  type SiteLocale,
} from "../config/schema";
import { hasDangerousScheme, isHttpOrRelativeUrl } from "../config/url";
import { capUtf8, normalizeCodeNodeProps, utf8Length, type CodeNodeIssue, type CodeNodeProps } from "../code/code-node";
import { joinSectionFile, splitSectionFile } from "../code/section-file";
import { MAX_BLOCKS, parseSectionSchema, type SettingDef } from "../code/section-schema";
import { getElementDefinition, type ElementDefinition } from "../elements/registry";
import { normalizeSectionStyle, normalizeStyle, STYLE_BREAKPOINTS } from "../elements/style";
import { cloneWithNewIds, duplicateNode, findNode, newTreeSection, removeNode, updateNode, type MakeId } from "../elements/tree";

export const MAX_OPS_PER_TURN = 20;
export const MAX_CODE_OPS_PER_TURN = 3;
/** A code op's file: the template (64 KB), stylesheet (32 KB) and schema together. */
export const MAX_AGENT_FILE_BYTES = 128 * 1024;
const MAX_TEXT_LENGTH = 2000;
const MAX_URL_LENGTH = 2048;
const MAX_NAME_LENGTH = 80;

const ID_RE = /^[A-Za-z0-9_:-]{1,64}$/;
const PROP_RE = /^[a-zA-Z][a-zA-Z0-9]{0,39}$/;

export const AGENT_DEVICES = ["desktop", ...STYLE_BREAKPOINTS] as const;
export type AgentDevice = (typeof AGENT_DEVICES)[number];

/** What the turn is about: a page (optionally one of its sections), or the shared header or footer. */
export type AgentTarget = { kind: "page" | "header" | "footer"; sectionId?: string };

// ---------------------------------------------------------------------------
// The operation schema (the contract with the editor)
// ---------------------------------------------------------------------------

const idSchema = z.string().regex(ID_RE);
const fileSchema = z.string().refine((file) => utf8Length(file) <= MAX_AGENT_FILE_BYTES, "file_too_large");
const valuesSchema = z.record(z.string(), z.unknown());
const blocksSchema = z
  .array(z.object({ id: z.string().max(64).optional(), type: z.string().max(40), settings: valuesSchema.optional() }))
  .max(MAX_BLOCKS);
const nameSchema = z.string().max(200);
const codeFields = { settings: valuesSchema.optional(), blocks: blocksSchema.optional(), name: nameSchema.optional() };

export const sectionOpSchema = z.discriminatedUnion("op", [
  z.object({
    op: z.literal("add_code_section"),
    /** Insert after this section, or at the start or end of the page (default: after the targeted section, else the end). */
    after: z.union([z.literal("start"), z.literal("end"), idSchema]).optional(),
    file: fileSchema,
    ...codeFields,
    /** Set by the server in normalised ops only, so the editor makes the same ids. */
    newSectionId: idSchema.optional(),
    newRootId: idSchema.optional(),
    newNodeId: idSchema.optional(),
  }),
  z.object({ op: z.literal("update_code_section"), sectionId: idSchema, file: fileSchema.optional(), ...codeFields }),
  z.object({ op: z.literal("convert_to_code_section"), sectionId: idSchema, file: fileSchema, ...codeFields, newRootId: idSchema.optional(), newNodeId: idSchema.optional() }),
  z.object({
    op: z.literal("set_text"),
    sectionId: idSchema,
    nodeId: idSchema,
    prop: z.string().regex(PROP_RE),
    ar: z.string().max(20_000).optional(),
    en: z.string().max(20_000).optional(),
  }),
  z.object({ op: z.literal("set_style"), sectionId: idSchema, nodeId: idSchema.optional(), breakpoint: z.enum(AGENT_DEVICES).optional(), style: valuesSchema }),
  z.object({ op: z.literal("set_custom_css"), sectionId: idSchema, nodeId: idSchema.optional(), css: z.string().max(MAX_CUSTOM_CSS_BYTES * 2) }),
  z.object({ op: z.literal("set_link"), sectionId: idSchema, nodeId: idSchema, href: z.string().max(MAX_URL_LENGTH) }),
  z.object({
    op: z.literal("set_image"),
    sectionId: idSchema,
    /** An image element (or an element with an image field), or the section's root element for its background photo. */
    nodeId: idSchema,
    src: z.string().max(MAX_URL_LENGTH),
    /** The photo's description (alt text); a language left out keeps its text. */
    alt: z.object({ ar: z.string().max(2000).optional(), en: z.string().max(2000).optional() }).optional(),
  }),
  z.object({ op: z.literal("remove_node"), sectionId: idSchema, nodeId: idSchema }),
  z.object({ op: z.literal("duplicate_node"), sectionId: idSchema, nodeId: idSchema }),
  z.object({ op: z.literal("hide_node"), sectionId: idSchema, nodeId: idSchema, device: z.enum(AGENT_DEVICES).optional() }),
  z.object({ op: z.literal("move_section"), sectionId: idSchema, to: z.number().int().min(0).max(MAX_SECTIONS_PER_PAGE - 1) }),
  z.object({ op: z.literal("remove_section"), sectionId: idSchema }),
  z.object({ op: z.literal("duplicate_section"), sectionId: idSchema }),
]);

export type SectionOp = z.infer<typeof sectionOpSchema>;
export type SectionOpName = SectionOp["op"];
export const SECTION_OP_NAMES = sectionOpSchema.options.map((o) => o.shape.op.value) as readonly SectionOpName[];

export const CODE_OP_NAMES: readonly SectionOpName[] = ["add_code_section", "update_code_section", "convert_to_code_section"];
const SECTION_LEVEL_OPS: readonly SectionOpName[] = ["add_code_section", "convert_to_code_section", "move_section", "remove_section", "duplicate_section"];

export const SECTION_OP_REJECT_CODES = [
  "invalid_op",
  "too_many_ops",
  "too_many_code_ops",
  "code_disabled",
  "section_not_found",
  "outside_target",
  "chrome_locked",
  "node_not_found",
  "not_code_section",
  "code_node",
  "bound_node",
  "root_node",
  "not_text_prop",
  "empty_text",
  "not_link",
  "unsafe_url",
  "not_image",
  "image_not_allowed",
  "invalid_style",
  "css_too_large",
  "invalid_code",
  "too_many_sections",
  "not_allowed",
  "invalid_result",
] as const;
export type SectionOpRejectCode = (typeof SECTION_OP_REJECT_CODES)[number];

/** A problem the validator or the code checks found (positions in the joined file when known). */
export type AgentIssue = { code: string; message: string; line?: number; column?: number };

export type AppliedOp = {
  /** Index in the ops passed in. */
  index: number;
  /** The op as applied: values cleaned, new ids filled in. Applying it again to the same content gives the same result. */
  op: SectionOp;
  /** The section it changed (for add: the new section). */
  sectionId: string;
  /** The code node it wrote, for code ops. */
  codeNodeId?: string;
};

export type RejectedOp = { index: number; op: unknown; code: SectionOpRejectCode; issues?: AgentIssue[] };

export type CodePropsBuilder = (
  file: string,
  rest: { name?: unknown; settings?: unknown; blocks?: unknown },
) => { props: CodeNodeProps; issues: CodeNodeIssue[] | AgentIssue[] };

export type ApplySectionOpsOptions = {
  target: AgentTarget;
  /** The store's default language: its text lives in `props`, the other language in `props.translations`. */
  defaultLocale: SiteLocale;
  /** The `code_sections` switch: off, every code op is refused. */
  allowCode: boolean;
  /** New ids (default: random, `s-…` for sections and `n-…` for elements). */
  makeId?: (kind: "section" | "node") => string;
  /**
   * File to code-node props. Default: split and normalise only (browser). The
   * server passes `codeNodeFromFile`, which also parses the Liquid and the CSS;
   * any issue refuses the op.
   */
  codeProps?: CodePropsBuilder;
  /**
   * `set_image`: a photo that isn't already in the section it goes into is
   * accepted only when this returns the src to store (null refuses it as
   * `image_not_allowed`). The servers pass a strict check (the store's own
   * media library, this turn's uploads). Default: any safe image src
   * (`isSafeImageSrc`), because the editor re-applies ops its server already
   * checked, and the seller can pick any photo in the sidebar anyway.
   */
  allowImage?: (src: string) => string | null;
  /** Run after each op on the whole content; issues refuse that op. The server passes `validatePageContent` with the server checks. */
  validate?: (content: { sections: SectionInstance[] }) => AgentIssue[] | null;
};

export type ApplySectionOpsResult<T extends { sections: SectionInstance[] }> = {
  content: T;
  applied: AppliedOp[];
  rejected: RejectedOp[];
};

// ---------------------------------------------------------------------------
// The code section builder (shared with the editor's Add › Code section)
// ---------------------------------------------------------------------------

function randomId(prefix: string): string {
  return `${prefix}-${globalThis.crypto.randomUUID().replace(/-/g, "").slice(0, 14)}`;
}

/**
 * A new tree section holding one `code` element: `section → code`, the shape
 * Add › Code section inserts. Returns null when the tree is over the limits.
 */
export function codeSectionInstance(
  codeProps: Record<string, unknown>,
  ids: { sectionId: string; codeNodeId: string; makeNodeId: MakeId },
): { instance: SectionInstance; codeNodeId: string } | null {
  const code: ComponentNode = { id: ids.codeNodeId, type: "code", props: codeProps, children: [] };
  const tree = newTreeSection([code], ids.makeNodeId);
  if (!tree.length) return null;
  return { instance: { id: ids.sectionId, sectionId: "custom-section", version: 1, props: {}, componentTree: tree }, codeNodeId: code.id };
}

/** The first `code` element of a section's tree (a code section holds one). */
export function findCodeNode(nodes: readonly ComponentNode[] | undefined): ComponentNode | null {
  for (const node of nodes ?? []) {
    if (node.type === "code") return node;
    const found = findCodeNode(node.children);
    if (found) return found;
  }
  return null;
}

const defaultCodeProps: CodePropsBuilder = (file, rest) => {
  const split = splitSectionFile(file);
  const normalized = normalizeCodeNodeProps(
    { ...rest, source: split.source, css: split.css, schema: split.schema },
    { cleanRichText: sanitizeRichText },
  );
  return { props: normalized.props, issues: [...split.issues, ...normalized.issues] };
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Bag = Record<string, unknown>;
const isBag = (v: unknown): v is Bag => v != null && typeof v === "object" && !Array.isArray(v);

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;

function cleanText(value: string, max: number): string {
  return sanitizeRichText(value.replace(CONTROL_CHARS, "")).slice(0, max);
}

function cleanName(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const name = value.replace(CONTROL_CHARS, "").replace(/\s+/g, " ").trim().slice(0, MAX_NAME_LENGTH);
  return name || undefined;
}

/** Text props of an element: its in-place text prop and its translatable text fields, with their caps. */
export function textPropsOf(def: ElementDefinition): Map<string, number> {
  const out = new Map<string, number>();
  for (const field of def.fields) {
    if (field.translatable && (field.type === "text" || field.type === "textarea")) out.set(field.key, field.maxLength ?? MAX_TEXT_LENGTH);
  }
  if (def.textProp && !out.has(def.textProp)) out.set(def.textProp, MAX_TEXT_LENGTH);
  return out;
}

function hasLinkProp(def: ElementDefinition): boolean {
  return def.fields.some((f) => f.key === "href" && f.type === "url");
}

/** http(s), a page path (`/x`, `/#products`), a `#anchor`, `mailto:` or `tel:`. */
export function isSafeAgentHref(value: string): boolean {
  const v = value.trim();
  if (!v || v.length > MAX_URL_LENGTH || hasDangerousScheme(v)) return false;
  return isHttpOrRelativeUrl(v) || /^#[A-Za-z][\w-]{0,63}$/.test(v) || /^(?:mailto|tel):[^\s<>"']{1,200}$/i.test(v);
}

/** An image src a store may hold: an http(s) URL or a store path (no other scheme, no `//host`, no spaces). The rule of a section's background photo. */
export function isSafeImageSrc(value: string): boolean {
  const v = value.trim();
  if (!v || v.length > MAX_URL_LENGTH || hasDangerousScheme(v) || /\s/.test(v)) return false;
  if (/^https?:\/\//i.test(v)) return true;
  return !v.startsWith("//") && !/^[a-z][a-z0-9+.-]*:/i.test(v);
}

/** The key of an element's image field (`src` of an image, `poster` of a video), or null. */
export function imageFieldOf(def: ElementDefinition): string | null {
  return def.fields.find((f) => f.type === "image")?.key ?? null;
}

/** The section's background photo (`style.shell.bgImage`), or null. */
export function sectionBackgroundImage(section: SectionInstance): string | null {
  const style = isBag(section.style) ? section.style : null;
  const shell = style && isBag(style.shell) ? style.shell : null;
  return typeof shell?.bgImage === "string" && shell.bgImage.trim() ? shell.bgImage.trim() : null;
}

/** Every photo a section shows: its elements' image fields and its background photo. */
export function sectionImageSrcs(section: SectionInstance): Set<string> {
  const out = new Set<string>();
  const background = sectionBackgroundImage(section);
  if (background) out.add(background);
  const walk = (nodes: readonly ComponentNode[]) => {
    for (const node of nodes) {
      const def = node.type === "code" ? undefined : getElementDefinition(node.type);
      const key = def ? imageFieldOf(def) : null;
      const value = key ? node.props?.[key] : undefined;
      if (typeof value === "string" && value.trim()) out.add(value.trim());
      walk(node.children ?? []);
    }
  };
  walk(section.componentTree ?? []);
  return out;
}

const PICK_TYPES = new Set(["product", "product_list", "collection", "collection_list"]);

/** The model's values minus product and category picks (ids are the seller's to pick), over `base`. */
function mergeValues(defs: readonly SettingDef[], base: Bag, fromModel: Bag | undefined): Bag {
  const picks = new Set(defs.filter((d) => PICK_TYPES.has(d.type) && d.id).map((d) => d.id as string));
  const out: Bag = { ...base };
  for (const [key, value] of Object.entries(fromModel ?? {})) {
    if (key === "__proto__" || picks.has(key)) continue;
    out[key] = value;
  }
  return out;
}

type StoredBlock = { id?: string; type: string; settings?: Bag };

function mergeBlocks(
  blockDefs: ReadonlyMap<string, readonly SettingDef[]>,
  existing: readonly StoredBlock[],
  fromModel: readonly StoredBlock[] | undefined,
): StoredBlock[] {
  if (!fromModel) return [...existing];
  const byId = new Map(existing.filter((b) => b.id).map((b) => [b.id as string, b]));
  return fromModel.map((block) => {
    const old = block.id ? byId.get(block.id) : undefined;
    const base = old && old.type === block.type ? (old.settings ?? {}) : {};
    // Picks never come from the model; a kept block keeps the seller's.
    const keptPicks = Object.fromEntries(Object.entries(base).filter(([key]) => (blockDefs.get(block.type) ?? []).some((d) => d.id === key && PICK_TYPES.has(d.type))));
    return { ...(block.id && { id: block.id }), type: block.type, settings: { ...mergeValues(blockDefs.get(block.type) ?? [], {}, block.settings), ...keptPicks } };
  });
}

function schemaOfFile(file: string) {
  const { schema } = parseSectionSchema(splitSectionFile(file).schema);
  return { settings: schema.settings, blocks: new Map(schema.blocks.map((b) => [b.type, b.settings])), schema };
}

function slotOf(holder: { style?: Bag; breakpointStyles?: Record<string, Bag> }, device: AgentDevice): Bag {
  if (device === "desktop") return isBag(holder.style) ? holder.style : {};
  const value = holder.breakpointStyles?.[device];
  return isBag(value) ? value : {};
}

function withSlot<T extends { style?: Bag; breakpointStyles?: Record<string, Bag> }>(holder: T, device: AgentDevice, slot: Bag): T {
  if (device === "desktop") return { ...holder, style: slot };
  return { ...holder, breakpointStyles: { ...(holder.breakpointStyles ?? {}), [device]: slot } };
}

function hasRootSection(instance: SectionInstance): boolean {
  return instance.componentTree?.length === 1 && instance.componentTree[0]?.type === "section";
}

// ---------------------------------------------------------------------------
// Apply
// ---------------------------------------------------------------------------

type Step = { ok: true; sections: SectionInstance[]; op: SectionOp; sectionId: string; codeNodeId?: string } | { ok: false; code: SectionOpRejectCode; issues?: AgentIssue[] };

const reject = (code: SectionOpRejectCode, issues?: AgentIssue[]): Step => ({ ok: false, code, ...(issues?.length && { issues }) });

function issuesOf(list: readonly (CodeNodeIssue | AgentIssue)[]): AgentIssue[] {
  return list.map(({ code, message, line, column }) => ({ code, message, ...(line !== undefined && { line }), ...(column !== undefined && { column }) }));
}

/**
 * Applies the ops in order. Each op is checked against the content as the
 * ops before it left it; a refused op changes nothing and the next one goes
 * on. Never mutates `content`, never throws.
 */
export function applySectionOps<T extends { sections: SectionInstance[] }>(
  content: T,
  ops: readonly unknown[],
  opts: ApplySectionOpsOptions,
): ApplySectionOpsResult<T> {
  const base = structuredClone(content);
  let sections: SectionInstance[] = Array.isArray(base.sections) ? base.sections : [];
  const applied: AppliedOp[] = [];
  const rejected: RejectedOp[] = [];
  const makeId = opts.makeId ?? ((kind) => randomId(kind === "section" ? "s" : "n"));
  const makeNodeId: MakeId = () => makeId("node");
  const codeProps = opts.codeProps ?? defaultCodeProps;
  const chrome = opts.target.kind !== "page";
  let codeOps = 0;

  const freshId = (kind: "section" | "node", wanted: string | undefined, taken: (id: string) => boolean): string => {
    if (wanted && !taken(wanted)) return wanted;
    let id = makeId(kind);
    while (taken(id)) id = makeId(kind);
    return id;
  };
  const sectionTaken = (id: string) => sections.some((s) => s.id === id);
  const nodeTaken = (id: string) => sections.some((s) => findNode(s.componentTree ?? [], id) !== null);

  ops.forEach((raw, index) => {
    if (index >= MAX_OPS_PER_TURN) return void rejected.push({ index, op: raw, code: "too_many_ops" });
    const parsed = sectionOpSchema.safeParse(raw);
    if (!parsed.success) return void rejected.push({ index, op: raw, code: "invalid_op" });
    const op = parsed.data;
    const step = applyOne(op);
    if (!step.ok) return void rejected.push({ index, op, code: step.code, ...(step.issues && { issues: step.issues }) });
    const issues = opts.validate?.({ sections: step.sections }) ?? null;
    if (issues?.length) {
      const codeIssue = issues.some((i) => i.code === "invalid_code" || i.code === "invalid_css");
      return void rejected.push({ index, op, code: codeIssue ? "invalid_code" : "invalid_result", issues });
    }
    sections = step.sections;
    applied.push({ index, op: step.op, sectionId: step.sectionId, ...(step.codeNodeId && { codeNodeId: step.codeNodeId }) });
  });

  return { content: { ...base, sections }, applied, rejected };

  function applyOne(op: SectionOp): Step {
    const isCode = CODE_OP_NAMES.includes(op.op);
    if (isCode) {
      if (!opts.allowCode) return reject("code_disabled");
      if (codeOps >= MAX_CODE_OPS_PER_TURN) return reject("too_many_code_ops");
      codeOps += 1;
    }
    if (chrome && SECTION_LEVEL_OPS.includes(op.op)) return reject("chrome_locked");

    if (op.op === "add_code_section") return addCodeSection(op);

    const index = sections.findIndex((s) => s.id === op.sectionId);
    if (index < 0) return reject("section_not_found");
    if (opts.target.sectionId && op.sectionId !== opts.target.sectionId) return reject("outside_target");
    const section = sections[index]!;
    const replace = (next: SectionInstance) => sections.map((s, i) => (i === index ? next : s));

    switch (op.op) {
      case "update_code_section":
        return updateCodeSection(op, section, replace);
      case "convert_to_code_section":
        return convertToCodeSection(op, section, replace);
      case "move_section": {
        const to = Math.min(op.to, sections.length - 1);
        const next = sections.filter((_, i) => i !== index);
        next.splice(to, 0, section);
        return { ok: true, sections: next, op: { ...op, to }, sectionId: section.id };
      }
      case "remove_section":
        return { ok: true, sections: sections.filter((_, i) => i !== index), op, sectionId: section.id };
      case "duplicate_section": {
        if (sections.length >= MAX_SECTIONS_PER_PAGE) return reject("too_many_sections");
        const copy: SectionInstance = {
          ...structuredClone(section),
          id: freshId("section", undefined, sectionTaken),
          ...(section.componentTree && { componentTree: section.componentTree.map((n) => cloneWithNewIds(n, makeNodeId)) }),
        };
        const next = [...sections];
        next.splice(index + 1, 0, copy);
        return { ok: true, sections: next, op, sectionId: copy.id };
      }
      case "set_style":
        return setStyle(op, section, replace);
      case "set_custom_css": {
        const css = op.css.replace(CONTROL_CHARS, "").trim();
        if (utf8Length(css) > MAX_CUSTOM_CSS_BYTES) return reject("css_too_large");
        const normalized = { ...op, css };
        if (!op.nodeId) {
          const { customCss: _old, ...rest } = section;
          return { ok: true, sections: replace(css ? { ...rest, customCss: css } : rest), op: normalized, sectionId: section.id };
        }
        const node = findNode(section.componentTree ?? [], op.nodeId);
        if (!node) return reject("node_not_found");
        const tree = updateNode(section.componentTree ?? [], op.nodeId, (n) => {
          const { customCss: _old, ...rest } = n;
          return css ? { ...rest, customCss: css } : rest;
        });
        return { ok: true, sections: replace({ ...section, componentTree: tree }), op: normalized, sectionId: section.id };
      }
      default:
        return nodeOp(op, section, replace);
    }
  }

  function addCodeSection(op: Extract<SectionOp, { op: "add_code_section" }>): Step {
    if (sections.length >= MAX_SECTIONS_PER_PAGE) return reject("too_many_sections");
    let at: number;
    const after = op.after ?? opts.target.sectionId ?? "end";
    if (after === "start") at = 0;
    else if (after === "end") at = sections.length;
    else {
      const found = sections.findIndex((s) => s.id === after);
      if (found < 0) return reject("section_not_found");
      at = found + 1;
    }
    const defs = schemaOfFile(op.file);
    const defaults = defs.schema.default?.blocks ?? defs.schema.presets?.[0]?.blocks;
    const built = codeProps(op.file, {
      name: cleanName(op.name),
      settings: mergeValues(defs.settings, {}, op.settings),
      blocks: mergeBlocks(defs.blocks, [], op.blocks ?? (defaults as StoredBlock[] | undefined)),
    });
    if (built.issues.length) return reject("invalid_code", issuesOf(built.issues));
    const sectionId = freshId("section", op.newSectionId, sectionTaken);
    const rootId = freshId("node", op.newRootId, nodeTaken);
    const codeNodeId = freshId("node", op.newNodeId, (id) => id === rootId || nodeTaken(id));
    const made = codeSectionInstance(built.props, { sectionId, codeNodeId, makeNodeId: () => rootId });
    if (!made) return reject("not_allowed");
    const next = [...sections];
    next.splice(at, 0, made.instance);
    const normalized: SectionOp = {
      op: "add_code_section",
      after: at === 0 ? "start" : (next[at - 1]?.id ?? "end"),
      ...codeOpValues(built.props),
      newSectionId: sectionId,
      newRootId: rootId,
      newNodeId: codeNodeId,
    };
    return { ok: true, sections: next, op: normalized, sectionId, codeNodeId };
  }

  function updateCodeSection(
    op: Extract<SectionOp, { op: "update_code_section" }>,
    section: SectionInstance,
    replace: (s: SectionInstance) => SectionInstance[],
  ): Step {
    const node = findCodeNode(section.componentTree);
    if (!node) return reject("not_code_section");
    const current = normalizeCodeNodeProps(node.props).props;
    const file = op.file ?? joinSectionFile({ source: current.source, css: current.css ?? "", schema: current.schema });
    const defs = schemaOfFile(file);
    const built = codeProps(file, {
      name: op.name !== undefined ? cleanName(op.name) : current.name,
      // The seller's values survive for every setting id the new file keeps.
      settings: mergeValues(defs.settings, current.settings, op.settings),
      blocks: mergeBlocks(defs.blocks, current.blocks, op.blocks),
    });
    if (built.issues.length) return reject("invalid_code", issuesOf(built.issues));
    const tree = updateNode(section.componentTree ?? [], node.id, (n) => ({ ...n, props: built.props as unknown as Bag }));
    const normalized: SectionOp = { op: "update_code_section", sectionId: section.id, ...codeOpValues(built.props) };
    return { ok: true, sections: replace({ ...section, componentTree: tree }), op: normalized, sectionId: section.id, codeNodeId: node.id };
  }

  function convertToCodeSection(
    op: Extract<SectionOp, { op: "convert_to_code_section" }>,
    section: SectionInstance,
    replace: (s: SectionInstance) => SectionInstance[],
  ): Step {
    const defs = schemaOfFile(op.file);
    const defaults = defs.schema.default?.blocks ?? defs.schema.presets?.[0]?.blocks;
    const built = codeProps(op.file, {
      name: cleanName(op.name),
      settings: mergeValues(defs.settings, {}, op.settings),
      blocks: mergeBlocks(defs.blocks, [], op.blocks ?? (defaults as StoredBlock[] | undefined)),
    });
    if (built.issues.length) return reject("invalid_code", issuesOf(built.issues));
    // The old tree's ids go away with it, so they may be reused.
    const others = sections.filter((s) => s.id !== section.id);
    const takenElsewhere = (id: string) => others.some((s) => findNode(s.componentTree ?? [], id) !== null);
    const rootId = freshId("node", op.newRootId, takenElsewhere);
    const codeNodeId = freshId("node", op.newNodeId, (id) => id === rootId || takenElsewhere(id));
    const made = codeSectionInstance(built.props, { sectionId: section.id, codeNodeId, makeNodeId: () => rootId });
    if (!made) return reject("not_allowed");
    const normalized: SectionOp = { op: "convert_to_code_section", sectionId: section.id, ...codeOpValues(built.props), newRootId: rootId, newNodeId: codeNodeId };
    return { ok: true, sections: replace(made.instance), op: normalized, sectionId: section.id, codeNodeId };
  }

  function setStyle(op: Extract<SectionOp, { op: "set_style" }>, section: SectionInstance, replace: (s: SectionInstance) => SectionInstance[]): Step {
    const style = normalizeStyle(op.style) as Bag;
    if (!Object.keys(style).length) return reject("invalid_style");
    const device = op.breakpoint ?? "desktop";
    const normalized: SectionOp = { ...op, breakpoint: device, style };
    // A tree section's look is its root `section` element.
    const nodeId = op.nodeId ?? (hasRootSection(section) ? section.componentTree![0]!.id : undefined);
    if (!nodeId) {
      const slot = normalizeSectionStyle({ ...slotOf(section, device), ...style }) as Bag;
      return { ok: true, sections: replace(withSlot(section, device, slot)), op: normalized, sectionId: section.id };
    }
    const node = findNode(section.componentTree ?? [], nodeId);
    if (!node) return reject("node_not_found");
    const tree = updateNode(section.componentTree ?? [], nodeId, (n) => withSlot(n, device, normalizeStyle({ ...slotOf(n, device), ...style }) as Bag));
    return { ok: true, sections: replace({ ...section, componentTree: tree }), op: { ...normalized, nodeId }, sectionId: section.id };
  }

  function setImage(
    op: Extract<SectionOp, { op: "set_image" }>,
    section: SectionInstance,
    node: ComponentNode,
    isRoot: boolean,
    replace: (s: SectionInstance) => SectionInstance[],
  ): Step {
    if (node.type === "code") return reject("code_node");
    if (typeof node.props.bind === "string") return reject("bound_node");
    const def = isRoot ? undefined : getElementDefinition(node.type);
    const field = def ? imageFieldOf(def) : null;
    if (!isRoot && !field) return reject("not_image");
    const wanted = op.src.trim();
    if (!isSafeImageSrc(wanted)) return reject("unsafe_url");
    // A photo already in this section is always fine (a swap or a reuse); any other must pass the host's check.
    const src = sectionImageSrcs(section).has(wanted) ? wanted : opts.allowImage ? opts.allowImage(wanted) : wanted;
    if (!src || !isSafeImageSrc(src)) return reject("image_not_allowed");

    if (isRoot) {
      // The section's background photo, drawn behind its tree (`style.shell.bgImage`).
      const style: Bag = isBag(section.style) ? section.style : {};
      const shell: Bag = isBag(style.shell) ? style.shell : {};
      const next = { ...section, style: { ...style, shell: { ...shell, bgImage: src } } } as SectionInstance;
      return { ok: true, sections: replace(next), op: { op: "set_image", sectionId: section.id, nodeId: node.id, src }, sectionId: section.id };
    }

    const altMax = def ? textPropsOf(def).get("alt") : undefined;
    const alt: Partial<Record<SiteLocale, string>> = {};
    if (altMax !== undefined && op.alt) {
      // Alt text is plain: no markup at all.
      const plain = (value: string) => value.replace(CONTROL_CHARS, "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, altMax);
      if (op.alt.ar !== undefined) alt.ar = plain(op.alt.ar);
      if (op.alt.en !== undefined) alt.en = plain(op.alt.en);
    }
    const key = field!;
    const tree = updateNode(section.componentTree ?? [], node.id, (n) => {
      let props: Bag = { ...n.props, [key]: src };
      for (const [locale, value] of Object.entries(alt) as [SiteLocale, string][]) {
        if (locale === opts.defaultLocale) props = { ...props, alt: value };
        else {
          const translations = isBag(props.translations) ? (props.translations as Record<string, Bag>) : {};
          props = { ...props, translations: { ...translations, [locale]: { ...(isBag(translations[locale]) ? translations[locale] : {}), alt: value } } };
        }
      }
      return { ...n, props };
    });
    const normalized: SectionOp = { op: "set_image", sectionId: section.id, nodeId: node.id, src, ...(Object.keys(alt).length > 0 && { alt }) };
    return { ok: true, sections: replace({ ...section, componentTree: tree }), op: normalized, sectionId: section.id };
  }

  function nodeOp(
    op: Extract<SectionOp, { op: "set_text" | "set_link" | "set_image" | "remove_node" | "duplicate_node" | "hide_node" }>,
    section: SectionInstance,
    replace: (s: SectionInstance) => SectionInstance[],
  ): Step {
    const tree = section.componentTree ?? [];
    const node = findNode(tree, op.nodeId);
    if (!node) return reject("node_not_found");
    const isRoot = tree[0]?.id === node.id && node.type === "section";
    const done = (next: ComponentNode[], normalized: SectionOp = op): Step => ({ ok: true, sections: replace({ ...section, componentTree: next }), op: normalized, sectionId: section.id });

    switch (op.op) {
      case "remove_node":
        if (isRoot) return reject("root_node");
        return done(removeNode(tree, node.id));
      case "duplicate_node": {
        if (isRoot) return reject("root_node");
        const result = duplicateNode(tree, node.id, makeNodeId);
        return result.newId ? done(result.nodes) : reject("not_allowed");
      }
      case "hide_node": {
        const devices: readonly AgentDevice[] = op.device ? [op.device] : AGENT_DEVICES;
        const next = updateNode(tree, node.id, (n) => devices.reduce((acc, d) => withSlot(acc, d, normalizeStyle({ ...slotOf(acc, d), hidden: true }) as Bag), n));
        return done(next);
      }
      case "set_link": {
        if (node.type === "code") return reject("code_node");
        const def = getElementDefinition(node.type);
        if (!def || !hasLinkProp(def)) return reject("not_link");
        if (typeof node.props.bind === "string") return reject("bound_node");
        const href = op.href.trim();
        if (!isSafeAgentHref(href)) return reject("unsafe_url");
        return done(updateNode(tree, node.id, (n) => ({ ...n, props: { ...n.props, href } })), { ...op, href });
      }
      case "set_image":
        return setImage(op, section, node, isRoot, replace);
      case "set_text": {
        if (node.type === "code") return reject("code_node");
        const def = getElementDefinition(node.type);
        const max = def ? textPropsOf(def).get(op.prop) : undefined;
        if (max === undefined) return reject("not_text_prop");
        if (typeof node.props.bind === "string") return reject("bound_node");
        const values: Partial<Record<SiteLocale, string>> = {};
        if (op.ar !== undefined) values.ar = cleanText(op.ar, max);
        if (op.en !== undefined) values.en = cleanText(op.en, max);
        if (!Object.values(values).some((v) => v.trim())) return reject("empty_text");
        const next = updateNode(tree, node.id, (n) => {
          let props: Bag = { ...n.props };
          for (const [locale, value] of Object.entries(values) as [SiteLocale, string][]) {
            if (locale === opts.defaultLocale) props = { ...props, [op.prop]: value };
            else {
              const translations = isBag(props.translations) ? (props.translations as Record<string, Bag>) : {};
              props = { ...props, translations: { ...translations, [locale]: { ...(isBag(translations[locale]) ? translations[locale] : {}), [op.prop]: value } } };
            }
          }
          return { ...n, props };
        });
        return done(next, { ...op, ...values });
      }
    }
  }
}

/** The values a normalised code op carries: the joined file and the final settings and blocks. */
function codeOpValues(props: CodeNodeProps) {
  return {
    file: joinSectionFile({ source: props.source, css: props.css ?? "", schema: props.schema }),
    settings: props.settings,
    blocks: props.blocks,
    ...(props.name && { name: props.name }),
  };
}

// ---------------------------------------------------------------------------
// Summaries (what the chat shows under a reply)
// ---------------------------------------------------------------------------

const SUMMARY: Record<SectionOpName, { ar: string; en: string }> = {
  add_code_section: { ar: "أضفت قسمًا جديدًا", en: "Added a new section" },
  update_code_section: { ar: "عدّلت كود القسم", en: "Updated the section's code" },
  convert_to_code_section: { ar: "حوّلت القسم إلى قسم بالكود", en: "Rebuilt the section as a code section" },
  set_text: { ar: "غيّرت نصًا", en: "Changed a text" },
  set_style: { ar: "غيّرت التنسيق", en: "Changed the style" },
  set_custom_css: { ar: "غيّرت الـ CSS المخصص", en: "Changed the custom CSS" },
  set_link: { ar: "غيّرت رابطًا", en: "Changed a link" },
  set_image: { ar: "غيّرت صورة", en: "Changed a photo" },
  remove_node: { ar: "حذفت عنصرًا", en: "Removed an element" },
  duplicate_node: { ar: "كرّرت عنصرًا", en: "Duplicated an element" },
  hide_node: { ar: "أخفيت عنصرًا", en: "Hid an element" },
  move_section: { ar: "نقلت القسم", en: "Moved the section" },
  remove_section: { ar: "حذفت القسم", en: "Removed the section" },
  duplicate_section: { ar: "كرّرت القسم", en: "Duplicated the section" },
};

const DEVICE_NAMES: Record<AgentDevice, { ar: string; en: string }> = {
  desktop: { ar: "الكمبيوتر", en: "desktop" },
  tablet: { ar: "التابلت", en: "tablet" },
  mobile: { ar: "الموبايل", en: "mobile" },
};

/** One short line per applied op, in the editor's UI language. */
export function describeAppliedOp(applied: AppliedOp, locale: "ar" | "en"): string {
  const { op } = applied;
  const base = SUMMARY[op.op][locale];
  const name = "name" in op && op.name ? ` «${capUtf8(op.name, 80)}»` : "";
  const device =
    (op.op === "set_style" && op.breakpoint && op.breakpoint !== "desktop") || (op.op === "hide_node" && op.device)
      ? ` (${DEVICE_NAMES[(op.op === "set_style" ? op.breakpoint : op.device) as AgentDevice][locale]})`
      : "";
  return `${base}${name}${device}`;
}
