import { LayoutTemplate, Languages, Repeat, Smartphone } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { CtaBand } from "@/components/marketing/site/cta-band";
import { FaqAccordion, type FaqEntry } from "@/components/marketing/site/faq-accordion";
import { Container, Section, SectionHeading } from "@/components/marketing/site/layout-primitives";
import { Reveal } from "@/components/marketing/site/reveal.client";
import { richTags } from "@/components/marketing/site/rich-text";
import { IconTile, SiteCard } from "@/components/marketing/site/site-card";
import { SignupTrigger, SlugClaimForm } from "@/components/marketing/signup/signup-trigger.client";
import { CONTACT } from "@/lib/marketing/site.lib";
import type { GalleryEntry, GalleryNicheTab } from "@/lib/marketing/templates.lib";
import { TemplateGallery } from "./template-gallery.client";

/** Everything on /templates. `entries` is the code catalog; `niches` the niche tabs under each category. */
export async function TemplatesPageContent({ entries, niches = [] }: { entries: GalleryEntry[]; niches?: GalleryNicheTab[] }) {
  const t = await getTranslations("templates");
  const included = [
    { icon: Smartphone, title: t("included.phoneTitle"), body: t("included.phoneBody") },
    { icon: Languages, title: t("included.langTitle"), body: t("included.langBody") },
    { icon: Repeat, title: t("included.switchTitle"), body: t("included.switchBody") },
  ];

  return (
    <>
      {/* A short hero (owner, 2026-11-16): the heading, one line and the sign-up, so the filters and grid sit near the top. */}
      <section id="gallery" aria-labelledby="templates-h1" className="scroll-mt-20 pt-8 pb-14 min-[641px]:pt-12 min-[861px]:pb-[72px]">
        <Container>
          <div className="mb-8 flex flex-col gap-4 min-[861px]:mb-10 min-[861px]:flex-row min-[861px]:items-end min-[861px]:justify-between min-[861px]:gap-10">
            <div className="max-w-[760px]">
              <h1 id="templates-h1" className="text-[clamp(30px,4.4vw,48px)] leading-[1.25] font-bold text-balance text-ink-900 en:leading-[1.1] en:tracking-[-0.02em] [&_em]:text-amber-700 [&_em]:not-italic">
                {t.rich("hero.title", richTags)}
              </h1>
              <p className="mt-3 max-w-[640px] text-[clamp(15px,1.6vw,17px)] text-pretty text-ink-500">{t("hero.lead")}</p>
            </div>
            <SignupTrigger className="self-start min-[861px]:self-auto">{t("hero.cta")}</SignupTrigger>
          </div>
          <h2 className="sr-only">{t("gallery.title")}</h2>
          <TemplateGallery entries={entries} niches={niches} />
        </Container>
      </section>

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
                <h3 className="text-[17px] leading-normal font-bold text-ink-900">{t("included.pagesTitle")}</h3>
                <div className="mt-auto flex flex-wrap gap-1.5">
                  {(t.raw("included.pages") as string[]).map((page) => (
                    <span key={page} className="rounded-full bg-tint px-2.5 py-[3px] text-xs font-semibold text-ink-brand">{page}</span>
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
                  <h3 className="text-[17px] leading-normal font-bold text-ink-900">{item.title}</h3>
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
                  <a href={CONTACT.whatsapp} target="_blank" rel="noopener noreferrer" className="font-semibold text-ink-brand underline-offset-2 hover:underline">
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
