import type { Metadata } from "next";
import { Gauge, Languages, Repeat, Smartphone } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { CtaBand } from "@/components/marketing/site/cta-band";
import { Container, Num, Section } from "@/components/marketing/site/layout-primitives";
import { PageHero } from "@/components/marketing/site/page-hero";
import { Reveal } from "@/components/marketing/site/reveal.client";
import { richTags } from "@/components/marketing/site/rich-text";
import { SignupTrigger } from "@/components/marketing/signup/signup-trigger.client";
import { TemplateFan } from "@/components/marketing/templates/template-fan.client";
import { TemplateGallery } from "@/components/marketing/templates/template-gallery.client";
import { pageMetadata } from "@/lib/marketing/metadata.lib";
import { TEMPLATES } from "@/lib/marketing/templates.data";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ locale, page: "templates", path: "/templates" });
}

export default async function TemplatesPage() {
  const t = await getTranslations("templates");
  const why = [
    { icon: Repeat, title: t("why.switchTitle"), body: t("why.switchBody") },
    { icon: Smartphone, title: t("why.phoneTitle"), body: t("why.phoneBody") },
    { icon: Gauge, title: t("why.fastTitle"), body: t("why.fastBody") },
    { icon: Languages, title: t("why.langTitle"), body: t("why.langBody") },
  ];
  const stats = [
    { value: String(TEMPLATES.length), label: t("hero.statTemplates") },
    { value: "0", label: t("hero.statFree") },
    { value: "100%", label: t("hero.statMobile") },
  ];

  return (
    <>
      <PageHero
        eyebrow={t("hero.eyebrow")}
        title={t.rich("hero.title", richTags)}
        lead={t("hero.lead")}
        aside={<TemplateFan />}
      >
        <div className="mt-8 flex flex-wrap gap-7">
          {stats.map((s) => (
            <div key={s.label} className="grid">
              <Num className="text-[28px] font-extrabold text-white">{s.value}</Num>
              <span className="text-[13px] text-haze">{s.label}</span>
            </div>
          ))}
        </div>
      </PageHero>

      <Section>
        <Container>
          <TemplateGallery variant="page" />
          <Reveal className="mt-[72px] grid gap-5 border-t border-neutral-200 pt-10 sm:grid-cols-2 lg:grid-cols-4">
            {why.map((w) => (
              <div key={w.title} className="grid gap-1.5">
                <span className="mb-1.5 grid size-11 place-items-center rounded-xl bg-amber-50 text-[#8a5300]">
                  <w.icon className="size-[18px]" aria-hidden />
                </span>
                <b className="text-teal-900">{w.title}</b>
                <span className="text-sm text-slate-ink">{w.body}</span>
              </div>
            ))}
          </Reveal>
        </Container>
      </Section>

      <CtaBand title={t("band")} action={<SignupTrigger tone="dark" />} />
    </>
  );
}
