import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@workspace/ui/lib/utils";

export type BreadcrumbItem = { label: string; href?: string };

/**
 * Page trail; the home link is added for you and the last item is the current
 * page. For search engines, pair it with breadcrumbSchema in JsonLd.
 */
export function Breadcrumb({ items, className }: { items: BreadcrumbItem[]; className?: string }) {
  const t = useTranslations("site");
  const Separator = useLocale() === "ar" ? ChevronLeft : ChevronRight;
  const all: BreadcrumbItem[] = [{ label: t("home"), href: "/" }, ...items];
  return (
    <nav aria-label={t("breadcrumb")} className={cn("text-[13px] text-ink-400", className)}>
      <ol className="flex flex-wrap items-center gap-1.5">
        {all.map((item, i) => {
          const last = i === all.length - 1;
          return (
            <li key={item.label} className="flex items-center gap-1.5">
              {item.href && !last ? (
                <Link href={item.href} className="text-ink-500 hover:text-teal-900">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className={last ? "font-semibold text-teal-900" : undefined}>
                  {item.label}
                </span>
              )}
              {last ? null : <Separator className="size-3.5" aria-hidden />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
