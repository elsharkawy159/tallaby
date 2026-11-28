"use client";

import { useTransition } from "react";
import { Check, Loader2, Undo2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { StoreSetupStepKey } from "@workspace/lib/sellers";
import { cn } from "@workspace/ui/lib/utils";
import { setSetupStepMarkedDone } from "./setup-mark-done.server";
import { requestSetupPromptCheck } from "./setup-prompts.lib";

/**
 * "Mark as done" on a home setup card, or "Undo" for a step done only by that
 * mark (owner, 2026-11-28). Rendered outside the card's link (a button can't
 * sit inside an <a>); the server action refreshes the home.
 */
export function SetupMarkDoneButton({
  step,
  storeId,
  undo = false,
  tone = "light",
  className,
}: {
  step: StoreSetupStepKey;
  storeId: string | null;
  undo?: boolean;
  /** "dark": on the dark setup card; "light": on the setup-only home's white cards. */
  tone?: "dark" | "light";
  className?: string;
}) {
  const t = useTranslations("home.setup");
  const [pending, startTransition] = useTransition();

  const onClick = () =>
    startTransition(async () => {
      const result = await setSetupStepMarkedDone({ step, storeId, done: !undo });
      if (!result.success) {
        toast.error(t("markDoneError"));
        return;
      }
      requestSetupPromptCheck();
    });

  const Icon = pending ? Loader2 : undo ? Undo2 : Check;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-label={undo ? t("markNotDoneLabel", { step: t(`tasks.${step}.title`) }) : t("markDoneLabel", { step: t(`tasks.${step}.title`) })}
      className={cn(
        "inline-flex h-[34px] cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-[12.5px] font-bold transition-colors duration-150 disabled:cursor-default disabled:opacity-60 max-[600px]:h-10",
        tone === "dark" ? "text-[#c6d8dc] hover:bg-white/10 hover:text-white" : "text-(--s-muted) hover:bg-(--s-fill) hover:text-(--s-ink)",
        className,
      )}
    >
      <Icon className={cn("size-[15px]", pending && "animate-spin")} aria-hidden />
      {undo ? t("markNotDone") : t("markDone")}
    </button>
  );
}
