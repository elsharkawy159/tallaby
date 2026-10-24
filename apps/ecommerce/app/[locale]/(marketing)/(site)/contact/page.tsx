import type { Metadata } from "next";
import { ArrowUpRight, Clock, Headset, LifeBuoy, Mail, MapPin, MessageCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { cn } from "@workspace/ui/lib/utils";
import { Link } from "@/i18n/navigation";
import { ContactForm } from "@/components/marketing/contact/contact-form.client";
import { Container, Ltr, Section } from "@/components/marketing/site/layout-primitives";
import { PageHero } from "@/components/marketing/site/page-hero";
import { Reveal } from "@/components/marketing/site/reveal.client";
import { richTags } from "@/components/marketing/site/rich-text";
import { CONTACT } from "@/lib/marketing/site.lib";
import { pageMetadata } from "@/lib/marketing/metadata.lib";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ locale, page: "contact", path: "/contact" });
}

export default async function ContactPage() {
  const t = await getTranslations("contact");
  const channels = [
    ...(CONTACT.whatsapp && CONTACT.whatsappHandle
      ? [{ href: CONTACT.whatsapp, icon: MessageCircle, title: t("whatsapp"), body: t("whatsappBody"), value: CONTACT.whatsappHandle, highlight: true, ltr: true }]
      : []),
    { href: `mailto:${CONTACT.email}`, icon: Mail, title: t("email"), body: t("emailBody"), value: CONTACT.email, highlight: !CONTACT.whatsapp, ltr: false },
  ];

  return (
    <>
      <PageHero eyebrow={t("eyebrow")} title={t.rich("title", richTags)} lead={t("lead")} className="pb-[180px] sm:pb-[180px]">
        <span className="mt-7 inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 py-2 ps-3 pe-4 text-sm">
          <i className="block size-2.5 animate-pulse-ring rounded-full bg-[#4ade80]" />
          {t("live")}
        </span>
      </PageHero>

      <Container>
        <div className={cn("relative -mt-[130px] grid gap-4", channels.length > 1 && "lg:grid-cols-[1.3fr_1fr]")}>
          {channels.map((c) => (
            <a
              key={c.title}
              href={c.href}
              className={cn(
                "flex flex-col gap-1.5 rounded-[22px] border p-7 shadow-soft transition-transform duration-200 hover:-translate-y-1 hover:no-underline",
                c.highlight ? "border-transparent bg-amber-600" : "border-neutral-200 bg-white",
              )}
            >
              <span
                className={cn(
                  "mb-3 grid size-12 place-items-center rounded-[14px]",
                  c.highlight ? "bg-teal-900 text-amber-600" : "bg-teal-50 text-teal-700",
                )}
              >
                <c.icon className="size-[22px]" aria-hidden />
              </span>
              <b className="text-lg text-teal-900">{c.title}</b>
              <span className={cn("text-sm", c.highlight ? "text-amber-ink" : "text-slate-ink")}>{c.body}</span>
              <span className={cn("mt-auto flex items-center gap-1.5 pt-3.5 font-latin font-bold", c.highlight ? "text-teal-900" : "text-teal-700")}>
                {c.ltr ? <Ltr>{c.value}</Ltr> : <span className="text-sm">{c.value}</span>}
                {c.highlight ? <ArrowUpRight className="size-4" aria-hidden /> : null}
              </span>
            </a>
          ))}
        </div>
      </Container>

      <Section>
        <Container className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
          <Reveal className="rounded-3xl border border-neutral-200 bg-white p-6 sm:p-9">
            <ContactForm />
          </Reveal>
          <aside className="grid gap-4 lg:sticky lg:top-24">
            <Reveal className="overflow-hidden rounded-[22px] border border-neutral-200 bg-white">
              <div className="p-[22px]">
                <h3 className="mb-2.5 text-[17px] font-bold text-teal-900">{t("office")}</h3>
                <ul className="m-0 list-none p-0">
                  {[
                    { icon: MapPin, text: t("officeAddress") },
                    { icon: Clock, text: t("officeHours") },
                    { icon: Headset, text: t("supportHours") },
                  ].map((row) => (
                    <li key={row.text} className="flex items-start gap-2.5 py-1.5 text-sm text-[#33454a]">
                      <row.icon className="mt-1 size-4 flex-none text-teal-500" aria-hidden />
                      {row.text}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal className="flex items-center gap-3.5 rounded-[22px] bg-teal-50 p-[22px] text-teal-900">
              <LifeBuoy className="size-7 text-teal-700" aria-hidden />
              <div>
                <b className="block">{t("quick")}</b>
                <Link href="/faq" className="text-sm font-bold text-teal-700">
                  {t("browse")}
                </Link>
              </div>
            </Reveal>
          </aside>
        </Container>
      </Section>
    </>
  );
}
