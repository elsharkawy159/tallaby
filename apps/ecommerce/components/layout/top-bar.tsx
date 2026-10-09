import { Banknote, Truck } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { FREE_SHIPPING_ENABLED } from "@/lib/constants";
import { contentParams } from "@/lib/content-params";
import { SellOnTallabyLink } from "./header.chunks";
import { LanguageSwitcher } from "./language-switcher";

const linkClass = "whitespace-nowrap hover:text-white hover:underline";

// Thin strip above the header. It scrolls away with the page; only the
// header below it is sticky.
export async function TopBar() {
  const [t, locale] = await Promise.all([getTranslations("topbar"), getLocale()]);

  return (
    <div className="hidden bg-[#0d3743] text-xs text-[#dfe9ec] md:block">
      <div className="container flex h-9 items-center gap-5">
        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <Banknote className="size-3.5" aria-hidden />
          {t("cashOnDelivery")}
        </span>
        {/* Only advertised while the cart threshold is actually switched on. */}
        {FREE_SHIPPING_ENABLED && (
          <span className="hidden items-center gap-1.5 whitespace-nowrap lg:flex">
            <Truck className="size-3.5" aria-hidden />
            {t("freeShipping", contentParams(locale))}
          </span>
        )}

        <nav className="ms-auto flex items-center gap-4">
          <SellOnTallabyLink className={linkClass} />
          <Link href="/help" className={linkClass}>
            {t("helpCenter")}
          </Link>
          <LanguageSwitcher variant="topbar" />
        </nav>
      </div>
    </div>
  );
}
