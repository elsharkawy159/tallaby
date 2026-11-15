"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Footprints, LoaderCircle, Plus, Ruler, Shirt, Sparkles, Tags } from "lucide-react";

import {
  SIZE_CHART_LIMITS,
  SIZE_CHART_TEMPLATES,
  sizeChartFromTemplate,
  type SizeChartDefinition,
  type SizeChartName,
  type SizeChartTemplateKey,
} from "@workspace/lib/size-charts";
import type { StoreSizeChart } from "@workspace/lib/size-charts/server";
import { EmptyState, Modal, Note, SectionCard, SellerButton, SellerCard, StatusBadge, Tag, Toggle } from "@/components/seller-ui";
import { SizeChartEditor } from "./size-chart-editor.client";
import { SizeChartTargets } from "./size-chart-targets.client";
import { setSizeChartAppInstalled } from "./size-chart.server";
import type { SizeChartCategoryOption } from "./size-chart.dto";
import { pickText } from "./size-chart-form.lib";

type Draft = { id: string | null; name: SizeChartName; definition: SizeChartDefinition };

const TEMPLATE_ICONS: Record<SizeChartTemplateKey | "blank", typeof Shirt> = {
  tops: Shirt,
  pants: Ruler,
  shoes: Footprints,
  dresses: Sparkles,
  blank: Plus,
};

/**
 * Store › Apps › Size chart (ROADMAP.md F-92). The seller installs the app,
 * makes charts from a Tallaby template (or blank), edits every number, and
 * applies each chart to products or store categories. Removing the app keeps
 * the charts: the storefront just stops showing them.
 */
export function SizeChartApp({
  storeId,
  installed,
  readOnly,
  charts,
  categories,
}: {
  storeId: string;
  installed: boolean;
  readOnly: boolean;
  charts: StoreSizeChart[];
  categories: SizeChartCategoryOption[];
}) {
  const t = useTranslations("sizeChartApp");
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [choosing, setChoosing] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [targeting, setTargeting] = useState<StoreSizeChart | null>(null);
  const atLimit = charts.length >= SIZE_CHART_LIMITS.chartsPerStore;
  const categoryName = new Map(categories.map((category) => [category.id, category.name]));

  const toggleApp = (next: boolean) => {
    startTransition(async () => {
      const result = await setSizeChartAppInstalled(storeId, next);
      if (!result.success) {
        toast.error(t(`errors.${result.error}`));
        return;
      }
      toast.success(next ? t("install.installed") : t("install.removed"));
      router.refresh();
    });
  };

  const start = (key: SizeChartTemplateKey | "blank") => {
    setChoosing(false);
    setDraft({ id: null, ...sizeChartFromTemplate(key) });
  };

  if (draft) {
    return (
      <SizeChartEditor
        storeId={storeId}
        initial={draft}
        readOnly={readOnly}
        onClose={() => setDraft(null)}
        onSaved={() => {
          setDraft(null);
          router.refresh();
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">

      <SellerCard className="flex flex-wrap items-center gap-4 px-6 py-5 max-[720px]:px-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <b className="text-[15px] text-(--s-ink)">{t("install.title")}</b>
            {installed ? <StatusBadge tone="success">{t("install.on")}</StatusBadge> : <Tag>{t("install.off")}</Tag>}
          </div>
          <p className="mt-1 text-pretty text-[13px] text-(--s-subtle)">{installed ? t("install.onBody") : t("install.offBody")}</p>
        </div>
        <Toggle
          checked={installed}
          disabled={pending || readOnly}
          onCheckedChange={toggleApp}
          label={<span className="sr-only">{t("install.title")}</span>}
        />
        {pending && <LoaderCircle className="size-4 animate-spin text-(--s-subtle)" aria-hidden />}
      </SellerCard>

      {readOnly && <Note tone="amber">{t("readOnly")}</Note>}

      <SectionCard
        icon={Ruler}
        title={t("charts.title")}
        description={t("charts.description", { max: SIZE_CHART_LIMITS.chartsPerStore })}
        action={
          !readOnly && (
            <SellerButton size="sm" variant="solid" disabled={atLimit} onClick={() => setChoosing(true)}>
              <Plus aria-hidden />
              {t("charts.new")}
            </SellerButton>
          )
        }
      >
        {charts.length === 0 ? (
          <EmptyState
            icon={Ruler}
            title={t("charts.emptyTitle")}
            description={t("charts.emptyBody")}
            action={
              !readOnly && (
                <SellerButton variant="amber" onClick={() => setChoosing(true)}>
                  {t("charts.new")}
                </SellerButton>
              )
            }
          />
        ) : (
          <ul className="flex flex-col divide-y divide-(--s-line-soft)">
            {charts.map((chart) => {
              const applied = chart.products.length + chart.categoryIds.length;
              const sizes = chart.definition.sizes.map((size) => size.label);
              return (
                <li key={chart.id} className="flex flex-wrap items-center gap-3 py-3.5 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <b dir="auto" className="block truncate text-[14.5px] text-(--s-ink)">
                      {pickText(chart.name, locale)}
                    </b>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-(--s-subtle)">
                      <span dir="ltr" className="font-montserrat tabular-nums">
                        {sizes.length > 6 ? `${sizes.slice(0, 3).join(" ")} … ${sizes.at(-1)}` : sizes.join(" ")}
                      </span>
                      <span>{chart.definition.inputs.map((input) => pickText(input.label, locale)).join("، ")}</span>
                    </p>
                    <p className="mt-1 text-xs text-(--s-muted)">
                      {applied === 0
                        ? t("charts.notApplied")
                        : [
                            chart.products.length ? t("charts.products", { count: chart.products.length }) : null,
                            ...chart.categoryIds.map((id) => categoryName.get(id)).filter(Boolean),
                          ]
                            .filter(Boolean)
                            .join(locale === "ar" ? "، " : ", ")}
                    </p>
                  </div>
                  {!readOnly && (
                    <div className="flex shrink-0 gap-2">
                      <SellerButton size="xs" variant="mini" onClick={() => setTargeting(chart)}>
                        <Tags aria-hidden />
                        {t("charts.apply")}
                      </SellerButton>
                      <SellerButton size="xs" variant="outline" onClick={() => setDraft({ id: chart.id, name: chart.name, definition: chart.definition })}>
                        {t("charts.edit")}
                      </SellerButton>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {charts.length > 0 && !installed && <Note>{t("charts.installHint")}</Note>}
      </SectionCard>

      <Modal open={choosing} onOpenChange={setChoosing} title={t("templates.title")} description={t("templates.description")} width={560}>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,230px),1fr))] gap-2">
          {([...(Object.keys(SIZE_CHART_TEMPLATES) as SizeChartTemplateKey[]), "blank"] as const).map((key) => {
            const Icon = TEMPLATE_ICONS[key];
            const sample = key === "blank" ? null : SIZE_CHART_TEMPLATES[key].definition;
            return (
              <button
                key={key}
                type="button"
                onClick={() => start(key)}
                className="flex cursor-pointer items-start gap-3 rounded-2xl border-[1.5px] border-(--s-field) bg-(--s-surface) p-3.5 text-start transition-colors hover:border-(--s-outline-hover) focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-(--s-focus)"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-(--s-tint) text-(--s-primary)">
                  <Icon className="size-[18px]" aria-hidden />
                </span>
                <span className="min-w-0">
                  <b className="block text-[13.5px] text-(--s-ink)">{t(`templates.${key}.name`)}</b>
                  <small className="block text-xs text-(--s-subtle)">{t(`templates.${key}.body`)}</small>
                  {sample && (
                    <small dir="ltr" className="mt-1 block font-montserrat text-[11px] text-(--s-faint) rtl:text-end">
                      {sample.sizes[0]!.label} – {sample.sizes.at(-1)!.label}
                    </small>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </Modal>

      <SizeChartTargets
        storeId={storeId}
        chart={targeting}
        categories={categories}
        onClose={() => setTargeting(null)}
        onSaved={() => {
          setTargeting(null);
          router.refresh();
        }}
      />
    </div>
  );
}
