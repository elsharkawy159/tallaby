"use client";

import { useEffect, useRef, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { SITE_ROOT_CLASS, SITE_THEME_KEY } from "@workspace/store-sections/render";

const EVENT = "sf-theme-change";

/**
 * Light/dark switch of a builder header or footer (`themeToggle` node). It
 * sets `data-sf-theme` on the site root, where `siteDarkCss` re-points the
 * surface tokens, and remembers the choice; the site's init script restores
 * it before paint. Toggles in the header and footer stay in step.
 */
export function StorefrontThemeToggle() {
  const t = useTranslations("storefront.theme");
  const ref = useRef<HTMLButtonElement>(null);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const root = ref.current?.closest(`.${SITE_ROOT_CLASS}`);
    const sync = () => setDark(root?.getAttribute("data-sf-theme") === "dark");
    sync();
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);

  function toggle() {
    const root = ref.current?.closest(`.${SITE_ROOT_CLASS}`);
    if (!root) return;
    const next = !dark;
    if (next) root.setAttribute("data-sf-theme", "dark");
    else root.removeAttribute("data-sf-theme");
    try {
      localStorage.setItem(SITE_THEME_KEY, next ? "dark" : "light");
    } catch {
      // Private mode: the choice lasts until the next page load.
    }
    window.dispatchEvent(new Event(EVENT));
  }

  const label = dark ? t("light") : t("dark");
  return (
    <button
      ref={ref}
      type="button"
      onClick={toggle}
      aria-label={label}
      aria-pressed={dark}
      title={label}
      className="inline-grid size-10 place-items-center rounded-full transition-colors hover:bg-(--sf-shelf) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--sf-brand)"
    >
      {dark ? <Sun className="size-4.5" aria-hidden /> : <Moon className="size-4.5" aria-hidden />}
    </button>
  );
}
