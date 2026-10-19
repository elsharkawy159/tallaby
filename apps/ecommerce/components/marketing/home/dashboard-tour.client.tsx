"use client";

import * as React from "react";
import { ChartNoAxesColumn, ClipboardList, CreditCard, Megaphone, Package, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { cn } from "@workspace/ui/lib/utils";

const AREAS = [
  { id: "products", icon: Package },
  { id: "orders", icon: ClipboardList },
  { id: "checkout", icon: CreditCard },
  { id: "analytics", icon: ChartNoAxesColumn },
  { id: "seo", icon: Search },
  { id: "marketing", icon: Megaphone },
] as const;

type StatusTone = "green" | "yellow" | "blue" | "neutral";
const STATUS_TONES: Record<StatusTone, string> = {
  green: "bg-success-soft text-[#166534]",
  yellow: "bg-[#fef3c7] text-[#92400e]",
  blue: "bg-[#dbeafe] text-[#1e40af]",
  neutral: "bg-neutral-100 text-neutral-700",
};

const BARS = [35, 50, 42, 70, 58, 80, 64, 90, 72, 100, 84, 66];

/** "One dashboard for the whole store": vertical shadcn Tabs with mock panes. */
export function DashboardTour() {
  const t = useTranslations("home.features");
  const s = (key: string) => t(`status.${key}`);

  return (
    <Tabs
      defaultValue="products"
      orientation="vertical"
      className="grid gap-0 overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-soft lg:grid-cols-[300px_minmax(0,1fr)]"
    >
      <TabsList
        aria-label={t("areas")}
        className="no-scrollbar flex h-auto! w-full max-w-none justify-start gap-1 overflow-x-auto rounded-none border-0 border-b border-neutral-200 bg-paper p-3.5 lg:flex-col lg:items-stretch lg:border-e lg:border-b-0"
      >
        <div className="hidden items-center gap-2.5 px-2.5 pt-2 pb-[18px] font-latin text-sm font-extrabold text-teal-900 lg:flex">
          <i className="block size-7 rounded-lg bg-teal-900" />
          {t("dashboard")}
        </div>
        {AREAS.map(({ id, icon: Icon }) => (
          <TabsTrigger
            key={id}
            value={id}
            className="group h-auto flex-none justify-start gap-3 rounded-[14px] px-3.5 py-2.5 text-start whitespace-nowrap text-neutral-800 hover:bg-teal-50 data-[state=active]:bg-teal-900 data-[state=active]:text-white lg:grid lg:grid-cols-[40px_1fr] lg:px-2.5 lg:py-3 lg:whitespace-normal"
          >
            <span className="hidden size-10 place-items-center rounded-xl border border-neutral-200 bg-white text-teal-700 group-data-[state=active]:border-transparent group-data-[state=active]:bg-white/10 group-data-[state=active]:text-amber-600 lg:grid">
              <Icon className="size-[18px]" aria-hidden />
            </span>
            <span>
              <b className="block text-[15px]">{t(`tabs.${id}.title`)}</b>
              <span className="hidden text-[12.5px] leading-[1.4] font-normal text-neutral-600 group-data-[state=active]:text-haze lg:block">
                {t(`tabs.${id}.sub`)}
              </span>
            </span>
          </TabsTrigger>
        ))}
      </TabsList>

      <div className="flex flex-col p-[18px] sm:p-7 lg:min-h-[480px] en:font-latin">
        <TabsContent value="products" className="animate-pop">
          <PaneHeader title={t("tabs.products.title")} fakes={["", "amber"]} />
          <Rows
            rows={[
              ["green", s("inStock"), "1,250 EGP"],
              ["green", s("inStock"), "890 EGP"],
              ["yellow", s("low"), "450 EGP"],
              ["neutral", s("draft"), "—"],
              ["green", s("inStock"), "2,100 EGP"],
            ]}
          />
        </TabsContent>
        <TabsContent value="orders" className="animate-pop">
          <PaneHeader title={t("tabs.orders.title")} fakes={["", ""]} />
          <Rows
            rows={[
              ["blue", s("new"), "#1041"],
              ["yellow", s("packing"), "#1040"],
              ["blue", s("shipped"), "#1039"],
              ["green", s("delivered"), "#1038"],
              ["green", s("delivered"), "#1037"],
            ]}
          />
        </TabsContent>
        <TabsContent value="checkout" className="animate-pop">
          <PaneHeader title={t("checkoutTitle")} />
          <div className="mx-auto grid max-w-[360px] gap-2.5 rounded-[20px] border border-neutral-200 p-[18px]">
            {[t("fullName"), t("phone"), t("address")].map((field) => (
              <div key={field} className="flex h-11 items-center rounded-[10px] border border-neutral-200 px-3 text-xs text-neutral-500">
                {field}
              </div>
            ))}
            <PayOption label={t("payOnline")} selected />
            <PayOption label={t("cod")} />
            <div className="grid h-[46px] place-items-center rounded-xl bg-amber-600 text-sm font-bold text-teal-900">{t("placeOrder")}</div>
          </div>
        </TabsContent>
        <TabsContent value="analytics" className="animate-pop">
          <PaneHeader title={t("tabs.analytics.title")} fakes={[""]} />
          <div className="mb-[18px] grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[t("sales"), t("orders"), t("avgOrder")].map((kpi) => (
              <div key={kpi} className="rounded-[14px] border border-neutral-200 px-4 py-3.5">
                <small className="block text-xs text-neutral-600">{kpi}</small>
                <b className="font-latin text-[22px] text-teal-900">—</b>
              </div>
            ))}
          </div>
          <div dir="ltr" className="flex h-[150px] items-end gap-2 border-b border-neutral-200 px-1">
            {BARS.map((h, i) => (
              <i
                key={i}
                className={cn(
                  "flex-1 origin-bottom animate-grow rounded-t-md",
                  h === 100 ? "bg-amber-600" : i % 2 === 0 ? "bg-teal-700" : "bg-teal-100",
                )}
                style={{ height: `${h}%`, animationDelay: `${i * 40}ms` }}
              />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="seo" className="animate-pop">
          <PaneHeader title={t("tabs.seo.title")} />
          <div className="grid gap-5 md:grid-cols-2">
            <div className="grid gap-3">
              <MockField label={t("pageTitle")}>{t("seoTitle")}</MockField>
              <MockField label={t("description")} tall>
                {t("seoDesc")}
              </MockField>
              <MockField label={t("url")} ltr>
                yourbrand.tallaby.com/shop
              </MockField>
            </div>
            <div dir="ltr" className="rounded-[14px] border border-neutral-200 p-4 font-[Arial,sans-serif]">
              <small className="block text-xs text-[#202124]">yourbrand.tallaby.com › shop</small>
              <b className="my-1 block text-lg font-normal text-[#1a0dab]" dir="auto">
                {t("seoTitle")}
              </b>
              <p className="text-[13px] leading-normal text-[#4d5156]" dir="auto">
                {t("seoDesc")}
              </p>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="marketing" className="animate-pop">
          <PaneHeader title={t("tabs.marketing.title")} fakes={["amber"]} />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2.5 rounded-2xl border border-neutral-200 p-[18px]">
              <span className="text-xs text-neutral-600">{t("discountCode")}</span>
              <div className="rounded-[10px] border border-dashed border-amber-600 bg-amber-50 px-3.5 py-2.5 text-center font-latin text-xl font-bold tracking-[0.08em] text-[#8a5300]">
                WELCOME10
              </div>
              <div className="h-2.5 w-[70%] rounded-[5px] bg-neutral-100" />
              <div className="h-2.5 w-[45%] rounded-[5px] bg-neutral-100" />
              <div className="flex items-center justify-between text-[13px] font-semibold text-neutral-800">
                {t("active")}
                <i className="relative block h-[22px] w-[38px] rounded-[11px] bg-success after:absolute after:end-[3px] after:top-[3px] after:size-4 after:rounded-full after:bg-white after:content-['']" />
              </div>
            </div>
            <div className="grid gap-2.5 rounded-2xl border border-neutral-200 p-[18px]">
              <span className="text-xs text-neutral-600">{t("shareLink")}</span>
              <div dir="ltr" className="flex h-[42px] items-center rounded-[10px] border border-neutral-200 px-3 font-latin text-[13px] font-semibold text-teal-900">
                yourbrand.tallaby.com/?ref=ig
              </div>
              {[80, 55, 65].map((w) => (
                <div key={w} className="h-2.5 rounded-[5px] bg-neutral-100" style={{ width: `${w}%` }} />
              ))}
            </div>
          </div>
        </TabsContent>
      </div>
    </Tabs>
  );
}

function PaneHeader({ title, fakes = [] }: { title: string; fakes?: ("" | "amber")[] }) {
  return (
    <div className="mb-[18px] flex items-center gap-3 border-b border-neutral-100 pb-[18px]">
      <h3 className="text-lg font-bold text-teal-900">{title}</h3>
      {fakes.length ? (
        <div className="ms-auto flex gap-2" aria-hidden>
          {fakes.map((tone, i) => (
            <i key={i} className={cn("block h-8 rounded-[9px]", tone === "amber" ? "w-[110px] bg-amber-600" : "w-[90px] bg-neutral-100")} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Rows({ rows }: { rows: [StatusTone, string, string][] }) {
  return (
    <div>
      {rows.map(([tone, label, value], i) => (
        <div
          key={i}
          className="grid grid-cols-[36px_1fr_70px] items-center gap-3.5 border-b border-neutral-100 py-2.5 font-latin text-[13px] text-neutral-800 sm:grid-cols-[44px_1fr_90px_80px]"
        >
          <span className="size-9 rounded-[10px] bg-neutral-100 sm:size-11" />
          <div>
            <div className="h-2.5 w-[60%] rounded-[5px] bg-neutral-200" />
            <div className="mt-1.5 h-2.5 w-[35%] rounded-[5px] bg-neutral-100" />
          </div>
          <span className={cn("rounded-full px-2.5 py-[3px] text-center text-[11px] font-semibold", STATUS_TONES[tone])}>{label}</span>
          <span dir="ltr" className="hidden text-end font-semibold sm:block">
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}

function PayOption({ label, selected }: { label: string; selected?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-[10px] border px-3 py-2.5 text-[13px] font-semibold",
        selected ? "border-teal-700 shadow-[0_0_0_1px_var(--color-teal-700)]" : "border-neutral-200",
      )}
    >
      <i
        className={cn(
          "block size-4 rounded-full border-2",
          selected ? "border-teal-700 bg-[radial-gradient(var(--color-teal-700)_45%,#fff_50%)]" : "border-neutral-300",
        )}
      />
      {label}
    </div>
  );
}

function MockField({ label, children, tall, ltr }: { label: string; children: React.ReactNode; tall?: boolean; ltr?: boolean }) {
  return (
    <div>
      <span className="mb-1 block text-xs text-neutral-600">{label}</span>
      <div
        dir={ltr ? "ltr" : undefined}
        className={cn(
          "flex rounded-[10px] border border-neutral-200 px-3 text-[13px]",
          tall ? "h-[84px] items-start pt-2.5 leading-normal text-neutral-800" : "h-[42px] items-center font-semibold text-teal-900",
        )}
      >
        {children}
      </div>
    </div>
  );
}
