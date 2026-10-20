/**
 * Translation overlay (ported from the reference
 * `lib/builder/i18n/resolve-section-locale.ts`). `props` holds the
 * default-locale content (Arabic for Tallaby); `translations[locale]` holds a
 * partial overlay. Arrays merge by index and keep the base length, so
 * non-text item fields (images, links) always come from the base.
 */
import type { SectionInstance } from "../config/schema";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mergeValue(base: unknown, overlay: unknown): unknown {
  if (overlay === undefined) return base;
  if (Array.isArray(base) && Array.isArray(overlay)) return mergeArray(base, overlay);
  if (isPlainObject(base) && isPlainObject(overlay)) return mergeRecord(base, overlay);
  return overlay;
}

export function mergeArray(base: unknown[], overlay: unknown[]): unknown[] {
  return base.map((item, i) => (i < overlay.length ? mergeValue(item, overlay[i]) : item));
}

export function mergeRecord(base: Record<string, unknown>, overlay: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(overlay)) {
    if (value === undefined) continue;
    out[key] = mergeValue(base[key], value);
  }
  return out;
}

type TreeNode = NonNullable<SectionInstance["componentTree"]>[number];

/** Element text overlays live on each node: `node.props.translations[locale]` (P4B-02). */
function resolveTreeForLocale(nodes: TreeNode[], locale: string): TreeNode[] {
  return nodes.map((node) => {
    const overlay = (node.props.translations as Record<string, unknown> | undefined)?.[locale];
    const props = isPlainObject(overlay) ? mergeRecord(node.props, overlay) : node.props;
    return { ...node, props, children: resolveTreeForLocale(node.children, locale) };
  });
}

/** The instance as seen in `locale`; the same object when nothing changes. */
export function resolveSectionForLocale(instance: SectionInstance, locale: string, defaultLocale: string): SectionInstance {
  if (locale === defaultLocale) return instance;
  const overlay = instance.translations?.[locale as keyof NonNullable<SectionInstance["translations"]>];
  const hasOverlay = Boolean(overlay && Object.keys(overlay).length > 0);
  if (!hasOverlay && !instance.componentTree?.length) return instance;
  return {
    ...instance,
    ...(hasOverlay && { props: mergeRecord(instance.props, overlay!) }),
    ...(instance.componentTree?.length && { componentTree: resolveTreeForLocale(instance.componentTree, locale) }),
  };
}
