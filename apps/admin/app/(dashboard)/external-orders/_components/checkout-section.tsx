'use client'

import { useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@workspace/ui/components/form'
import { RadioGroup, RadioGroupItem } from '@workspace/ui/components/radio-group'
import { Label } from '@workspace/ui/components/label'
import { Input } from '@workspace/ui/components/input'
import { Button } from '@workspace/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'
import { formatPricePlain } from '@workspace/lib'
import { isCodEligibleForShipping } from '@workspace/lib/orders/payment'
import type {
  ExternalOrderFormData,
  ExternalOrderPricing,
} from '../external-orders.schema'
import type { ExternalOrderPreview } from '../external-orders.types'

interface CheckoutSectionProps {
  preview: ExternalOrderPreview | null
  isLoadingPreview: boolean
  pricing: ExternalOrderPricing
  onPricingChange: (pricing: ExternalOrderPricing) => void
}

/** Blank input means "no override" — not zero. */
function parseOverride(raw: string): number | undefined {
  if (raw.trim() === '') return undefined
  const value = Number(raw)
  if (Number.isNaN(value) || value < 0) return undefined
  return value
}

export function CheckoutSection({
  preview,
  isLoadingPreview,
  pricing,
  onPricingChange,
}: CheckoutSectionProps) {
  const form = useFormContext<ExternalOrderFormData>()
  const billedShipping = preview
    ? Math.max(0, preview.shippingCost - preview.discountAmount)
    : null
  const isCodEligible =
    billedShipping == null ? true : isCodEligibleForShipping(billedShipping)

  useEffect(() => {
    if (!isCodEligible && form.getValues('paymentType') === 'cod') {
      form.setValue('paymentType', 'paid', {
        shouldValidate: true,
        shouldDirty: true,
      })
    }
  }, [isCodEligible, form])

  return (
    <Card>
      <CardHeader>
        <CardTitle>4. Checkout</CardTitle>
        <CardDescription>Select payment method and review totals.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormField
          control={form.control}
          name="paymentType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment method</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex flex-col gap-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="paid" id="paid" />
                    <Label htmlFor="paid">Paid — customer already paid</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cod" id="cod" disabled={!isCodEligible} />
                    <Label
                      htmlFor="cod"
                      className={!isCodEligible ? 'text-muted-foreground' : undefined}
                    >
                      COD — Cash on Delivery
                      {!isCodEligible && (
                        <span className="ml-2 text-xs text-orange-600">
                          (Not available when shipping exceeds 90 EGP)
                        </span>
                      )}
                    </Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="rounded-lg border bg-muted/40 p-4 space-y-3 text-sm">
          {isLoadingPreview ? (
            <p className="text-muted-foreground">Calculating totals…</p>
          ) : preview ? (
            <>
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPricePlain(preview.subtotal, 'en')} EGP</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span>Shipping</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    className="h-8 w-28 bg-background"
                    placeholder={formatPricePlain(
                      preview.calculatedShippingCost,
                      'en',
                    )}
                    value={pricing.shippingCost ?? ''}
                    onChange={(e) =>
                      onPricingChange({
                        ...pricing,
                        shippingCost: parseOverride(e.target.value),
                      })
                    }
                  />
                  <span className="text-xs text-muted-foreground">EGP</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-green-700">Discount</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    className="h-8 w-28 bg-background"
                    placeholder={formatPricePlain(
                      preview.calculatedDiscountAmount,
                      'en',
                    )}
                    value={pricing.discountAmount ?? ''}
                    onChange={(e) =>
                      onPricingChange({
                        ...pricing,
                        discountAmount: parseOverride(e.target.value),
                      })
                    }
                  />
                  <span className="text-xs text-muted-foreground">EGP</span>
                </div>
              </div>

              {(pricing.shippingCost != null ||
                pricing.discountAmount != null) && (
                <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span>
                    Manual pricing — calculated shipping{' '}
                    {formatPricePlain(preview.calculatedShippingCost, 'en')} EGP,
                    discount{' '}
                    {formatPricePlain(preview.calculatedDiscountAmount, 'en')} EGP
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7"
                    onClick={() => onPricingChange({})}
                  >
                    Reset
                  </Button>
                </div>
              )}

              <div className="flex justify-between border-t pt-2 text-base font-semibold">
                <span>Total</span>
                <span>{formatPricePlain(preview.total, 'en')} EGP</span>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">
              Add products and address to see totals.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
