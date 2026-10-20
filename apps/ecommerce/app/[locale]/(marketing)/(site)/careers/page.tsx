import type { Metadata } from "next";
import { GraduationCap, HeartPulse, House, Laptop, Store } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { RolesList, RotatingWord } from "@/components/marketing/careers/careers.client";
import { CtaBand } from "@/components/marketing/site/cta-band";
import { CtaButton } from "@/components/marketing/site/cta-button";
import { Container, PhotoPlaceholder, Section, SectionHeading } from "@/components/marketing/site/layout-primitives";
import { PageHero } from "@/components/marketing/site/page-hero";
import { Reveal } from "@/components/marketing/site/reveal.client";
import { CONTACT } from "@/lib/marketing/site.lib";
import { pageMetadata } from "@/lib/marketing/metadata.lib";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ locale, page: "careers", path: "/careers" });
}

export default async function CareersPage() {
  const t = await getTranslations("careers");
  const steps = t.raw("steps") as { title: string; body: string }[];
  const perks = [
    { icon: House, title: t("perkHybrid"), body: t("perkHybridBody") },
    { icon: HeartPulse, title: t("perkHealth"), body: t("perkHealthBody") },
    { icon: GraduationCap, title: t("perkLearn"), body: t("perkLearnBody") },
    { icon: Laptop, title: t("perkSetup"), body: t("perkSetupBody") },
  ];

  return (
    <>
      <PageHero
        eyebrow={t("eyebrow")}
        title={
          <>
            {t("titleStart")} <RotatingWord />
            <br />
            {t("titleEnd")}
          </>
        }
        lead={t("lead")}
      />

      <Section>
        <Container>
          <Reveal>
            <SectionHeading kicker={t("perksKicker")} title={t("perksTitle")} />
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Reveal className="grid content-start gap-2 rounded-[20px] bg-amber-600 p-[26px] sm:col-span-2 lg:col-span-1 lg:row-span-2">
              <span className="mb-2 grid size-[46px] place-items-center rounded-[14px] bg-teal-900 text-amber-600">
                <Store className="size-5" aria-hidden />
              </span>
              <b className="text-2xl leading-[1.3] text-teal-900">{t("perkBig")}</b>
              <span className="text-[15px] text-amber-ink">{t("perkBigBody")}</span>
              <PhotoPlaceholder className="mt-4 min-h-40 rounded-[14px] border-teal-900/15 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.35)_0_10px,rgba(255,255,255,0.15)_10px_20px)] text-teal-900">
                {t("perkBigPhoto")}
              </PhotoPlaceholder>
            </Reveal>
            {perks.map((p) => (
              <Reveal key={p.title} className="grid content-start gap-2 rounded-[20px] border border-neutral-200 bg-white p-[26px]">
                <span className="mb-2 grid size-[46px] place-items-center rounded-[14px] bg-teal-900 text-amber-600">
                  <p.icon className="size-5" aria-hidden />
                </span>
                <b className="text-[17px] text-teal-900">{p.title}</b>
                <span className="text-sm text-slate-ink">{p.body}</span>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      <Section id="roles" className="pt-0 md:pt-0">
        <Container>
          <RolesList />
        </Container>
      </Section>

      <Section className="pt-0 md:pt-0">
        <Container>
          <Reveal>
            <SectionHeading kicker={t("processKicker")} title={t("processTitle")} />
          </Reveal>
          <Reveal as="ol" className="m-0 grid list-none gap-y-5 p-0 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.title} className="relative border-s-2 border-teal-100 p-6">
                <span className="absolute -start-[15px] top-[22px] size-7 rounded-full bg-teal-900 text-center font-latin text-[13px] leading-7 font-bold text-white">
                  {i + 1}
                </span>
                <b className="mb-1.5 block ps-2.5 text-teal-900">{s.title}</b>
                <span className="block ps-2.5 text-sm text-slate-ink">{s.body}</span>
              </li>
            ))}
          </Reveal>
        </Container>
      </Section>

      <CtaBand
        title={t("band")}
        body={t("bandBody")}
        action={
          <CtaButton asChild tone="dark">
            <a href={`mailto:${CONTACT.email}?subject=Careers`}>{t("emailUs")}</a>
          </CtaButton>
        }
      />
    </>
  );
}
