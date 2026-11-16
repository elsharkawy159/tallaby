import type { CSSProperties } from "react";
import Image from "next/image";
import { Bell, ShoppingBag, Wallet } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { cn } from "@workspace/ui/lib/utils";
import { Money } from "@/components/marketing/pricing/visitor-prices.client";
import { getTemplateGallery } from "@/lib/marketing/templates.server";
import { HeroPhoneScreen } from "./hero-phone.client";
import { heroPhoneShots } from "./hero-phone.lib";
import { HERO_DEMO_WALLET_USD_CENTS } from "./home-demo.lib";

type Order = { product: string; when: string; total: number; status: "pending" | "shipped" | "delivered" };

/** Sample week (a still frame, the new order included): sales, orders and visits that agree with each other. */
const SALES = 49_820;
const ORDERS = 39;
const VISITS = 2940;
/** The new order: one bag plus shipping. */
const PRODUCT_PRICE = 1450;
const SHIPPING = 50;
const BADGE = { pending: "bg-[#fff4dc] text-[#8a5a00]", shipped: "bg-[#e8f1fb] text-[#1d5fa8]", delivered: "bg-[#e5f6ea] text-[#15803d]" };

const money = (n: number) => n.toLocaleString("en-US");

/** One of the order's things (bag, parcel): the outer box pops in once, the image inside drifts slowly (`.hero-float`). */
function Floating({ src, className, float }: { src: string; className: string; float: Record<`--float-${string}`, string> }) {
  return (
    <span className={cn("absolute z-[2] block motion-safe:animate-pop", className)}>
      <Image src={src} alt="" width={256} height={256} unoptimized className="hero-float block h-auto w-full" style={float as CSSProperties} />
    </span>
  );
}

/**
 * The hero's stage: the seller's dashboard, where an order has just landed,
 * and the store on a phone. The dashboard is a still frame of sample data (the
 * wallet shows in the visitor's currency like every tallaby.com price, owner
 * 2026-11-10); the phone shows a real template that scrolls itself, a
 * different one on every load (owner, 2026-11-17; HeroPhoneScreen).
 */
export async function HeroDemo() {
  const locale = await getLocale();
  const [t, gallery] = await Promise.all([getTranslations("home.demo.hero"), getTemplateGallery(locale)]);
  const phoneShots = heroPhoneShots(gallery);
  const hasPhone = phoneShots.length > 0;
  const egp = t("egp");
  const productName = (t.raw("products") as string[])[0] ?? "";
  const fresh: Order = { product: productName, when: "justNow", total: PRODUCT_PRICE + SHIPPING, status: "pending" };
  const orders = [fresh, ...(t.raw("orders") as Order[])].slice(0, 4);
  const pending = orders.filter((o) => o.status === "pending").length;
  const kpis = [
    { label: t("kpi.sales"), value: money(SALES), unit: egp },
    { label: t("kpi.orders"), value: String(ORDERS), unit: t("kpi.ordersUnit") },
    { label: t("kpi.visits"), value: money(VISITS), unit: t("kpi.visitsUnit"), wide: true },
    { label: t("kpi.conversion"), value: ((ORDERS / VISITS) * 100).toFixed(1), unit: "%", wide: true },
  ];

  return (
    <div aria-hidden className="relative mx-auto mt-[68px] w-full max-w-[1060px] text-start text-[13px] text-[#333] min-[641px]:mt-20">
      {/* The phone covers only the dashboard's last 30 px (its padding): the end margin and the top bar's wider end padding keep the bell, amounts and statuses clear of it. */}
      <div className={cn("overflow-hidden rounded-2xl border border-[#e7e9e8] bg-[#f8f9f8] shadow-soft min-[641px]:rounded-[20px]", hasPhone && "min-[641px]:me-[190px] min-[1081px]:me-[210px]")}>
        <div className={cn("flex h-[50px] items-center gap-2 border-b border-[#e7e9e8] bg-white px-3 min-[641px]:ps-4", hasPhone ? "min-[641px]:pe-12" : "min-[641px]:pe-4")}>
          <b className="flex-1 text-[14px] font-bold text-[#171717] min-[641px]:text-[15px]">{t("title")}</b>
          <span className="flex h-[30px] items-center gap-1.5 rounded-full border border-[#e7e9e8] px-2.5 text-[11.5px] whitespace-nowrap text-[#5f6b6e]">
            <Wallet className="size-3.5" />
            <span className="hidden min-[641px]:inline">{t("walletLabel")}</span>
            <b className="text-[12px] text-[#171717]"><Money cents={HERO_DEMO_WALLET_USD_CENTS} /></b>
          </span>
          <span className="relative grid size-[30px] place-items-center text-[#808080]">
            <Bell className="size-4" />
            <i className="absolute -end-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-amber-600 font-latin text-[9px] font-bold text-teal-900 not-italic">1</i>
          </span>
        </div>

        {/* Under 641 px the phone stands in the space kept below the order list. */}
        <div className={cn("flex flex-col gap-3 p-3 min-[641px]:p-[18px]", hasPhone && "pb-[160px]")}>
          <div>
            <b className="block text-[16px] font-bold text-[#171717] min-[641px]:text-xl">{t("greeting")}</b>
            <small className="text-xs text-[#808080]">{t("newOrders", { count: pending })}</small>
          </div>
          <div className="grid grid-cols-2 gap-2 min-[641px]:gap-2.5 min-[861px]:grid-cols-4">
            {kpis.map((kpi) => (
              <div key={kpi.label} className={cn("rounded-2xl border border-[#e7e9e8] bg-white p-3", kpi.wide && "hidden min-[861px]:block")}>
                <span className="block truncate text-xs font-semibold text-[#3f4a4d]">{kpi.label}</span>
                <b className="font-latin text-[18px] font-bold text-[#171717] min-[641px]:text-[22px]">{kpi.value}</b> <span className="text-[11.5px] text-[#808080]">{kpi.unit}</span>
              </div>
            ))}
          </div>
          <ul className="m-0 list-none overflow-hidden rounded-2xl border border-[#e7e9e8] bg-white p-0">
            <li className="px-3.5 py-2.5 text-[14px] font-bold text-[#171717]">{t("latest")}</li>
            {orders.map((o, i) => (
              <li key={i} className={cn("flex items-center gap-2.5 border-t border-[#e7e9e8] px-3.5 py-2 text-xs", i === 0 && "bg-[#fff4dc]")}>
                <span className="min-w-0 flex-1 truncate">{o.product}</span>
                <span className="hidden text-[#808080] min-[861px]:block">{t(`when.${o.when}`)}</span>
                <span className="font-semibold whitespace-nowrap">
                  <span className="font-latin">{money(o.total)}</span> {egp}
                </span>
                <span className={cn("rounded-full px-2 py-0.5 text-[10.5px] font-medium whitespace-nowrap", BADGE[o.status])}>{t(`status.${o.status}`)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* The store on a phone, over the end corner: a template's home page that scrolls itself. */}
      {hasPhone && (
        <div className="absolute -end-1 -bottom-[176px] z-[3] w-[160px] rounded-[28px] bg-[#0f1d21] p-1.5 shadow-stage min-[641px]:end-0 min-[641px]:-bottom-[70px] min-[641px]:w-[220px] min-[641px]:rounded-[36px] min-[641px]:p-2 min-[1081px]:-bottom-[112px] min-[1081px]:w-[240px] min-[1081px]:rounded-[40px] min-[1081px]:p-[9px]">
          <HeroPhoneScreen shots={phoneShots} className="aspect-[9/19] rounded-[22px] min-[641px]:rounded-[28px] min-[1081px]:rounded-[30px]" />
          <i className="absolute top-2.5 left-1/2 h-2 w-[30%] -translate-x-1/2 rounded-full bg-[#0f1d21] min-[641px]:top-3.5 min-[641px]:h-2.5 min-[1081px]:top-4 min-[1081px]:h-3" />
        </div>
      )}

      {/* The order's bag and parcel drift slowly, each at its own pace. From 641 px they sit off the free corners
          (opposite the notice and behind the phone's top); on phones, in the space beside the phone. Not directional, so not mirrored. */}
      <Floating
        src="/marketing/home/home-hero-bag.webp"
        className="start-[92px] -bottom-[150px] w-[66px] [animation-delay:300ms] min-[641px]:start-auto min-[641px]:end-7 min-[641px]:-top-14 min-[641px]:bottom-auto min-[641px]:w-[104px] min-[1081px]:-top-[68px] min-[1081px]:w-[128px]"
        float={{ "--float-run": "9s", "--float-delay": "-2s", "--float-x": "3px", "--float-y": "-7px", "--float-turn": "3deg" }}
      />
      <Floating
        src="/marketing/home/home-hero-parcel.webp"
        className="start-2 -bottom-[62px] w-[92px] [animation-delay:450ms] min-[641px]:-start-4 min-[641px]:-bottom-[76px] min-[641px]:w-[96px] min-[1081px]:-start-8 min-[1081px]:-bottom-[100px] min-[1081px]:w-[124px] min-[1281px]:-start-20"
        float={{ "--float-run": "12s", "--float-delay": "-7s", "--float-x": "-4px", "--float-y": "-5px", "--float-turn": "-2.5deg" }}
      />

      {/* The new order's notice, above the dashboard's start corner (clear of its title). */}
      <div className="absolute -top-[56px] start-2 z-[4] flex items-center gap-2.5 rounded-2xl border border-line bg-white px-3 py-2 shadow-raise min-[641px]:start-7">
        <span className="grid size-8 place-items-center rounded-xl bg-amber-100 text-amber-700">
          <ShoppingBag className="size-[18px]" />
        </span>
        <div>
          <b className="block text-[13.5px] text-teal-900">{t("newOrder")}</b>
          <small className="text-xs text-ink-400">
            {fresh.product} · <span className="font-latin">{money(fresh.total)}</span> {egp}
          </small>
        </div>
      </div>
    </div>
  );
}
