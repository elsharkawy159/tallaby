import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ChevronRight, Compass, PlayCircle } from "lucide-react";
import { getBillingState } from "@workspace/lib/billing/server";
import { PageContainer, PageHeader, Row, Rows, SectionCard, Tag } from "@/components/seller-ui";
import { requireSeller } from "@/lib/auth/require-seller.server";
import { getSellerStores } from "@/lib/stores/current-store.server";
import { storeBuilderEnabled } from "@/components/dashboard/sidebar.config";
import { HELP_SHORTCUTS, HELP_TOPICS, HELP_VIDEOS, USD_ANSWER_FAQS, resolveHelpLink } from "./help.lib";
import { ContactDesk, FaqBrowser, type FaqTopicView } from "./help.client";

/**
 * Help & support: a direct line to the team, a searchable FAQ whose answers
 * link into the seller's own pages, and the (coming) video tutorials.
 * The selected store only fills navigation links (never a write target).
 */
export async function HelpData() {
  const [seller, { selected }, t, tNav, billing] = await Promise.all([
    requireSeller(),
    getSellerStores(),
    getTranslations("help"),
    getTranslations("nav"),
    getBillingState(),
  ]);
  const ctx = { storeId: selected?.id ?? null, builder: storeBuilderEnabled(seller.sellerId) };

  const topics: FaqTopicView[] = HELP_TOPICS.map((topic) => ({
    key: topic.key,
    title: t(`topics.${topic.key}`),
    faqs: topic.faqs.map((faq) => {
      const link = resolveHelpLink(faq.link, ctx);
      return {
        key: faq.key,
        question: t(`faqs.${faq.key}.question`),
        answer: t(billing.usdLive && USD_ANSWER_FAQS.has(faq.key) ? `faqs.${faq.key}.answerUsd` : `faqs.${faq.key}.answer`),
        link: link ? { href: link.href, label: t("openPage", { page: tNav(link.nav) }) } : null,
      };
    }),
  }));
  const shortcuts = HELP_SHORTCUTS.flatMap((s) => {
    const link = resolveHelpLink(s, ctx);
    return link ? [{ href: link.href, label: tNav(link.nav) }] : [];
  });

  return (
    <PageContainer>
      <PageHeader title={t("contactTitle")} description={t("contactSubtitle")} />
      <ContactDesk storeName={selected?.name ?? null} />

      <div className="grid grid-cols-[minmax(0,1fr)_20rem] items-start gap-3.5 max-[1020px]:grid-cols-1">
        <FaqBrowser topics={topics} />

        <aside className="flex min-w-0 flex-col gap-3.5">
          <SectionCard icon={Compass} title={t("shortcutsTitle")} description={t("shortcutsSubtitle")}>
            <Rows>
              {shortcuts.map((s) => (
                <Link key={s.href + s.label} href={s.href} className="no-underline [&+&]:border-t [&+&]:border-(--s-line-soft)">
                  <Row title={s.label} end={<ChevronRight className="size-4 text-(--s-subtle) rtl:rotate-180" aria-hidden />} />
                </Link>
              ))}
            </Rows>
          </SectionCard>

          <SectionCard
            icon={PlayCircle}
            tone="neutral"
            title={
              <>
                {t("videosTitle")}
                <Tag>{t("comingSoon")}</Tag>
              </>
            }
            description={t("videosSubtitle")}
          >
            <ul className="flex flex-col gap-2" aria-label={t("videosPlanned")}>
              {HELP_VIDEOS.map((key) => (
                <li key={key} className="flex items-center gap-2.5 text-[13px] text-(--s-muted)">
                  <PlayCircle className="size-4 shrink-0 text-(--s-faint)" aria-hidden />
                  {t(`videos.${key}`)}
                </li>
              ))}
            </ul>
          </SectionCard>
        </aside>
      </div>
    </PageContainer>
  );
}
