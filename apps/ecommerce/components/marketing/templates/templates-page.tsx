import { Check, LayoutTemplate, Languages, Repeat, Smartphone } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { CtaBand } from "@/components/marketing/site/cta-band";
import { CtaButton } from "@/components/marketing/site/cta-button";
import { FaqAccordion, type FaqEntry } from "@/components/marketing/site/faq-accordion";
import { Container, Kicker, Section, SectionHeading } from "@/components/marketing/site/layout-primitives";
import { Reveal } from "@/components/marketing/site/reveal.client";
import { richTags } from "@/components/marketing/site/rich-text";
import { IconTile, SiteCard } from "@/components/marketing/site/site-card";
import { SignupTrigger, SlugClaimForm } from "@/components/marketing/signup/signup-trigger.client";
import { CONTACT } from "@/lib/marketing/site.lib";
import type { GalleryEntry } from "@/lib/marketing/templates.lib";
import { TemplateGallery } from "./template-gallery.client";
import { TemplateShowcase, type ShowcaseEntry } from "./template-showcase.client";

/** How many templates the hero's picker offers. */
const SHOWCASE_SIZE = 6;

/** The hero's picks: `leadKeys` first, then one template per category not shown yet. */
export function showcasePicks(entries: readonly GalleryEntry[], leadKeys: readonly string[], size = SHOWCASE_SIZE): GalleryEntry[] {
  const leads = leadKeys.flatMap((key) => entries.filter((entry) => entry.id === key));
  const categories = new Set(leads.map((entry) => entry.category));
  const rest = entries.filter((entry) => {
    if (categories.has(entry.category)) return false;
    categories.add(entry.category);
    return true;
  });
  return [...leads, ...rest].slice(0, size);
}

/** Everything on /templates. `entries` is the code catalog. */
export async function TemplatesPageContent({ entries, leadKeys = [] }: { entries: GalleryEntry[]; leadKeys?: readonly string[] }) {
  const t = await getTranslations("templates");
  const picks: ShowcaseEntry[] = showcasePicks(entries, leadKeys).map((entry) => ({
    id: entry.id,
    name: entry.name,
    description: entry.description,
    category: entry.category,
    palette: entry.palette,
  }));
  const checks = [t("hero.checkFree"), t("hero.checkLanguages"), t("hero.checkMobile")];
  const included = [
    { icon: Smartphone, title: t("included.phoneTitle"), body: t("included.phoneBody") },
    { icon: Languages, title: t("included.langTitle"), body: t("included.langBody") },
    { icon: Repeat, title: t("included.switchTitle"), body: t("included.switchBody") },
  ];

  return (
    <>
      <section aria-labelledby="templates-h1" className="relative overflow-hidden pt-10 pb-14 min-[641px]:pt-16 min-[641px]:pb-[72px]">
        <Container className="flex flex-col items-center text-center">
          <Kicker className="mb-[18px]">{t("hero.eyebrow")}</Kicker>
          <h1 id="templates-h1" className="max-w-[900px] text-[clamp(34px,6.2vw,68px)] leading-[1.25] font-bold text-balance text-teal-900 en:leading-[1.08] en:tracking-[-0.02em] [&_em]:text-amber-700 [&_em]:not-italic">
            {t.rich("hero.title", richTags)}
          </h1>
          <p className="mx-auto mt-4 mb-6 max-w-[640px] text-[clamp(16px,2vw,19px)] text-pretty text-ink-500 min-[641px]:mt-5 min-[641px]:mb-8">{t("hero.lead")}</p>
          <div className="flex flex-wrap justify-center gap-2.5">
            <SignupTrigger>{t("hero.cta")}</SignupTrigger>
            <CtaButton asChild tone="outline">
              <a href="#gallery">{t("hero.browse", { count: entries.length })}</a>
            </CtaButton>
          </div>
          <ul className="m-0 mt-[18px] flex list-none flex-wrap justify-center gap-x-3.5 gap-y-1.5 p-0 text-[13px] text-ink-500 min-[641px]:gap-x-[22px] min-[641px]:gap-y-2 min-[641px]:text-sm">
            {checks.map((check) => (
              <li key={check} className="flex items-center gap-1.5">
                <Check className="size-4 text-[#16a34a]" aria-hidden />
                {check}
              </li>
            ))}
          </ul>
          {picks.length ? <TemplateShowcase entries={picks} /> : null}
        </Container>
      </section>

      <Section id="gallery" aria-labelledby="gallery-title" className="scroll-mt-20">
        <Container>
          <Reveal>
            <SectionHeading id="gallery-title" kicker={t("gallery.kicker")} title={t("gallery.title")} description={t("gallery.body")} centered />
          </Reveal>
          <TemplateGallery entries={entries} />
        </Container>
      </Section>

      <Section id="included" aria-labelledby="included-title">
        <Container>
          <Reveal>
            <SectionHeading id="included-title" kicker={t("included.kicker")} title={t("included.title")} centered />
          </Reveal>
          <div className="grid gap-4 min-[641px]:grid-cols-2 min-[1081px]:grid-cols-4">
            <Reveal as="article">
              <SiteCard glass className="flex h-full min-h-[220px] flex-col gap-2.5 p-[26px]">
                <IconTile className="mb-1">
                  <LayoutTemplate aria-hidden />
                </IconTile>
                <h3 className="text-[17px] leading-normal font-bold text-teal-900">{t("included.pagesTitle")}</h3>
                <div className="mt-auto flex flex-wrap gap-1.5">
                  {(t.raw("included.pages") as string[]).map((page) => (
                    <span key={page} className="rounded-full bg-teal-50 px-2.5 py-[3px] text-xs font-semibold text-teal-700">{page}</span>
                  ))}
                </div>
              </SiteCard>
            </Reveal>
            {included.map((item) => (
              <Reveal as="article" key={item.title}>
                <SiteCard glass className="flex h-full min-h-[220px] flex-col gap-2.5 p-[26px]">
                  <IconTile className="mb-1">
                    <item.icon aria-hidden />
                  </IconTile>
                  <h3 className="text-[17px] leading-normal font-bold text-teal-900">{item.title}</h3>
                  <p className="text-sm text-pretty text-ink-500">{item.body}</p>
                </SiteCard>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      <Section id="faq" aria-labelledby="templates-faq-title">
        <Container className="grid gap-7 min-[1081px]:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] min-[1081px]:gap-14">
          <Reveal>
            <SectionHeading
              id="templates-faq-title"
              kicker={t("faq.kicker")}
              title={t("faq.title")}
              className="mb-0"
              description={t.rich("faq.desc", {
                link: (chunks) => (
                  <a href={CONTACT.whatsapp} target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-700 underline-offset-2 hover:underline">
                    {chunks}
                  </a>
                ),
              })}
            />
          </Reveal>
          <Reveal>
            <FaqAccordion items={t.raw("faq.items") as FaqEntry[]} />
          </Reveal>
        </Container>
      </Section>

      <CtaBand title={t("final.title")} body={t("final.body")} action={<SlugClaimForm className="w-full sm:w-[420px]" />} />
    </>
  );
}
