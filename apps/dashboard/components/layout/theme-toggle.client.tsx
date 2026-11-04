"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/** Icon button in the top bar; with `row`, a labelled line for the phone drawer. */
export function ThemeToggle({ row = false }: { row?: boolean }) {
  const t = useTranslations("header");
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label={t("toggleTheme")}
      title={t("toggleTheme")}
      className={cn(
        "flex shrink-0 cursor-pointer items-center text-(--s-subtle) transition-colors duration-150 hover:bg-(--s-hover) hover:text-(--s-ink)",
        row ? "min-h-10 gap-[11px] rounded-xl px-3 text-[13px] font-medium text-(--s-muted)" : "size-9 justify-center rounded-[11px]",
      )}
    >
      {/* Icons swap via the `dark` class, so there's no hydration mismatch. */}
      <Moon className="size-[18px] shrink-0 dark:hidden" />
      <Sun className="hidden size-[18px] shrink-0 dark:block" />
      {row && t("menuDarkMode")}
    </button>
  );
}
