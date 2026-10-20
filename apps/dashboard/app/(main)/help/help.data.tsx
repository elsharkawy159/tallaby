import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ChevronRight, PlayCircle } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { requireSeller } from "@/lib/auth/require-seller.server";
import { getSellerStores } from "@/lib/stores/current-store.server";
import { storeBuilderEnabled } from "@/components/dashboard/sidebar.config";
import { HELP_SHORTCUTS, HELP_TOPICS, HELP_VIDEOS, resolveHelpLink } from "./help.lib";
import { ContactDesk, FaqBrowser, type FaqTopicView } from "./help.client";

/**
 * Help & support: a direct line to the team, a searchable FAQ whose answers
 * link into the seller's own pages, and the (coming) video tutorials.
 * The selected store only fills navigation links (never a write target).
 */
export async function HelpData() {
  const [seller, { selected }, t, tNav] = await Promise.all([
    requireSeller(),
    getSellerStores(),
    getTranslations("help"),
    getTranslations("nav"),
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
        answer: t(`faqs.${faq.key}.answer`),
        link: link ? { href: link.href, label: t("openPage", { page: tNav(link.nav) }) } : null,
      };
    }),
  }));
  const shortcuts = HELP_SHORTCUTS.flatMap((s) => {
    const link = resolveHelpLink(s, ctx);
    return link ? [{ href: link.href, label: tNav(link.nav) }] : [];
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 sm:p-6">
      <ContactDesk storeName={selected?.name ?? null} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <FaqBrowser topics={topics} />

        <aside className="space-y-8">
          <nav aria-labelledby="help-shortcuts-title">
            <h2 id="help-shortcuts-title" className="mb-1 text-base font-semibold">
              {t("shortcutsTitle")}
            </h2>
            <p className="mb-3 text-[13px] text-muted-foreground">{t("shortcutsSubtitle")}</p>
            <ul className="divide-y rounded-xl border bg-card">
              {shortcuts.map((s) => (
                <li key={s.href + s.label}>
                  <Link
                    href={s.href}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset first:rounded-t-xl last:rounded-b-xl"
                  >
                    {s.label}
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground rtl:rotate-180" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <section aria-labelledby="help-videos-title">
            <div className="mb-1 flex items-center gap-2">
              <h2 id="help-videos-title" className="text-base font-semibold">
                {t("videosTitle")}
              </h2>
              <Badge variant="secondary">{t("comingSoon")}</Badge>
            </div>
            <p className="mb-3 text-pretty text-[13px] text-muted-foreground">{t("videosSubtitle")}</p>
            <ul className="space-y-2" aria-label={t("videosPlanned")}>
              {HELP_VIDEOS.map((key) => (
                <li key={key} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <PlayCircle className="size-4 shrink-0 opacity-60" aria-hidden />
                  {t(`videos.${key}`)}
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
