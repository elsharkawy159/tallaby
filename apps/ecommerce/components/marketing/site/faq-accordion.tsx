import * as React from "react";
import { Plus } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@workspace/ui/components/accordion";
import { cn } from "@workspace/ui/lib/utils";

export type FaqEntry = { q: React.ReactNode; a: React.ReactNode; id?: string };

/** Question list on the shadcn Accordion: white rows, and a "+" that turns as a row opens. */
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
      className={cn("flex flex-col gap-2.5", className)}
    >
      {items.map((item, i) => (
        <AccordionItem
          key={values[i]}
          value={values[i]!}
          className="rounded-card-sm border! border-[#e6eef0] bg-white transition-shadow duration-300 data-[state=open]:shadow-[0_10px_30px_rgba(13,55,67,0.06)] [&_[data-slot=accordion-content]]:p-0"
        >
          <AccordionTrigger className="group items-center gap-4 rounded-card-sm bg-transparent px-[22px] py-[18px]! text-[15.5px] font-semibold text-teal-900 hover:no-underline [&>svg:last-child]:hidden">
            <span>{item.q}</span>
            <span className="grid size-7 flex-none place-items-center text-teal-700 transition-transform duration-200 group-data-[state=open]:rotate-45">
              <Plus className="size-[18px]" aria-hidden />
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-[22px] pb-5 text-[15px] text-pretty text-[#56696e]">{item.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
