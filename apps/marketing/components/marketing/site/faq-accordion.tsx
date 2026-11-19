import { FaqAccordionList, type FaqEntry } from "./faq-accordion.client";

export type { FaqEntry };

/**
 * Question list: white rows, and a "+" that turns as a row opens. Every answer
 * is in the server HTML, open or closed (faq-accordion.client.tsx).
 */
export function FaqAccordion({
  items,
  defaultOpen,
  className,
}: {
  items: FaqEntry[];
  /** Open every item (used while searching). */
  defaultOpen?: boolean;
  className?: string;
}) {
  const values = items.map((item, i) => item.id ?? String(i));
  // A new key when `defaultOpen` changes resets which rows are open, as before.
  return <FaqAccordionList key={defaultOpen ? values.join("|") : "closed"} items={items} defaultOpen={defaultOpen} className={className} />;
}
