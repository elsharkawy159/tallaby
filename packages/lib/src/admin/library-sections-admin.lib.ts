/**
 * Pure parts of admin section management (spec 2026-10-20-admin-website-builder
 * §5.3, Task 11): input schemas, the reason check, the blank tree and the
 * tree check every library write goes through. No database here.
 */
import { z } from "zod";
import {
  LIBRARY_CATEGORY_IDS,
  createNode,
  fromTemplate,
  storeSectionRegistry,
  toTemplate,
  type NodeTemplate,
} from "@workspace/store-sections/render";
import { validatePageContent } from "@workspace/store-sections";
import { assignFieldNames } from "@workspace/store-sections/templates";
import { ADMIN_REASON_MAX, ADMIN_REASON_MIN } from "./admin.lib";

/** `library_sections.key`: the DB check is `^[a-z0-9-]+$`; 2–48 characters so node ids stay under 64. */
export const LIBRARY_KEY_RE = /^[a-z0-9-]+$/;

const keySchema = z.string().trim().min(2).max(48).regex(LIBRARY_KEY_RE);
const nameSchema = z.object({ ar: z.string().trim().min(1).max(80), en: z.string().trim().min(1).max(80) }).strict();
const descriptionSchema = z.object({ ar: z.string().trim().max(300), en: z.string().trim().max(300) }).strict();

const metaShape = {
  category: z.enum(LIBRARY_CATEGORY_IDS),
  subcategory: z.string().trim().max(40).regex(/^[a-z0-9-]*$/),
  name: nameSchema,
  description: descriptionSchema,
};

export const librarySectionCreateSchema = z.object({ key: keySchema, ...metaShape }).strict();
export type LibrarySectionCreateInput = z.output<typeof librarySectionCreateSchema>;

export const librarySectionMetaSchema = z
  .object({
    ...metaShape,
    keywords: z.array(z.string().trim().min(1).max(40)).max(30).optional(),
    sortOrder: z.number().int().min(-100_000).max(100_000).optional(),
  })
  .strict();
export type LibrarySectionMetaInput = z.output<typeof librarySectionMetaSchema>;

export const libraryKeySchema = keySchema;

/** The trimmed reason when it fits the audit log's limits, else null. */
export function libraryReason(reason: unknown): string | null {
  if (typeof reason !== "string") return null;
  const value = reason.trim();
  return value.length >= ADMIN_REASON_MIN && value.length <= ADMIN_REASON_MAX ? value : null;
}

/** A new, empty `section` root with the element's defaults. */
export function blankSectionTree(): NodeTemplate {
  let n = 0;
  return toTemplate(createNode("section", () => `n${++n}`));
}

const ALLOWED = storeSectionRegistry.allowedSections();

/**
 * The stored form of an untrusted library tree, or `{ ok: false }`. The tree
 * must be one `section` root; it is checked as a `custom-section` with the
 * page-content validator (schema, size and depth limits, known elements,
 * sanitizing), and the sanitized tree comes back without ids. Photo slots
 * (`stock:photo:N`) pass through unchanged. Every node gets its field name
 * (`props.field`, kept when it has one; a duplicated node gets a new one),
 * which templates store their values by.
 */
export function prepareLibraryTree(tree: unknown): { ok: true; tree: NodeTemplate } | { ok: false } {
  if (typeof tree !== "object" || tree === null || Array.isArray(tree)) return { ok: false };
  if ((tree as { type?: unknown }).type !== "section") return { ok: false };
  let root;
  try {
    let n = 0;
    root = fromTemplate(tree as NodeTemplate, () => `n${++n}`);
  } catch {
    return { ok: false };
  }
  const validated = validatePageContent(
    { sections: [{ id: "library-section", sectionId: "custom-section", version: 1, props: {}, componentTree: [root] }] },
    { allowedSections: ALLOWED },
  );
  if (!validated.success) return { ok: false };
  const nodes = validated.data.sections[0]?.componentTree;
  if (!nodes || nodes.length !== 1 || nodes[0]!.type !== "section") return { ok: false };
  return { ok: true, tree: assignFieldNames(toTemplate(nodes[0]!)) };
}
