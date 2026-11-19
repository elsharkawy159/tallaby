import type { Metadata } from "next";
import { GraduationCap, HeartPulse, House, Laptop, Store } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { RolesList, RotatingWord } from "@/components/marketing/careers/careers.client";
import { CtaBand } from "@/components/marketing/site/cta-band";
import { CtaButton } from "@/components/marketing/site/cta-button";
import { Container, Num, Section, SectionHeading } from "@/components/marketing/site/layout-primitives";
import { PageHero } from "@/components/marketing/site/page-hero";
import { Reveal } from "@/components/marketing/site/reveal.client";
import { IconTile, SiteCard } from "@/components/marketing/site/site-card";
import { CONTACT } from "@/lib/marketing/site.lib";
import { pageMetadata } from "@/lib/marketing/metadata.lib";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ locale, page: "careers", path: "/careers" });
}

export default async function CareersPage() {
  const t = await getTranslations("careers");
  const steps = t.raw("steps") as { title: string; body: string }[];
  // Openings live in the messages; there are none today, and none are invented here.
  const roleCount = (t.raw("roles") as unknown[]).length;
  const mailto = `mailto:${CONTACT.email}?subject=Careers`;
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
        containerClassName="items-end lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]"
        aside={
          <SiteCard size="lg" glass className="grid gap-4 p-7">
            {roleCount ? (
              <>
                <Num className="text-[80px] leading-none font-extrabold tracking-[-0.04em] text-teal-900">{roleCount}</Num>
                <p className="text-[#56696e]">{t("openCount", { count: roleCount })}</p>
                <CtaButton asChild className="justify-self-start">
                  <a href="#roles">{t("openCta")}</a>
                </CtaButton>
              </>
            ) : (
              <>
                <b className="text-2xl leading-[1.3] text-teal-900">{t("noneTitle")}</b>
                <p className="text-[#56696e]">{t("noneBody")}</p>
                <CtaButton asChild className="justify-self-start">
                  <a href={mailto}>{t("emailUs")}</a>
                </CtaButton>
              </>
            )}
          </SiteCard>
        }
      />

      <Section>
        <Container>
          <Reveal>
            <SectionHeading kicker={t("perksKicker")} title={t("perksTitle")} />
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Reveal className="grid content-start gap-2 rounded-card bg-teal-900 p-[26px] sm:col-span-2 lg:col-span-1 lg:row-span-2">
              <IconTile className="mb-2 bg-white/10 text-amber-600">
                <Store aria-hidden />
              </IconTile>
              <b className="text-2xl leading-[1.4] text-white">{t("perkBig")}</b>
              <span className="text-[15px] text-ink-on-dark">{t("perkBigBody")}</span>
            </Reveal>
            {perks.map((p) => (
              <Reveal
                key={p.title}
                className="grid content-start gap-2 rounded-card border border-[#e6eef0] bg-surface-glass p-[26px] transition-[transform,box-shadow] duration-200 hover:-translate-y-[3px] hover:shadow-raise"
              >
                <IconTile className="mb-2">
                  <p.icon aria-hidden />
                </IconTile>
                <b className="text-[17px] text-teal-900">{p.title}</b>
                <span className="text-sm text-slate-ink">{p.body}</span>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {roleCount ? (
        <Section id="roles" className="scroll-mt-20 pt-0 min-[861px]:pt-0">
          <Container>
            <RolesList />
          </Container>
        </Section>
      ) : null}

      <Section className="pt-0 min-[861px]:pt-0">
        <Container>
          <Reveal>
            <SectionHeading kicker={t("processKicker")} title={t("processTitle")} />
          </Reveal>
          <Reveal as="ol" className="m-0 grid list-none gap-y-5 p-0 ps-[15px] sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.title} className="relative border-s-2 border-line-strong p-6">
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
            <a href={mailto}>{t("emailUs")}</a>
          </CtaButton>
        }
      />
    </>
  );
}
