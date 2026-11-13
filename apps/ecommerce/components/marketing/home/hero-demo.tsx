import Image from "next/image";
import { Bell, ShoppingBag, Wallet } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { cn } from "@workspace/ui/lib/utils";
import { Money } from "@/components/marketing/pricing/visitor-prices.client";
import { HERO_DEMO_WALLET_USD_CENTS } from "./home-demo.lib";

type Order = { product: string; when: string; total: number; status: "pending" | "shipped" | "delivered" };

/** Sample week (a still frame, the new order included): sales, orders and visits that agree with each other. */
const SALES = 49_820;
const ORDERS = 39;
const VISITS = 2940;
/** glow sells bags: a Pexels shot on white (the host is allowed in next.config `images.remotePatterns`). */
const PRODUCT = { price: 1450, image: "https://images.pexels.com/photos/22434764/pexels-photo-22434764.jpeg?auto=compress&cs=tinysrgb&w=500" };
const SHIPPING = 50;
const BADGE = { pending: "bg-[#fff4dc] text-[#8a5a00]", shipped: "bg-[#e8f1fb] text-[#1d5fa8]", delivered: "bg-[#e5f6ea] text-[#15803d]" };

const money = (n: number) => n.toLocaleString("en-US");

/**
 * The hero's stage, a still frame: an order placed on the store's phone page
 * has just landed in the seller's dashboard. Sample data; the wallet shows in
 * the visitor's currency like every tallaby.com price (owner, 2026-11-10).
 */
export async function HeroDemo() {
  const t = await getTranslations("home.demo.hero");
  const egp = t("egp");
  const productName = (t.raw("products") as string[])[0] ?? "";
  const fresh: Order = { product: productName, when: "justNow", total: PRODUCT.price + SHIPPING, status: "pending" };
  const orders = [fresh, ...(t.raw("orders") as Order[])].slice(0, 4);
  const pending = orders.filter((o) => o.status === "pending").length;
  const kpis = [
    { label: t("kpi.sales"), value: money(SALES), unit: egp },
    { label: t("kpi.orders"), value: String(ORDERS), unit: t("kpi.ordersUnit") },
    { label: t("kpi.visits"), value: money(VISITS), unit: t("kpi.visitsUnit"), wide: true },
    { label: t("kpi.conversion"), value: ((ORDERS / VISITS) * 100).toFixed(1), unit: "%", wide: true },
  ];

  return (
    <div aria-hidden className="relative mx-auto mt-11 w-full max-w-[1060px] text-start text-[13px] text-[#333] min-[641px]:mt-16">
      <div className="overflow-hidden rounded-2xl border border-[#e7e9e8] bg-[#f8f9f8] shadow-soft min-[641px]:me-[110px] min-[641px]:rounded-[20px] min-[1081px]:me-[150px]">
        <div className="flex h-[50px] items-center gap-2 border-b border-[#e7e9e8] bg-white px-3 min-[641px]:px-4">
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

        <div className="flex flex-col gap-3 p-3 pb-[110px] min-[641px]:p-[18px]">
          <div>
            <b className="block text-[16px] font-bold text-[#171717] min-[641px]:text-xl">{t("greeting")}</b>
            <small className="text-xs text-[#808080]">{t("newOrders", { count: pending })}</small>
          </div>
          <div className="grid grid-cols-2 gap-2 min-[641px]:grid-cols-4 min-[641px]:gap-2.5">
            {kpis.map((kpi) => (
              <div key={kpi.label} className={cn("rounded-2xl border border-[#e7e9e8] bg-white p-3", kpi.wide && "hidden min-[641px]:block")}>
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

      {/* The store on a phone: the product the order came from. */}
      <div className="absolute -end-1 -bottom-[60px] z-[3] w-[150px] rounded-[26px] bg-[#0f1d21] p-1.5 shadow-raise min-[641px]:end-0 min-[641px]:-bottom-12 min-[641px]:w-[210px] min-[641px]:rounded-[34px] min-[641px]:p-2 min-[1081px]:w-[240px]">
        <div className="flex flex-col gap-1.5 overflow-hidden rounded-[21px] bg-white p-2 pt-3 min-[641px]:gap-2.5 min-[641px]:rounded-[27px] min-[641px]:p-3 min-[641px]:pt-5">
          <b className="flex items-center justify-between font-latin text-xs font-extrabold text-[#4a2c2a] min-[641px]:text-[15px]">
            glow
            <ShoppingBag className="size-4" />
          </b>
          <span className="relative block aspect-[1.1] overflow-hidden rounded-xl">
            <Image src={PRODUCT.image} alt="" fill sizes="230px" className="object-cover" style={{ objectPosition: "center 55%" }} />
          </span>
          <p className="truncate text-[11px] text-[#4a2c2a] min-[641px]:text-sm">{productName}</p>
          <b className="text-xs text-[#c8586b] min-[641px]:text-base">
            <span className="font-latin">{money(PRODUCT.price)}</span> {egp}
          </b>
          <span className="text-[10px] text-[#7a6461] min-[641px]:text-xs">{t("cod")}</span>
          <span className="grid h-8 place-items-center rounded-[10px] bg-[#c8586b] text-[11px] font-bold text-white min-[641px]:h-10 min-[641px]:text-sm">{t("placeOrder")}</span>
        </div>
      </div>

      {/* The new order's notice, over the dashboard's start corner. */}
      <div className="absolute -top-[30px] start-2 z-[4] flex items-center gap-2.5 rounded-2xl border border-line bg-white px-3 py-2 shadow-raise min-[641px]:start-7">
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
