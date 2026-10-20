"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowUpRight, Copy, Mail, Search } from "lucide-react";
import { Input } from "@workspace/ui/components/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import { cn } from "@/lib/utils";
import { SUPPORT_EMAIL, SUPPORT_WHATSAPP_HANDLE } from "@/lib/constants";
import { useSupportWhatsAppUrl, WhatsAppIcon } from "@/components/dashboard/support-chat-link.client";

export type FaqTopicView = {
  key: string;
  title: string;
  faqs: { key: string; question: string; answer: string; link: { href: string; label: string } | null }[];
};

const actionClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-primary";

function CopyButton({ value, label }: { value: string; label: string }) {
  const t = useTranslations("help");
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          toast.success(t("copied"));
        } catch {
          toast.error(t("copyFailed"));
        }
      }}
      aria-label={label}
      title={label}
      className={cn(actionClass, "w-10 px-0 bg-primary-foreground/10 hover:bg-primary-foreground/20")}
    >
      <Copy className="size-4" aria-hidden />
    </button>
  );
}

/** The page's lead: the two real ways to reach the team, with the number and address in full. */
export function ContactDesk({ storeName }: { storeName: string | null }) {
  const t = useTranslations("help");
  const whatsAppUrl = useSupportWhatsAppUrl();
  const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    storeName ? t("emailSubject", { store: storeName }) : t("emailSubjectNoStore")
  )}`;

  return (
    <section
      aria-labelledby="help-contact-title"
      className="overflow-hidden rounded-2xl bg-primary text-primary-foreground"
    >
      <div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.6fr)]">
        <div className="p-6 sm:p-8">
          <h2 id="help-contact-title" className="text-balance text-2xl font-bold leading-tight sm:text-[1.75rem]">
            {t("contactTitle")}
          </h2>
          <p className="mt-3 max-w-[42ch] text-pretty text-sm leading-relaxed text-primary-foreground/80">
            {t("contactSubtitle")}
          </p>
        </div>

        <div className="grid border-t border-primary-foreground/15 sm:grid-cols-2 sm:divide-x sm:rtl:divide-x-reverse sm:divide-primary-foreground/15 lg:border-s lg:border-t-0">
          <div className="flex flex-col gap-4 p-6 sm:p-8">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-medium text-primary-foreground/80">
                <WhatsAppIcon className="size-4" />
                {t("whatsappTitle")}
              </h3>
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                dir="ltr"
                className="mt-2 block text-start text-[1.75rem] font-semibold leading-none tracking-tight tabular-nums underline-offset-4 hover:underline rtl:text-end sm:text-3xl"
              >
                {SUPPORT_WHATSAPP_HANDLE}
              </a>
              <p className="mt-2 text-[13px] text-primary-foreground/70">{t("whatsappHint")}</p>
            </div>
            <div className="mt-auto flex gap-2">
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(actionClass, "flex-1 bg-[#1fa855] text-white hover:bg-[#1a9149]")}
              >
                <WhatsAppIcon className="size-4" />
                {t("whatsappAction")}
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-primary-foreground/15 p-6 sm:border-t-0 sm:p-8">
            <div className="min-w-0">
              <h3 className="flex items-center gap-2 text-sm font-medium text-primary-foreground/80">
                <Mail className="size-4" aria-hidden />
                {t("emailTitle")}
              </h3>
              <a
                href={mailto}
                dir="ltr"
                className="mt-2 block break-all text-start text-lg font-semibold leading-snug underline-offset-4 hover:underline rtl:text-end sm:text-xl"
              >
                {SUPPORT_EMAIL}
              </a>
              <p className="mt-2 text-[13px] text-primary-foreground/70">{t("emailHint")}</p>
            </div>
            <div className="mt-auto flex gap-2">
              <a href={mailto} className={cn(actionClass, "flex-1 bg-primary-foreground text-primary hover:bg-primary-foreground/90")}>
                <Mail className="size-4" aria-hidden />
                {t("emailAction")}
              </a>
              <CopyButton value={SUPPORT_EMAIL} label={t("copyEmail")} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Lowercase, no Arabic diacritics/tatweel, and one form for alef, taa marbuta and yaa. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[ً-ْـ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي");
}

export function FaqBrowser({ topics }: { topics: FaqTopicView[] }) {
  const t = useTranslations("help");
  const searchId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string[]>([]);

  const q = normalize(query.trim());
  const visible = useMemo(
    () =>
      topics
        .map((topic) => ({
          ...topic,
          faqs: q ? topic.faqs.filter((f) => normalize(`${f.question} ${f.answer}`).includes(q)) : topic.faqs,
        }))
        .filter((topic) => topic.faqs.length > 0),
    [topics, q]
  );
  const matches = visible.reduce((n, topic) => n + topic.faqs.length, 0);

  return (
    <section aria-labelledby="help-faq-title" className="min-w-0">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <h2 id="help-faq-title" className="text-xl font-semibold">
          {t("faqTitle")}
        </h2>
        <div className="relative w-full sm:w-72">
          <label htmlFor={searchId} className="sr-only">
            {t("searchLabel")}
          </label>
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => {
              const next = e.target.value;
              setQuery(next);
              // While searching, open every matching answer so it can be read at a glance.
              const nq = normalize(next.trim());
              setOpen(
                nq
                  ? topics.flatMap((topic) =>
                      topic.faqs.filter((f) => normalize(`${f.question} ${f.answer}`).includes(nq)).map((f) => f.key)
                    )
                  : []
              );
            }}
            placeholder={t("searchPlaceholder")}
            className="ps-9"
          />
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {q ? t("searchResults", { count: matches }) : ""}
      </p>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed p-6 text-sm">
          <p className="font-medium">{t("noResults", { query: query.trim() })}</p>
          <p className="mt-1 text-muted-foreground">{t("noResultsHint")}</p>
        </div>
      ) : (
        <Accordion type="multiple" value={open} onValueChange={setOpen} className="space-y-6">
          {visible.map((topic) => (
            <div key={topic.key}>
              <h3 className="mb-1 text-[13px] font-semibold text-primary-ink">{topic.title}</h3>
              <div className="rounded-xl border bg-card px-4">
                {topic.faqs.map((faq) => (
                  <AccordionItem key={faq.key} value={faq.key} className="last:border-b-0">
                    <AccordionTrigger className="text-start text-[15px]">{faq.question}</AccordionTrigger>
                    <AccordionContent>
                      <p className="max-w-[68ch] text-pretty leading-relaxed text-muted-foreground">{faq.answer}</p>
                      {faq.link && (
                        <Link
                          href={faq.link.href}
                          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary-ink underline-offset-4 hover:underline"
                        >
                          {faq.link.label}
                          <ArrowUpRight className="size-3.5 rtl:-scale-x-100" aria-hidden />
                        </Link>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </div>
            </div>
          ))}
        </Accordion>
      )}
    </section>
  );
}
