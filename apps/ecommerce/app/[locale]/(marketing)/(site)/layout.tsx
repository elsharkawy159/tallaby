import { getLocale, getTranslations } from "next-intl/server";
import { VisitorPricesProvider } from "@/components/marketing/pricing/visitor-prices.client";
import { SignupProvider } from "@/components/marketing/signup/signup-dialog.client";
import { JsonLd } from "@/components/marketing/site/json-ld";
import { SiteFooter } from "@/components/marketing/site/site-footer";
import { SiteHeader } from "@/components/marketing/site/site-header.client";
import { WhatsAppButton } from "@/components/marketing/site/whatsapp-button";
import { getMarketingPriceTable } from "@/lib/marketing/exchange-rate.server";
import { siteGraph } from "@/lib/marketing/structured-data.lib";

/** Header, footer, the signup dialog and the visitor-currency prices shared by every marketing page. */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [t, priceTable] = await Promise.all([getTranslations("nav"), getLocale().then(getMarketingPriceTable)]);
  return (
    <VisitorPricesProvider table={priceTable}>
    <SignupProvider>
      <JsonLd data={siteGraph()} />
      <a
        href="#main"
        className="absolute -top-[60px] start-3 z-[200] rounded-[10px] bg-teal-900 px-3.5 py-2 text-white focus:top-3"
      >
        {t("skip")}
      </a>
      <div className="site-fog">
        <SiteHeader />
        <main id="main">{children}</main>
      </div>
      <SiteFooter />
      <WhatsAppButton label={t("whatsapp")} />
    </SignupProvider>
    </VisitorPricesProvider>
  );
}
