"use client";

import { Barcode, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@workspace/ui/lib/utils";
import { useDemoSteps } from "./use-demo.client";

/** ready, riders hovered, Bosta picked, shipped, on the way, delivered, hold. */
const SHIP_STEPS = [700, 800, 900, 1200, 1200, 2800] as const;
const SHIP_STILL = 3;

const STATUS = {
  ready: "bg-[#fef3c7] text-[#92400e]",
  shipped: "bg-[#e0ecff] text-[#1d4ed8]",
  delivered: "bg-[#dcfce7] text-[#166534]",
};

/** An order being sent with Bosta from the orders screen. Sample data. */
export function ShippingDemo() {
  const t = useTranslations("home.demo.shipping");
  const { ref, step } = useDemoSteps<HTMLDivElement>(SHIP_STEPS, SHIP_STILL);
  const options = t.raw("options") as { name: string; body: string; price: string; latin?: boolean }[];
  const picked = step === 0 ? -1 : step === 1 ? 1 : 0;
  const shipped = step >= 3;
  const stage = step >= 5 ? 2 : step >= 4 ? 1 : shipped ? 0 : -1;
  const status = step >= 5 ? "delivered" : shipped ? "shipped" : "ready";

  return (
    <div ref={ref} aria-hidden className="flex w-full max-w-[470px] flex-col gap-3 rounded-[20px] border border-line bg-white p-4 shadow-[0_16px_40px_rgba(13,55,67,0.07)] min-[641px]:rounded-card min-[641px]:p-5">
      <div className="flex items-start justify-between gap-2.5">
        <div>
          <b dir="ltr" className="font-latin text-base text-teal-900">#2481</b>
          <small className="block text-[12.5px] text-ink-400">{t("customer")}</small>
        </div>
        <span className={cn("rounded-full px-2.5 py-[3px] text-xs font-bold whitespace-nowrap transition-colors duration-300", STATUS[status])}>{t(`status.${status}`)}</span>
      </div>
      <p className="text-[12.5px] font-semibold text-ink-400">{t("shipWith")}</p>
      <div className="flex flex-col gap-2">
        {options.map((option, i) => (
          <div key={option.name} className={cn("grid grid-cols-[20px_minmax(0,1fr)_auto] items-center gap-3 rounded-[14px] border-[1.5px] border-[#e6eef0] px-3.5 py-3 transition-colors duration-300", picked === i && "border-teal-700 bg-[#f6fafb]")}>
            <span className={cn("size-5 rounded-full border-2 border-[#cfdde1] transition-[border] duration-300", picked === i && "border-[6px] border-teal-700")} />
            <div className="min-w-0">
              <b className={cn("text-sm text-teal-900", option.latin && "font-latin")}>{option.name}</b>
              <small className="block text-xs text-ink-400">{option.body}</small>
            </div>
            <span className="text-sm font-bold whitespace-nowrap text-teal-900">{option.price}</span>
          </div>
        ))}
      </div>
      <div className={cn("flex items-center gap-3 rounded-[14px] border border-amber-100 bg-amber-50 px-3.5 py-3 transition-[opacity,transform] duration-500", shipped ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0")}>
        <Barcode className="flex-none text-[#8a5300]" />
        <div className="min-w-0 flex-1">
          <small className="block text-[11.5px] text-[#8a5300]">{t("tracking")}</small>
          <b dir="ltr" className="block text-start font-latin text-sm text-teal-900">7384 2291 06</b>
        </div>
        <span className="rounded-[10px] border border-line bg-white px-2.5 py-[5px] text-xs font-bold whitespace-nowrap text-teal-900">{t("label")}</span>
      </div>
      <div className="relative grid grid-cols-3 pt-1 before:absolute before:inset-x-[16%] before:top-[13px] before:h-0.5 before:bg-[#e6eef0]">
        {[t("stage.picked"), t("stage.onTheWay"), t("stage.delivered")].map((label, i) => (
          <span key={label} className={cn("relative flex flex-col items-center gap-1.5 text-center text-xs text-[#6b7f84]", i <= stage && "font-semibold text-teal-900")}>
            <i className={cn("size-5 rounded-full border-2 border-[#dfe8ea] bg-white transition-colors duration-300", i <= stage && "border-[#16a34a] bg-[#16a34a] shadow-[0_0_0_4px_#dcfce7]")} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

const PAY_STEPS = [1500, 1500, 1500, 1500] as const;

/** A store's checkout cycling through its payment methods. Sample data. */
export function PaymentDemo() {
  const t = useTranslations("home.demo.payment");
  const { ref, step } = useDemoSteps<HTMLDivElement>(PAY_STEPS, 0);
  const methods = t.raw("methods") as { name: string; note?: string }[];

  return (
    <div ref={ref} aria-hidden className="relative aspect-[9/17] w-[260px] rounded-[38px] bg-[#0f1d21] p-[9px] shadow-[0_18px_44px_rgba(13,55,67,0.18)] min-[641px]:w-[280px]">
      <div className="absolute start-1/2 top-4 z-[2] h-5 w-[76px] -translate-x-1/2 rounded-xl bg-[#0f1d21] rtl:translate-x-1/2" />
      <div className="flex h-full flex-col gap-3 overflow-hidden rounded-[30px] bg-white px-4 pt-12 pb-5">
        <div className="flex items-baseline justify-between gap-2">
          <b className="text-[15px] text-teal-900">{t("title")}</b>
          <small className="text-[13px] font-bold text-teal-900">
            <span className="font-latin">1,240</span> {t("egp")}
          </small>
        </div>
        <p className="text-xs font-semibold text-ink-400">{t("method")}</p>
        <div className="flex flex-col gap-2">
          {methods.map((m, i) => (
            <div key={m.name} className={cn("flex items-center gap-2.5 rounded-xl border-[1.5px] border-[#e6eef0] px-3 py-2.5 text-[13px] font-semibold text-[#26393e] transition-colors duration-300", i === step && "border-teal-700 bg-[#f6fafb]")}>
              <span className={cn("size-4 flex-none rounded-full border-2 border-[#cfdde1] transition-[border] duration-300", i === step && "border-[5px] border-teal-700")} />
              <span className="min-w-0 flex-1">{m.name}</span>
              {m.note ? <em className="font-latin text-[10.5px] font-semibold text-ink-400 not-italic">{m.note}</em> : null}
            </div>
          ))}
        </div>
        <div className="mt-auto grid h-11 place-items-center rounded-[14px] bg-amber-600 text-sm font-bold text-teal-900">{t("place")}</div>
        <p className="flex items-center justify-center gap-1.5 text-xs text-ink-400">
          <ShieldCheck className="size-3.5 text-[#16a34a]" />
          {t("secure")}
        </p>
      </div>
    </div>
  );
}
