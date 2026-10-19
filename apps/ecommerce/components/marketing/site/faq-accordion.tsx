import * as React from "react";
import { Plus } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@workspace/ui/components/accordion";
import { cn } from "@workspace/ui/lib/utils";

export type FaqEntry = { q: React.ReactNode; a: React.ReactNode; id?: string };

/**
 * Question list on the shadcn Accordion, styled like the design: hairline
 * rows and a round "+" that turns into an amber "×" when open.
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
  return (
    <Accordion
      type="multiple"
      defaultValue={defaultOpen ? values : undefined}
      key={defaultOpen ? values.join("|") : "closed"}
      className={cn("border-t border-neutral-200", className)}
    >
      {items.map((item, i) => (
        <AccordionItem key={values[i]} value={values[i]!} 
          className="border-b! border-neutral-200 [&_[data-slot=accordion-content]]:p-0"
        >
          <AccordionTrigger className="group items-center rounded-none bg-transparent px-0 py-[22px]! text-[17px] font-bold text-teal-900 hover:no-underline [&>svg:last-child]:hidden">
            <span>{item.q}</span>
            <span className="grid size-8 flex-none place-items-center rounded-full bg-teal-50 transition-[transform,background-color] duration-200 group-data-[state=open]:rotate-45 group-data-[state=open]:bg-amber-600">
              <Plus className="size-[18px]" aria-hidden />
            </span>
          </AccordionTrigger>
          <AccordionContent className="max-w-[680px] pb-[22px] text-[15px] text-slate-ink">
            {item.a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
