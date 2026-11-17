"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Modal, SellerButton } from "@/components/seller-ui";
import { IndustryNichePicker } from "@/components/stores/industry-niche-picker.client";
import { STORE_INDUSTRIES, type StoreIndustry } from "@/lib/stores/industries.lib";
import { requestSetupPromptCheck } from "../../../_components/setup-prompts.lib";
import { saveStoreGeneral } from "../settings/store-settings.server";
import type { WelcomeData } from "./welcome.types";

/**
 * Inside the theme step: what the store sells, as one line with a "change"
 * link. The link opens the same chips as Store settings › General; saving
 * re-sorts the themes (they are sorted by the industry and niche).
 */
export function WelcomeIndustryLine({ storeId, industry: data, disabled }: { storeId: string; industry: WelcomeData["industry"]; disabled: boolean }) {
  const t = useTranslations("storeWelcome.steps.industry");
  const tSettings = useTranslations("storeSettings");
  const uiLocale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [saving, startSaving] = useTransition();
  const saved = STORE_INDUSTRIES.find((option) => option.id === data.id) ?? null;
  const [industry, setIndustry] = useState<StoreIndustry | null>(saved);
  const [niche, setNiche] = useState(data.savedNiche);

  const industryName = saved
    ? uiLocale === "en"
      ? saved.en
      : saved.ar
    : (uiLocale === "en" ? data.category.en || data.category.ar : data.category.ar || data.category.en) || "";
  const nicheName = saved && data.shownNiche ? (data.nicheOptions[saved.id] ?? []).find((option) => option.id === data.shownNiche)?.name : undefined;
  const changed = industry !== null && (industry.id !== saved?.id || niche !== data.savedNiche);

  const openEditor = () => {
    setIndustry(saved);
    setNiche(data.savedNiche);
    setEditing(true);
  };

  const onSave = () =>
    startSaving(async () => {
      if (!industry) return;
      const result = await saveStoreGeneral(storeId, { storeCategory: industry.en, storeCategoryAr: industry.ar, niche: niche || null });
      if (!result.success) {
        toast.error(tSettings(`errors.${result.error}`));
        return;
      }
      toast.success(t("saved"));
      setEditing(false);
      // The themes are sorted by the industry and niche.
      void queryClient.invalidateQueries({ queryKey: ["store-templates", storeId] });
      router.refresh();
      requestSetupPromptCheck();
    });

  return (
    <>
      <p className="flex flex-wrap items-center gap-x-2 text-[13px] text-(--s-muted)">
        {industryName ? (
          <span>
            {t.rich(nicheName ? "labelNiche" : "label", {
              industry: industryName,
              niche: nicheName ?? "",
              b: (chunks) => <b className="font-bold text-(--s-ink)">{chunks}</b>,
            })}
          </span>
        ) : (
          <span>{t("empty")}</span>
        )}
        <button
          type="button"
          disabled={disabled}
          onClick={openEditor}
          className="inline-flex min-h-11 cursor-pointer items-center rounded-[10px] px-1 text-[13px] font-bold text-(--s-link) underline-offset-4 hover:underline disabled:pointer-events-none disabled:opacity-45"
        >
          {t(industryName ? "change" : "choose")}
        </button>
      </p>

      <Modal
        open={editing}
        onOpenChange={(value) => !value && !saving && setEditing(false)}
        title={t("modalTitle")}
        width={560}
        footer={
          <>
            <SellerButton variant="outline" disabled={saving} onClick={() => setEditing(false)}>
              {t("cancel")}
            </SellerButton>
            <SellerButton variant="solid" disabled={saving || !changed} onClick={onSave}>
              {saving && <LoaderCircle className="animate-spin" aria-hidden />}
              {t("save")}
            </SellerButton>
          </>
        }
      >
        <IndustryNichePicker
          industryId={industry?.id ?? null}
          nicheId={niche}
          niches={industry ? (data.nicheOptions[industry.id] ?? []) : []}
          disabled={saving}
          onIndustryChange={(option) => {
            // Another industry has other niches: the niche starts again.
            if (industry?.id !== option.id) setNiche("");
            setIndustry(option);
          }}
          onNicheChange={setNiche}
        />
      </Modal>
    </>
  );
}
