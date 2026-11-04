"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Languages, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { setLocale } from "@/actions/locale";

/** Each option is labelled in its own language so it's readable by whoever needs it. */
const TARGET = {
  ar: { value: "en", label: "English" },
  en: { value: "ar", label: "العربية" },
} as const;

/** `.lang` in the top bar (the name goes up to 1020px); with `row`, a labelled line for the phone drawer. */
export function LanguageToggle({ row = false }: { row?: boolean }) {
  const t = useTranslations("header");
  const locale = useLocale() === "ar" ? "ar" : "en";
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const target = TARGET[locale];

  const onClick = () =>
    startTransition(async () => {
      await setLocale(target.value);
      router.refresh();
    });

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      lang={target.value}
      title={t("language")}
      aria-label={`${t("language")}: ${target.label}`}
      className={cn(
        "flex shrink-0 cursor-pointer items-center transition-colors duration-150 hover:bg-(--s-hover) hover:text-(--s-ink) disabled:opacity-60",
        row
          ? "min-h-10 gap-[11px] rounded-xl px-3 text-[13px] font-medium text-(--s-muted)"
          : "h-9 gap-1.5 rounded-[11px] px-2.5 text-[12.5px] font-semibold text-(--s-muted) max-[1020px]:w-9 max-[1020px]:justify-center max-[1020px]:px-0",
      )}
    >
      {isPending ? <Loader2 className="size-[18px] animate-spin" /> : <Languages className="size-[18px]" />}
      {row ? (
        <>
          <span>{t("menuLanguage")}</span>
          <span className="ms-auto font-montserrat text-xs">{target.label}</span>
        </>
      ) : (
        <span className="font-montserrat max-[1020px]:hidden">{target.label}</span>
      )}
    </button>
  );
}
