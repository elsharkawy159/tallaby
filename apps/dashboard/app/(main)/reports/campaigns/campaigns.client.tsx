"use client";

import { useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Copy, Link2 } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { cn } from "@workspace/ui/lib/utils";
import {
  CAMPAIGN_PRESETS,
  CAMPAIGN_PRESET_KEYS,
  buildCampaignUrl,
  type CampaignPreset,
} from "@workspace/lib/campaigns/utm";
import { HomeCard, HomeCardHeader } from "../../_components/home-ui";
import type { LinkBuilderProduct } from "./campaigns.server";

/* Reports › Campaigns (ROADMAP.md F-26a): tabs and the campaign link builder. */

/** Overview | Campaigns, keeping the selected store and period. */
export function ReportsTabs() {
  const t = useTranslations("campaignReport.tabs");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const tabs = [
    { href: "/reports", label: t("overview") },
    { href: "/reports/campaigns", label: t("campaigns") },
  ];
  return (
    <nav aria-label={t("label")} className="flex gap-1 rounded-[12px] bg-muted p-1 text-[13px] sm:w-fit">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={query ? `${tab.href}?${query}` : tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex-1 rounded-[9px] px-4 py-1.5 text-center font-medium text-muted-foreground transition-colors sm:flex-none",
              active ? "bg-card text-foreground shadow-xs" : "hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

const HOME = "home";

export function CampaignLinkBuilder({ storeUrl, products }: { storeUrl: string; products: LinkBuilderProduct[] }) {
  const t = useTranslations("campaignReport.builder");
  const [preset, setPreset] = useState<CampaignPreset>("facebook");
  const [page, setPage] = useState<string>(HOME);
  const [source, setSource] = useState<string>(CAMPAIGN_PRESETS.facebook.source);
  const [medium, setMedium] = useState<string>(CAMPAIGN_PRESETS.facebook.medium);
  const [campaign, setCampaign] = useState("");
  const [content, setContent] = useState("");

  const base = page === HOME ? storeUrl : (products.find((p) => p.id === page)?.url ?? storeUrl);
  const result = useMemo(
    () => buildCampaignUrl(base, { source, medium, campaign, content }),
    [base, source, medium, campaign, content],
  );

  const choosePreset = (key: CampaignPreset) => {
    setPreset(key);
    setSource(CAMPAIGN_PRESETS[key].source);
    setMedium(CAMPAIGN_PRESETS[key].medium);
  };

  const copy = async () => {
    if (!result.ok) return;
    try {
      await navigator.clipboard.writeText(result.url);
      toast.success(t("copied"));
    } catch {
      toast.error(result.url);
    }
  };

  const hint = !result.ok
    ? result.error === "missingSource"
      ? t(preset === "influencer" ? "errors.missingInfluencer" : "errors.missingSource")
      : result.error === "missingCampaign"
        ? t("errors.missingCampaign")
        : t("errors.invalidUrl")
    : null;

  return (
    <HomeCard aria-labelledby="link-builder-title" className="pb-5">
      <HomeCardHeader
        id="link-builder-title"
        title={
          <>
            <Link2 className="size-4 text-primary-ink" aria-hidden />
            {t("title")}
          </>
        }
        description={t("description")}
      />
      <div className="space-y-4 px-5 pt-4">
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("preset")}>
          {CAMPAIGN_PRESET_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={preset === key}
              onClick={() => choosePreset(key)}
              className={cn(
                "h-8 rounded-full border px-3.5 text-[13px] transition-colors",
                preset === key ? "border-primary bg-primary-soft font-semibold text-primary-ink" : "hover:bg-muted",
              )}
            >
              {t(`presets.${key}`)}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="utm-page">{t("page")}</Label>
            <Select value={page} onValueChange={setPage}>
              <SelectTrigger id="utm-page" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={HOME}>{t("storeHome")}</SelectItem>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="utm-source">{preset === "influencer" ? t("influencerName") : t("source")}</Label>
            <Input
              id="utm-source"
              value={source}
              maxLength={100}
              placeholder={preset === "influencer" ? t("influencerPlaceholder") : "facebook"}
              onChange={(e) => setSource(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="utm-medium">{t("medium")}</Label>
            <Input id="utm-medium" value={medium} maxLength={100} onChange={(e) => setMedium(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="utm-campaign">{t("campaign")}</Label>
            <Input
              id="utm-campaign"
              value={campaign}
              maxLength={100}
              placeholder={t("campaignPlaceholder")}
              onChange={(e) => setCampaign(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="utm-content">{t("content")}</Label>
            <Input
              id="utm-content"
              value={content}
              maxLength={100}
              placeholder={t("contentPlaceholder")}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="utm-url">{t("result")}</Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="utm-url"
              readOnly
              dir="ltr"
              value={result.ok ? result.url : ""}
              placeholder={hint ?? ""}
              className="font-mono text-xs"
              onFocus={(e) => e.currentTarget.select()}
            />
            <Button type="button" onClick={copy} disabled={!result.ok} className="shrink-0">
              <Copy className="size-4" aria-hidden />
              {t("copy")}
            </Button>
          </div>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
      </div>
    </HomeCard>
  );
}
