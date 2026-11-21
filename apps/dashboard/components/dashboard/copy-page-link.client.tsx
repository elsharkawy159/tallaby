"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { toStorelessPath } from "@/lib/navigation/storeless-routes.lib";
import { formatPageLinkText } from "./copy-page-link.lib";

/**
 * Support accounts only (`isSupportAccount`, decided on the server): each
 * sidebar link gets a "copy page link" button that copies the page's sidebar
 * path in the current UI language (`"Settings" > "Payments"`), then on the next
 * line its store-less URL (`/settings/payments`, not
 * `/stores/<uuid>/settings/payments`), which opens the same page for whichever
 * seller it is sent to.
 */
export const SupportToolsContext = createContext(false);

export function useSupportTools() {
  return useContext(SupportToolsContext);
}

/** The absolute store-less link of a sidebar href, on this dashboard's origin. */
function storelessUrl(href: string) {
  return new URL(toStorelessPath(href), window.location.origin).toString();
}

/**
 * The copy button. A sibling of the row's link (never inside the `<a>`); the
 * row is a `group/copy` that shows it on hover or keyboard focus.
 */
export function CopyPageLinkButton({
  href,
  trail,
  onActive = false,
  className,
}: {
  href: string;
  /** The row's sidebar path, as shown (group label, then item label). */
  trail: string[];
  /** The row is the current page (filled primary), so the icon takes the row's text colour. */
  onActive?: boolean;
  className?: string;
}) {
  const t = useTranslations("nav");
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const onClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const text = formatPageLinkText(trail, storelessUrl(href));
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // No clipboard (permission, insecure context): let the owner copy it by hand.
      window.prompt(t("copyLinkManually"), text);
      return;
    }
    setCopied(true);
    toast.success(t("linkCopied"));
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1500);
  };

  const label = copied ? t("linkCopied") : t("copyPageLink");
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "absolute top-1/2 grid size-7 -translate-y-1/2 cursor-pointer place-items-center rounded-lg opacity-0 transition-[opacity,background-color,color] duration-150 group-hover/copy:opacity-100 group-focus-within/copy:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-(--s-primary)",
        copied && "opacity-100",
        onActive
          ? "text-primary-foreground hover:bg-white/15"
          : "text-(--s-subtle) hover:bg-(--s-hover) hover:text-(--s-ink)",
        className,
      )}
    >
      {copied ? (
        <Check aria-hidden className="size-3.5" />
      ) : (
        <Copy aria-hidden className="size-3.5" />
      )}
    </button>
  );
}
