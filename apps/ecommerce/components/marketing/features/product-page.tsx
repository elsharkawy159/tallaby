import Image from "next/image";
import { CircleCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { cn } from "@workspace/ui/lib/utils";
import { Link } from "@/i18n/navigation";
import { BidiText, ClosingCta, FaqBlock, PageTrail, type FaqItem } from "@/components/marketing/pages/content-blocks";
import { SignupTrigger } from "@/components/marketing/signup/signup-trigger.client";
import { chipClassName, ChipRow } from "@/components/marketing/site/chips";
import { CtaButton } from "@/components/marketing/site/cta-button";
import { ForwardArrow } from "@/components/marketing/site/direction-icons";
import { Container, Section, SectionHeading } from "@/components/marketing/site/layout-primitives";
import { Reveal } from "@/components/marketing/site/reveal.client";
import { IconTile } from "@/components/marketing/site/site-card";
import { PRODUCT_MENU, type ProductPage } from "@/lib/marketing/product-pages.lib";
import { ProductVisualView, type MockWords } from "./product-shots";

type Titled = { title: string; body: string };
type RowWords = { title: string; body: string; points: string[]; link?: string; mock?: MockWords };

/**
 * One product page (Shopify's "Build your website / Run your business /
 * Marketing & analytics / Get paid" pages): hero with the real screen, the
 * group's sibling pages, a plain answer, alternating feature rows, a short
 * list of the rest, related pages, FAQ (with FAQPage data) and the closing CTA.
 */
export async function ProductPageView({ page }: { page: ProductPage }) {
  const [t, shared, nav] = await Promise.all([
    getTranslations(`productPages.${page.slug}`),
    getTranslations("productPages.shared"),
    getTranslations("nav.productMenu"),
  ]);
  const path = `/features/${page.slug}`;
  const checks = t.raw("checks") as string[];
  const what = t.raw("what") as string[];
  const rows = t.raw("rows") as RowWords[];
  const grid = t.raw("grid") as Titled[];
  const related = t.raw("related") as Titled[];
  const faq = t.raw("faq") as FaqItem[];
  const heroMock = page.hero.kind === "dash" ? (t.raw("mock") as MockWords) : undefined;
  const siblings = PRODUCT_MENU[page.area];

  return (
    <>
      <PageTrail path={path} items={[{ label: shared("crumbHub"), href: "/features" }, { label: t("crumb") }]} />

      <section className="pt-6 pb-8 sm:pt-9 sm:pb-10">
        <Container className="grid items-center gap-10 min-[1081px]:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] min-[1081px]:gap-14">
          <div className="flex min-w-0 flex-col items-start gap-[18px]">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#e1eaec] bg-white py-[5px] ps-1.5 pe-3.5 text-[13.5px] font-bold text-teal-700">
              <span className="grid size-7 place-items-center rounded-full bg-teal-700 text-white">
                <page.icon className="size-[15px]" aria-hidden />
              </span>
              {nav(`areas.${page.area}.title`)}
            </span>
            <h1 className="text-[clamp(32px,4.4vw,52px)] leading-[1.25] font-bold text-balance text-teal-900 en:leading-[1.1] en:tracking-[-0.015em]">
              <BidiText text={t("title")} />
            </h1>
            <p className="max-w-[560px] text-lg text-pretty text-ink-500">
              <BidiText text={t("lead")} />
            </p>
            <ul className="grid gap-2 text-[15px] text-ink-700">
              {checks.map((check) => (
                <li key={check} className="flex items-start gap-2">
                  <CircleCheck className="mt-[3px] size-[17px] flex-none text-teal-700" aria-hidden />
                  <span>
                    <BidiText text={check} />
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:flex-wrap">
              <SignupTrigger>{shared("createStore")}</SignupTrigger>
              <CtaButton asChild tone="outline">
                <Link href="/pricing">{shared("pricing")}</Link>
              </CtaButton>
            </div>
          </div>
          <figure className="relative m-0 min-w-0">
            {page.art ? (
              <Image src={page.art} alt="" width={160} height={160} aria-hidden className="pointer-events-none absolute -top-10 end-0 z-10 hidden size-[140px] min-[1081px]:block" />
            ) : null}
            <ProductVisualView visual={page.hero} mock={heroMock} hero />
            {page.hero.kind === "dash" ? <figcaption className="mt-3 text-center text-[12.5px] text-ink-400">{shared("illustration")}</figcaption> : null}
          </figure>
        </Container>
      </section>

      <nav aria-label={shared("moreIn", { area: nav(`areas.${page.area}.title`) })} className="border-y border-line-soft bg-white/60">
        <Container className="flex flex-col gap-2 py-3.5 min-[761px]:flex-row min-[761px]:items-center min-[761px]:gap-4">
          <span className="flex-none text-[13.5px] font-bold text-ink-600">{shared("moreIn", { area: nav(`areas.${page.area}.title`) })}</span>
          <ChipRow className="-mx-0.5">
            {siblings.map((item) => (
              <Link key={item.href} href={item.href} aria-current={item.href === path ? "page" : undefined} className={cn(chipClassName, "h-9 gap-1.5 px-3.5 text-[13.5px]")}>
                <item.icon className="size-4" aria-hidden />
                {nav(`items.${item.id}.title`)}
              </Link>
            ))}
          </ChipRow>
        </Container>
      </nav>

      <Section>
        <Container className="grid items-start gap-4 min-[1081px]:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] min-[1081px]:gap-14">
          <h2 className="text-[clamp(26px,3.4vw,36px)] leading-[1.35] font-bold text-balance text-teal-900">
            <BidiText text={t("whatTitle")} />
          </h2>
          <div className="grid gap-4 text-[17px] leading-[1.95] text-[#3d5055]">
            {what.map((paragraph) => (
              <p key={paragraph} className="text-pretty">
                <BidiText text={paragraph} />
              </p>
            ))}
          </div>
        </Container>
      </Section>

      <div className="grid gap-14 pb-4 min-[861px]:gap-[88px]">
        {rows.map((row, i) => {
          const entry = page.rows[i]!;
          return (
            <section key={row.title} aria-labelledby={`row-${i}`}>
              <Container className="grid items-center gap-8 min-[1081px]:grid-cols-2 min-[1081px]:gap-16">
                <div className={cn("flex min-w-0 flex-col items-start gap-4", i % 2 === 1 && "min-[1081px]:order-2")}>
                  <IconTile>
                    <entry.icon aria-hidden />
                  </IconTile>
                  <h2 id={`row-${i}`} className="text-[clamp(24px,3vw,34px)] leading-[1.35] font-bold text-balance text-teal-900 en:leading-[1.2]">
                    <BidiText text={row.title} />
                  </h2>
                  <p className="text-[17px] text-pretty text-ink-500">
                    <BidiText text={row.body} />
                  </p>
                  <ul className="grid gap-2.5 border-s-2 border-amber-600 ps-4 text-[15.5px] text-ink-700">
                    {row.points.map((point) => (
                      <li key={point}>
                        <BidiText text={point} />
                      </li>
                    ))}
                  </ul>
                  {entry.href && row.link ? (
                    <Link href={entry.href} className="inline-flex items-center gap-1.5 text-[15px] font-bold text-teal-700 hover:text-teal-900">
                      <BidiText text={row.link} />
                      <ForwardArrow className="size-4" />
                    </Link>
                  ) : null}
                </div>
                <Reveal className="min-w-0">
                  <ProductVisualView visual={entry.visual} mock={row.mock} />
                </Reveal>
              </Container>
            </section>
          );
        })}
      </div>

      <Section>
        <Container>
          <SectionHeading title={<BidiText text={t("gridTitle")} />} />
          <ul className="grid gap-x-10 gap-y-7 border-t border-line pt-8 min-[641px]:grid-cols-2 min-[1081px]:grid-cols-3">
            {grid.map((item, i) => {
              const Icon = page.grid[i]!;
              return (
                <li key={item.title} className="grid grid-cols-[28px_minmax(0,1fr)] gap-3">
                  <Icon className="mt-1 size-[22px] text-teal-700" aria-hidden />
                  <div>
                    <h3 className="mb-1 text-[17px] font-bold text-teal-900">
                      <BidiText text={item.title} />
                    </h3>
                    <p className="text-[15px] text-pretty text-ink-500">
                      <BidiText text={item.body} />
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Container>
      </Section>

      <Section className="pt-0 min-[861px]:pt-0">
        <Container>
          <SectionHeading title={shared("relatedTitle")} />
          <div className="grid gap-3.5 min-[641px]:grid-cols-2 min-[1081px]:grid-cols-4">
            {related.map((item, i) => {
              const { href, icon: Icon } = page.related[i]!;
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex flex-col gap-2 rounded-[22px] border border-[#e3ebed] bg-white p-5 text-inherit transition-[border-color,box-shadow] duration-200 hover:border-teal-300 hover:no-underline hover:shadow-[0_14px_32px_rgba(13,55,67,0.08)]"
                >
                  <Icon className="mb-1 size-6 text-teal-700" aria-hidden />
                  <b className="flex items-center justify-between gap-2 text-base text-teal-900">
                    <span>
                      <BidiText text={item.title} />
                    </span>
                    <ForwardArrow className="flex-none text-teal-500" />
                  </b>
                  <p className="text-sm text-ink-500">
                    <BidiText text={item.body} />
                  </p>
                </Link>
              );
            })}
          </div>
        </Container>
      </Section>

      <FaqBlock items={faq} />
      <ClosingCta title={<BidiText text={t("closingTitle")} />} secondary="pricing" />
    </>
  );
}
