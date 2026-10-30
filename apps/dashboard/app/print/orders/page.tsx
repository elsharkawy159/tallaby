import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createTranslator, type AbstractIntlMessages } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { isAccessError, requireSeller } from "@/lib/auth/require-seller.server";
import ar from "@/messages/ar.json";
import en from "@/messages/en.json";
import { InvoiceDocument, PickingDocument, SlipDocument, type PrintT } from "./print-documents";
import { PRINT_DOCS, parsePrintDoc, parsePrintIds, parsePrintLocale, printOrdersHref } from "./print-orders.lib";
import { loadPrintOrders } from "./print-orders.server";
import { PrintToolbar } from "./print-toolbar.client";

// Customer names, phones and addresses for the session seller: never cached.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("orders.print");
  return { title: t("metaTitle"), robots: { index: false, follow: false } };
}

// Sheet sizes for the screen preview and the printer (ROADMAP.md F-04a).
const PRINT_CSS = `
.print-sheet { background: #fff; color: #000; box-shadow: 0 1px 3px rgb(0 0 0 / .15); margin: 16px auto; box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.print-sheet-a4 { width: 210mm; min-height: 297mm; padding: 14mm; }
.print-sheet-a6 { width: 105mm; min-height: 148mm; padding: 5mm; }
@media screen and (max-width: 820px) { .print-sheet-a4 { width: 100%; min-height: 0; padding: 20px; } }
@media print {
  html, body { background: #fff !important; }
  .print-toolbar { display: none !important; }
  .print-sheet { margin: 0; box-shadow: none; break-after: page; }
  .print-sheet:last-child { break-after: auto; }
}
`;

export default async function PrintOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string | string[]; doc?: string; lang?: string; print?: string }>;
}) {
  let sellerId: string;
  try {
    ({ sellerId } = await requireSeller());
  } catch (error) {
    if (isAccessError(error)) redirect("/");
    throw error;
  }

  const [params, dashboardLocale] = await Promise.all([searchParams, getLocale()]);
  const doc = parsePrintDoc(params.doc);
  const ids = parsePrintIds(params.ids);
  const locale = parsePrintLocale(params.lang, dashboardLocale === "en" ? "en" : "ar");
  // Typed loosely: inferring keys from the whole messages file is too heavy for tsc.
  const messages = (locale === "en" ? en : ar) as AbstractIntlMessages;
  const t = createTranslator({ locale, messages, namespace: "orders" }) as unknown as PrintT;

  const orders = await loadPrintOrders(sellerId, ids, {
    name: t("print.tallaby"),
    logoUrl: "/logo/logo.png",
    website: "tallaby.com",
    phone: null,
  });

  const href = (nextDoc: typeof doc, nextLocale: typeof locale) =>
    `${printOrdersHref(nextDoc, ids)}&lang=${nextLocale}`;
  const Document = doc === "slip" ? SlipDocument : InvoiceDocument;

  return (
    <div className="min-h-screen bg-muted print:bg-white" lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <style>{`${PRINT_CSS}\n@page { size: ${doc === "slip" ? "A6" : "A4"}; margin: 0; }`}</style>
      <PrintToolbar
        autoPrint={params.print === "1" && orders.length > 0}
        title={`${t(`print.${doc}`)} · ${t("print.ordersCount", { count: orders.length })}`}
        printLabel={t("print.print")}
        closeLabel={t("print.close")}
        docs={PRINT_DOCS.map((d) => ({ href: href(d, locale), label: t(`print.${d}`), active: d === doc }))}
        languages={(["ar", "en"] as const).map((l) => ({
          href: href(doc, l),
          label: l === "ar" ? "عربي" : "English",
          active: l === locale,
        }))}
      />
      {orders.length === 0 ? (
        <div className="mx-auto max-w-md px-4 py-16 text-center">
          <p className="font-semibold">{t("print.empty")}</p>
          <p className="text-sm text-muted-foreground">{t("print.emptyHint")}</p>
        </div>
      ) : doc === "picking" ? (
        <div className="px-4 pb-8 print:p-0">
          <PickingDocument orders={orders} t={t} locale={locale} />
        </div>
      ) : (
        <div className="px-4 pb-8 print:p-0">
          {orders.map((order) => (
            <Document key={order.id} order={order} t={t} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
