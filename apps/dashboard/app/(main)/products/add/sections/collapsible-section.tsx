"use client";

import { useEffect, useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card, CardContent } from "@workspace/ui/components/card";
import { cn } from "@/lib/utils";
import { SectionIcon, type SectionIconProp } from "@/components/form/form-ui";
import { OPEN_SECTION_EVENT } from "../add-product.lib";

export type SectionSummaryTone = "ok" | "need" | "bad" | "muted";

const SUMMARY_TONE: Record<SectionSummaryTone, string> = {
  ok: "border-transparent bg-success-soft text-success",
  need: "border-transparent bg-accent-soft text-accent-ink",
  bad: "border-transparent bg-destructive/10 text-destructive",
  muted: "border-border bg-muted text-muted-foreground",
};

/**
 * A product-form section that folds to its header and a one-line summary,
 * so the optional details stay out of the way until the seller needs them.
 * The body stays mounted while closed: its fields keep registering and
 * validating. It opens itself when it holds an error.
 */
export function CollapsibleSection({
  id,
  icon,
  title,
  description,
  summary,
  summaryTone = "muted",
  invalid = false,
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
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = useId();

  useEffect(() => {
    if (invalid) setOpen(true);
  }, [invalid]);

  useEffect(() => {
    const onOpen = (event: Event) => {
      if ((event as CustomEvent<string>).detail === id) setOpen(true);
    };
    document.addEventListener(OPEN_SECTION_EVENT, onOpen);
    return () => document.removeEventListener(OPEN_SECTION_EVENT, onOpen);
  }, [id]);

  return (
    <Card
      id={id}
      className={cn(
        "scroll-mt-[136px] gap-0 rounded-2xl py-0 transition-colors md:scroll-mt-[88px] dark:shadow-none",
        invalid && "border-destructive/45"
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "group flex w-full items-center gap-2.5 rounded-2xl px-4 py-3.5 text-start sm:gap-3 sm:px-[22px] sm:py-[18px]",
          open && "pb-0 sm:pb-0"
        )}
      >
        <SectionIcon icon={icon} compact />
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] leading-normal font-bold transition-colors group-hover:text-primary-ink sm:text-base">
            {title}
          </h2>
          <p className="mt-0.5 hidden text-xs leading-relaxed text-pretty text-muted-foreground sm:block">
            {description}
          </p>
        </div>
        {summary ? (
          <span
            className={cn(
              "max-w-[46%] shrink-0 truncate rounded-full border px-2.5 text-xs leading-6 sm:max-w-[42%]",
              SUMMARY_TONE[summaryTone]
            )}
          >
            {summary}
          </span>
        ) : null}
        <ChevronDown
          className={cn(
            "size-[18px] shrink-0 text-faint transition-transform duration-200",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>
      <CardContent
        id={bodyId}
        className={cn(
          "flex-col gap-4 p-4 sm:px-[22px] sm:pt-[18px] sm:pb-[22px]",
          open ? "flex" : "hidden"
        )}
      >
        {children}
      </CardContent>
    </Card>
  );
}
