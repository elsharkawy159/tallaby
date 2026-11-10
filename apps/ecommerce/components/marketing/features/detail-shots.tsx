import * as React from "react";
import { Activity, Check, Copy, Globe, KeyRound, Lock, RefreshCw } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { DashFrame, MockButton, MockCard, MockCardHead, MockCode, MockField, MockPill, MockTable, MockToggle } from "@/components/marketing/pages/dash-mock";
import type { DetailShot, DetailStepVisual } from "@/lib/marketing/detail-pages.lib";
import { MoreShotView, moreStepContent } from "./detail-shots-more";

/** The real records the dashboard asks for (apps/dashboard settings/custom-domain.client.tsx). */
const DNS_ROWS = [
  ["A", "@", "76.76.21.21"],
  ["CNAME", "www", "cname.vercel-dns.com"],
] as const;
const SAMPLE_PIXEL = "128455390172664";
const SAMPLE_DOMAIN = "glowskin.com";

async function DomainShot() {
  const t = await getTranslations("detailPages.custom-domain.mock");
  return (
    <DashFrame active="website" title={t("title")}>
      <div className="flex items-end justify-between gap-2.5">
        <div>
          <b className="block text-base text-[#171717]">{t("title")}</b>
          <small className="text-[11.5px] text-[#808080]">{t("path")}</small>
        </div>
        <MockPill>{t("live")}</MockPill>
      </div>
      <MockCard>
        <MockCardHead title={t("ownTitle")} hint={t("ownHint")} end={<MockPill>{t("live")}</MockPill>} />
        <div className="flex items-center gap-2">
          <MockField on>
            <Globe />
            {SAMPLE_DOMAIN}
          </MockField>
          <MockButton>
            <RefreshCw />
            {t("check")}
          </MockButton>
        </div>
        <span className="flex items-center gap-2 text-xs font-semibold text-[#15803d]">
          <Lock className="size-[15px]" />
          {t("ssl")}
        </span>
      </MockCard>
      <MockCard className="gap-0 overflow-hidden p-0">
        <div className="px-3.5 pt-3 pb-1">
          <MockCardHead title={t("dnsTitle")} hint={t("dnsHint")} />
        </div>
        <MockTable head={[t("type"), t("name"), t("value")]} rows={DNS_ROWS.map((row) => row.map((cell) => <MockCode key={cell}>{cell}</MockCode>))} />
      </MockCard>
      <MockCard>
        <MockCardHead title={t("freeTitle")} hint={t("freeHint")} />
        <MockField>
          glow<span className="font-medium text-[#808080]">.tallaby.com</span>
        </MockField>
      </MockCard>
    </DashFrame>
  );
}

async function PixelShot() {
  const t = await getTranslations("detailPages.meta-pixel.mock");
  const events = ["ViewContent", "AddToCart", "InitiateCheckout", "Purchase"];
  return (
    <DashFrame active="apps" title={t("apps")}>
      <div className="flex items-end justify-between gap-2.5">
        <div>
          <b className="block font-latin text-base text-[#171717]">Meta Pixel</b>
          <small className="text-[11.5px] text-[#808080]">{t("path")}</small>
        </div>
        <MockPill>{t("connected")}</MockPill>
      </div>
      <MockCard>
        <MockCardHead
          title={t("idTitle")}
          hint={t("idHint")}
          end={
            <span className="grid size-[34px] flex-none place-items-center rounded-[10px] bg-[#eef3f4] text-teal-700">
              <Activity className="size-[17px]" />
            </span>
          }
        />
        <MockField on>{SAMPLE_PIXEL}</MockField>
      </MockCard>
      <MockCard>
        <MockCardHead title="Conversions API" hint={t("capiHint")} end={<MockToggle />} />
        <MockField>
          <KeyRound />
          EAAG••••••••••••••••
        </MockField>
      </MockCard>
      <MockCard>
        <MockCardHead title={t("eventsTitle")} hint={t("eventsHint")} />
        <div className="grid gap-1.5">
          {events.map((name) => (
            <div key={name} className="flex items-center justify-between gap-2 rounded-[9px] bg-[#f7faf9] px-2.5 py-[7px]">
              <b className="font-latin text-xs text-[#171717]">{name}</b>
              <MockToggle />
            </div>
          ))}
        </div>
      </MockCard>
    </DashFrame>
  );
}

export function DetailShotView({ shot, slug, partner }: { shot: DetailShot; slug: string; partner?: string }) {
  if (shot === "domain") return <DomainShot />;
  if (shot === "pixel") return <PixelShot />;
  return <MoreShotView shot={shot} slug={slug} partner={partner} />;
}

/** The small picture beside a step. Its words live under the page's `mock`. */
export async function StepVisual({ visual, slug, partner }: { visual: DetailStepVisual; slug: string; partner?: string }) {
  const t = await getTranslations(`detailPages.${slug}.mock`);
  const label = (text: string) => <span className="text-[11px] font-semibold text-[#808080]">{text}</span>;
  const content: Record<DetailStepVisual, () => React.ReactNode> = {
    ...moreStepContent(t, partner),
    registrar: () => (
      <>
        {label(t("registrarLabel"))}
        <MockField>
          glowskin<span className="font-medium text-[#808080]">.com</span>
        </MockField>
        <MockPill className="self-start">{t("available")}</MockPill>
      </>
    ),
    connect: () => (
      <>
        {label(t("ownTitle"))}
        <div className="flex items-center gap-2">
          <MockField on>{SAMPLE_DOMAIN}</MockField>
          <MockButton>{t("connect")}</MockButton>
        </div>
      </>
    ),
    dns: () => <MockTable head={[t("type"), t("name"), t("value")]} rows={DNS_ROWS.map((row) => row.map((cell) => <MockCode key={cell}>{cell}</MockCode>))} />,
    status: () => (
      <>
        <div className="flex items-center justify-between gap-2">
          <MockCode>{SAMPLE_DOMAIN}</MockCode>
          <MockPill tone="amber">{t("pending")}</MockPill>
        </div>
        <div className="flex items-center justify-between gap-2">
          <MockCode>{SAMPLE_DOMAIN}</MockCode>
          <MockPill>{t("live")}</MockPill>
        </div>
      </>
    ),
    copyId: () => (
      <>
        <span dir="ltr" className="text-[11px] font-semibold text-[#808080] rtl:text-right">
          Events Manager › Data sources
        </span>
        <div className="flex items-center gap-2">
          <MockField>{SAMPLE_PIXEL}</MockField>
          <MockButton>
            <Copy />
          </MockButton>
        </div>
      </>
    ),
    openApp: () => (
      <MockCard>
        <MockCardHead
          title="Meta Pixel"
          hint={t("appHint")}
          end={<MockButton>{t("connect")}</MockButton>}
        />
      </MockCard>
    ),
    pasteId: () => (
      <>
        <MockField on>{SAMPLE_PIXEL}</MockField>
        <div className="flex items-center justify-between gap-2">
          <b className="font-latin text-xs">Conversions API</b>
          <MockToggle />
        </div>
      </>
    ),
    testEvents: () => (
      <>
        {label("Test Events")}
        {["PageView", "AddToCart"].map((name) => (
          <div key={name} className="flex items-center justify-between gap-2 rounded-[9px] bg-white px-2.5 py-[7px]">
            <b className="font-latin text-xs text-[#171717]">{name}</b>
            <Check className="size-3.5 text-[#16a34a]" />
          </div>
        ))}
      </>
    ),
  };
  return (
    <div aria-hidden className="flex min-h-[120px] min-w-0 flex-col justify-center gap-2 overflow-hidden rounded-2xl border border-[#e7e9e8] bg-[#f4f6f6] p-3.5 text-xs text-[#333]">
      {content[visual]()}
    </div>
  );
}
