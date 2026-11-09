import Image from "next/image";
import { Award, Check, ChevronDown, List, RefreshCw, Star, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BidiText, ClosingCta, faqSchema } from "@/components/marketing/pages/content-blocks";
import { Breadcrumb } from "@/components/marketing/site/breadcrumb";
import { BrandIcon } from "@/components/marketing/site/brand-icon";
import { ForwardArrow } from "@/components/marketing/site/direction-icons";
import { FaqAccordion } from "@/components/marketing/site/faq-accordion";
import { JsonLd } from "@/components/marketing/site/json-ld";
import { Container } from "@/components/marketing/site/layout-primitives";
import { SignupTrigger } from "@/components/marketing/signup/signup-trigger.client";
import { formatLongDate } from "@/lib/marketing/format.lib";
import { rankingItemList, rankingToc, type RankingArticle, type RankingItem } from "@/lib/marketing/ranking.lib";
import { localizedUrl } from "@/lib/marketing/seo.lib";
import { cn } from "@workspace/ui/lib/utils";
import { CopyLinkButton, RankingToc, ReadingProgress, SummaryRow } from "./ranking-tools.client";

const H2 = "mt-[52px] mb-[18px] scroll-mt-[100px] text-[28px] leading-[1.35] font-bold text-teal-900 first:mt-0";
const pad = (rank: number) => String(rank).padStart(2, "0");

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap" aria-label={`${rating.toFixed(1)} / 5`}>
      <span className="relative hidden leading-none sm:inline-flex" aria-hidden>
        <span className="flex gap-px text-[#dfe5e6]">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} className="size-[15px] fill-current stroke-0" />
          ))}
        </span>
        <span className="absolute inset-y-0 start-0 flex gap-px overflow-hidden text-amber-600" style={{ width: `${(rating / 5) * 100}%` }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} className="size-[15px] flex-none fill-current stroke-0" />
          ))}
        </span>
      </span>
      <b className="font-latin text-sm text-teal-900">{rating.toFixed(1)}</b>
    </span>
  );
}

async function ItemCard({ item, rank }: { item: RankingItem; rank: number }) {
  const t = await getTranslations("blogRanking");
  return (
    <article
      id={item.id}
      className={cn(
        "relative scroll-mt-[100px] rounded-[26px] border border-[#e3ebed] bg-white p-5 text-base leading-[1.8] sm:p-[26px]",
        item.pick && "border-2 border-amber-600 pt-[30px] shadow-[0_22px_50px_rgba(253,173,40,0.16)] sm:pt-[34px]",
      )}
    >
      {item.pick ? (
        <span className="absolute start-6 -top-3.5 inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-3.5 py-[3px] text-[13px] font-bold text-teal-900">
          <Award className="size-3.5" aria-hidden />
          {t("ourPick")}
        </span>
      ) : null}
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 min-[601px]:grid-cols-[auto_minmax(0,1fr)_auto]">
        <span
          className={cn(
            "relative grid size-[54px] place-items-center rounded-[15px] bg-[#f1f4f5] font-latin text-[22px] font-extrabold text-teal-900 sm:size-16 sm:rounded-[18px] sm:text-[26px]",
            item.pick && "bg-amber-600",
          )}
        >
          <small className="absolute start-2 top-1.5 text-[11px] opacity-60">#</small>
          {pad(rank)}
        </span>
        <div className="min-w-0">
          <h3 className="flex flex-wrap items-center gap-2.5 text-[19px] leading-[1.35] font-bold text-teal-900 sm:text-[22px]">
            {item.logo ? <Image src={item.logo} alt={item.name} width={102} height={26} className="h-[26px] w-auto" /> : item.name}
          </h3>
          {item.rating !== undefined ? <Stars rating={item.rating} /> : null}
        </div>
        {item.bestFor ? (
          <span className={cn("col-span-full justify-self-start rounded-full border border-[#dbe8eb] bg-teal-50 px-3 py-[3px] text-[13px] leading-normal font-semibold text-teal-700 min-[601px]:col-span-1 min-[601px]:max-w-[220px] min-[601px]:text-center", item.pick && "border-amber-100 bg-amber-50 text-[#7a4a00]")}>
            {t("bestFor")} <BidiText text={item.bestFor} />
          </span>
        ) : null}
      </div>
      {item.description ? (
        <p className="mt-4 mb-[18px] text-pretty text-[#3d5055]">
          <BidiText text={item.description} />
        </p>
      ) : null}
      {item.pros?.length || item.cons?.length ? (
        <div className="grid gap-3.5 min-[601px]:grid-cols-2">
          {item.pros?.length ? (
            <div className="rounded-2xl bg-[#f1faf4] px-4 py-3.5">
              <h4 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-[#15803d]">
                <ThumbsUp className="size-4" aria-hidden />
                {t("pros")}
              </h4>
              <ul className="grid gap-2 text-[14.5px] leading-[1.6] text-ink-700">
                {item.pros.map((pro) => (
                  <li key={pro} className="grid grid-cols-[18px_1fr] gap-2">
                    <Check className="mt-1 size-4 stroke-[2.4] text-[#16a34a]" aria-hidden />
                    <span>
                      <BidiText text={pro} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {item.cons?.length ? (
            <div className="rounded-2xl bg-[#fdf3f2] px-4 py-3.5">
              <h4 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-[#b42318]">
                <ThumbsDown className="size-4" aria-hidden />
                {t("cons")}
              </h4>
              <ul className="grid gap-2 text-[14.5px] leading-[1.6] text-ink-700">
                {item.cons.map((con) => (
                  <li key={con} className="grid grid-cols-[18px_1fr] gap-2">
                    <X className="mt-1 size-4 stroke-[2.4] text-[#dc2626]" aria-hidden />
                    <span>
                      <BidiText text={con} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
      {item.price || item.pick || item.compareHref ? (
        <div className="mt-[18px] flex flex-wrap items-center justify-between gap-3.5 border-t border-[#edf1f2] pt-4">
          {item.price ? (
            <div>
              <small className="block text-[12.5px] text-ink-400">{t("startingPrice")}</small>
              <b className="text-base text-teal-900">
                <BidiText text={item.price} />
              </b>
            </div>
          ) : (
            <span />
          )}
          {item.pick ? (
            <SignupTrigger>{t("createStore")}</SignupTrigger>
          ) : item.compareHref ? (
            <Link href={item.compareHref} className="inline-flex items-center gap-1.5 text-[15px] font-bold text-teal-700">
              {t("readComparison")}
              <ForwardArrow />
            </Link>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

/**
 * The "best X" list article layout. Unrouted until there's real content: a
 * future /blog/ranking/[slug] page only has to pass a RankingArticle. Columns
 * and blocks with no data are left out, so nothing unverified is ever shown.
 */
export async function RankingArticleView({ article }: { article: RankingArticle }) {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("blogRanking")]);
  const url = localizedUrl(locale, `/blog/ranking/${article.slug}`);
  const toc = rankingToc(article, { summary: t("summaryTitle"), method: t("methodTitle"), choose: t("chooseTitle"), faq: t("faqTitle") });
  const hasBestFor = article.items.some((item) => item.bestFor);
  const hasPrice = article.items.some((item) => item.price);
  const hasRating = article.items.some((item) => item.rating !== undefined);
  const share = [
    { name: "facebook", label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
    { name: "linkedin", label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
    { name: "whatsapp", label: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(url)}` },
  ] as const;

  return (
    <>
      <JsonLd data={rankingItemList(article, url)} />
      <JsonLd data={faqSchema(article.faq)} />
      <ReadingProgress articleId="ranking-article" />

      <div className="pt-10 text-ink-700">
        <Container>
          <Breadcrumb items={[{ label: t("crumb"), href: "/blog" }, { label: article.title }]} className="mb-[26px]" />
          <h1 className="max-w-[900px] text-[clamp(30px,4.4vw,52px)] leading-[1.35] font-bold text-balance text-teal-900 en:leading-[1.15]">{article.title}</h1>
          <div className="my-[26px] flex flex-wrap items-center gap-3 text-sm text-ink-400">
            <Image src="/logo-mark.png" alt="" width={40} height={40} className="size-10 rounded-xl" />
            <div>
              <b className="block text-teal-900">{article.author}</b>
              <span>{t("published", { date: formatLongDate(article.publishedAt, locale) })}</span>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-0.5 text-[13px] font-semibold text-teal-700">
              <RefreshCw className="size-3.5" aria-hidden />
              {t("updated", { date: formatLongDate(article.updatedAt, locale) })}
            </span>
            <span>{t("minutes", { count: String(article.readMinutes) })}</span>
          </div>
          {article.cover ? (
            <div className="relative h-[clamp(220px,36vw,440px)] overflow-hidden rounded-[20px] shadow-[0_24px_60px_rgba(13,55,67,0.14)] sm:rounded-card-lg">
              <Image src={article.cover} alt={article.title} fill sizes="(min-width: 1200px) 1160px, 100vw" className="object-cover" priority />
            </div>
          ) : null}
        </Container>
      </div>

      <Container className="grid gap-14 pt-8 pb-20 min-[821px]:grid-cols-[minmax(0,1fr)_220px] min-[821px]:pt-14 min-[1101px]:grid-cols-[200px_minmax(0,700px)_1fr]">
        <aside className="order-3 flex flex-wrap items-center gap-2 self-start min-[821px]:col-span-full min-[1101px]:sticky min-[1101px]:top-[110px] min-[1101px]:order-none min-[1101px]:col-span-1 min-[1101px]:grid min-[1101px]:justify-items-start">
          <small className="text-xs font-semibold text-neutral-500 min-[1101px]:mb-1">{t("share")}</small>
          {share.map((item) => (
            <a key={item.name} href={item.href} target="_blank" rel="noopener noreferrer" aria-label={item.label} className="grid size-10 place-items-center rounded-full border border-[#dfe8ea] bg-white text-teal-700 hover:bg-teal-50">
              <BrandIcon name={item.name} className="size-4" />
            </a>
          ))}
          <CopyLinkButton url={url} label={t("copyLink")} doneLabel={t("copied")} />
        </aside>

        <article id="ranking-article" className="min-w-0 text-[17px] leading-[1.95] text-[#2a3a3f] min-[821px]:text-lg">
          <details className="group mb-7 rounded-[18px] border border-[#e3ebed] bg-white min-[821px]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between px-[18px] py-3.5 text-[15px] font-bold text-teal-900 [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-2">
                <List className="size-[18px]" aria-hidden />
                {t("contents")}
              </span>
              <ChevronDown className="size-[18px] transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none" aria-hidden />
            </summary>
            <nav className="grid px-[18px] pb-3.5 text-[14.5px] leading-normal">
              {toc.map((entry) => (
                <a key={entry.id} href={`#${entry.id}`} className={cn("border-t border-[#f0f3f4] py-2 text-ink-700", "rank" in entry && "ps-4 text-[13.5px] text-ink-500")}>
                  {entry.title}
                </a>
              ))}
            </nav>
          </details>

          <p className="mb-[22px] text-pretty first-letter:float-start first-letter:me-3 first-letter:mt-1.5 first-letter:font-latin first-letter:text-[64px] first-letter:leading-none first-letter:font-extrabold first-letter:text-amber-600">
            <BidiText text={article.intro} />
          </p>

          <h2 id="summary" className={H2}>
            {t("summaryTitle")}
          </h2>
          <p className="mb-2 text-[13px] text-ink-400">{t("summaryHint")}</p>
          <div className="mb-3 overflow-x-auto rounded-[22px] border border-[#e3ebed] bg-white shadow-[0_14px_36px_rgba(13,55,67,0.05)]">
            <table className="w-full border-collapse text-[13.5px] leading-[1.6] sm:text-[14.5px]">
              <thead>
                <tr className="bg-[#f6fafb] text-[13px] font-semibold whitespace-nowrap text-ink-500 [&_th]:p-2.5 [&_th]:text-start sm:[&_th]:px-3.5 sm:[&_th]:py-3">
                  <th>{t("columns.rank")}</th>
                  <th>{t("columns.platform")}</th>
                  {hasBestFor ? <th className="hidden min-[821px]:table-cell">{t("columns.bestFor")}</th> : null}
                  {hasPrice ? <th>{t("columns.price")}</th> : null}
                  {hasRating ? <th>{t("columns.rating")}</th> : null}
                </tr>
              </thead>
              <tbody>
                {article.items.map((item, i) => (
                  <SummaryRow key={item.id} target={item.id} highlighted={item.pick}>
                    <td className={cn("w-11 border-t border-[#edf1f2] p-2.5 font-latin text-[15px] font-extrabold text-teal-700 sm:px-3.5 sm:py-3", item.pick && "text-amber-700")}>{pad(i + 1)}</td>
                    <td className="border-t border-[#edf1f2] p-2.5 sm:px-3.5 sm:py-3">
                      <a href={`#${item.id}`} className="font-bold text-teal-900">
                        {item.name}
                      </a>
                    </td>
                    {hasBestFor ? <td className="hidden border-t border-[#edf1f2] p-2.5 text-[#4d5f64] sm:px-3.5 sm:py-3 min-[821px]:table-cell">{item.bestFor ? <BidiText text={item.bestFor} /> : null}</td> : null}
                    {hasPrice ? <td className="border-t border-[#edf1f2] p-2.5 whitespace-nowrap sm:px-3.5 sm:py-3">{item.price ? <BidiText text={item.price} /> : null}</td> : null}
                    {hasRating ? <td className="border-t border-[#edf1f2] p-2.5 sm:px-3.5 sm:py-3">{item.rating !== undefined ? <Stars rating={item.rating} /> : null}</td> : null}
                  </SummaryRow>
                ))}
              </tbody>
            </table>
          </div>

          <h2 id="method" className={H2}>
            {t("methodTitle")}
          </h2>
          <div className="rounded-card border border-[#dbe8eb] bg-teal-50 p-[26px]">
            <p className="mb-[18px] text-base text-pretty text-[#3d5055]">
              <BidiText text={article.method} />
            </p>
            <ul className="grid grid-cols-2 gap-2.5 min-[601px]:grid-cols-3 min-[1101px]:grid-cols-5">
              {article.criteria.map(({ icon: Icon, title, body }) => (
                <li key={title} className="grid justify-items-start gap-2 rounded-2xl bg-white px-3 py-3.5 text-sm leading-normal text-ink-700">
                  <span className="grid size-9 place-items-center rounded-[11px] bg-teal-700 text-white">
                    <Icon className="size-[17px]" aria-hidden />
                  </span>
                  <b className="text-[14.5px] text-teal-900">{title}</b>
                  <BidiText text={body} />
                </li>
              ))}
            </ul>
          </div>

          <h2 id="list" className={H2}>
            {article.listTitle}
          </h2>
          <div className="grid gap-5">
            {article.items.map((item, i) => (
              <div key={item.id} className="contents">
                <ItemCard item={item} rank={i + 1} />
                {i + 1 === article.ctaAfter ? (
                  <aside className="cta-glow relative flex flex-wrap items-center justify-between gap-5 overflow-hidden rounded-[26px] bg-teal-900 p-7">
                    <div className="relative">
                      <b className="block text-xl leading-normal text-white">{t("midTitle")}</b>
                      <span className="text-[15px] text-ink-on-dark">{t("midBody")}</span>
                    </div>
                    <SignupTrigger className="relative">{t("midCta")}</SignupTrigger>
                  </aside>
                ) : null}
              </div>
            ))}
          </div>

          <h2 id="choose" className={H2}>
            {t("chooseTitle")}
          </h2>
          <p className="mb-[22px] text-pretty">{article.chooseLead}</p>
          <ul className="mb-[22px] grid gap-2.5">
            {article.checklist.map((item) => (
              <li key={item.title}>
                <label className="grid cursor-pointer grid-cols-[26px_1fr] items-start gap-3 rounded-2xl border border-[#e3ebed] bg-white px-4 py-3.5 text-base leading-[1.7] transition-colors duration-150 hover:border-teal-300 has-checked:bg-[#f6fafb]">
                  <input type="checkbox" className="mt-1 size-5 accent-teal-700" />
                  <div>
                    <b className="block text-teal-900">{item.title}</b>
                    <span className="text-[15px] text-ink-500">
                      <BidiText text={item.body} />
                    </span>
                  </div>
                </label>
              </li>
            ))}
          </ul>

          <h2 id="faq" className={H2}>
            {t("faqTitle")}
          </h2>
          <FaqAccordion items={article.faq.map((item) => ({ q: item.q, a: <BidiText text={item.a} /> }))} className="mb-2" />
        </article>

        <RankingToc entries={toc} title={t("inArticle")} />
      </Container>

      {article.related?.length ? (
        <section className="border-t border-[#e3ebed] pt-16 pb-6">
          <Container>
            <h2 className="mb-8 text-[28px] font-bold text-teal-900">{t("readAlso")}</h2>
            <div className="grid gap-6 min-[821px]:grid-cols-3">
              {article.related.map((post) => (
                <Link key={post.href} href={post.href} className="grid gap-2.5 text-inherit hover:no-underline">
                  <span className="relative block aspect-[16/10] overflow-hidden rounded-[20px]">
                    <Image src={post.image} alt="" fill sizes="(min-width: 821px) 33vw, 100vw" className="object-cover" />
                  </span>
                  <span className="text-[13px] text-neutral-600">{post.category}</span>
                  <b className="text-[17px] leading-[1.4] text-teal-900">{post.title}</b>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      <ClosingCta title={t("midTitle")} body={t("midBody")} secondary="pricing" />
    </>
  );
}
