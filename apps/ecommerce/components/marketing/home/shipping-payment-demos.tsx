import { Barcode } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { cn } from "@workspace/ui/lib/utils";

/** A still frame: an order sent with Bosta from the orders screen, tracking number ready. Sample data. */
export async function ShippingDemo() {
  const t = await getTranslations("home.demo.shipping");
  const options = t.raw("options") as { name: string; body: string; price: string; latin?: boolean }[];

  return (
    <div aria-hidden className="flex w-full max-w-[470px] flex-col gap-3 rounded-[20px] border border-line bg-white p-4 shadow-soft min-[641px]:rounded-card min-[641px]:p-5">
      <div className="flex items-start justify-between gap-2.5">
        <div>
          <b className="text-base text-teal-900">{t("product")}</b>
          <small className="block text-[12.5px] text-ink-400">{t("place")}</small>
        </div>
        <span className="rounded-full bg-[#e0ecff] px-2.5 py-[3px] text-xs font-bold whitespace-nowrap text-[#1d4ed8]">{t("status.shipped")}</span>
      </div>
      <p className="text-[12.5px] font-semibold text-ink-400">{t("shipWith")}</p>
      {options.map((option, i) => (
        <div key={option.name} className={cn("flex items-center gap-3 rounded-[14px] border-[1.5px] px-3.5 py-3", i === 0 ? "border-teal-700 bg-[#f6fafb]" : "border-[#e6eef0]")}>
          <span className={cn("size-5 flex-none rounded-full", i === 0 ? "border-[6px] border-teal-700" : "border-2 border-[#cfdde1]")} />
          <div className="min-w-0 flex-1">
            <b className={cn("text-sm text-teal-900", option.latin && "font-latin")}>{option.name}</b>
            <small className="block text-xs text-ink-400">{option.body}</small>
          </div>
          <b className="text-sm whitespace-nowrap text-teal-900">{option.price}</b>
        </div>
      ))}
      <div className="flex items-center gap-3 rounded-[14px] bg-amber-50 px-3.5 py-3">
        <Barcode className="flex-none text-[#8a5300]" />
        <div className="min-w-0 flex-1">
          <small className="block text-[11.5px] text-[#8a5300]">{t("tracking")}</small>
          <b dir="ltr" className="block text-start font-latin text-sm text-teal-900">7384 2291 06</b>
        </div>
        <span className="rounded-[10px] border border-line bg-white px-2.5 py-[5px] text-xs font-bold whitespace-nowrap text-teal-900">{t("label")}</span>
      </div>
    </div>
  );
}

/** A store's checkout on a phone with its payment methods, cash on delivery picked. Sample data. */
export async function PaymentDemo() {
  const t = await getTranslations("home.demo.payment");
  const methods = t.raw("methods") as { name: string; note?: string }[];

  return (
    <div aria-hidden className="w-[260px] rounded-[38px] bg-[#0f1d21] p-[9px] shadow-raise min-[641px]:w-[280px]">
      <div className="flex flex-col gap-3 rounded-[30px] bg-white px-4 pt-8 pb-5">
        <div className="flex items-baseline justify-between gap-2">
          <b className="text-[15px] text-teal-900">{t("title")}</b>
          <small className="text-[13px] font-bold text-teal-900">
            <span className="font-latin">1,240</span> {t("egp")}
          </small>
        </div>
        <p className="text-xs font-semibold text-ink-400">{t("method")}</p>
        {methods.map((m, i) => (
          <div key={m.name} className={cn("flex items-center gap-2.5 rounded-xl border-[1.5px] px-3 py-2.5 text-[13px] font-semibold text-[#26393e]", i === 0 ? "border-teal-700 bg-[#f6fafb]" : "border-[#e6eef0]")}>
            <span className={cn("size-4 flex-none rounded-full", i === 0 ? "border-[5px] border-teal-700" : "border-2 border-[#cfdde1]")} />
            <span className="min-w-0 flex-1">{m.name}</span>
            {m.note ? <em className="font-latin text-[10.5px] text-ink-400 not-italic">{m.note}</em> : null}
          </div>
        ))}
        <span className="mt-4 grid h-11 place-items-center rounded-[14px] bg-amber-600 text-sm font-bold text-teal-900">{t("place")}</span>
      </div>
    </div>
  );
}
