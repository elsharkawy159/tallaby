import Image from "next/image";
import { Mail, MapPin } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CONTACT, LOGIN_URL, SOCIAL_LINKS } from "@/lib/marketing/site.lib";
import { BrandIcon, type BrandIconName } from "./brand-icon";
import { FooterClaim } from "./footer-claim.client";
import { Container, Ltr } from "./layout-primitives";

const PAYMENT_BADGES = ["VISA", "Mastercard", "Meeza", "Apple Pay", "Google Pay"];

type FooterLink = { href: string; label: string; external?: boolean };

/**
 * Dark teal like the header and heroes, so every page is bookended. Opens
 * with the store-link claim; links and legal stay quiet underneath.
 */
export async function SiteFooter() {
  const t = await getTranslations("siteFooter");

  const columns: { title: string; links: FooterLink[] }[] = [
    {
      title: t("product"),
      links: [
        { href: "/templates", label: t("templates") },
        { href: "/#builder", label: t("builder") },
        { href: "/pricing", label: t("pricing") },
        { href: "/faq", label: t("faq") },
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
    ...(["instagram", "tiktok", "youtube", "x"] as const).map((id) => ({ id, href: SOCIAL_LINKS[id].href, label: SOCIAL_LINKS[id].label })),
    ...(CONTACT.whatsapp ? [{ id: "whatsapp" as const, href: CONTACT.whatsapp, label: "WhatsApp" }] : []),
  ];

  const link = "text-mist transition-colors hover:text-white hover:no-underline";

  return (
    <footer data-print="hide" className="bg-teal-900 text-sm text-mist">
      <Container className="pt-16 pb-12">
        <div data-footer-claim className="mb-14 border-b border-white/10 pb-12">
          <FooterClaim />
        </div>

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div className="sm:col-span-2 lg:col-span-1">
            <Image src="/logo-white.png" alt="طلبي" width={118} height={30} className="h-[30px] w-auto" />
            <p className="mt-4 max-w-[320px] leading-relaxed">{t("about")}</p>
            <ul className="mt-5 grid gap-2.5 [&_svg]:size-4 [&_svg]:flex-none [&_svg]:text-amber-600">
              <li className="flex items-center gap-2.5">
                <MapPin aria-hidden />
                <span>{t("location")}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail aria-hidden />
                <a href={`mailto:${CONTACT.email}`} className={`font-latin ${link}`}>
                  {CONTACT.email}
                </a>
              </li>
            </ul>
          </div>
          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h2 className="mb-4 text-[15px] font-bold text-white">{col.title}</h2>
              <ul className="grid gap-2.5">
                {col.links.map((item) => (
                  <li key={item.label}>
                    {item.external ? (
                      <a href={item.href} className={link}>
                        {item.label}
                      </a>
                    ) : (
                      <Link href={item.href} className={link}>
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </Container>

      <div className="bg-teal-950">
        <Container className="flex flex-col gap-5 py-6 text-[12.5px] lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="font-latin">{t("rights", { year: new Date().getFullYear() })}</span>
            <Link href="/terms" className={link}>
              {t("terms")}
            </Link>
            <Link href="/privacy" className={link}>
              {t("privacy")}
            </Link>
            <Link href="/privacy#cookies" className={link}>
              {t("cookies")}
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex gap-2" aria-label={t("social")} role="list">
              {socials.map((s) => (
                <a
                  key={s.id}
                  role="listitem"
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="grid size-9 place-items-center rounded-full border border-white/15 text-white transition-colors hover:border-amber-600 hover:bg-amber-600 hover:text-teal-900"
                >
                  <BrandIcon name={s.id} className="size-4" />
                </a>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5" dir="ltr">
              {PAYMENT_BADGES.map((badge) => (
                <span key={badge} className="rounded-md border border-white/10 px-2 py-1 font-latin text-[10px] font-bold text-white/70">
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </Container>
      </div>
    </footer>
  );
}
