"use client";

import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { ArabicInvoice } from "../../../external-orders/_components/arabic-invoice";
import type { PlacedExternalOrderResult } from "../../../external-orders/external-orders.types";

interface OrderInvoiceContentProps {
  orderId: string;
  invoice: PlacedExternalOrderResult;
}

export function OrderInvoiceContent({
  orderId,
  invoice,
}: OrderInvoiceContentProps) {
  return (
    <div className="space-y-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-2">
        <Link href={`/orders/${orderId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Order
          </Button>
        </Link>
        <Link href={`/orders/${orderId}/edit`}>
          <Button variant="outline" size="sm">
            <Pencil className="h-4 w-4 mr-2" />
            Edit prices
          </Button>
        </Link>
      </div>

      <ArabicInvoice data={invoice} />
    </div>
  );
}
