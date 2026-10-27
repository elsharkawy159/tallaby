import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { BrandIcon } from "@/components/marketing/site/brand-icon";
import { ForwardArrow } from "@/components/marketing/site/direction-icons";
import { richTags } from "@/components/marketing/site/rich-text";
import { Link } from "@/i18n/navigation";
import { SOCIAL_LINKS, type SocialId } from "@/lib/marketing/site.lib";
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
    "group flex min-h-[52px] items-center justify-between gap-3 rounded-full px-[22px] py-4 text-[15px] font-bold transition-[transform,background-color,box-shadow] hover:no-underline active:scale-[0.98]";

  return (
    <div className="relative grid min-h-dvh place-items-start justify-center overflow-x-hidden bg-teal-700 px-4 py-10 text-white sm:place-items-center sm:px-5 sm:py-12">
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-[radial-gradient(rgba(255,255,255,0.07)_1.2px,transparent_1.2px)] bg-size-[22px_22px]" />
      <div aria-hidden className="pointer-events-none fixed -right-[200px] -bottom-[200px] size-[420px] rounded-full bg-teal-800 opacity-70 sm:-right-[220px] sm:-bottom-[260px] sm:size-[620px]" />

      <main className="relative z-[1] flex w-full max-w-[440px] flex-col items-center text-center">
        <Image src="/logo-white.png" alt="Tallaby" width={200} height={51} priority className="mb-7 h-auto w-40 sm:mb-9 sm:w-[200px]" />
        <h1 className="display-tight text-2xl leading-[1.2] font-extrabold sm:text-[28px]">{t.rich("title", richTags)}</h1>
        <p className="mt-2.5 max-w-[340px] text-sm leading-[1.55] text-pretty text-teal-100 sm:mt-3 sm:text-[15px]">{t("sub")}</p>

        {/* Rows of 3 (2 on the narrowest phones); a short last row sits in the middle. */}
        <nav aria-label={t("social")} className="mt-7 flex w-full flex-wrap justify-center gap-2.5 sm:mt-9 sm:gap-3">
          {ORDER.map((id) => {
            const s = SOCIAL_LINKS[id];
            return (
              <a
                key={id}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex min-w-0 basis-[calc((100%-0.625rem)/2)] flex-col items-center gap-2 rounded-[14px] min-[341px]:basis-[calc((100%-1.25rem)/3)] sm:basis-[calc((100%-1.5rem)/3)] border border-white/10 bg-white/5 px-1.5 pt-4 pb-3.5 transition-[transform,background-color,border-color] duration-200 hover:no-underline active:scale-[0.96] sm:gap-2.5 sm:rounded-2xl sm:px-2 sm:pt-5 sm:pb-4 [@media(hover:hover)]:hover:-translate-y-1 [@media(hover:hover)]:hover:border-amber-600 [@media(hover:hover)]:hover:bg-white/10"
              >
                <span className="grid size-11 place-items-center rounded-xl bg-white text-teal-700 transition-[transform,background-color] duration-200 sm:size-12 sm:rounded-[14px] [@media(hover:hover)]:group-hover:-rotate-6 [@media(hover:hover)]:group-hover:bg-amber-600">
                  <BrandIcon name={id} className="size-[22px]" />
                </span>
                <b className="text-[13px] font-semibold sm:text-sm">{s.label}</b>
                <small dir="ltr" className="max-w-full truncate text-[10.5px] font-medium text-teal-100 sm:text-[11px]">
                  {s.handle}
                </small>
              </a>
            );
          })}
        </nav>

        <div className="mt-7 mb-4 flex w-full items-center gap-3 text-xs font-semibold tracking-[0.12em] text-teal-300 uppercase before:h-px before:flex-1 before:bg-white/15 before:content-[''] after:h-px after:flex-1 after:bg-white/15 after:content-[''] sm:mt-8 sm:mb-5">
          {t("visit")}
        </div>
        <div className="flex w-full flex-col gap-2.5">
          <Link href="/" className={`${btn} bg-amber-600 text-neutral-900 hover:bg-amber-500 hover:text-neutral-900 hover:shadow-[0_10px_24px_rgba(253,173,40,0.3)]`}>
            <span>{t("sell")}</span>
            <ForwardArrow className="size-[18px] transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
          </Link>
        </div>
      </main>
    </div>
  );
}
