'use client'

import { formatPricePlain } from '@workspace/lib'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'
import type { ExternalOrderPreview } from '../external-orders.types'

interface OrderSummarySidebarProps {
  preview: ExternalOrderPreview | null
  itemCount: number
  paymentType: 'cod' | 'paid'
}

export function OrderSummarySidebar({
  preview,
  itemCount,
  paymentType,
}: OrderSummarySidebarProps) {
  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="text-lg">Order summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Items</span>
          <span>{itemCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Payment</span>
          <span>{paymentType === 'paid' ? 'Paid' : 'COD'}</span>
        </div>
        {preview && (
          <>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPricePlain(preview.subtotal, 'en')} EGP</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>{formatPricePlain(preview.shippingCost, 'en')} EGP</span>
            </div>
            <div className="flex justify-between border-t pt-2 text-base font-semibold">
              <span>Total</span>
              <span>{formatPricePlain(preview.total, 'en')} EGP</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
