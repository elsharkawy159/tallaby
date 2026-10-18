import { getTranslations } from "next-intl/server";
import { SignupProvider } from "@/components/signup/signup-dialog.client";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header.client";
import { WhatsAppButton } from "@/components/site/whatsapp-button";

/** Header, footer and the signup dialog shared by every marketing page. */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("nav");
  return (
    <SignupProvider>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-teal-900"
      >
        {t("skip")}
      </a>
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
      <WhatsAppButton label={t("whatsapp")} />
    </SignupProvider>
  );
}
