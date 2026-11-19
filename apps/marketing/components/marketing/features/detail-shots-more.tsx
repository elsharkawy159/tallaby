import * as React from "react";
import {
  Ban,
  Banknote,
  Bike,
  Check,
  CircleCheck,
  Copy,
  CreditCard,
  FileSpreadsheet,
  ImagePlus,
  KeyRound,
  MessageCircle,
  PackageCheck,
  Phone,
  Printer,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { DashFrame, MockButton, MockCard, MockCardHead, MockCode, MockField, MockPill, MockTable, MockToggle } from "@/components/marketing/pages/dash-mock";
import type { DetailStepVisual } from "@/lib/marketing/detail-pages.lib";

/**
 * Coded pictures of the real dashboard screens for the newer feature and
 * integration pages (SEO_PLAN.md §9.0): every word is under the page's
 * `detailPages.<slug>.mock`, every name and number is made up, and no customer
 * data appears. Each matches what the dashboard really shows (checked in
 * apps/dashboard: products/add/ai, orders, missed orders, shipping zones,
 * Bosta, Store settings › Payment methods).
 */

type T = Awaited<ReturnType<typeof getTranslations>>;

const SAMPLE_TRACKING = "7465012388";

function Chip({ tone = "amber", children }: { tone?: "amber" | "red"; children: React.ReactNode }) {
  const tones = { amber: "bg-[#fff4dc] text-[#8a5a00]", red: "bg-[#fdecec] text-[#b42318]" };
  return <span className={`inline-flex h-[22px] items-center gap-1 rounded-full px-2 text-[11px] font-semibold whitespace-nowrap ${tones[tone]} [&_svg]:size-3`}>{children}</span>;
}

function WhatsAppButton({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-8 items-center gap-1.5 self-start rounded-[9px] bg-[#16a34a] px-3 text-xs font-bold whitespace-nowrap text-white">
      <MessageCircle className="size-3.5" />
      {children}
    </span>
  );
}

function Head({ t, latin }: { t: T; latin?: boolean }) {
  return (
    <div className="flex items-end justify-between gap-2.5">
      <div>
        <b className={`block text-base text-[#171717] ${latin ? "font-latin" : ""}`}>{t("title")}</b>
        <small className="text-[11.5px] text-[#808080]">{t("path")}</small>
      </div>
      {t.has("live") ? <MockPill>{t("live")}</MockPill> : null}
    </div>
  );
}

async function AiShot() {
  const t = await getTranslations("detailPages.ai-online-store.mock");
  return (
    <DashFrame active="products" title={t("title")}>
      <Head t={t} />
      <MockCard>
        <MockCardHead title={t("inputTitle")} hint={t("inputHint")} />
        <div className="flex items-center gap-2">
          {["#e8e4da", "#c9b79c", "#3b5878"].map((color) => (
            <span key={color} className="block size-11 rounded-[10px] border border-[#e7e9e8]" style={{ backgroundColor: color }} />
          ))}
          <span className="grid size-11 place-items-center rounded-[10px] border border-dashed border-[#c9d3d5] text-[#808080]">
            <ImagePlus className="size-4" />
          </span>
          <span className="ms-auto">
            <MockButton>
              <Sparkles />
              {t("write")}
            </MockButton>
          </span>
        </div>
      </MockCard>
      <MockCard>
        <MockCardHead title={t("fieldsTitle")} end={<MockPill>{t("review")}</MockPill>} />
        <div className="grid gap-1.5">
          {[t("sampleAr"), t("sampleEn")].map((name, i) => (
            <div key={name} className="flex items-center justify-between gap-2 rounded-[9px] bg-[#f7faf9] px-2.5 py-[7px]">
              <span className="text-[11px] font-semibold text-[#808080]">{i === 0 ? "AR" : "EN"}</span>
              <b dir={i === 0 ? "rtl" : "ltr"} className="truncate text-[#171717]">
                {name}
              </b>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(t.raw("tags") as string[]).map((tag) => (
            <MockPill key={tag} tone="gray">
              {tag}
            </MockPill>
          ))}
        </div>
      </MockCard>
      <small className="text-[11px] text-[#808080]">{t("aiNote")}</small>
    </DashFrame>
  );
}

async function RiskShot() {
  const t = await getTranslations("detailPages.fake-order-protection.mock");
  const rows = t.raw("rows") as string[][];
  return (
    <DashFrame active="orders" title={t("title")}>
      <Head t={t} />
      <MockCard className="gap-0 overflow-hidden p-0">
        <MockTable
          head={t.raw("head") as string[]}
          rows={rows.map(([product, area, total], i) => [
            product,
            area,
            <MockCode key="t">{total}</MockCode>,
            i === 0 ? (
              <Chip key="r" tone="red">
                <TriangleAlert />
                {t("refused")}
              </Chip>
            ) : i === 1 ? (
              <Chip key="d">{t("duplicate")}</Chip>
            ) : (
              <MockPill key="c">{t("confirmed")}</MockPill>
            ),
          ])}
        />
      </MockCard>
      <MockCard>
        <MockCardHead title={t("panelTitle")} hint={t("panelHint")} />
        <div className="flex flex-wrap items-center gap-2">
          <WhatsAppButton>{t("ask")}</WhatsAppButton>
          <MockButton>
            <Check />
            {t("confirm")}
          </MockButton>
          <span className="inline-flex h-9 items-center gap-1.5 rounded-[9px] border border-[#f1c9c9] px-3 text-xs font-bold text-[#b42318]">
            <Ban className="size-3.5" />
            {t("block")}
          </span>
        </div>
      </MockCard>
    </DashFrame>
  );
}

async function MissedShot() {
  const t = await getTranslations("detailPages.abandoned-checkouts.mock");
  const rows = t.raw("rows") as string[][];
  return (
    <DashFrame active="orders" title={t("title")}>
      <Head t={t} />
      {rows.map(([items, total, left], i) => (
        <MockCard key={items}>
          <MockCardHead title={items} hint={left} end={<MockCode>{total}</MockCode>} />
          <div className="flex flex-wrap items-center gap-2">
            <WhatsAppButton>{t("whatsapp")}</WhatsAppButton>
            <span className="inline-flex h-8 items-center gap-1.5 rounded-[9px] border border-[#d9dddc] px-3 text-xs font-bold text-teal-900">
              <Phone className="size-3.5" />
              {t("call")}
            </span>
            {i === 0 ? <MockPill tone="gray">{t("emailSent")}</MockPill> : <MockPill>{t("contacted")}</MockPill>}
          </div>
        </MockCard>
      ))}
    </DashFrame>
  );
}

async function ZonesShot() {
  const t = await getTranslations("detailPages.shipping.mock");
  return (
    <DashFrame active="shipping" title={t("title")}>
      <Head t={t} />
      <MockCard className="gap-0 overflow-hidden p-0">
        <div className="px-3.5 pt-3 pb-1">
          <MockCardHead title={t("zonesTitle")} hint={t("zonesHint")} />
        </div>
        <MockTable
          head={t.raw("zonesHead") as string[]}
          rows={(t.raw("zones") as string[][]).map(([name, price, free, cod]) => [
            name,
            <MockCode key="p">{price}</MockCode>,
            <MockCode key="f">{free}</MockCode>,
            <MockToggle key="c" off={cod !== "on"} />,
          ])}
        />
      </MockCard>
      <div className="grid grid-cols-3 gap-2">
        {[
          { Icon: PackageCheck, label: t("bosta") },
          { Icon: Bike, label: t("rider") },
          { Icon: FileSpreadsheet, label: t("wassalha") },
        ].map(({ Icon, label }) => (
          <MockCard key={label} className="items-center gap-1.5 px-2 py-2.5 text-center">
            <Icon className="size-4 text-teal-700" />
            <b className="text-[11.5px] text-[#171717]">{label}</b>
          </MockCard>
        ))}
      </div>
    </DashFrame>
  );
}

async function WaybillShot() {
  const t = await getTranslations("detailPages.bosta.mock");
  return (
    <DashFrame active="orders" title={t("title")}>
      <Head t={t} />
      <MockCard>
        <MockCardHead title={t("dialogTitle")} hint={t("pickup")} />
        {(t.raw("fields") as string[][]).map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-2 rounded-[9px] bg-[#f7faf9] px-2.5 py-[7px]">
            <span className="text-[#55605f]">{label}</span>
            <b className="text-[#171717]">{value}</b>
          </div>
        ))}
        <span className="self-end">
          <MockButton>{t("send")}</MockButton>
        </span>
      </MockCard>
      <MockCard>
        <MockCardHead title={t("cardTitle")} end={<MockPill>{t("state")}</MockPill>} />
        <div className="flex items-center gap-2">
          <MockField>
            {t("tracking")} {SAMPLE_TRACKING}
          </MockField>
          <MockButton>
            <Printer />
            {t("print")}
          </MockButton>
        </div>
      </MockCard>
    </DashFrame>
  );
}

async function GatewayShot({ slug, partner }: { slug: string; partner: string }) {
  const t = await getTranslations(`detailPages.${slug}.mock`);
  return (
    <DashFrame active="website" title={t("title")}>
      <Head t={t} />
      <MockCard>
        <MockCardHead
          title={partner}
          hint={t("cardHint")}
          end={
            <span className="grid size-[34px] flex-none place-items-center rounded-[10px] bg-[#eef3f4] text-teal-700">
              <CreditCard className="size-[17px]" />
            </span>
          }
        />
        {(t.raw("keys") as string[]).map((name) => (
          <div key={name} className="grid gap-1">
            <span className="text-[11px] font-semibold text-[#808080]">{name}</span>
            <MockField>
              <KeyRound />
              ••••••••••••••••
            </MockField>
          </div>
        ))}
        <span className="flex items-center gap-2 text-xs font-semibold text-[#15803d]">
          <CircleCheck className="size-[15px]" />
          {t("checked")}
        </span>
      </MockCard>
      <MockCard>
        <MockCardHead title={t("checkoutTitle")} />
        {[t("card"), t("cod")].map((label, i) => (
          <div key={label} className="flex items-center justify-between gap-2 rounded-[9px] border border-[#e7e9e8] px-2.5 py-2">
            <span className="flex items-center gap-2 font-semibold text-[#171717]">
              {i === 0 ? <CreditCard className="size-3.5 text-teal-700" /> : <Banknote className="size-3.5 text-teal-700" />}
              {label}
            </span>
            <MockToggle />
          </div>
        ))}
      </MockCard>
    </DashFrame>
  );
}

export function MoreShotView({ shot, slug, partner }: { shot: "ai" | "risk" | "missed" | "zones" | "waybill" | "gateway"; slug: string; partner?: string }) {
  switch (shot) {
    case "ai":
      return <AiShot />;
    case "risk":
      return <RiskShot />;
    case "missed":
      return <MissedShot />;
    case "zones":
      return <ZonesShot />;
    case "waybill":
      return <WaybillShot />;
    case "gateway":
      return <GatewayShot slug={slug} partner={partner ?? ""} />;
  }
}

export type MoreStepVisual = Exclude<DetailStepVisual, "registrar" | "connect" | "dns" | "status" | "copyId" | "openApp" | "pasteId" | "testEvents">;

/** The step pictures of the newer pages. `t` is the page's `mock` translator. */
export function moreStepContent(t: T, partner: string | undefined): Record<MoreStepVisual, () => React.ReactNode> {
  const label = (text: string) => <span className="text-[11px] font-semibold text-[#808080]">{text}</span>;
  const row = (a: React.ReactNode, b: React.ReactNode) => (
    <div className="flex items-center justify-between gap-2 rounded-[9px] bg-white px-2.5 py-[7px]">
      {a}
      {b}
    </div>
  );
  return {
    aiInput: () => (
      <>
        {label(t("inputTitle"))}
        <div className="flex items-center gap-2">
          <MockField>
            <ImagePlus />
            {t("photos")}
          </MockField>
          <MockButton>
            <Sparkles />
            {t("write")}
          </MockButton>
        </div>
      </>
    ),
    aiFields: () => (
      <>
        {row(<b>AR</b>, <bdi className="truncate">{t("sampleAr")}</bdi>)}
        {row(<b>EN</b>, <bdi dir="ltr" className="truncate">{t("sampleEn")}</bdi>)}
      </>
    ),
    priceStock: () => (
      <>
        {row(<span>{t("priceLabel")}</span>, <MockCode>450</MockCode>)}
        {row(<span>{t("stockLabel")}</span>, <MockCode>12</MockCode>)}
      </>
    ),
    blockNumber: () => (
      <>
        {label(t("blockTitle"))}
        <div className="flex items-center gap-2">
          <MockField>010•••••678</MockField>
          <MockButton>
            <Ban />
            {t("block")}
          </MockButton>
        </div>
      </>
    ),
    riskChip: () => (
      <div className="flex flex-wrap gap-1.5">
        <Chip tone="red">
          <TriangleAlert />
          {t("refused")}
        </Chip>
        <Chip>{t("duplicate")}</Chip>
      </div>
    ),
    whatsapp: () => (
      <>
        <span className="max-w-[260px] rounded-[12px] rounded-ss-sm bg-white px-3 py-2 text-[11.5px] leading-relaxed text-[#333]">{t("message")}</span>
        <WhatsAppButton>{t("ask")}</WhatsAppButton>
      </>
    ),
    confirmed: () => (
      <>
        {row(<b className="text-teal-900">{t("panelTitle")}</b>, <MockPill tone="amber">{t("pending")}</MockPill>)}
        {row(<b className="text-teal-900">{t("panelTitle")}</b>, <MockPill>{t("confirmed")}</MockPill>)}
      </>
    ),
    leadForm: () => (
      <>
        {label(t("formTitle"))}
        <MockField on>
          <Phone />
          010•••••312
        </MockField>
        {row(<span>{t("addressLabel")}</span>, <Check className="size-3.5 text-[#16a34a]" />)}
      </>
    ),
    missedRow: () => {
      const [items, total, left] = (t.raw("rows") as string[][])[0]!;
      return (
        <MockCard>
          <MockCardHead title={items} hint={left} end={<MockCode>{total}</MockCode>} />
        </MockCard>
      );
    },
    markContacted: () => (
      <>
        <MockButton>
          <Check />
          {t("markContacted")}
        </MockButton>
        <MockPill className="self-start">{t("contacted")}</MockPill>
      </>
    ),
    zoneRow: () => (
      <>
        {(t.raw("zones") as string[][]).slice(0, 2).map(([name, price]) => (
          <React.Fragment key={name}>{row(<b className="text-teal-900">{name}</b>, <MockCode>{price}</MockCode>)}</React.Fragment>
        ))}
      </>
    ),
    freeOver: () => (
      <>
        {label(t("freeOverLabel"))}
        <MockField on>{t("freeOverValue")}</MockField>
      </>
    ),
    shipChoice: () => (
      <div className="grid gap-1.5">
        {row(
          <span className="flex items-center gap-1.5">
            <PackageCheck className="size-3.5 text-teal-700" />
            {t("bosta")}
          </span>,
          <MockToggle />,
        )}
        {row(
          <span className="flex items-center gap-1.5">
            <Bike className="size-3.5 text-teal-700" />
            {t("rider")}
          </span>,
          <MockToggle off />,
        )}
      </div>
    ),
    trackStatus: () => (
      <>
        {(t.raw("states") as string[]).map((state, i) => (
          <React.Fragment key={state}>{row(<MockCode>{SAMPLE_TRACKING}</MockCode>, <MockPill tone={i === 0 ? "gray" : "green"}>{state}</MockPill>)}</React.Fragment>
        ))}
      </>
    ),
    connectAccount: () => (
      <MockCard>
        <MockCardHead title={partner ?? ""} hint={t("connectHint")} end={<MockButton>{t("connect")}</MockButton>} />
      </MockCard>
    ),
    sendOrder: () => (
      <>
        {row(<span>{t("areaLabel")}</span>, <b>{t("areaValue")}</b>)}
        <span className="self-end">
          <MockButton>{t("send")}</MockButton>
        </span>
      </>
    ),
    printWaybill: () => (
      <div className="flex items-center gap-2">
        <MockField>{SAMPLE_TRACKING}</MockField>
        <MockButton>
          <Printer />
          {t("print")}
        </MockButton>
      </div>
    ),
    copyKeys: () => (
      <>
        {label(t("copyHint"))}
        {(t.raw("keys") as string[]).slice(0, 2).map((name) => (
          <div key={name} className="flex items-center gap-2">
            <MockField>
              <KeyRound />
              {name}
            </MockField>
            <MockButton>
              <Copy />
            </MockButton>
          </div>
        ))}
      </>
    ),
    keyCheck: () => (
      <>
        {row(<span>{t("checking")}</span>, <MockPill tone="amber">…</MockPill>)}
        {row(<span>{t("checked")}</span>, <Check className="size-3.5 text-[#16a34a]" />)}
      </>
    ),
    cardCheckout: () => (
      <>
        {row(
          <span className="flex items-center gap-1.5 font-semibold">
            <CreditCard className="size-3.5 text-teal-700" />
            {t("card")}
          </span>,
          <MockToggle />,
        )}
        {row(
          <span className="flex items-center gap-1.5 font-semibold">
            <Banknote className="size-3.5 text-teal-700" />
            {t("cod")}
          </span>,
          <MockToggle />,
        )}
      </>
    ),
  };
}
