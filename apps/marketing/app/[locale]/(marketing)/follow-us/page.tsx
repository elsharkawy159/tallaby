import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { BrandIcon } from "@/components/marketing/site/brand-icon";
import { ForwardArrow } from "@/components/marketing/site/direction-icons";
import { richTags } from "@/components/marketing/site/rich-text";
import { Link } from "@/i18n/navigation";
import { SOCIAL_LINKS, type SocialId } from "@/lib/marketing/site.lib";
import { TALLABY_SOCIAL_LINKS } from "@/lib/social-links";
import { pageMetadata } from "@/lib/marketing/metadata.lib";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ locale, page: "followUs", path: "/follow-us" });
}

const ORDER: SocialId[] = ["facebook", "instagram", "tiktok", "youtube", "x", "linkedin", "threads", "pinterest"];

/** Link-in-bio page for social profiles. No site header or footer. */
export default async function FollowUsPage() {
  const t = await getTranslations("followUs");
  const btn =
    "group flex min-h-[54px] items-center justify-between gap-3 rounded-full px-6 py-4 text-[15px] font-bold transition-[transform,background-color,box-shadow] hover:no-underline active:scale-[0.98]";

  return (
    <div className="site-fog grid min-h-dvh place-items-start justify-center overflow-x-hidden px-4 py-10 text-ink-700 sm:place-items-center sm:px-5 sm:py-12">
      <main className="relative z-[1] flex w-full max-w-[440px] flex-col items-center text-center">
        <Image src="/logo-primary.png" alt="Tallaby" width={180} height={46} priority className="mb-7 h-auto w-[150px] sm:mb-8 sm:w-[180px]" />
        <h1 className="text-2xl leading-[1.25] font-bold text-balance text-teal-900 sm:text-[28px] [&_em]:text-amber-700 [&_em]:not-italic">{t.rich("title", richTags)}</h1>
        <p className="mt-2.5 max-w-[340px] text-sm leading-[1.6] text-pretty text-ink-500 sm:mt-3 sm:text-[15px]">{t("sub")}</p>

        {/* Rows of 3 (2 on the narrowest phones); a short last row sits in the middle. */}
        <nav aria-label={t("social")} className="mt-7 flex w-full flex-wrap justify-center gap-2.5 sm:mt-9 sm:gap-3">
          {ORDER.map((id) => {
            const s = SOCIAL_LINKS[id];
            return (
              <a
                key={id}
                href={TALLABY_SOCIAL_LINKS[id]}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex min-w-0 basis-[calc((100%-0.625rem)/2)] flex-col items-center gap-2 rounded-[20px] min-[341px]:basis-[calc((100%-1.25rem)/3)] sm:basis-[calc((100%-1.5rem)/3)] border border-line bg-surface-glass px-1.5 pt-4 pb-3.5 shadow-[0_10px_28px_rgba(13,55,67,0.06)] transition-[transform,box-shadow,border-color] duration-200 hover:no-underline active:scale-[0.96] active:border-amber-600 sm:gap-2.5 sm:rounded-card sm:px-2 sm:pt-5 sm:pb-4 [@media(hover:hover)]:hover:-translate-y-[3px] [@media(hover:hover)]:hover:border-teal-300 [@media(hover:hover)]:hover:shadow-[0_18px_40px_rgba(13,55,67,0.1)]"
              >
                <span className="grid size-11 place-items-center rounded-xl bg-teal-50 text-teal-700 transition-[transform,background-color] duration-200 sm:size-12 sm:rounded-[14px] [@media(hover:hover)]:group-hover:-rotate-6 [@media(hover:hover)]:group-hover:bg-amber-600">
                  <BrandIcon name={id} className="size-[22px]" />
                </span>
                <b className="text-[13px] font-bold text-teal-900 sm:text-sm">{s.label}</b>
                <small dir="ltr" className="max-w-full truncate text-[10.5px] font-medium text-ink-400 sm:text-[11px]">
                  {s.handle}
                </small>
              </a>
            );
          })}
        </nav>

        <div className="mt-7 mb-4 flex w-full items-center gap-3 text-xs font-bold text-ink-400 en:tracking-[0.1em] en:uppercase before:h-px before:flex-1 before:bg-line before:content-[''] after:h-px after:flex-1 after:bg-line after:content-[''] sm:mt-8 sm:mb-5">
          {t("visit")}
        </div>
        <div className="flex w-full flex-col gap-2.5">
          <Link href="/" className={`${btn} bg-amber-600 text-teal-900 shadow-cta hover:bg-amber-700 hover:text-teal-900 hover:shadow-cta-hover`}>
            <span>{t("sell")}</span>
            <ForwardArrow className="size-[18px] transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
          </Link>
        </div>
      </main>
    </div>
  );
}
