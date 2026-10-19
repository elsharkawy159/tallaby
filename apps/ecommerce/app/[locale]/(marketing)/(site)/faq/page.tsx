import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { HelpCenterProvider, HelpResults, HelpSearch } from "@/components/marketing/faq/help-center.client";
import { CtaButton } from "@/components/marketing/site/cta-button";
import { Container } from "@/components/marketing/site/layout-primitives";
import { PageHero } from "@/components/marketing/site/page-hero";
import { Reveal } from "@/components/marketing/site/reveal.client";
import { richTags } from "@/components/marketing/site/rich-text";
import { CONTACT } from "@/lib/marketing/site.lib";
import { pageMetadata } from "@/lib/marketing/metadata.lib";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ locale, page: "faq", path: "/faq" });
}

const GROUP_IDS = ["start", "pricing", "payments", "shipping", "design", "domain"];

export default async function FaqPage() {
  const t = await getTranslations("faq");

  // FAQPage structured data from the same answers shown on the page.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: GROUP_IDS.flatMap((id) =>
      (t.raw(`groups.${id}.items`) as { q: string; a: string }[]).map((x) => ({
        "@type": "Question",
        name: x.q,
        acceptedAnswer: { "@type": "Answer", text: x.a },
      })),
    ),
  };

  return (
    <HelpCenterProvider>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <PageHero
        eyebrow={t("eyebrow")}
        title={t.rich("title", richTags)}
        lead={t("lead")}
        className="pb-[110px] text-center sm:pb-[110px]"
        containerClassName="[&_p]:mx-auto"
      >
        <HelpSearch />
      </PageHero>
      <Container>
        <HelpResults
          still={
            <Reveal className="mt-6 grid items-center gap-6 rounded-3xl bg-teal-900 p-9 text-white md:grid-cols-[1fr_auto]">
              <div>
                <h3 className="text-[22px] font-bold">{t("stillTitle")}</h3>
                <p className="mt-1 text-mist">{t("stillBody")}</p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <CtaButton asChild>
                  <a href={CONTACT.whatsapp} target="_blank" rel="noopener noreferrer">
                    {t("whatsapp")}
                  </a>
                </CtaButton>
                <CtaButton asChild tone="ghost">
                  <Link href="/contact">{t("contactPage")}</Link>
                </CtaButton>
              </div>
            </Reveal>
          }
        />
      </Container>
    </HelpCenterProvider>
  );
}
