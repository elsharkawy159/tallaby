"use client";

import { useState, type MouseEvent, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@workspace/ui/lib/utils";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@workspace/ui/components/sheet";
import { MOBILE_MENU_BUTTON_CLASS } from "@workspace/store-sections/render";
import { StoreAccountButton } from "./store-account-button.client";
import s from "../storefront.module.css";

/**
 * The burger menu of a builder header on phones (`mobileMenu` node,
 * docs/section-rules.md §5.6): a sheet from the start side with the header's
 * menu links (drawn by the renderer) and the shopper's account. Tapping a
 * link closes it.
 */
export function StoreMobileMenu({
  title,
  links,
  fontClassName,
}: {
  title: string;
  links: ReactNode;
  /** The storefront font's CSS variable class (next/font can't be imported in client components). */
  fontClassName: string;
}) {
  const t = useTranslations("storefront");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const closeOnLink = (event: MouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("a")) setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className={MOBILE_MENU_BUTTON_CLASS} aria-label={t("openMenu")}>
        <Menu className="size-6" aria-hidden />
      </SheetTrigger>
      <SheetContent side={locale === "ar" ? "right" : "left"} className={cn(fontClassName, s.tokens, "flex w-[85%] flex-col gap-0 p-5 sm:max-w-sm")}>
        <SheetHeader className="p-0 pb-3 text-start">
          <SheetTitle className="text-lg font-bold">{title}</SheetTitle>
          <SheetDescription className="sr-only">{t("menuNote", { store: title })}</SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto" onClick={closeOnLink}>
          {links}
        </div>
        <div className="border-t border-(--sf-line) pt-3" onClick={closeOnLink}>
          <StoreAccountButton />
        </div>
      </SheetContent>
    </Sheet>
  );
}
