import type { Metadata, Viewport } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import type { SimpleIcon } from "simple-icons";
import {
  siFacebook,
  siInstagram,
  siPinterest,
  siThreads,
  siTiktok,
  siX,
  siYoutube,
} from "simple-icons";
import { Link } from "@/i18n/navigation";
import { SimpleBrandIcon } from "@/components/layout/social-brand-icons";
import { BASE_URL } from "@/lib/constants";
import { TALLABY_SOCIAL_LINKS } from "@/lib/social-links";
import {
  generateStaticPageMetadata,
  localizedUrl,
  type SeoLocale,
} from "@/lib/metadata";

const PATH = "/follow-us";

type SocialChannel = {
  network: string;
  handle: string;
  href: string;
  icon: SimpleIcon;
};

const CHANNELS: SocialChannel[] = [
  { network: "Instagram", handle: "@usetallaby", href: TALLABY_SOCIAL_LINKS.instagram, icon: siInstagram },
  { network: "TikTok", handle: "@tallaby_", href: TALLABY_SOCIAL_LINKS.tiktok, icon: siTiktok },
  { network: "YouTube", handle: "@usetallaby", href: TALLABY_SOCIAL_LINKS.youtube, icon: siYoutube },
  { network: "Facebook", handle: "usetallaby", href: TALLABY_SOCIAL_LINKS.facebook, icon: siFacebook },
  { network: "X", handle: "@usetallaby", href: TALLABY_SOCIAL_LINKS.x, icon: siX },
  { network: "Threads", handle: "@usetallaby", href: TALLABY_SOCIAL_LINKS.threads, icon: siThreads },
  { network: "Pinterest", handle: "tallabycommerce", href: TALLABY_SOCIAL_LINKS.pinterest, icon: siPinterest },
];

// Brand teal, fixed rather than `--primary` so the page keeps its look in dark mode.
export const viewport: Viewport = {
  themeColor: "#145163",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.followUs" });

  return {
    ...generateStaticPageMetadata({
      locale: locale as SeoLocale,
      path: PATH,
      title: t("title"),
      description: t("description"),
    }),
    keywords: [
      "Tallaby",
      "Tallaby social media",
      ...CHANNELS.map((channel) => `Tallaby ${channel.network}`),
      "promotions",
      "discounts",
    ],
  };
}

export default async function FollowUsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.followUs" });
  const pageUrl = localizedUrl(locale as SeoLocale, PATH);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": pageUrl,
    url: pageUrl,
    name: t("title"),
    description: t("description"),
    inLanguage: locale,
    mainEntity: {
      "@type": "Organization",
      name: "Tallaby.com",
      url: BASE_URL,
      logo: `${BASE_URL}/logo.png`,
      sameAs: CHANNELS.map((channel) => channel.href),
    },
  };

  return (
    <div className="relative isolate flex min-h-svh justify-center overflow-x-hidden bg-[#145163] px-4 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] text-white sm:items-center sm:px-5 sm:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Dot grid + corner disc backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[radial-gradient(rgba(255,255,255,.07)_1.2px,transparent_1.2px)] bg-size-[22px_22px]"
      >
        <div className="absolute -end-50 -bottom-50 size-105 rounded-full bg-[#0f4555] opacity-70 sm:-end-55 sm:-bottom-65 sm:size-155" />
      </div>

      <main className="flex w-full max-w-110 flex-col items-center text-center">
        <Link href="/" aria-label="Tallaby.com" className="mb-7 sm:mb-9">
          <Image
            src="/logo.white.png"
            alt="Tallaby"
            width={3184}
            height={810}
            fetchPriority="high"
            loading="eager"
            sizes="(max-width: 520px) 160px, 200px"
            className="h-auto w-40 sm:w-50"
          />
        </Link>

        <h1 className="text-[22px] leading-tight font-extrabold tracking-[-0.01em] text-balance text-white min-[341px]:text-2xl sm:text-[28px]">
          {t.rich("heading", {
            hl: (chunks) => <span className="text-[#fdad28]">{chunks}</span>,
          })}
        </h1>
        <p className="mt-2.5 max-w-85 text-sm leading-relaxed text-pretty text-[#cfdde1] sm:mt-3 sm:text-[15px]">
          {t("subtitle")}
        </p>

        <nav aria-label={t("socialNavLabel")} className="mt-7 w-full sm:mt-9">
          <ul className="flex flex-wrap justify-center gap-2.5 sm:gap-3">
            {CHANNELS.map((channel) => (
              <li
                key={channel.network}
                className="w-[calc((100%-0.625rem)/2)] min-[341px]:w-[calc((100%-1.25rem)/3)] sm:w-[calc((100%-1.5rem)/3)]"
              >
                <a
                  href={channel.href}
                  target="_blank"
                  rel="noopener noreferrer me"
                  aria-label={`${t("followOn", { network: channel.network })} ${t("opensInNewTab")}`}
                  className="group flex h-full flex-col items-center gap-2 rounded-[14px] border border-white/12 bg-white/6 px-1.5 pt-4 pb-3.5 transition-[transform,background-color,border-color] duration-200 hover:-translate-y-1 hover:border-[#fdad28] hover:bg-white/12 focus-visible:border-[#fdad28] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fdad28] active:scale-96 active:border-[#fdad28] active:bg-white/12 sm:gap-2.5 sm:rounded-2xl sm:px-2 sm:pt-5 sm:pb-4"
                >
                  <span className="grid size-11 place-items-center rounded-xl bg-white text-[#145163] transition-[transform,background-color] duration-200 group-hover:-rotate-6 group-hover:bg-[#fdad28] sm:size-12 sm:rounded-[14px]">
                    <SimpleBrandIcon icon={channel.icon} className="size-5.5" />
                  </span>
                  <span className="text-[13px] font-semibold sm:text-sm">
                    {channel.network}
                  </span>
                  <span
                    dir="ltr"
                    className="max-w-full truncate text-[10.5px] font-medium text-[#cfdde1] sm:text-[11px]"
                  >
                    {channel.handle}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-7 mb-4 flex w-full items-center gap-3 text-xs font-semibold tracking-[0.12em] text-[#89a8b1] uppercase before:h-px before:flex-1 before:bg-white/15 after:h-px after:flex-1 after:bg-white/15 sm:mt-8 sm:mb-5">
          {t("visitTallaby")}
        </div>

        <div className="flex w-full flex-col gap-2.5">
          <Link
            href="/"
            className="group flex min-h-13 items-center justify-between gap-3 rounded-full border-[1.5px] border-white/35 px-5 py-3.5 text-[15px] font-bold text-white transition-[transform,background-color,color] duration-200 hover:bg-white hover:text-[#145163] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fdad28] active:scale-98 sm:px-5.5 sm:py-4"
          >
            <span>{t("shopCta")}</span>
            <ArrowRight
              aria-hidden="true"
              className="size-4.5 transition-transform duration-200 group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1"
            />
          </Link>
          <Link
            href="/sell"
            className="group flex min-h-13 items-center justify-between gap-3 rounded-full bg-[#fdad28] px-5 py-3.5 text-[15px] font-bold text-neutral-900 transition-[transform,background-color,box-shadow] duration-200 hover:bg-[#ffb43d] hover:shadow-[0_10px_24px_rgba(253,173,40,.3)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-98 sm:px-5.5 sm:py-4"
          >
            <span>{t("sellCta")}</span>
            <ArrowRight
              aria-hidden="true"
              className="size-4.5 transition-transform duration-200 group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1"
            />
          </Link>
        </div>
      </main>
    </div>
  );
}
