"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

export type FaqEntry = { q: React.ReactNode; a: React.ReactNode; id?: string };

/** The shared accordion trigger's classes (`@workspace/ui` AccordionTrigger), so the rows look the same as before. */
const TRIGGER_BASE =
  "focus-visible:border-ring bg-muted px-4 font-semibold focus-visible:ring-ring/50 flex flex-1 items-start justify-between gap-4 rounded-lg py-3.5! cursor-pointer text-start text-sm transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50";

/**
 * The question list. Same markup, ARIA and keys as the Radix accordion it
 * replaces (button with aria-expanded in an h3, a labelled region, Up/Down/
 * Home/End between questions), but every answer is always in the HTML: Radix
 * renders a closed answer as an empty hidden div, so crawlers saw questions
 * without answers. A closed answer is collapsed to zero height and `inert`, so
 * it stays out of the tab order and the accessibility tree, as before.
 */
export function FaqAccordionList({ items, defaultOpen, className }: { items: FaqEntry[]; defaultOpen?: boolean; className?: string }) {
  const baseId = React.useId();
  const values = items.map((item, i) => item.id ?? String(i));
  const [open, setOpen] = React.useState<ReadonlySet<string>>(() => new Set(defaultOpen ? values : []));
  const list = React.useRef<HTMLDivElement>(null);

  const toggle = (value: string) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const triggers = Array.from(list.current?.querySelectorAll<HTMLButtonElement>("[data-faq-trigger]") ?? []);
    const at = triggers.indexOf(event.currentTarget);
    if (at < 0) return;
    const target = {
      ArrowDown: triggers[(at + 1) % triggers.length],
      ArrowUp: triggers[(at - 1 + triggers.length) % triggers.length],
      Home: triggers[0],
      End: triggers[triggers.length - 1],
    }[event.key];
    if (!target) return;
    event.preventDefault();
    target.focus();
  };

  return (
    <div ref={list} data-slot="accordion" className={cn("flex flex-col gap-2.5", className)}>
      {items.map((item, i) => {
        const value = values[i]!;
        const isOpen = open.has(value);
        const state = isOpen ? "open" : "closed";
        const triggerId = `${baseId}-q-${i}`;
        const contentId = `${baseId}-a-${i}`;
        return (
          <div
            key={value}
            data-slot="accordion-item"
            data-state={state}
            className={cn(
              "border-b-0!",
              "rounded-card-sm border! border-[#e6eef0] dark:border-line bg-surface transition-shadow duration-300 data-[state=open]:shadow-[0_10px_30px_rgba(13,55,67,0.06)]",
            )}
          >
            <h3 data-state={state} className="flex">
              <button
                type="button"
                id={triggerId}
                aria-controls={contentId}
                aria-expanded={isOpen}
                data-state={state}
                data-slot="accordion-trigger"
                data-faq-trigger=""
                onClick={() => toggle(value)}
                onKeyDown={onKeyDown}
                className={cn(
                  TRIGGER_BASE,
                  "group items-center gap-4 rounded-card-sm bg-transparent px-[22px] py-[18px]! text-[15.5px] font-semibold text-ink-900 hover:no-underline",
                )}
              >
                <span>{item.q}</span>
                <span className="grid size-7 flex-none place-items-center text-ink-brand transition-transform duration-200 group-data-[state=open]:rotate-45">
                  <Plus className="size-[18px]" aria-hidden />
                </span>
              </button>
            </h3>
            {/* Height animates 0 ↔ auto through grid rows (the accordion's 0.2s ease-out), off under reduced motion. */}
            <div
              id={contentId}
              role="region"
              aria-labelledby={triggerId}
              data-state={state}
              data-slot="accordion-content"
              inert={!isOpen}
              className="grid text-sm transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none data-[state=closed]:grid-rows-[0fr] data-[state=open]:grid-rows-[1fr]"
            >
              <div className="min-h-0 overflow-hidden">
                {/* Answers keep a reading width inside the wide page container (2026-11-16). */}
                <div className="max-w-[75ch] px-[22px] pt-0 pb-5 text-[15px] text-pretty text-ink-500">{item.a}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
