"use client";

import { useEffect } from "react";
import { LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { SellerButton } from "./buttons";

/**
 * The floating "unsaved changes" pill (`.sbar`). It slides in while `dirty` and
 * warns before the tab closes with unsaved work. Toast the result yourself.
 * Inside a <form>, omit `onSave` and it becomes a submit button.
 */
export function SaveBar({
  dirty,
  saving = false,
  onSave,
  onDiscard,
  message,
  saveLabel,
  discardLabel,
  saveDisabled = false,
}: {
  dirty: boolean;
  saving?: boolean;
  onSave?: () => void;
  onDiscard?: () => void;
  message?: React.ReactNode;
  saveLabel?: React.ReactNode;
  discardLabel?: React.ReactNode;
  saveDisabled?: boolean;
}) {
  const t = useTranslations("sellerUi.saveBar");

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  return (
    <div
      data-save-bar
      data-open={dirty || undefined}
      inert={!dirty}
      className={cn(
        "fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-3.5 whitespace-nowrap rounded-full bg-(--tallaby-teal-900) py-2.5 ps-[18px] pe-2.5 text-white shadow-(--s-shadow-bar) transition-transform duration-[350ms] ease-[cubic-bezier(.2,.7,.2,1)] dark:bg-[#1b4b5a]",
        "max-[720px]:inset-x-3 max-[720px]:translate-x-0 max-[720px]:justify-between max-[720px]:gap-2 max-[720px]:py-2 max-[720px]:ps-3.5 max-[720px]:pe-2",
        !dirty && "translate-y-[calc(100%+40px)]",
      )}
    >
      <span className="flex min-w-0 items-center gap-2 text-[13.5px] max-[720px]:whitespace-normal max-[720px]:text-[12.5px]">
        <i aria-hidden className="size-2 shrink-0 rounded-full bg-accent" />
        {message ?? t("message")}
      </span>
      <span className="flex shrink-0 items-center gap-1">
        {onDiscard && (
          <button
            type="button"
            onClick={onDiscard}
            disabled={saving}
            className="h-[38px] cursor-pointer rounded-full px-3.5 max-[600px]:h-10 text-[13px] font-semibold text-[#c6d8dc] transition-colors duration-150 hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            {discardLabel ?? t("discard")}
          </button>
        )}
        <SellerButton
          type={onSave ? "button" : "submit"}
          onClick={onSave}
          disabled={saving || saveDisabled}
          className="h-[38px] max-[600px]:h-10"
        >
          {saving && <LoaderCircle className="animate-spin" aria-hidden />}
          {saveLabel ?? t("save")}
        </SellerButton>
      </span>
    </div>
  );
}
