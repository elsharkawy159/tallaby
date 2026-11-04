"use client";

import * as React from "react";
import Image from "next/image";
import {
  AppWindow,
  ArrowLeft,
  Banknote,
  Bell,
  ChartColumn,
  Check,
  ChevronDown,
  ChevronsUpDown,
  Eye,
  ExternalLink,
  Globe,
  Megaphone,
  Menu,
  Package,
  Percent,
  Search,
  ShoppingBag,
  Store,
  TrendingUp,
  Truck,
  Wallet,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@workspace/ui/lib/utils";
import { DemoCursor } from "./demo-cursor";
import { ordersAfter, sparkPaths, wrapIndex, type DemoOrder } from "./home-demo.lib";
import { useDemoSteps } from "./use-demo.client";

/** product, cursor to add, summary, cursor to place, confirmed, order lands, toast gone. */
const STEPS = [1300, 1150, 1600, 1150, 500, 2600, 2100] as const;
const SHIPPING = 50;
const FIRST_NEW_ORDER = 2481;
const SPARKS = [
  [12, 18, 15, 22, 19, 26, 23, 30, 27, 33, 31, 36],
  [8, 11, 10, 14, 12, 16, 15, 19, 17, 21, 20, 23],
  [40, 44, 42, 47, 45, 50, 48, 52, 51, 55, 54, 58],
  [2.0, 2.1, 1.9, 2.2, 2.1, 2.3, 2.2, 2.4, 2.2, 2.3, 2.4, 2.3],
];
const PRODUCTS = [
  { price: 1240, image: "/cosmetics.jpg", position: "20% 50%" },
  { price: 420, image: "/cosmetics.jpg", position: "60% 40%" },
  { price: 1080, image: "/accessories.jpg", position: "50% 50%" },
];
const BADGE = { pending: "bg-[#fff4dc] text-[#8a5a00]", shipped: "bg-[#e8f1fb] text-[#1d5fa8]", delivered: "bg-[#e5f6ea] text-[#15803d]" };

const money = (n: number) => n.toLocaleString("en-US");

/** The hero's stage: an order placed on the phone lands in the seller's dashboard. All sample data. */
export function HeroDemo() {
  const t = useTranslations("home.demo.hero");
  const { ref, step, cycle } = useDemoSteps<HTMLDivElement>(STEPS, 0);

  const customers = t.raw("customers") as string[];
  const products = t.raw("products") as string[];
  const base = (t.raw("orders") as Omit<DemoOrder, "id">[]).map((o, i) => ({ ...o, id: FIRST_NEW_ORDER - 1 - i }));
  const make = (i: number) => {
    const p = wrapIndex(i, PRODUCTS.length);
    return { customer: customers[wrapIndex(i, customers.length)] ?? "", product: products[p] ?? "", total: PRODUCTS[p]!.price + SHIPPING };
  };

  const landed = step >= 5;
  const added = cycle + (landed ? 1 : 0);
  const orders = ordersAfter(base, added, make, FIRST_NEW_ORDER);
  let sales = 48320;
  for (let i = Math.max(0, added - 50); i < added; i++) sales += make(i).total;
  const pendingCount = orders.filter((o) => o.status === "pending").length;

  const index = wrapIndex(cycle, PRODUCTS.length);
  const product = PRODUCTS[index]!;
  const productName = products[index] ?? "";
  const view = step <= 1 ? 1 : step <= 3 ? 2 : 3;
  const cursor = step === 1 || step === 3 ? { x: 50, y: 88 } : { x: 72, y: 42 };
  const fresh = make(added - 1);

  const nav = [
    { icon: ChartColumn, label: t("nav.home"), on: true },
    { icon: Package, label: t("nav.products"), chevron: true },
    { icon: ShoppingBag, label: t("nav.orders"), count: pendingCount, chevron: true },
    { icon: Truck, label: t("nav.shipping"), chevron: true },
    { icon: Wallet, label: t("nav.finance"), chevron: true },
    { sep: true },
    { icon: Globe, label: t("nav.website"), chevron: true },
    { icon: Megaphone, label: t("nav.marketing"), chevron: true },
    { icon: AppWindow, label: t("nav.apps") },
  ];
  const kpis = [
    { label: t("kpi.sales"), icon: Banknote, value: money(sales), unit: t("egp"), delta: "18.4%", note: t("kpi.previous"), bump: step === 5 },
    { label: t("kpi.orders"), icon: ShoppingBag, value: String(212 + added), unit: t("kpi.ordersUnit"), delta: "12.1%", note: t("kpi.previous"), bump: step === 5 },
    { label: t("kpi.visits"), icon: Eye, value: "9,410", unit: t("kpi.visitsUnit"), delta: "6.3%", note: t("kpi.previous"), extra: true },
    { label: t("kpi.conversion"), icon: Percent, value: "2.3", unit: "%", delta: "4.0%", note: t("kpi.perVisit"), extra: true },
  ];

  return (
    <div ref={ref} aria-hidden className="relative mx-auto mt-11 w-full max-w-[1060px] text-start min-[641px]:mt-16">
      <div className="grid overflow-hidden rounded-2xl border border-[#e7e9e8] bg-[#fafaf8] text-[13px] text-[#333] shadow-[0_16px_44px_rgba(13,55,67,0.09),0_2px_8px_rgba(13,55,67,0.04)] min-[641px]:me-[110px] min-[641px]:rounded-[20px] min-[1081px]:me-[150px] min-[1081px]:grid-cols-[200px_minmax(0,1fr)]">
        <aside className="hidden flex-col border-e border-[#e7e9e8] bg-white min-[1081px]:flex">
          <div className="flex h-[52px] items-center border-b border-[#e7e9e8] px-3.5 font-latin text-base font-extrabold text-teal-900">tallaby</div>
          <ul className="flex flex-1 flex-col gap-0.5 p-2.5">
            {nav.map((item, i) =>
              item.sep ? (
                <li key={i} className="mx-2.5 my-1.5 border-t border-[#e7e9e8]" />
              ) : (
                <li
                  key={item.label}
                  className={cn(
                    "flex items-center gap-2.5 rounded-[10px] px-2.5 py-[7px] text-[12.5px] whitespace-nowrap text-[#171717]",
                    item.on && "bg-[#eef3f4] font-bold text-[#145163]",
                  )}
                >
                  {item.icon ? <item.icon className={cn("size-4", item.on ? "text-[#145163]" : "text-[#808080]")} /> : null}
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.count ? <b className="rounded-full bg-[#145163] px-[7px] py-px font-latin text-[10px] font-bold text-white">{item.count}</b> : null}
                  {item.chevron ? <ChevronDown className="size-[13px] text-[#808080]" /> : null}
                </li>
              ),
            )}
          </ul>
          <div className="flex items-center gap-[9px] border-t border-[#e7e9e8] px-3 py-2.5">
            <span className="grid size-[30px] place-items-center rounded-[9px] bg-[#fbf1ef] font-latin text-sm font-extrabold text-[#c8586b]">g</span>
            <div className="min-w-0 flex-1">
              <b className="block font-latin text-[12.5px] font-bold text-[#171717]">glow</b>
              <small dir="ltr" className="block truncate text-start font-latin text-[10.5px] font-medium text-[#808080]">glow.tallaby.com</small>
            </div>
            <ChevronsUpDown className="size-3.5 text-[#808080]" />
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          <div className="flex h-[46px] items-center gap-1.5 border-b border-[#e7e9e8] bg-white/90 px-2.5 min-[641px]:h-[52px] min-[641px]:gap-2.5 min-[641px]:px-4">
            <span className="grid size-[30px] flex-none place-items-center text-[#808080] min-[1081px]:hidden">
              <Menu className="size-4" />
            </span>
            <b className="flex-1 text-[13.5px] font-bold whitespace-nowrap text-[#171717] min-[641px]:flex-none">{t("nav.home")}</b>
            <span dir="ltr" className="hidden items-center gap-1 font-latin text-[11.5px] font-medium whitespace-nowrap text-[#808080] min-[641px]:flex">
              glow.tallaby.com <ExternalLink className="size-3" />
            </span>
            <span className="mx-auto hidden h-8 max-w-[240px] flex-1 items-center gap-2 rounded-[9px] border border-[#e7e9e8] bg-[#f7f7f7] px-2.5 text-xs text-[#808080] min-[641px]:flex">
              <Search className="size-3.5" />
              <span className="flex-1">{t("search")}</span>
            </span>
            <span className="relative grid size-[30px] flex-none place-items-center text-[#808080]">
              <Bell className="size-4" />
              <i className={cn("absolute end-1.5 top-[5px] size-[7px] rounded-full bg-amber-600 shadow-[0_0_0_2px_#fff] transition-transform duration-200", step === 5 ? "scale-100" : "scale-0")} />
            </span>
            <span className="flex h-8 items-center gap-1.5 rounded-[9px] border border-[#e7e9e8] bg-[#f7f7f7] px-2 font-latin text-xs font-semibold whitespace-nowrap text-[#171717] min-[641px]:px-2.5">
              <Wallet className="size-3.5 text-[#808080]" />
              <span dir="ltr" className="hidden min-[641px]:inline">$12.40</span>
            </span>
          </div>

          <div className="flex flex-col gap-2.5 p-3 pb-[120px] min-[641px]:gap-3.5 min-[641px]:p-[18px]">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <b className="block text-[15px] font-bold text-[#171717] min-[641px]:text-lg">{t("greeting")}</b>
                <small className="text-xs text-[#808080]">{t("newOrders", { count: pendingCount })}</small>
              </div>
              <div className="hidden gap-1.5 min-[641px]:flex">
                <span className="flex h-8 items-center gap-1.5 rounded-[9px] border border-[#d9dddc] bg-white px-2.5 text-xs whitespace-nowrap">
                  <Store className="size-[13px] text-[#808080]" />
                  {t("allStores")}
                  <ChevronDown className="size-[13px] text-[#808080]" />
                </span>
                <span className="flex h-8 items-center gap-1.5 rounded-[9px] border border-[#d9dddc] bg-white px-2.5 text-xs whitespace-nowrap">
                  {t("last30")}
                  <ChevronDown className="size-[13px] text-[#808080]" />
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 min-[641px]:grid-cols-4 min-[641px]:gap-2.5">
              {kpis.map((kpi, i) => {
                const spark = sparkPaths(SPARKS[i]!);
                return (
                  <div key={kpi.label} className={cn("min-w-0 flex-col gap-[7px] rounded-[14px] border border-[#e7e9e8] bg-white p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] min-[641px]:rounded-2xl min-[641px]:px-3.5 min-[641px]:pt-3 min-[641px]:pb-2.5", kpi.extra ? "hidden min-[641px]:flex" : "flex")}>
                    <div className="flex items-center justify-between text-xs text-[#808080]">
                      <span>{kpi.label}</span>
                      <span className="grid size-[30px] place-items-center rounded-[9px] bg-[#eef3f4] text-[#145163]">
                        <kpi.icon className="size-[15px]" />
                      </span>
                    </div>
                    <div className="flex items-baseline gap-[5px]">
                      <b className={cn("font-latin text-[17px] leading-none font-semibold text-[#171717] transition-colors duration-500 min-[641px]:text-[21px]", kpi.bump && "text-[#15803d]")}>{kpi.value}</b>
                      <span className="text-[11.5px] text-[#808080]">{kpi.unit}</span>
                    </div>
                    <svg viewBox="0 0 200 34" preserveAspectRatio="none" className="block h-7 w-full rtl:-scale-x-100">
                      <path d={spark.area} className="fill-[#145163] opacity-[0.08]" />
                      <path d={spark.line} fill="none" stroke="#145163" strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                    </svg>
                    <div className="flex min-h-5 items-center justify-end gap-1.5 text-[10.5px] text-[#808080] min-[641px]:justify-between">
                      <span className="hidden truncate min-[641px]:inline">{kpi.note}</span>
                      <span dir="ltr" className="inline-flex h-5 flex-none items-center gap-[3px] rounded-full bg-[#e5f6ea] px-[7px] font-latin text-[10px] font-bold text-[#15803d]">
                        <TrendingUp className="size-[11px]" />
                        {kpi.delta}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <section className="overflow-hidden rounded-2xl border border-[#e7e9e8] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between px-3.5 pt-3 pb-2.5">
                <div>
                  <b className="block text-[13.5px] font-bold text-[#171717]">{t("latest")}</b>
                  <small className="text-[11px] text-[#808080]">{t("lastFive")}</small>
                </div>
                <span className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11.5px] font-semibold text-[#145163]">
                  {t("viewAll")}
                  <ArrowLeft className="size-[13px] ltr:rotate-180" />
                </span>
              </div>
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                    {[
                      [t("col.order"), "hidden min-[641px]:table-cell"],
                      [t("col.customer"), ""],
                      [t("col.product"), "hidden min-[1081px]:table-cell"],
                      [t("col.date"), "hidden min-[1081px]:table-cell"],
                      [t("col.total"), ""],
                      [t("col.status"), ""],
                    ].map(([label, cls]) => (
                      <th key={label} className={cn("border-y border-[#e7e9e8] bg-[#f7f7f7] px-2.5 py-[7px] text-start text-[11px] font-medium whitespace-nowrap text-[#808080] min-[641px]:px-3.5", cls)}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o, i) => (
                    <tr key={o.id} className={cn("border-b border-[#e7e9e8] transition-colors duration-1000 last:border-b-0", i === 0 && step === 5 && "bg-[#fff4dc]")}>
                      <td className="hidden px-3.5 py-2 font-mono text-[11px] font-medium text-[#171717] min-[641px]:table-cell">
                        <span dir="ltr">#{o.id}</span>
                      </td>
                      <td className="max-w-[110px] px-2.5 py-2 whitespace-nowrap min-[641px]:max-w-none min-[641px]:px-3.5">
                        <span className="flex items-center gap-2">
                          <i className="grid size-6 flex-none place-items-center rounded-full bg-[#eef3f4] text-[10.5px] font-bold text-[#145163] not-italic">{o.customer[0]}</i>
                          <span className="truncate">{o.customer}</span>
                        </span>
                      </td>
                      <td className="hidden max-w-[140px] truncate px-3.5 py-2 min-[1081px]:table-cell">{o.product}</td>
                      <td className="hidden px-3.5 py-2 whitespace-nowrap text-[#808080] min-[1081px]:table-cell">{t(`when.${o.when}`)}</td>
                      <td dir="ltr" className="px-2.5 py-2 text-start font-latin text-xs font-semibold whitespace-nowrap min-[641px]:px-3.5">
                        {money(o.total)} EGP
                      </td>
                      <td className="px-2.5 py-2 min-[641px]:px-3.5">
                        <span className={cn("inline-flex h-5 items-center gap-[5px] rounded-full px-2 text-[10.5px] font-medium whitespace-nowrap", BADGE[o.status])}>{t(`status.${o.status}`)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>
        </div>
      </div>

      <div className="absolute -end-1 -bottom-[60px] z-[3] aspect-[9/18.5] w-[150px] rounded-[26px] bg-[#0f1d21] p-1.5 shadow-[0_18px_44px_rgba(13,55,67,0.18)] min-[641px]:end-0 min-[641px]:-bottom-12 min-[641px]:w-[210px] min-[641px]:rounded-[38px] min-[641px]:p-[9px] min-[1081px]:w-[248px]">
        <div className="absolute start-1/2 top-2.5 z-[2] h-3 w-12 -translate-x-1/2 rounded-xl bg-[#0f1d21] rtl:translate-x-1/2 min-[641px]:top-4 min-[641px]:h-5 min-[641px]:w-[76px]" />
        <div className="relative flex h-full flex-col overflow-hidden rounded-[21px] bg-white min-[641px]:rounded-[30px]">
          <div className="flex items-center justify-between border-b border-[#f3e5e2] bg-[#fbf1ef] px-2.5 pt-[26px] pb-1.5 font-latin text-xs font-extrabold text-[#4a2c2a] min-[641px]:px-4 min-[641px]:pt-10 min-[641px]:pb-2.5 min-[641px]:text-[15px]">
            <Menu className="size-[17px]" />
            <b>glow</b>
            <ShoppingBag className="size-[17px]" />
          </div>
          <div className="relative flex-1 overflow-hidden">
            <PhoneView on={view === 1}>
              <div className="relative aspect-[1.15] overflow-hidden rounded-2xl bg-[#fbf1ef]">
                <Image src={product.image} alt="" fill sizes="230px" className="object-cover" style={{ objectPosition: product.position }} />
                <span className="absolute start-2 top-2 rounded-full bg-white px-2 py-0.5 font-latin text-[10px] font-bold text-[#c8586b]">NEW</span>
              </div>
              <h4 className="text-[11px] leading-[1.4] text-[#4a2c2a] min-[641px]:text-[15px]">{productName}</h4>
              <div className="font-latin text-xs font-bold text-[#c8586b] min-[641px]:text-base">
                {money(product.price)} {t("egp")}
              </div>
              <PhoneButton pressed={step === 1}>{t("addToCart")}</PhoneButton>
            </PhoneView>
            <PhoneView on={view === 2}>
              <h4 className="text-[11px] leading-[1.4] text-[#4a2c2a] min-[641px]:text-[15px]">{t("summary")}</h4>
              <SummaryRow label={productName} value={money(product.price)} />
              <SummaryRow label={t("shipping")} value={String(SHIPPING)} />
              <div className="flex justify-between gap-2 border-t border-dashed border-[#f0dcd8] pt-2.5 text-[10px] text-[#7a6461] min-[641px]:text-sm">
                <span>{t("total")}</span>
                <b className="font-latin text-[10.5px] font-bold text-[#c8586b] min-[641px]:text-[15px]">
                  {money(product.price + SHIPPING)} {t("egp")}
                </b>
              </div>
              <div className="flex items-center gap-2 rounded-xl border-[1.5px] border-[#c8586b] p-1.5 text-[10px] font-semibold text-[#4a2c2a] min-[641px]:p-2.5 min-[641px]:text-[12.5px]">
                <i className="size-3.5 flex-none rounded-full border-4 border-[#c8586b]" />
                {t("cod")}
              </div>
              <PhoneButton pressed={step === 3}>{t("placeOrder")}</PhoneButton>
            </PhoneView>
            <PhoneView on={view === 3} className="items-center justify-center text-center">
              <span className="grid size-10 place-items-center rounded-full bg-[#e9f7ee] text-[#16a34a] min-[641px]:size-[62px]">
                <Check className="size-5 min-[641px]:size-[30px]" />
              </span>
              <b className="text-xs text-[#4a2c2a] min-[641px]:text-base">{t("received")}</b>
              <small className="text-[10px] text-[#7a6461] min-[641px]:text-xs">{t("willCall")}</small>
            </PhoneView>
          </div>
          <DemoCursor x={cursor.x} y={cursor.y} visible={step <= 3} />
        </div>
      </div>

      <div
        className={cn(
          "absolute -top-[30px] start-2 z-[4] flex items-center gap-2.5 rounded-2xl border border-line bg-white py-2 ps-3 pe-3 shadow-[0_10px_26px_rgba(13,55,67,0.11)] transition-[opacity,transform] duration-500 min-[641px]:-top-[26px] min-[641px]:start-7 min-[641px]:py-2.5 min-[641px]:pe-4",
          step === 5 ? "translate-y-0 scale-100 opacity-100" : "-translate-y-2.5 scale-[0.96] opacity-0",
        )}
      >
        <span className="grid size-8 place-items-center rounded-xl bg-amber-100 text-amber-700 min-[641px]:size-[38px]">
          <ShoppingBag className="size-[18px]" />
        </span>
        <div>
          <b className="block text-[13.5px] text-teal-900">
            {t("newOrder")} <span dir="ltr" className="font-latin">#{FIRST_NEW_ORDER + Math.max(added - 1, 0)}</span>
          </b>
          <small className="text-xs text-ink-400">
            {fresh.customer} · <span className="font-latin">{money(fresh.total)}</span> {t("egp")}
          </small>
        </div>
      </div>
    </div>
  );
}

function PhoneView({ on, className, children }: { on: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "absolute inset-0 flex flex-col gap-1.5 bg-white p-[9px] transition-[opacity,transform] duration-300 min-[641px]:gap-2.5 min-[641px]:p-3.5",
        on ? "opacity-100" : "pointer-events-none -translate-x-6 opacity-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 text-[10px] text-[#7a6461] min-[641px]:text-[12.5px]">
      <span className="min-w-0 truncate">{label}</span>
      <b className="font-latin text-[10.5px] font-bold text-[#4a2c2a] min-[641px]:text-[13px]">{value}</b>
    </div>
  );
}

function PhoneButton({ pressed, children }: { pressed: boolean; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "mt-auto grid h-8 place-items-center rounded-[10px] bg-[#c8586b] text-[11px] font-bold text-white transition-transform duration-150 min-[641px]:h-11 min-[641px]:rounded-[14px] min-[641px]:text-sm",
        pressed && "scale-[0.97]",
      )}
    >
      {children}
    </div>
  );
}
