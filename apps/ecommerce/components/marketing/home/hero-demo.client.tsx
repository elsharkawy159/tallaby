"use client";

import * as React from "react";
import Image from "next/image";
import {
  ArrowLeft,
  Banknote,
  Bell,
  Blocks,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronsUpDown,
  ExternalLink,
  Eye,
  Globe,
  LayoutGrid,
  Megaphone,
  Menu,
  Package,
  PanelRight,
  Percent,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  TrendingUp,
  Truck,
  Wallet,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@workspace/ui/lib/utils";
import { DemoCursor } from "./demo-cursor";
import { formatUsd } from "@/lib/marketing/pricing.lib";
import { HERO_DEMO_WALLET_USD_CENTS, ordersAfter, sparkPaths, wrapIndex, type DemoOrder } from "./home-demo.lib";
import { useDemoSteps } from "./use-demo.client";

/** product, cursor to add, summary, cursor to place, confirmed, order lands, toast gone. */
const STEPS = [1300, 1150, 1600, 1150, 500, 2600, 2100] as const;
const SHIPPING = 50;
const FIRST_NEW_ORDER = 2481;
/** Sample week: sales, orders and visits that agree with each other (average order and conversion are worked out). */
const BASE_SALES = 48_320;
const BASE_ORDERS = 38;
const VISITS = 2940;
const SPARKS = [
  [12, 18, 15, 22, 19, 26, 23, 30, 27, 33, 31, 36],
  [8, 11, 10, 14, 12, 16, 15, 19, 17, 21, 20, 23],
  [40, 44, 42, 47, 45, 50, 48, 52, 51, 55, 54, 58],
  [1.1, 1.2, 1.1, 1.3, 1.2, 1.3, 1.2, 1.4, 1.3, 1.3, 1.4, 1.3],
];
/** A Pexels photo (the host is allowed in next.config `images.remotePatterns`). */
const pexels = (id: number) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=500`;
/**
 * glow sells bags: product shots on a white background, not used by any other
 * demo or template. The names are `home.demo.hero.products` in the same order,
 * and the sample orders use these prices + shipping.
 */
const PRODUCTS = [
  { price: 1450, image: pexels(22434764), position: "center 55%" },
  { price: 1290, image: pexels(22432987), position: "center 55%" },
  { price: 980, image: pexels(22434773), position: "center 50%" },
];
const BADGE = { pending: "bg-[#fff4dc] text-[#8a5a00]", shipped: "bg-[#e8f1fb] text-[#1d5fa8]", delivered: "bg-[#e5f6ea] text-[#15803d]" };

const money = (n: number) => n.toLocaleString("en-US");

/**
 * The hero's stage: an order placed on the phone lands in the seller's
 * dashboard, drawn after the redesigned dashboard home (Claude Design "Seller
 * Home v3"). All sample data, every pound amount in the page's own word for it.
 */
export function HeroDemo({ walletEgp }: { walletEgp?: string }) {
  const t = useTranslations("home.demo.hero");
  const ar = useLocale() === "ar";
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
  let sales = BASE_SALES;
  for (let i = Math.max(0, added - 50); i < added; i++) sales += make(i).total;
  const orderCount = BASE_ORDERS + added;
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const egp = t("egp");

  const index = wrapIndex(cycle, PRODUCTS.length);
  const product = PRODUCTS[index]!;
  const productName = products[index] ?? "";
  const view = step <= 1 ? 1 : step <= 3 ? 2 : 3;
  // Moves onto each control a step before it is pressed (each press waits 700ms for it):
  // Add to cart, then the cash-on-delivery choice, then Place order.
  const cursor = step <= 1 ? { x: 50, y: 90 } : step === 2 ? { x: 16, y: 52 } : step === 3 ? { x: 50, y: 90 } : { x: 70, y: 40 };
  const fresh = make(added - 1);

  const groups = [
    {
      label: t("nav.groupSell"),
      items: [
        { icon: Package, label: t("nav.products"), chevron: true },
        { icon: ShoppingBag, label: t("nav.orders"), count: pendingCount, chevron: true },
        { icon: Truck, label: t("nav.shipping"), chevron: true },
        { icon: Wallet, label: t("nav.wallet") },
      ],
    },
    {
      label: t("nav.groupStore"),
      items: [
        { icon: Globe, label: t("nav.onlineStore"), chevron: true },
        { icon: Megaphone, label: t("nav.offers") },
        { icon: Blocks, label: t("nav.apps") },
        { icon: Settings, label: t("nav.settings"), chevron: true },
      ],
    },
  ];
  const kpis = [
    { label: t("kpi.sales"), icon: Banknote, value: money(sales), unit: egp, delta: "18.4%", spark: 0, bump: step === 5 },
    { label: t("kpi.orders"), icon: ShoppingBag, value: String(orderCount), unit: t("kpi.ordersUnit"), delta: "12.1%", spark: 1, bump: step === 5 },
    { label: t("kpi.visits"), icon: Eye, value: money(VISITS), unit: t("kpi.visitsUnit"), delta: "6.3%", spark: 2, extra: true },
    { label: t("kpi.conversion"), icon: Percent, value: ((orderCount / VISITS) * 100).toFixed(1), unit: "%", delta: "4.0%", spark: 3, extra: true },
  ];

  return (
    <div ref={ref} aria-hidden className="relative mx-auto mt-11 w-full max-w-[1060px] text-start min-[641px]:mt-16">
      <div className="grid overflow-hidden rounded-2xl border border-[#e7e9e8] bg-[#f8f9f8] text-[13px] text-[#333] shadow-[0_16px_44px_rgba(13,55,67,0.09),0_2px_8px_rgba(13,55,67,0.04)] min-[641px]:me-[110px] min-[641px]:rounded-[20px] min-[1081px]:me-[150px] min-[1081px]:grid-cols-[208px_minmax(0,1fr)]">
        <aside className="hidden flex-col gap-2 border-e border-[#e7e9e8] bg-white p-2.5 min-[1081px]:flex">
          <div className="flex h-9 items-center justify-between px-1.5">
            <b className="font-latin text-[19px] font-extrabold tracking-[-0.01em] text-teal-900">tallaby</b>
            <PanelRight className="size-4 text-[#808080] rtl:-scale-x-100" />
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-[#e7e9e8] p-2">
            <span className="grid size-[30px] flex-none place-items-center rounded-[9px] bg-teal-900 font-latin text-sm font-extrabold text-white">g</span>
            <div className="min-w-0 flex-1">
              <b className="block font-latin text-[12.5px] font-bold text-[#171717]">glow</b>
              <small dir="ltr" className="block truncate text-start font-latin text-[10.5px] font-medium text-[#808080]">glow.tallaby.com</small>
            </div>
            <ChevronsUpDown className="size-3.5 flex-none text-[#808080]" />
          </div>
          <span className="flex items-center gap-2.5 rounded-xl bg-teal-900 px-2.5 py-2 text-[12.5px] font-bold text-white shadow-[0_6px_16px_rgba(20,81,99,0.22)]">
            <LayoutGrid className="size-4" />
            {t("nav.home")}
          </span>
          {groups.map((group) => (
            <div key={group.label} className="flex flex-col gap-0.5">
              <small className="px-2.5 pt-1.5 pb-0.5 text-[10.5px] font-semibold text-[#9aa7aa]">{group.label}</small>
              {group.items.map((item) => (
                <span key={item.label} className="flex items-center gap-2.5 rounded-[10px] px-2.5 py-[6px] text-[12.5px] whitespace-nowrap text-[#171717]">
                  <item.icon className="size-4 flex-none text-[#808080]" />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.count ? <b className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-amber-600 px-1 font-latin text-[10px] font-bold text-teal-900">{item.count}</b> : null}
                  {item.chevron ? <ChevronDown className="size-[13px] flex-none text-[#a0a0a0]" /> : null}
                </span>
              ))}
            </div>
          ))}
        </aside>

        <div className="flex min-w-0 flex-col">
          <div className="flex h-[46px] items-center gap-1.5 border-b border-[#e7e9e8] bg-white/90 px-2.5 min-[641px]:h-[54px] min-[641px]:gap-2.5 min-[641px]:px-4">
            <span className="grid size-[30px] flex-none place-items-center text-[#808080] min-[1081px]:hidden">
              <Menu className="size-4" />
            </span>
            <b className="flex-1 text-[13.5px] font-bold whitespace-nowrap text-[#171717] min-[641px]:flex-none min-[641px]:text-[15px]">{t("title")}</b>
            <span dir="ltr" className="hidden h-[30px] items-center gap-1.5 rounded-full border border-[#e7e9e8] px-2.5 font-latin text-[11px] font-medium whitespace-nowrap text-[#5f6b6e] min-[641px]:flex">
              <i className="size-[7px] rounded-full bg-[#16a34a]" />
              glow.tallaby.com
              <ExternalLink className="size-3" />
            </span>
            <span className="mx-auto hidden h-[30px] max-w-[260px] flex-1 items-center gap-2 rounded-full border border-[#e7e9e8] bg-white px-3 text-[11.5px] text-[#9a9a9a] min-[861px]:flex">
              <Search className="size-3.5 flex-none" />
              <span className="min-w-0 flex-1 truncate">{t("search")}</span>
              <kbd dir="ltr" className="rounded-[5px] border border-[#e7e9e8] bg-[#f7f7f7] px-1 font-latin text-[10px] text-[#808080]">Ctrl K</kbd>
            </span>
            <span className="flex h-[30px] flex-none items-center gap-1.5 rounded-full border border-[#e7e9e8] bg-white ps-2.5 pe-1 text-[11.5px] whitespace-nowrap text-[#5f6b6e]">
              <span className="hidden min-[641px]:inline">{t("walletLabel")}</span>
              <Wallet className="size-3.5 min-[641px]:hidden" />
              <b dir="ltr" className="font-latin text-[12px] font-bold text-[#171717]">{formatUsd(HERO_DEMO_WALLET_USD_CENTS)}</b>
              {/* Arabic also shows it in pounds at the live rate; not on narrow screens, where the pill has no room. */}
              {ar && walletEgp ? <span className="hidden text-[11px] text-[#808080] min-[861px]:inline">{t("walletApprox", { amount: walletEgp })}</span> : null}
              <span className="grid size-[22px] place-items-center rounded-full bg-[#eef3f4] text-teal-900">
                <Plus className="size-3" />
              </span>
            </span>
            <span className="relative grid size-[30px] flex-none place-items-center text-[#808080]">
              <Bell className="size-4" />
              <i
                className={cn(
                  "absolute -end-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-amber-600 px-1 font-latin text-[9px] font-bold text-teal-900 not-italic shadow-[0_0_0_2px_#fff] transition-transform duration-200",
                  step === 5 ? "scale-100" : "scale-0",
                )}
              >
                1
              </i>
            </span>
          </div>

          <div className="flex flex-col gap-2.5 p-3 pb-[120px] min-[641px]:gap-3.5 min-[641px]:p-[18px]">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <b className="block text-[16px] font-bold text-[#171717] min-[641px]:text-xl">{t("greeting")}</b>
                <small className="text-xs text-[#808080]">{t("newOrders", { count: pendingCount })}</small>
              </div>
              <div className="hidden items-center gap-1.5 min-[641px]:flex">
                <span className="flex h-8 items-center gap-1.5 rounded-full border border-[#d9dddc] bg-white px-3 text-xs whitespace-nowrap">
                  <CalendarDays className="size-[13px] text-[#808080]" />
                  {t("last7")}
                  <ChevronDown className="size-[13px] text-[#808080]" />
                </span>
                <span className="flex h-8 items-center gap-1.5 rounded-full bg-amber-600 px-3.5 text-xs font-bold whitespace-nowrap text-teal-900 shadow-[0_6px_14px_rgba(253,173,40,0.35)]">
                  <Plus className="size-3.5" />
                  {t("addProduct")}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 min-[641px]:grid-cols-4 min-[641px]:gap-2.5">
              {kpis.map((kpi) => {
                const spark = sparkPaths(SPARKS[kpi.spark]!);
                return (
                  <div key={kpi.label} className={cn("min-w-0 flex-col gap-[7px] rounded-2xl border border-[#e7e9e8] bg-white p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] min-[641px]:rounded-[18px] min-[641px]:px-3.5 min-[641px]:pt-3 min-[641px]:pb-2.5", kpi.extra ? "hidden min-[641px]:flex" : "flex")}>
                    <div className="flex items-center justify-between gap-2 text-xs font-semibold text-[#3f4a4d]">
                      <span className="truncate">{kpi.label}</span>
                      <span className="grid size-[30px] flex-none place-items-center rounded-[10px] border border-[#e7eef0] bg-[#f6f9fa] text-[#145163]">
                        <kpi.icon className="size-[15px]" />
                      </span>
                    </div>
                    <div className="flex items-baseline gap-[5px]">
                      <b className={cn("font-latin text-[17px] leading-none font-bold text-[#171717] transition-colors duration-500 min-[641px]:text-[22px]", kpi.bump && "text-[#15803d]")}>{kpi.value}</b>
                      <span className="text-[11.5px] text-[#808080]">{kpi.unit}</span>
                    </div>
                    <svg viewBox="0 0 200 34" preserveAspectRatio="none" className="block h-7 w-full rtl:-scale-x-100">
                      <path d={spark.area} className="fill-[#145163] opacity-[0.08]" />
                      <path d={spark.line} fill="none" stroke="#145163" strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                    </svg>
                    <div className="flex min-h-5 items-center justify-between gap-1.5 border-t border-dashed border-[#e7e9e8] pt-1.5 text-[10.5px] text-[#808080]">
                      <span className="hidden truncate min-[1081px]:inline">{t("kpi.previous")}</span>
                      <span dir="ltr" className="inline-flex h-5 flex-none items-center gap-[3px] rounded-full bg-[#e5f6ea] px-[7px] font-latin text-[10px] font-bold text-[#15803d]">
                        <TrendingUp className="size-[11px]" />
                        {kpi.delta}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <section className="overflow-hidden rounded-[18px] border border-[#e7e9e8] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between px-3.5 pt-3 pb-2.5">
                <div>
                  <b className="block text-[14px] font-bold text-[#171717]">{t("latest")}</b>
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
                      <th key={label} className={cn("border-y border-[#e7e9e8] bg-[#f7f8f8] px-2.5 py-[7px] text-start text-[11px] font-medium whitespace-nowrap text-[#808080] min-[641px]:px-3.5", cls)}>
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
                      <td className="px-2.5 py-2 text-xs font-semibold whitespace-nowrap min-[641px]:px-3.5">
                        <span className="font-latin">{money(o.total)}</span> {egp}
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
              <div className="relative aspect-[1.15] overflow-hidden rounded-2xl border border-[#f1f1f1] bg-white">
                <Image src={product.image} alt={productName} fill sizes="230px" className="object-cover" style={{ objectPosition: product.position }} />
                <span className="absolute start-2 top-2 rounded-full bg-[#c8586b] px-2 py-0.5 font-latin text-[10px] font-bold text-white">NEW</span>
              </div>
              <p className="text-[11px] leading-[1.4] text-[#4a2c2a] min-[641px]:text-[15px]">{productName}</p>
              <div className="text-xs font-bold text-[#c8586b] min-[641px]:text-base">
                <span className="font-latin">{money(product.price)}</span> {egp}
              </div>
              <PhoneButton pressed={step === 1}>{t("addToCart")}</PhoneButton>
            </PhoneView>
            <PhoneView on={view === 2}>
              <p className="text-[11px] leading-[1.4] font-semibold text-[#4a2c2a] min-[641px]:text-[15px]">{t("summary")}</p>
              <SummaryRow label={productName} value={money(product.price)} />
              <SummaryRow label={t("shipping")} value={String(SHIPPING)} />
              <div className="flex justify-between gap-2 border-t border-dashed border-[#f0dcd8] pt-2.5 text-[10px] text-[#7a6461] min-[641px]:text-sm">
                <span>{t("total")}</span>
                <b className="text-[10.5px] font-bold text-[#c8586b] min-[641px]:text-[15px]">
                  <span className="font-latin">{money(product.price + SHIPPING)}</span> {egp}
                </b>
              </div>
              {/* Picked by the cursor's click in step 2 (same delay as the buttons' press). */}
              <div className={cn("flex items-center gap-2 rounded-xl border-[1.5px] p-1.5 text-[10px] font-semibold text-[#4a2c2a] transition-colors duration-150 min-[641px]:p-2.5 min-[641px]:text-[12.5px]", step >= 2 ? "border-[#c8586b] delay-700" : "border-[#eadcd9]")}>
                <i className={cn("size-3.5 flex-none rounded-full transition-[border-width,border-color] duration-150", step >= 2 ? "border-4 border-[#c8586b] delay-700" : "border-2 border-[#d9c9c6]")} />
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
            {fresh.customer} · <span className="font-latin">{money(fresh.total)}</span> {egp}
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
        "mt-auto grid h-8 place-items-center rounded-[10px] bg-[#c8586b] text-[11px] font-bold text-white transition-[transform,filter] duration-150 min-[641px]:h-11 min-[641px]:rounded-[14px] min-[641px]:text-sm",
        pressed && "scale-[0.94] brightness-90 delay-700",
      )}
    >
      {children}
    </div>
  );
}
