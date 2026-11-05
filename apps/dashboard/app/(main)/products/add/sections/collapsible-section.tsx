"use client";

import { useEffect, useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionIcon, type SectionIconProp } from "@/app/(main)/products/add/form-kit";
import { OPEN_SECTION_EVENT } from "../add-product.lib";

export type SectionSummaryTone = "ok" | "need" | "bad" | "muted";

const SUMMARY_TONE: Record<SectionSummaryTone, string> = {
  ok: "border-transparent bg-success-soft text-success",
  need: "border-transparent bg-accent-soft text-accent-ink",
  bad: "border-transparent bg-destructive/10 text-destructive",
  muted: "border-(--s-line) bg-(--s-surface-2) text-(--s-muted)",
};

/**
 * A product-form section that folds to its header and a one-line summary,
 * so the optional details stay out of the way until the seller needs them.
 * The body stays mounted while closed: its fields keep registering and
 * validating. It opens itself when it holds an error, and when it gets
 * content (an existing product, or the AI filling it); the seller can still
 * fold it again.
 */
export function CollapsibleSection({
  id,
  icon,
  title,
  description,
  summary,
  summaryTone = "muted",
  invalid = false,
  filled = false,
  defaultOpen = false,
  children,
}: {
  id: string;
  icon: SectionIconProp;
  title: React.ReactNode;
  description: React.ReactNode;
  summary?: React.ReactNode;
  summaryTone?: SectionSummaryTone;
  invalid?: boolean;
  /** The seller (or the AI) has put something in it beyond the defaults. */
  filled?: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen || filled);
  const bodyId = useId();

  useEffect(() => {
    if (invalid) setOpen(true);
  }, [invalid]);

  useEffect(() => {
    if (filled) setOpen(true);
  }, [filled]);

  useEffect(() => {
    const onOpen = (event: Event) => {
      if ((event as CustomEvent<string>).detail === id) setOpen(true);
    };
    document.addEventListener(OPEN_SECTION_EVENT, onOpen);
    return () => document.removeEventListener(OPEN_SECTION_EVENT, onOpen);
  }, [id]);

  return (
    <section
      id={id}
      className={cn(
        "rounded-[24px] border border-(--s-line) bg-(--s-glass) shadow-(--s-shadow-card) transition-colors max-[600px]:rounded-[20px]",
        invalid && "border-destructive/45",
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "group flex min-h-[60px] w-full cursor-pointer items-center gap-3 rounded-[24px] p-[22px] text-start max-[600px]:gap-2.5 max-[600px]:rounded-[20px] max-[600px]:p-4",
          open && "pb-0 max-[600px]:pb-0",
        )}
      >
        <SectionIcon icon={icon} />
        <div className="min-w-0 flex-1">
          <h2 className="text-[16.5px] font-bold leading-normal text-(--s-ink) transition-colors group-hover:text-(--s-link) max-[600px]:text-[15px]">
            {title}
          </h2>
          <p className="mt-0.5 text-pretty text-[13px] leading-relaxed text-(--s-muted) max-[600px]:hidden">{description}</p>
        </div>
        {summary ? (
          <span
            className={cn(
              "max-w-[46%] shrink-0 truncate rounded-full border px-2.5 text-xs font-medium leading-6 min-[601px]:max-w-[42%]",
              SUMMARY_TONE[summaryTone],
            )}
          >
            {summary}
          </span>
        ) : null}
        <ChevronDown
          className={cn("size-[18px] shrink-0 text-(--s-faint) transition-transform duration-200", open && "rotate-180")}
          aria-hidden
        />
      </button>
      <div
        id={bodyId}
        className={cn("flex-col gap-4 p-[22px] pt-[18px] max-[600px]:p-4 max-[600px]:pt-3.5", open ? "flex" : "hidden")}
      >
        {children}
      </div>
    </section>
  );
}
