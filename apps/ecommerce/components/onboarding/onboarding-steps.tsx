"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { WIZARD_STEPS } from "./become-seller.dto";

/**
 * Wizard progress for the dark sidebar: a vertical list with summaries on
 * desktop, a compact horizontal track on smaller screens.
 */
export function OnboardingSteps({
  current,
  maxReached,
  onSelect,
}: {
  current: number;
  maxReached: number;
  onSelect: (index: number) => void;
}) {
  const t = useTranslations("onboarding");

  return (
    <ol className="relative mt-3 flex flex-row lg:mt-0 lg:flex-col lg:gap-1">
      {WIZARD_STEPS.map((step, index) => {
        const status = index < current ? "done" : index === current ? "current" : "todo";
        const reachable = index <= maxReached && index !== current;
        return (
          <li key={step} className="flex-1 lg:flex-none">
            <button
              type="button"
              disabled={!reachable}
              onClick={() => onSelect(index)}
              aria-current={status === "current" ? "step" : undefined}
              className={cn(
                "relative flex w-full flex-col items-center gap-1 rounded-xl px-0.5 py-1 text-center outline-none",
                "lg:flex-row lg:items-start lg:gap-3.5 lg:px-3 lg:py-2.5 lg:text-start",
                "focus-visible:ring-[3px] focus-visible:ring-white/40",
                reachable ? "cursor-pointer lg:hover:bg-white/6" : "cursor-default",
                status === "current" && "lg:bg-white/10"
              )}
            >
              {index < WIZARD_STEPS.length - 1 && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute",
                    "start-[calc(50%+15px)] top-4.25 h-[1.5px] w-[calc(100%-30px)]",
                    "lg:start-6.5 lg:top-11 lg:h-[calc(100%-40px)] lg:w-[1.5px]",
                    status === "done" ? "bg-accent" : "bg-white/18"
                  )}
                />
              )}
              <span
                className={cn(
                  "grid size-6.5 shrink-0 place-items-center rounded-full border-[1.5px] text-xs font-bold lg:size-7.5 lg:text-[13px]",
                  status === "done" && "border-accent bg-accent text-neutral-900",
                  status === "current" && "border-white bg-white text-primary",
                  status === "todo" && "border-white/35 text-white/80"
                )}
              >
                {status === "done" ? <Check className="size-3.5" /> : index + 1}
              </span>
              <span className="flex flex-col gap-0.5 lg:pt-1">
                <span
                  className={cn(
                    "hidden text-[11px] leading-snug font-medium sm:block lg:text-[15px] lg:font-semibold",
                    status === "todo" ? "text-white/80" : "text-white"
                  )}
                >
                  {t(`wizard.steps.${step}.label`)}
                </span>
                <span
                  className={cn(
                    "hidden text-[12.5px] lg:block",
                    status === "current" ? "text-white/80" : "text-secondary"
                  )}
                >
                  {t(`wizard.steps.${step}.summary`)}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
