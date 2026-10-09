import { getTranslations } from "next-intl/server";
import { cn } from "@workspace/ui/lib/utils";
import { Link } from "@/i18n/navigation";
import type { Storefront } from "@/lib/storefront.server";
import { StoreLogo } from "./store-logo";
import { CartSheet } from "./cart-sheet.client";
import { storefrontFont } from "./storefront-font";
import { StorefrontLanguageSwitcher } from "./storefront-language.client";
import s from "../storefront.module.css";

export async function StorefrontHeader({ store }: { store: Storefront }) {
  const t = await getTranslations("storefront");

  return (
    <header className={s.header}>
      <div className={cn(s.wrap, s.headerRow)}>
        <Link
          href="/"
          className={s.brand}
          aria-label={t("homeLabel", { store: store.displayName })}
        >
          <StoreLogo name={store.displayName} logoUrl={store.logoUrl} />
          <span className="truncate">{store.displayName}</span>
        </Link>
        <StorefrontLanguageSwitcher />
        <CartSheet storeName={store.displayName} fontClassName={storefrontFont.variable} />
      </div>
    </header>
  );
}
