"use client";

import { Check, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";

export type StepState = "active" | "done" | "locked" | "idle";

type Props = {
  id: string;
  index: number;
  title: string;
  description: string;
  /** Shown instead of the description once the step is done (e.g. the chosen package). */
  summary?: string;
  state: StepState;
  onOpen?: () => void;
  children: React.ReactNode;
  /** Bottom bar: back / next buttons and a hint. */
  footer?: React.ReactNode;
};

/** One collapsible step of the advertise flow. Only the active step shows its body. */
export function StepSection({
  id,
  index,
  title,
  description,
  summary,
  state,
  onOpen,
  children,
  footer,
}: Props) {
  const t = useTranslations("advertise.flow");
  const done = state === "done";
  const active = state === "active";
  const canOpen = !!onOpen && (done || state === "idle");

  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={cn(
        "scroll-mt-24 overflow-hidden rounded-2xl border bg-card shadow-xs transition-colors",
        active && "border-primary/35"
      )}
    >
      <div
        className={cn("flex items-center gap-3.5 px-4 py-4 sm:px-5", canOpen && "cursor-pointer")}
        onClick={canOpen ? onOpen : undefined}
      >
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full border-[1.5px] text-sm font-bold tabular-nums transition-colors",
            active && "border-primary bg-primary text-primary-foreground",
            done && "border-transparent bg-success-soft text-success",
            !active && !done && "border-border text-muted-foreground"
          )}
        >
          {done ? <Check className="size-4" aria-hidden /> : index}
        </span>
        <div className="min-w-0 flex-1">
          <h2
            id={`${id}-title`}
            className={cn("text-base font-bold leading-snug", state === "locked" && "text-muted-foreground")}
          >
            {title}
          </h2>
          {done && summary ? (
            <p className="truncate text-sm font-medium">{summary}</p>
          ) : (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {done && onOpen && (
          <Button
            type="button"
            variant="soft"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
          >
            <Pencil aria-hidden />
            {t("change")}
          </Button>
        )}
      </div>

      {active && (
        <div className="px-4 pb-4 sm:px-5 sm:pb-5">
          {children}
          {footer && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              {footer}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
