"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowUpRight, Copy, Mail, MessagesSquare, Search } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import { EmptyState, IconButton, SectionCard, SellerButton, SellerCard, TwoColumns } from "@/components/seller-ui";
import { SUPPORT_EMAIL, SUPPORT_WHATSAPP_HANDLE } from "@/lib/constants";
import { useSupportWhatsAppUrl, WhatsAppIcon } from "@/components/dashboard/support-chat-link.client";
import { SearchPill } from "../orders/orders-ui";

export type FaqTopicView = {
  key: string;
  title: string;
  faqs: { key: string; question: string; answer: string; link: { href: string; label: string } | null }[];
};

function CopyButton({ value, label }: { value: string; label: string }) {
  const t = useTranslations("help");
  return (
    <IconButton
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
      className="size-[42px]"
    >
      <Copy aria-hidden />
    </IconButton>
  );
}

/** The two real ways to reach the team, with the number and address in full. */
export function ContactDesk({ storeName }: { storeName: string | null }) {
  const t = useTranslations("help");
  const whatsAppUrl = useSupportWhatsAppUrl();
  const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    storeName ? t("emailSubject", { store: storeName }) : t("emailSubjectNoStore")
  )}`;

  return (
    <TwoColumns className="items-stretch gap-3.5">
      <SellerCard className="flex flex-col gap-3 p-6 max-[720px]:p-4">
        <h2 className="flex items-center gap-2 text-[14px] font-bold text-(--s-ink)">
          <WhatsAppIcon className="size-4 text-(--s-whatsapp)" />
          {t("whatsappTitle")}
        </h2>
        <a
          href={whatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          dir="ltr"
          className="block py-2 text-start font-montserrat text-2xl font-bold leading-none tracking-tight text-(--s-ink) tabular-nums underline-offset-4 hover:underline rtl:text-end"
        >
          {SUPPORT_WHATSAPP_HANDLE}
        </a>
        <p className="text-[13px] text-(--s-subtle)">{t("whatsappHint")}</p>
        <SellerButton asChild variant="whatsapp" className="mt-auto w-full">
          <a href={whatsAppUrl} target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon className="size-4" />
            {t("whatsappAction")}
          </a>
        </SellerButton>
      </SellerCard>

      <SellerCard className="flex flex-col gap-3 p-6 max-[720px]:p-4">
        <h2 className="flex items-center gap-2 text-[14px] font-bold text-(--s-ink)">
          <Mail className="size-4 text-(--s-primary)" aria-hidden />
          {t("emailTitle")}
        </h2>
        <a
          href={mailto}
          dir="ltr"
          className="block break-all py-2 text-start font-montserrat text-xl font-bold leading-snug text-(--s-ink) underline-offset-4 hover:underline rtl:text-end"
        >
          {SUPPORT_EMAIL}
        </a>
        <p className="text-[13px] text-(--s-subtle)">{t("emailHint")}</p>
        <div className="mt-auto flex items-center gap-2">
          <SellerButton asChild variant="solid" className="flex-1">
            <a href={mailto}>
              <Mail aria-hidden />
              {t("emailAction")}
            </a>
          </SellerButton>
          <CopyButton value={SUPPORT_EMAIL} label={t("copyEmail")} />
        </div>
      </SellerCard>
    </TwoColumns>
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
    <SectionCard icon={MessagesSquare} title={t("faqTitle")} aria-label={t("faqTitle")}>
      {/* A row of its own: SearchPill's flex-basis is meant for a row, not this column. */}
      <div className="flex">
      <SearchPill
        id={searchId}
        value={query}
        aria-label={t("searchLabel")}
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
      />
      </div>

      <p className="sr-only" aria-live="polite">
        {q ? t("searchResults", { count: matches }) : ""}
      </p>

      {visible.length === 0 ? (
        <EmptyState icon={Search} title={t("noResults", { query: query.trim() })} description={t("noResultsHint")} />
      ) : (
        <Accordion type="multiple" value={open} onValueChange={setOpen} className="flex flex-col gap-5">
          {visible.map((topic) => (
            <div key={topic.key}>
              <h3 className="mb-1.5 text-xs font-bold text-(--s-faint)">{topic.title}</h3>
              <div className="rounded-[20px] border border-(--s-line) bg-(--s-surface) px-4">
                {topic.faqs.map((faq) => (
                  <AccordionItem key={faq.key} value={faq.key} className="border-(--s-line-soft) last:border-b-0">
                    <AccordionTrigger className="rounded-none bg-transparent px-0 text-start text-[14px] font-bold text-(--s-text)">{faq.question}</AccordionTrigger>
                    <AccordionContent>
                      <p className="max-w-[68ch] text-pretty text-[13.5px] leading-[1.8] text-(--s-muted)">{faq.answer}</p>
                      {faq.link && (
                        <Link
                          href={faq.link.href}
                          className="mt-3 inline-flex min-h-10 items-center gap-1 text-[13px] font-bold text-(--s-link) underline-offset-4 hover:underline"
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
    </SectionCard>
  );
}
