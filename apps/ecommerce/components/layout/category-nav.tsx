import { BadgeCheck } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { loadTopCategories } from "@/lib/top-categories";
import { AllCategoriesMenu } from "./category-nav.client";

// White second row of the desktop header: the all-categories menu, the
// busiest categories as quick links, and the verified-sellers note.
export async function CategoryNav() {
  const locale = await getLocale();
  const [t, categories] = await Promise.all([
    getTranslations("navigation"),
    loadTopCategories(locale),
  ]);

  return (
    <nav className="relative hidden border-b border-neutral-200 bg-white md:block">
      <div className="container flex h-12 items-center gap-1">
        <AllCategoriesMenu
          categories={categories}
          labels={{
            allCategories: t("allCategories"),
            browseAll: t("browseAllCategories"),
          }}
        />

        <div className="flex min-w-0 flex-1 gap-0.5 overflow-x-auto [scrollbar-width:none]">
          {categories.slice(0, 10).map((category) => (
            <Link
              key={category.id}
              href={category.href}
              className="whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-neutral-800 transition-colors hover:bg-muted hover:text-primary"
            >
              {category.displayName}
            </Link>
          ))}
        </div>

        <span className="hidden shrink-0 items-center gap-1.5 whitespace-nowrap text-xs text-neutral-600 lg:flex">
          <BadgeCheck className="size-4 text-green-600" aria-hidden />
          {t("verifiedSellers")}
        </span>
      </div>
    </nav>
  );
}
