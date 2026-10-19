/**
 * Fitting a code template to one store before it is merged into the drafts
 * (P4-05 apply). Pure:
 *
 * - `storeForm` nodes with a `formTemplate` (`newsletter`, `contact`…) get the
 *   id of the store's form of that kind, which the caller found or created.
 * - Text with role `storeName` becomes the store's name, `storeInitial` its
 *   first letter (a logo mark), and `copyright` its copyright line, in both
 *   languages.
 * - For an English-default store, English moves into `props` and Arabic into
 *   `translations.ar` (templates are written Arabic-first).
 *
 * No React here.
 */
import type { ComponentNode, SectionInstance, SiteConfig, SiteLocale } from "../config/schema";

type NodeProps = Record<string, unknown> & { translations?: Partial<Record<SiteLocale, Record<string, unknown>>> };

function walk(nodes: readonly ComponentNode[] | undefined, visit: (node: ComponentNode) => void) {
  for (const node of nodes ?? []) {
    visit(node);
    walk(node.children, visit);
  }
}

function sectionsOf(config: SiteConfig): SectionInstance[] {
  return [config.header, config.footer, ...config.pages.flatMap((page) => page.content.sections)].filter((s): s is SectionInstance => s !== null);
}

/** The ready-made forms a template needs (`storeForm` nodes with a `formTemplate`), in first-seen order. */
export function templateFormNeeds(config: SiteConfig): string[] {
  const out = new Set<string>();
  for (const section of sectionsOf(config)) {
    walk(section.componentTree, (node) => {
      const kind = node.type === "storeForm" ? node.props?.formTemplate : undefined;
      if (typeof kind === "string" && kind) out.add(kind);
    });
  }
  return [...out];
}

export type TemplateStoreDetails = {
  defaultLocale: SiteLocale;
  /** The store's display name; left as the template's demo name when empty. */
  storeName?: string | null;
  /** Ready-made form kind → this store's form id. */
  formIds?: Readonly<Record<string, string>>;
  /** Copyright year (defaults to the current year). */
  year?: number;
};

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const arDigits = (value: string) => value.replace(/\d/g, (d) => AR_DIGITS[Number(d)]!);

function fitNode(node: ComponentNode, store: TemplateStoreDetails): ComponentNode {
  let props = { ...(node.props as NodeProps) };
  const name = store.storeName?.trim().slice(0, 80);
  const year = String(store.year ?? new Date().getFullYear());

  if (node.type === "storeForm" && typeof props.formTemplate === "string") {
    const { formTemplate, ...rest } = props;
    const formId = store.formIds?.[formTemplate as string];
    props = formId ? { ...rest, formId } : { ...rest, formTemplate };
  }
  if (name && props.role === "storeName") {
    props = { ...props, text: name, translations: { ...props.translations, en: { ...props.translations?.en, text: name } } };
  }
  if (name && props.role === "storeInitial") {
    const initial = Array.from(name)[0]!.toUpperCase();
    props = { ...props, text: initial, translations: { ...props.translations, en: { ...props.translations?.en, text: initial } } };
  }
  if (name && props.role === "copyright") {
    props = {
      ...props,
      text: `© ${arDigits(year)} ${name}. كل الحقوق محفوظة.`,
      translations: { ...props.translations, en: { ...props.translations?.en, text: `© ${year} ${name}. All rights reserved.` } },
    };
  }
  if (store.defaultLocale === "en") {
    const { translations, ...rest } = props;
    const { en, ...others } = translations ?? {};
    if (en && Object.keys(en).length) {
      const ar = Object.fromEntries(Object.keys(en).map((key) => [key, rest[key]]));
      props = { ...rest, ...en, translations: { ...others, ar } };
    }
  }
  return { ...node, props, children: node.children.map((child) => fitNode(child, store)) };
}

function fitSection(section: SectionInstance, store: TemplateStoreDetails): SectionInstance {
  return section.componentTree ? { ...section, componentTree: section.componentTree.map((node) => fitNode(node, store)) } : section;
}

/** The template as this store gets it: forms bound, its name filled in, its default language first. */
export function prepareTemplateForStore(config: SiteConfig, store: TemplateStoreDetails): SiteConfig {
  return {
    ...config,
    header: config.header && fitSection(config.header, store),
    footer: config.footer && fitSection(config.footer, store),
    settings: { ...config.settings, defaultLocale: store.defaultLocale },
    pages: config.pages.map((page) => ({ ...page, content: { ...page.content, sections: page.content.sections.map((s) => fitSection(s, store)) } })),
  };
}
