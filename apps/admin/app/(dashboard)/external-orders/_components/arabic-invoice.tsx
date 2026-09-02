"use client";

import { useRef, useState } from "react";
import { Copy, Loader2, Printer } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { formatPricePlain } from "@workspace/lib";
import { getGovernorateLabel } from "@workspace/lib/address";
import { toast } from "sonner";
import type { PlacedExternalOrderResult } from "../external-orders.types";
import {
  captureInvoiceImage,
  getOrderStatusTone,
  translateOrderStatus,
  translatePaymentStatus,
} from "./arabic-invoice.lib";

interface ArabicInvoiceProps {
  data: PlacedExternalOrderResult;
}

function formatAddress(data: PlacedExternalOrderResult): string {
  const addr = data.address;
  if (!addr) return "—";

  const governorate = getGovernorateLabel(addr.state) || addr.state;

  const parts = [
    addr.addressLine1,
    addr.addressLine2,
    `${addr.city}، ${governorate}`,
    addr.postalCode,
    addr.country,
  ].filter(Boolean);

  return parts.join(" — ");
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    numberingSystem: "latn",
  });
}

function formatPhone(phone: string | null): string {
  if (!phone) return "—";
  return phone.replace(/(\d{3})(\d{4})(\d{4})/, "$1 $2 $3");
}

export function ArabicInvoice({ data }: ArabicInvoiceProps) {
  const { order, orderItems, customer } = data;
  const isPaid =
    order.paymentStatus === "paid" || order.paymentMethod === "cash";

  const subtotal = Number(order.subtotal);
  const shipping = Number(order.shippingCost ?? 0);
  const discount = Number(order.discountAmount ?? 0);
  const total = Number(order.totalAmount);
  const itemCount = orderItems.reduce((sum, item) => sum + item.quantity, 0);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isCopying, setIsCopying] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyAsImage = async () => {
    const node = invoiceRef.current;
    if (!node) return;

    if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
      toast.error("المتصفح لا يدعم نسخ الصور");
      return;
    }

    setIsCopying(true);

    try {
      const blob = await captureInvoiceImage(node);

      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);

      toast.success("تم نسخ الفاتورة كصورة");
    } catch {
      toast.error("تعذر نسخ الفاتورة. حاول مرة أخرى.");
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }

          html, body {
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          body * {
            visibility: hidden !important;
          }

          #external-order-invoice,
          #external-order-invoice * {
            visibility: visible !important;
          }

          #external-order-invoice {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: white !important;
            z-index: 99999 !important;
            overflow: visible !important;
          }

          #external-order-invoice table {
            width: 100% !important;
            table-layout: fixed;
            border-collapse: collapse;
          }

          #external-order-invoice th,
          #external-order-invoice td {
            word-wrap: break-word;
            overflow-wrap: anywhere;
          }

          .no-print {
            display: none !important;
          }
        }
      `,
        }}
      />

      <div className="no-print mb-4 flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleCopyAsImage}
          disabled={isCopying}
          className="gap-2"
        >
          {isCopying ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          نسخ كصورة
        </Button>
        <Button type="button" onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" />
          طباعة الفاتورة
        </Button>
      </div>

      <div
        ref={invoiceRef}
        id="external-order-invoice"
        dir="rtl"
        lang="ar"
        className="font-noto-kufi-arabic mx-auto max-w-3xl overflow-visible rounded-2xl border border-[#e2cbcb]/60 bg-white text-right antialiased shadow-lg print:mx-0 print:max-w-none print:w-full print:rounded-none print:border-0 print:shadow-none"
      >
        {/* Brand header */}
        <div className="bg-[#145163] px-8 py-6 text-white print:px-0 print:py-5">
          <div className="flex items-start justify-between gap-6">
            <div className="space-y-3">
              <p className="text-sm font-medium text-white/80">فاتورة طلب</p>
              <h1 className="text-2xl font-bold tracking-tight">طلبي</h1>
              <p className="text-sm text-white/70">
                منصة تسوق إلكتروني موثوقة
              </p>
            </div>
            <div className="shrink-0 rounded-xl bg-white/95 px-4 py-3">
              <img
                src="/logo-primary.png"
                alt="Tallaby"
                width={140}
                height={40}
                className="h-10 w-auto object-contain"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6 p-8 print:p-0 print:pt-4">
          {/* Order meta */}
          <div className="grid gap-4 rounded-xl border border-[#e2cbcb]/50 bg-[#fafaf8] p-4 sm:grid-cols-3">
            <div className="text-right">
              <p className="text-xs font-medium text-[#808080]">رقم الطلب</p>
              <p
                className="mt-1 font-mono text-base font-bold text-[#145163]"
                dir="ltr"
              >
                {order.orderNumber}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-[#808080]">تاريخ الطلب</p>
              <p className="mt-1 text-sm font-semibold text-[#333333]">
                {formatDate(order.createdAt)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-[#808080]">
                عدد المنتجات
              </p>
              <p className="mt-1 text-sm font-semibold text-[#333333]">
                {itemCount} قطعة
              </p>
            </div>
          </div>

          {/* Customer + order status */}
          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-xl border border-[#e2cbcb]/50 p-4">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#145163]">
                <span className="inline-block h-4 w-1 rounded-full bg-[#fdad28]" />
                بيانات العميل
              </h2>
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-[#333333]">
                  {customer.fullName}
                </p>
                <p className="text-[#808080]" dir="ltr">
                  {formatPhone(customer.phone)}
                </p>
              </div>
            </section>

            <section className="rounded-xl border border-[#e2cbcb]/50 p-4">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#145163]">
                <span className="inline-block h-4 w-1 rounded-full bg-[#fdad28]" />
                حالة الطلب
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${getOrderStatusTone(order.status)}`}
                >
                  {translateOrderStatus(order.status)}
                </span>
                <span className="inline-flex rounded-full bg-[#145163]/10 px-3 py-1 text-xs font-semibold text-[#145163] ring-1 ring-inset ring-[#145163]/20">
                  {isPaid
                    ? translatePaymentStatus(order.paymentStatus)
                    : "الدفع عند الاستلام"}
                </span>
              </div>
            </section>
          </div>

          {/* Shipping address */}
          <section className="rounded-xl border border-[#e2cbcb]/50 p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#145163]">
              <span className="inline-block h-4 w-1 rounded-full bg-[#fdad28]" />
              عنوان الشحن
            </h2>
            <p className="text-sm leading-7 text-[#555555]">
              {formatAddress(data)}
            </p>
          </section>

          {/* Products table */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#145163]">
              <span className="inline-block h-4 w-1 rounded-full bg-[#fdad28]" />
              تفاصيل المنتجات
            </h2>
            <div className="overflow-hidden rounded-xl border border-[#e2cbcb]/50">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#145163] text-white">
                    <th className="px-4 py-3 text-right font-semibold">
                      المنتج
                    </th>
                    <th className="w-20 px-3 py-3 text-center font-semibold">
                      الكمية
                    </th>
                    <th className="w-28 px-3 py-3 text-right font-semibold">
                      السعر
                    </th>
                    <th className="w-28 px-4 py-3 text-right font-semibold">
                      الإجمالي
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orderItems.map((item, index) => (
                    <tr
                      key={item.id}
                      className={
                        index % 2 === 0 ? "bg-white" : "bg-[#fafaf8]"
                      }
                    >
                      <td className="px-4 py-3 text-right">
                        <p className="font-medium text-[#333333]">
                          {item.productName}
                        </p>
                        {item.variantName ? (
                          <p className="mt-0.5 text-xs text-[#808080]">
                            {item.variantName}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 text-center font-medium">
                        {item.quantity}
                      </td>
                      <td
                        className="px-3 py-3 text-right font-medium"
                        dir="ltr"
                      >
                        {formatPricePlain(Number(item.price), "ar")}
                      </td>
                      <td
                        className="px-4 py-3 text-right font-semibold text-[#145163]"
                        dir="ltr"
                      >
                        {formatPricePlain(Number(item.subtotal), "ar")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Totals */}
          <div className="flex justify-start">
            <div className="w-full max-w-sm space-y-2 rounded-xl border border-[#e2cbcb]/50 bg-[#fafaf8] p-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[#808080]">المجموع الفرعي</span>
                <span className="font-medium" dir="ltr">
                  {formatPricePlain(subtotal, "ar")}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[#808080]">الشحن</span>
                <span className="font-medium" dir="ltr">
                  {formatPricePlain(shipping, "ar")}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex items-center justify-between gap-4 text-emerald-700">
                  <span>الخصم</span>
                  <span className="font-medium" dir="ltr">
                    -{formatPricePlain(discount, "ar")}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between gap-4 border-t border-[#e2cbcb]/60 pt-3">
                <span className="text-base font-bold text-[#145163]">
                  الإجمالي النهائي
                </span>
                <span
                  className="text-lg font-bold text-[#145163]"
                  dir="ltr"
                >
                  {formatPricePlain(total, "ar")}
                </span>
              </div>
            </div>
          </div>

          {/* Payment + notes */}
          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-xl border border-[#fdad28]/40 bg-[#fdad28]/10 p-4">
              <p className="text-xs font-medium text-[#808080]">طريقة الدفع</p>
              <p className="mt-1 text-lg font-bold text-[#333333]">
                {isPaid ? "مدفوع" : "الدفع عند الاستلام"}
              </p>
            </section>

            {order.notes ? (
              <section className="rounded-xl border border-[#e2cbcb]/50 p-4">
                <p className="text-xs font-medium text-[#808080]">ملاحظات</p>
                <p className="mt-1 text-sm text-[#333333]">{order.notes}</p>
              </section>
            ) : null}
          </div>

          {/* Footer */}
          <div className="border-t border-[#e2cbcb]/50 pt-6 text-center">
            <p className="text-sm font-semibold text-[#145163]">
              شكراً لتسوقكم من طلبي
            </p>
            <p className="mt-1 text-xs text-[#808080]">
              Tallaby — تجربة تسوق موثوقة ومميزة
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
