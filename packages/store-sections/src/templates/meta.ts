/**
 * `templates.meta` as read back from the database (0087, admin website
 * builder §5.4): page names, the demo preview catalog and the gallery
 * swatches. The database row is the master copy; each field that is missing
 * or malformed falls back to the code template of the same key (the seed),
 * then to a default (no names, no swatches, the default template's demo
 * catalog). Pure; no React here.
 */
import { z } from "zod";
import { DEFAULT_TEMPLATE, getCodeTemplate, type TemplateMeta } from "./catalog";

const both = z.object({ ar: z.string(), en: z.string() });

const demoSchema = z.object({
  store: z.object({ name: both, description: both }),
  categories: z.array(z.object({ id: z.string(), name: both, image: z.string().nullable(), productCount: z.number() })),
  products: z.array(
    z.object({
      id: z.string(),
      title: both,
      slug: z.string(),
      image: z.string().nullable(),
      price: z.number().nullable(),
      compareAtPrice: z.number().nullable(),
      isFeatured: z.boolean(),
      categoryId: z.string(),
      inStock: z.boolean(),
      createdAt: z.string(),
      rating: z.number().nullable(),
      sold90: z.number(),
      sold14: z.number(),
    }),
  ),
});

export const templateMetaSchema = z.object({
  pageNames: z.record(z.string(), both),
  demo: demoSchema,
  palette: z.array(z.string().max(64)).max(32),
});

const field = <T>(schema: z.ZodType<T>, value: unknown): T | undefined => {
  const parsed = schema.safeParse(value);
  return parsed.success ? (value as T) : undefined;
};

/** The meta a gallery or preview uses for `key`, from the database row's `meta` with per-field fallbacks. */
export function resolveTemplateMeta(raw: unknown, key: string): TemplateMeta {
  const row = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const code = getCodeTemplate(key);
  return {
    pageNames: field(templateMetaSchema.shape.pageNames, row.pageNames) ?? { ...(code?.pageNames ?? {}) },
    demo: field(demoSchema, row.demo) ?? code?.demo ?? DEFAULT_TEMPLATE.demo,
    palette: field(templateMetaSchema.shape.palette, row.palette) ?? [...(code?.palette ?? [])],
  };
}
