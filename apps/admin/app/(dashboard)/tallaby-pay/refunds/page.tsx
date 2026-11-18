import Link from "next/link";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table";
import { loadTallabyPayRefunds } from "../tallaby-pay.data";
import { cairoTime, egpAmount, refundReasonLabel } from "../tallaby-pay.lib";
import { EmptyState, LoadError, Tone } from "../tallaby-pay.ui";
import { DeclineRefundAction, RefundDuplicateAction, RefundSaleAction } from "./refunds.client";

export const dynamic = "force-dynamic";

/**
 * Money to give back from Tallaby's EasyKash account: sales with a refund
 * request (the seller cancelled, or a payment arrived after the cancel) and
 * second payments for an order already paid. Refund in EasyKash first, then
 * record it here.
 */
export default async function TallabyPayRefundsPage() {
  const result = await loadTallabyPayRefunds();
  if (!result.data) return <LoadError error={result.error} />;
  const { sales, duplicates } = result.data;

  return (
    <div className="space-y-6">
      <section className="space-y-3" aria-labelledby="tp-refund-sales">
        <div>
          <h2 id="tp-refund-sales" className="text-lg font-semibold">
            Refund requests
          </h2>
          <p className="text-sm text-muted-foreground">
            Only orders that were never delivered. After delivery the seller refunds the customer, and Tallaby changes nothing.
          </p>
        </div>
        {sales.length === 0 ? (
          <EmptyState>No refund is waiting.</EmptyState>
        ) : (
          <Card>
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asked</TableHead>
                    <TableHead>Store</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Why</TableHead>
                    <TableHead className="text-end">Customer paid</TableHead>
                    <TableHead>EasyKash</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((s) => (
                    <TableRow key={s.saleId}>
                      <TableCell className="whitespace-nowrap text-sm">{cairoTime(s.requestedAt)}</TableCell>
                      <TableCell>
                        <Link href={`/stores/${s.storeId}`} className="font-medium hover:underline">
                          {s.storeName}
                        </Link>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {s.orderId ? (
                          <Link href={`/orders/${s.orderId}`} className="hover:underline">
                            #{s.orderNumber ?? s.orderId.slice(0, 8)}
                          </Link>
                        ) : (
                          "—"
                        )}
                        {s.purpose === "deposit" && <span className="ms-1 text-xs text-muted-foreground">deposit</span>}
                        {s.orderStatus && <span className="block text-xs text-muted-foreground">{s.orderStatus}</span>}
                      </TableCell>
                      <TableCell className="max-w-64 text-sm">
                        {s.refundReason === "paid_after_cancel" ? (
                          <Tone tone="warning">{refundReasonLabel(s.refundReason)}</Tone>
                        ) : (
                          refundReasonLabel(s.refundReason)
                        )}
                      </TableCell>
                      <TableCell className="text-end tabular-nums">
                        {egpAmount(s.gross)}
                        <span className="block text-xs text-muted-foreground">
                          net {egpAmount(s.net)} · fee {egpAmount(s.fee)}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs" dir="ltr">
                        {s.easykashRef}
                        {s.customerReference && <span className="block text-muted-foreground">{s.customerReference}</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap justify-end gap-2">
                          {s.delivered ? (
                            <span className="text-xs text-destructive">Delivered: the seller refunds</span>
                          ) : (
                            <RefundSaleAction saleId={s.saleId} amount={egpAmount(s.gross)} />
                          )}
                          {/* A payment made after the cancel belongs to the customer: refund only. */}
                          {s.refundReason !== "paid_after_cancel" && <DeclineRefundAction saleId={s.saleId} />}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </section>

      <section className="space-y-3" aria-labelledby="tp-refund-twice">
        <div>
          <h2 id="tp-refund-twice" className="text-lg font-semibold">
            Paid twice
          </h2>
          <p className="text-sm text-muted-foreground">
            A customer paid again for an order that was already paid. The second payment was never credited to the store.
          </p>
        </div>
        {duplicates.length === 0 ? (
          <EmptyState>No second payment is waiting.</EmptyState>
        ) : (
          <Card>
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paid</TableHead>
                    <TableHead>Store</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead className="text-end">Amount</TableHead>
                    <TableHead>EasyKash</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {duplicates.map((d) => (
                    <TableRow key={d.paymentId}>
                      <TableCell className="whitespace-nowrap text-sm">{cairoTime(d.createdAt)}</TableCell>
                      <TableCell>
                        {d.storeId ? (
                          <Link href={`/stores/${d.storeId}`} className="font-medium hover:underline">
                            {d.storeName}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Link href={`/orders/${d.orderId}`} className="hover:underline">
                          #{d.orderNumber ?? d.orderId.slice(0, 8)}
                        </Link>
                        {d.method === "cod_deposit" && <span className="ms-1 text-xs text-muted-foreground">deposit</span>}
                      </TableCell>
                      <TableCell className="text-end tabular-nums">{egpAmount(d.amount)}</TableCell>
                      <TableCell className="font-mono text-xs" dir="ltr">
                        {d.easykashRef}
                      </TableCell>
                      <TableCell className="text-end">
                        <RefundDuplicateAction paymentId={d.paymentId} amount={egpAmount(d.amount)} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
