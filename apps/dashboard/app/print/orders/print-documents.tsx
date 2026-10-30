import { isPaymentSettled } from "@/app/(main)/orders/order-flow.lib";
import { formatDateTime, formatMoney } from "@/lib/i18n/format";
import type { PrintOrder, PrintSender } from "./print-orders.types";

/** A translator for the `orders` namespace (createTranslator), in the printout's language. */
export type PrintT = {
  (key: string, values?: Record<string, string | number>): string;
  has: (key: string) => boolean;
};

type DocProps = { order: PrintOrder; t: PrintT; locale: "ar" | "en" };

function paymentLabel(order: PrintOrder, t: PrintT) {
  const key = `details.paymentMethods.${order.paymentMethod}`;
  return order.paymentMethod ? (t.has(key) ? t(key) : order.paymentMethod.replace(/_/g, " ")) : "—";
}

function SenderBlock({ sender, compact = false }: { sender: PrintSender; compact?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      {sender.logoUrl && (
        // A plain <img>: the print dialog waits for it, and next/image would lazy-load it.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={sender.logoUrl}
          alt=""
          className={compact ? "size-9 shrink-0 rounded object-contain" : "size-14 shrink-0 rounded-md object-contain"}
        />
      )}
      <div className="min-w-0">
        <p className={compact ? "truncate text-sm font-bold" : "truncate text-xl font-bold"}>{sender.name}</p>
        {!compact && (sender.website || sender.phone) && (
          <p className="text-xs text-neutral-600">
            {sender.website && <span dir="ltr">{sender.website}</span>}
            {sender.website && sender.phone && " · "}
            {sender.phone && <span dir="ltr">{sender.phone}</span>}
          </p>
        )}
      </div>
    </div>
  );
}

function AddressBlock({ order, t, large = false }: { order: PrintOrder; t: PrintT; large?: boolean }) {
  const name = order.address?.fullName || order.customerName;
  const phone = order.address?.phone || order.customerPhone;
  return (
    <div className="space-y-0.5">
      {name && <p className={large ? "text-base font-bold" : "font-semibold"}>{name}</p>}
      {phone && (
        <p className={large ? "text-lg font-bold tracking-wide" : "font-medium"} dir="ltr">
          <span className="inline-block">{phone}</span>
        </p>
      )}
      {order.address ? (
        <>
          {order.address.line && <p>{order.address.line}</p>}
          {order.address.area && <p>{order.address.area}</p>}
        </>
      ) : (
        <p className="text-neutral-500">{t("print.noAddress")}</p>
      )}
    </div>
  );
}

function CollectBox({ order, t, locale, large = false }: DocProps & { large?: boolean }) {
  return (
    <div className="rounded-md border-2 border-black px-3 py-2 text-center">
      {order.collect ? (
        <>
          <p className="text-xs font-semibold">{t("print.collect")}</p>
          <p className={large ? "text-2xl font-extrabold tabular-nums" : "text-xl font-extrabold tabular-nums"} dir="ltr">
            {formatMoney(order.collect, locale)}
          </p>
        </>
      ) : (
        <p className="text-sm font-bold">{t("print.nothingToCollect")}</p>
      )}
    </div>
  );
}

function Notes({ order, t }: { order: PrintOrder; t: PrintT }) {
  const notes = [
    order.address?.instructions ? [t("print.instructions"), order.address.instructions] : null,
    order.notes ? [t("print.note"), order.notes] : null,
    order.giftMessage ? [t("print.giftMessage"), order.giftMessage] : null,
  ].filter((n): n is [string, string] => Boolean(n));
  if (notes.length === 0) return null;
  return (
    <div className="space-y-1 rounded-md border border-neutral-300 p-2 text-xs">
      {notes.map(([label, text]) => (
        <p key={label} className="whitespace-pre-wrap">
          <span className="font-semibold">{label}: </span>
          {text}
        </p>
      ))}
    </div>
  );
}

function TotalRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={strong ? "flex justify-between gap-6 border-t border-black pt-1.5 text-base font-bold" : "flex justify-between gap-6"}>
      <span>{label}</span>
      <span className="tabular-nums" dir="ltr">
        {value}
      </span>
    </div>
  );
}

/** A4 invoice: sender, customer, every line with prices, totals and the door amount. */
export function InvoiceDocument({ order, t, locale }: DocProps) {
  const money = (value: string) => formatMoney(value, locale);
  const discount = Number(order.discountAmount) || 0;
  return (
    <article className="print-sheet print-sheet-a4 flex flex-col gap-6 text-[13px]">
      <header className="flex items-start justify-between gap-6 border-b-2 border-black pb-4">
        <SenderBlock sender={order.sender} />
        <div className="shrink-0 text-end">
          <p className="text-2xl font-extrabold uppercase">{t("print.invoice")}</p>
          <p className="font-semibold">{t("print.order", { number: order.orderNumber })}</p>
          <p className="text-neutral-600">{formatDateTime(order.createdAt, locale)}</p>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-6">
        <div>
          <h2 className="mb-1 text-xs font-bold uppercase text-neutral-500">{t("print.shipTo")}</h2>
          <AddressBlock order={order} t={t} />
        </div>
        <div>
          <h2 className="mb-1 text-xs font-bold uppercase text-neutral-500">{t("print.payment")}</h2>
          <p className="font-semibold">{paymentLabel(order, t)}</p>
          {isPaymentSettled(order.paymentStatus) && <p>{t("print.paid")}</p>}
        </div>
      </section>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-black text-start text-xs uppercase">
            <th className="py-1.5 text-start font-bold">{t("print.item")}</th>
            <th className="w-14 py-1.5 text-center font-bold">{t("print.qty")}</th>
            <th className="w-28 py-1.5 text-end font-bold">{t("print.price")}</th>
            <th className="w-28 py-1.5 text-end font-bold">{t("print.total")}</th>
          </tr>
        </thead>
        <tbody>
          {order.lines.map((line) => (
            <tr key={line.id} className="break-inside-avoid border-b border-neutral-300 align-top">
              <td className="py-2 pe-3">
                <p className="font-medium">{line.productName}</p>
                {(line.variantName || line.sku) && (
                  <p className="text-xs text-neutral-600">
                    {line.variantName}
                    {line.variantName && line.sku && " · "}
                    {line.sku && t("print.sku", { sku: line.sku })}
                  </p>
                )}
              </td>
              <td className="py-2 text-center tabular-nums">{line.quantity}</td>
              <td className="py-2 text-end tabular-nums" dir="ltr">
                {money(line.price)}
              </td>
              <td className="py-2 text-end font-medium tabular-nums" dir="ltr">
                {money(line.total)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="flex items-start justify-between gap-6">
        <div className="max-w-[55%] flex-1 space-y-3">
          <Notes order={order} t={t} />
          {!order.wholeOrder && <p className="text-xs text-neutral-600">{t("print.partialNote")}</p>}
        </div>
        <div className="w-64 shrink-0 space-y-1.5">
          {order.wholeOrder ? (
            <>
              <TotalRow label={t("print.subtotal")} value={money(order.subtotal)} />
              <TotalRow label={t("print.shipping")} value={money(order.shippingCost)} />
              {discount > 0 && <TotalRow label={t("print.discount")} value={`- ${money(order.discountAmount)}`} />}
              <TotalRow label={t("print.orderTotal")} value={money(order.totalAmount)} strong />
              <div className="pt-2">
                <CollectBox order={order} t={t} locale={locale} />
              </div>
            </>
          ) : (
            <TotalRow label={t("print.yourItems")} value={money(order.linesTotal)} strong />
          )}
        </div>
      </section>

      <footer className="mt-auto border-t border-neutral-300 pt-3 text-center text-xs text-neutral-600">
        {t("print.thanks")}
      </footer>
    </article>
  );
}

/** A6 packing slip: who it goes to, what is inside, and what to collect. No prices. */
export function SlipDocument({ order, t, locale }: DocProps) {
  return (
    <article className="print-sheet print-sheet-a6 flex flex-col gap-2.5 text-[11px] leading-snug">
      <header className="flex items-center justify-between gap-2 border-b-2 border-black pb-2">
        <SenderBlock sender={order.sender} compact />
        <div className="shrink-0 text-end">
          <p className="text-sm font-extrabold" dir="ltr">
            #{order.orderNumber}
          </p>
          <p className="text-[10px] text-neutral-600">{formatDateTime(order.createdAt, locale)}</p>
        </div>
      </header>

      <section>
        <h2 className="text-[10px] font-bold uppercase text-neutral-500">{t("print.shipTo")}</h2>
        <AddressBlock order={order} t={t} large />
      </section>

      {order.wholeOrder && <CollectBox order={order} t={t} locale={locale} large />}

      <section className="min-h-0 flex-1">
        <h2 className="mb-1 text-[10px] font-bold uppercase text-neutral-500">
          {t("print.items", { count: order.itemCount })}
        </h2>
        <ul className="space-y-1">
          {order.lines.map((line) => (
            <li key={line.id} className="flex gap-2 border-b border-dashed border-neutral-300 pb-1">
              <span className="w-7 shrink-0 font-bold tabular-nums">{line.quantity}×</span>
              <span className="min-w-0">
                <span className="font-medium">{line.productName}</span>
                {line.variantName && <span className="text-neutral-600"> · {line.variantName}</span>}
                {line.sku && <span className="block text-[10px] text-neutral-500">{t("print.sku", { sku: line.sku })}</span>}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <Notes order={order} t={t} />
    </article>
  );
}
