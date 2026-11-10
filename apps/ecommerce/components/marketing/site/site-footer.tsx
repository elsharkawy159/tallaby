import { storeBuilderEnabled } from "@/lib/store-build/intake-request.server";
import Image from "next/image";
import { Mail, MapPin, Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { type PaymentMethod, PaymentMethodIcons } from "@/components/layout/payment-method-icons";
import { CookieSettingsButton } from "@/components/layout/tracking-consent-banner.client";
import { isCompareHubPublic } from "@/lib/marketing/compare.lib";
import { footerSolutionLinks } from "@/lib/marketing/content-routes.lib";
import { CONTACT, DASHBOARD_URL, LOGIN_URL, SOCIAL_LINKS } from "@/lib/marketing/site.lib";
import { BrandIcon, type BrandIconName } from "./brand-icon";
import { Container } from "./layout-primitives";

const PAYMENT_METHODS: PaymentMethod[] = ["visa", "mastercard", "meeza", "apple-pay", "google-pay"];

type FooterLink = { href: string; label: string; external?: boolean };

/**
 * Two tiers: the link grid, then a darker bar with the legal links, social
 * buttons and payment marks.
 */
export async function SiteFooter() {
  const [t, tm] = await Promise.all([getTranslations("siteFooter"), getTranslations("meta")]);

  const columns: { title: string; links: FooterLink[] }[] = [
    {
      title: t("product"),
      links: [
        { href: "/templates", label: t("templates") },
        { href: "/#builder", label: t("builder") },
        { href: "/pricing", label: t("pricing") },
        { href: "/integrations", label: t("integrations") },
        // Off until the owner decides about naming competitors (lib/marketing/compare.lib.ts).
        ...(isCompareHubPublic() ? [{ href: "/compare", label: t("compare") }] : []),
        // The AI Store Builder's entry (F-54): signup, then the chat. Hidden behind its switch.
        ...(storeBuilderEnabled() ? [{ href: `${DASHBOARD_URL}signup?next=/ai-builder`, label: t("aiBuilder"), external: true }] : []),
        { href: "/affiliates", label: t("affiliates") },
        { href: "/faq", label: t("faq") },
      ],
    },
    // Built from the page lists, so a new solution, industry, feature or tool page appears here by itself.
    {
      title: t("solutions"),
      links: [
        ...footerSolutionLinks().map((page) => ({ href: page.href, label: tm(`${page.metaKey}.title`) })),
        { href: "/solutions", label: t("allSolutions") },
        { href: "/features", label: t("allFeatures") },
      ],
    },
    {
      title: t("company"),
      links: [
        { href: "/about", label: t("aboutUs") },
        { href: "/blog", label: t("blog") },
        { href: "/careers", label: t("careers") },
        { href: "/contact", label: t("contactUs") },
      ],
    },
    {
      title: t("support"),
      links: [
        { href: "/faq", label: t("helpCenter") },
        { href: "/faq#payments", label: t("paymentMethods") },
        { href: "/faq#shipping", label: t("shippingInfo") },
        { href: "/faq#domain", label: t("connectDomain") },
        { href: LOGIN_URL, label: t("sellerLogin"), external: true },
      ],
    },
  ];

  const socials: { id: BrandIconName; href: string; label: string }[] = [
    ...(["facebook", "instagram", "tiktok", "youtube", "x", "threads", "linkedin"] as const).map((id) => ({ id, href: SOCIAL_LINKS[id].href, label: SOCIAL_LINKS[id].label })),
    ...(CONTACT.whatsapp ? [{ id: "whatsapp" as const, href: CONTACT.whatsapp, label: "WhatsApp" }] : []),
  ];

  const link = "text-ink-on-dark transition-colors duration-150 hover:text-amber-600 hover:no-underline";
  // Phones: each link gets a 40px-tall row so it is easy to tap.
  const tap = "max-[860px]:inline-flex max-[860px]:min-h-10 max-[860px]:items-center";

  return (
    <footer data-print="hide" className="text-sm text-ink-on-dark">
      <div className="bg-footer-top pt-14 pb-12">
        <Container className="grid grid-cols-2 gap-x-6 gap-y-8 min-[861px]:grid-cols-[1.3fr_1fr_1.15fr_1fr_1fr] min-[861px]:gap-10">
          <div className="col-span-2 min-[861px]:col-span-1">
            <Image src="/logo-white.png" alt="طلبي" width={118} height={30} className="mb-[18px] block h-[30px] w-auto" />
            <p className="max-w-[330px] leading-[1.85] text-[#d5e2e5]">{t("about")}</p>
            <ul className="mt-5 grid gap-3 max-[860px]:gap-0 [&_svg]:size-[17px] [&_svg]:flex-none [&_svg]:text-amber-600">
              <li className="flex items-center gap-2.5">
                <MapPin aria-hidden />
                <span>{t("location")}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail aria-hidden />
                <a href={`mailto:${CONTACT.email}`} dir="ltr" className={`font-latin ${link} ${tap}`}>
                  {CONTACT.email}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone aria-hidden />
                <a href={`tel:${CONTACT.phoneTel}`} dir="ltr" className={`font-latin tabular-nums ${link} ${tap}`}>
                  {CONTACT.phone}
                </a>
              </li>
            </ul>
          </div>
          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h2 className="mb-4 text-base font-bold text-white">{col.title}</h2>
              <ul className="grid gap-2.5 max-[860px]:gap-0">
                {col.links.map((item) => (
                  <li key={item.label}>
                    {item.external ? (
                      <a href={item.href} className={`${link} ${tap}`}>
                        {item.label}
                      </a>
                    ) : (
                      <Link href={item.href} className={`${link} ${tap}`}>
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </Container>
      </div>

      <div className="bg-footer-bar py-[22px]">
        <Container className="flex flex-col items-start justify-between gap-6 min-[861px]:flex-row min-[861px]:items-center">
          <div className="flex flex-col gap-1.5 text-[13px] max-[860px]:gap-0">
            <div className="flex flex-wrap items-center gap-x-[22px] gap-y-1.5 max-[860px]:gap-y-0">
              <span className="font-latin">{t("rights", { year: new Date().getFullYear() })}</span>
              <Link href="/terms" className={`${link} ${tap}`}>
                {t("terms")}
              </Link>
              <Link href="/privacy" className={`${link} ${tap}`}>
                {t("privacy")}
              </Link>
            </div>
            <Link href="/privacy#cookies" className={`w-fit ${link} ${tap}`}>
              {t("cookies")}
            </Link>
            <CookieSettingsButton className={`${link} ${tap}`} />
          </div>
          <div className="flex flex-col items-start gap-3.5 min-[861px]:items-end">
            <div className="flex flex-wrap gap-2" aria-label={t("social")} role="list">
              {socials.map((s) => (
                <a
                  key={s.id}
                  role="listitem"
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="grid size-[38px] place-items-center max-[860px]:size-10 rounded-full border border-white/15 text-white transition-colors duration-150 hover:border-amber-600 hover:bg-amber-600 hover:text-teal-900"
                >
                  <BrandIcon name={s.id} className="size-[17px]" />
                </a>
              ))}
            </div>
            <div dir="ltr" aria-label={t("paymentMethods")} role="group">
              <PaymentMethodIcons methods={PAYMENT_METHODS} className="gap-1.5" iconClassName="h-[30px]" />
            </div>
          </div>
        </Container>
      </div>
    </footer>
  );
}
