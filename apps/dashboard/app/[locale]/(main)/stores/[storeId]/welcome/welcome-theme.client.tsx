"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, LayoutTemplate, LoaderCircle, RotateCcw, Sparkles } from "lucide-react";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Link, useRouter } from "@/i18n/navigation";
import { EmptyState, Modal, SellerButton } from "@/components/seller-ui";
import { requestSetupPromptCheck } from "../../../_components/setup-prompts.lib";
import { TemplateCard } from "../website/templates/template-card.client";
import { TemplatePreview } from "../website/templates/template-preview.client";
import { applyTemplate, listTemplatesPage } from "../website/templates/templates.server";
import type { TemplateCardView, TemplatesPageView } from "../website/templates/templates.dto";
import { cardEdition } from "../website/templates/templates.lib";

type Localized = { ar?: string; en?: string };

/** How many of the most relevant themes the step shows; the rest are in Website › Templates. */
const SHOWN = 6;

/** The gallery's first page, "All", no search, no niche: the same React Query key, so both share one cache. */
const firstPageKey = (storeId: string) => ["store-templates", storeId, 1, { category: null, q: "", niche: null }];

/**
 * The theme step: the six themes that fit the store best (`listTemplatesPage`
 * sorts by its industry and niche, shown above the cards as `industry`), each
 * with Preview and Use. Using one is the gallery's `applyTemplate` (a
 * never-published store goes live with it only when it already has a
 * published product; owner, 2026-11-17), then the page refreshes in place.
 */
export function WelcomeThemeStep({
  storeId,
  done,
  needsConfirm,
  disabled,
  fontClassName,
  industry,
}: {
  storeId: string;
  done: boolean;
  /** Ask before applying (`welcomeThemeNeedsConfirm`): everywhere but a never-published store with no template yet. */
  needsConfirm: boolean;
  disabled: boolean;
  fontClassName: string;
  /** The "what you sell" line with its change link. */
  industry: React.ReactNode;
}) {
  const t = useTranslations("websiteTemplates");
  const tw = useTranslations("storeWelcome.steps.theme");
  const locale = useLocale() === "en" ? "en" : "ar";
  const router = useRouter();
  const queryClient = useQueryClient();
  const [previewing, setPreviewing] = useState<TemplateCardView | null>(null);
  const [confirming, setConfirming] = useState<{ template: TemplateCardView; edition: string | null } | null>(null);
  const [isPending, startTransition] = useTransition();

  const query = useQuery({
    queryKey: firstPageKey(storeId),
    queryFn: async (): Promise<TemplatesPageView> => {
      const result = await listTemplatesPage(storeId, { page: 1 });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    retry: 1,
  });
  const data = query.data;

  const text = (value: Localized) => value[locale] || value.ar || value.en || "";
  const categoryName = (value: string) => (t.has(`categories.${value}`) ? t(`categories.${value}`) : value);
  const nicheCardOf = (template: TemplateCardView) => data?.nicheCards?.[template.key] ?? null;
  const editionOf = (template: TemplateCardView) => cardEdition(template, data?.niche ?? null, nicheCardOf(template));
  const editionName = (template: TemplateCardView, edition: string | null) => {
    const card = nicheCardOf(template);
    if (card) return text(card.name);
    const found = edition ? template.editions?.find((option) => option.id === edition) : undefined;
    return found ? text(found.name) : "";
  };

  const onApply = (template: TemplateCardView, edition: string | null) =>
    startTransition(async () => {
      const result = await applyTemplate(storeId, template.key, edition);
      setConfirming(null);
      if (!result.success) {
        toast.error(t(`errors.${result.error}`));
        return;
      }
      // Still offline for lack of a published product: say what makes it live (the product step is on this page).
      toast.success(t(result.data.needsProduct ? "appliedNeedsProduct" : result.data.published ? "appliedPublished" : "applied", { name: text(template.name) }));
      void queryClient.invalidateQueries({ queryKey: ["store-templates", storeId] });
      router.refresh();
      requestSetupPromptCheck();
    });

  // The first theme of a never-published store applies at once: nothing of the seller's is replaced yet. Every other case asks.
  const requestUse = (template: TemplateCardView, edition: string | null) =>
    needsConfirm ? setConfirming({ template, edition }) : onApply(template, edition);

  const currentName = data?.currentKey ? text(data.currentName ?? {}) || data.currentKey : "";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col">
        {done && currentName && <p className="text-[13.5px] font-semibold text-(--s-ink)">{tw("current", { name: currentName })}</p>}
        {industry}
      </div>

      {!data && query.isPending && (
        <div role="status" aria-label={t("loading")} className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="aspect-[3/4] w-full rounded-2xl" />
          ))}
        </div>
      )}
      {!data && query.isError && (
        <EmptyState
          icon={LayoutTemplate}
          title={t("loadFailed")}
          action={
            <SellerButton variant="mini" size="sm" onClick={() => void query.refetch()}>
              <RotateCcw aria-hidden />
              {t("retry")}
            </SellerButton>
          }
        />
      )}
      {data && (
        // Phones: one row that scrolls sideways, so six tall cards don't push the next steps away.
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-x-4 gap-y-6 max-[600px]:-mx-1 max-[600px]:flex max-[600px]:snap-x max-[600px]:snap-mandatory max-[600px]:overflow-x-auto max-[600px]:px-1 max-[600px]:pb-2 max-[600px]:[&>li]:w-[72%] max-[600px]:[&>li]:shrink-0 max-[600px]:[&>li]:snap-start">
          {data.items.slice(0, SHOWN).map((template) => {
            const edition = editionOf(template);
            return (
              <TemplateCard
                key={template.key}
                storeId={storeId}
                template={template}
                current={template.key === data.currentKey}
                edition={edition}
                nicheTag={editionName(template, edition)}
                categoryName={categoryName(template.category)}
                fontClassName={fontClassName}
                disabled={disabled || isPending}
                onPreview={() => setPreviewing(template)}
                onUse={() => requestUse(template, edition)}
                compact
              />
            );
          })}
        </ul>
      )}
      <Link href={`/stores/${storeId}/website/templates`} className="inline-flex min-h-11 items-center self-start text-[13px] font-bold text-(--s-link) underline-offset-4 hover:underline">
        {tw("seeAll")}
      </Link>

      <TemplatePreview
        storeId={storeId}
        template={previewing}
        current={previewing?.key === data?.currentKey}
        disabled={disabled || isPending || Boolean(previewing?.isPremium)}
        uiLocale={locale}
        fontClassName={fontClassName}
        categoryName={previewing ? editionName(previewing, editionOf(previewing)) || categoryName(previewing.category) : ""}
        editionId={previewing ? editionOf(previewing) : null}
        onUse={(template) => {
          setPreviewing(null);
          requestUse(template, editionOf(template));
        }}
        onOpenChange={(value) => !value && setPreviewing(null)}
      />

      <Modal
        open={confirming !== null}
        onOpenChange={(value) => !value && !isPending && setConfirming(null)}
        title={t("confirm.title", { name: text(confirming?.template.name ?? {}) })}
        description={t("confirm.description")}
        footer={
          <>
            <SellerButton variant="outline" disabled={isPending} onClick={() => setConfirming(null)}>
              {t("cancel")}
            </SellerButton>
            <SellerButton disabled={isPending} onClick={() => confirming && onApply(confirming.template, confirming.edition)}>
              {isPending ? <LoaderCircle className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />}
              {t("confirm.action")}
            </SellerButton>
          </>
        }
      >
        <ul className="flex flex-col gap-1.5 text-[13px] text-(--s-muted)">
          {[t("confirm.keeps"), t("confirm.untouched")].map((line) => (
            <li key={line} className="flex items-start gap-2">
              <Check className="mt-1 size-3.5 shrink-0 text-success" aria-hidden />
              {line}
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  );
}
