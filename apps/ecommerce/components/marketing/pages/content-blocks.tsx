import * as React from "react";
import { MessageCircle } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SignupTrigger } from "@/components/marketing/signup/signup-trigger.client";
import { Breadcrumb, type BreadcrumbItem } from "@/components/marketing/site/breadcrumb";
import { CtaBand } from "@/components/marketing/site/cta-band";
import { CtaButton } from "@/components/marketing/site/cta-button";
import { FaqAccordion } from "@/components/marketing/site/faq-accordion";
import { JsonLd } from "@/components/marketing/site/json-ld";
import { Container, Section, SectionHeading } from "@/components/marketing/site/layout-primitives";
import { localizedUrl } from "@/lib/marketing/seo.lib";
import { CONTACT } from "@/lib/marketing/site.lib";
import { breadcrumbSchema } from "@/lib/marketing/structured-data.lib";
import { cn } from "@workspace/ui/lib/utils";

const LATIN_RUN = /([A-Za-z][A-Za-z0-9 .&@=_-]*[A-Za-z0-9])/;

/**
 * Text with its Latin runs (brand names, domains) isolated, so they read
 * correctly inside Arabic. Harmless in English.
 */
export function BidiText({ text }: { text: string }) {
  const parts = text.split(LATIN_RUN);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <bdi key={i} dir="ltr">
            {part}
          </bdi>
        ) : (
          part
        ),
      )}
    </>
  );
}

/** The visible trail and its BreadcrumbList. `items` excludes Home; hrefs are locale-free paths. */
export async function PageTrail({ items, path, className }: { items: BreadcrumbItem[]; path: string; className?: string }) {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("site")]);
  const schema = [
    { name: t("home"), url: localizedUrl(locale, "/") },
    // A hub with no page of its own stays out of the data; the current page is the last item.
    ...items.flatMap((item, i) => {
      const last = i === items.length - 1;
      return last || item.href ? [{ name: item.label, url: localizedUrl(locale, last ? path : item.href!) }] : [];
    }),
  ];
  return (
    <Container className={cn("pt-6", className)}>
      <Breadcrumb items={items} />
      <JsonLd data={breadcrumbSchema(schema)} />
    </Container>
  );
}

export type FaqItem = { q: string; a: string };

export function faqSchema(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

/** Heading on the start side, questions beside it, plus the FAQPage data for the same answers. */
export async function FaqBlock({ items, title }: { items: FaqItem[]; title?: string }) {
  const t = await getTranslations("contentPages");
  return (
    <Section id="faq">
      <JsonLd data={faqSchema(items)} />
      <Container className="grid items-start gap-5 min-[961px]:grid-cols-[minmax(0,320px)_minmax(0,1fr)] min-[961px]:gap-12">
        <SectionHeading kicker={t("faqKicker")} title={title ?? t("faqTitle")} description={t("faqLead")} className="mb-0" />
        <FaqAccordion items={items.map((item) => ({ q: <BidiText text={item.q} />, a: <BidiText text={item.a} /> }))} />
      </Container>
    </Section>
  );
}

/**
 * The plain statement every "start free" claim needs: the first top-up and
 * the Order Notifications app (no app prices on tallaby.com).
 */
export async function FreeTermsNote({ className }: { className?: string }) {
  const t = await getTranslations("contentPages");
  return <p className={cn("text-[13.5px] text-pretty text-ink-500", className)}>{t("freeTerms")}</p>;
}

/** The closing band: "create your store" and either WhatsApp or the pricing page. */
export async function ClosingCta({
  title,
  body,
  secondary = "whatsapp",
}: {
  title: React.ReactNode;
  body?: React.ReactNode;
  secondary?: "whatsapp" | "pricing";
}) {
  const t = await getTranslations("contentPages");
  return (
    <CtaBand
      title={title}
      body={
        <>
          <span className="block">{body ?? t("closingBody")}</span>
          <span className="mt-2 block max-w-[640px] text-[13.5px] text-pretty opacity-85">{t("freeTerms")}</span>
        </>
      }
      action={
        <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
          <SignupTrigger>{t("createStore")}</SignupTrigger>
          {secondary === "whatsapp" && CONTACT.whatsapp ? (
            <CtaButton asChild tone="ghost">
              <a href={CONTACT.whatsapp} target="_blank" rel="noopener noreferrer">
                <MessageCircle aria-hidden />
                {t("whatsapp")}
              </a>
            </CtaButton>
          ) : (
            <CtaButton asChild tone="ghost">
              <Link href="/pricing">{t("pricing")}</Link>
            </CtaButton>
          )}
        </div>
      }
    />
  );
}
