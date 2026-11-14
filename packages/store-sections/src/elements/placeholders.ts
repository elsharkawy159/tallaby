/**
 * The English of element placeholders (`registry.ts` defaultProps) that are
 * written in Arabic only. Element defaults are Arabic-first like every code
 * design; this is the other language, so a new element starts in the store's
 * default language (`createNode`) and "Fill missing translations" can fill an
 * old one (`templates/fill-translations.ts`). The bilingual test checks that
 * every Arabic placeholder has its English here or in its own `translations.en`.
 */
import { getElementDefinition } from "./registry";
import type { ComponentNode } from "../config/schema";

export const ELEMENT_PLACEHOLDERS: readonly (readonly [string, string])[] = [
  ["سؤال جديد؟", "New question?"],
  ["عنوان جديد", "New heading"],
  ["اكتب هنا نصًا يشرح فكرتك للعملاء.", "Write a short text here that explains your idea to customers."],
  ["نص قصير", "Short text"],
  ["اقتباس ملهم من عميل سعيد.", "An inspiring quote from a happy customer."],
  ["تسوّق الآن", "Shop now"],
  ["فيديو جديد", "New video"],
  ["جديد", "New"],
  ["عنصر", "Item"],
  ["اعرف المزيد", "Learn more"],
  // Default children (`defaultChildren`) of the accordion and the list.
  ["سؤال شائع؟", "A common question?"],
  ["سؤال آخر؟", "Another question?"],
  ["الإجابة هنا.", "The answer goes here."],
  ["العنصر الأول", "First item"],
  ["العنصر الثاني", "Second item"],
];

const ENGLISH = new Map(ELEMENT_PLACEHOLDERS);

type Props = Record<string, unknown> & { translations?: Record<string, Record<string, unknown> | undefined> };

/**
 * The node with `translations.en` filled for each translatable Arabic
 * placeholder that has none (children too). Other text is left as it is.
 */
export function withPlaceholderEnglish(node: ComponentNode): ComponentNode {
  const props = node.props as Props;
  const filled: Record<string, string> = {};
  for (const field of getElementDefinition(node.type)?.fields ?? []) {
    if (!field.translatable) continue;
    const value = props[field.key];
    const en = typeof value === "string" ? ENGLISH.get(value) : undefined;
    if (en && props.translations?.en?.[field.key] === undefined) filled[field.key] = en;
  }
  const children = node.children.map(withPlaceholderEnglish);
  if (!Object.keys(filled).length && children.every((child, i) => child === node.children[i])) return node;
  const next = Object.keys(filled).length
    ? { ...props, translations: { ...props.translations, en: { ...props.translations?.en, ...filled } } }
    : node.props;
  return { ...node, props: next as ComponentNode["props"], children };
}
