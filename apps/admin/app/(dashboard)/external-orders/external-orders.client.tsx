'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, FormProvider, type Resolver } from 'react-hook-form'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'
import { Form } from '@workspace/ui/components/form'
import { Textarea } from '@workspace/ui/components/textarea'
import { addressDefaults, resolveGovernorateSelectValue } from '@workspace/lib/address'
import { PageHeader } from '@/components/layout/page-header'
import {
  placeExternalOrder,
  previewExternalOrderTotals,
} from '@/actions/external-orders'
import {
  externalOrderFormSchema,
  type ExternalOrderFormData,
} from './external-orders.schema'
import {
  type CustomerLookupData,
  type ExternalOrderCartLine,
  type ExternalOrderPreview,
  type PlacedExternalOrderResult,
} from './external-orders.types'
import { CustomerSection } from './_components/customer-section'
import { AddressSection } from './_components/address-section'
import { ProductCartSection } from './_components/product-cart-section'
import { CheckoutSection } from './_components/checkout-section'
import { OrderSummarySidebar } from './_components/order-summary-sidebar'
import { ArabicInvoice } from './_components/arabic-invoice'

const defaultValues: ExternalOrderFormData = {
  customer: {
    fullName: '',
    phone: '',
    email: '',
  },
  address: {
    ...addressDefaults,
    addressType: 'shipping',
    fullName: '',
    phone: '',
    addressLine1: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Egypt',
  } as ExternalOrderFormData['address'],
  items: [],
  paymentType: 'cod',
  notes: '',
}

export function ExternalOrdersClient() {
  const [cartLines, setCartLines] = useState<ExternalOrderCartLine[]>([])
  const [preview, setPreview] = useState<ExternalOrderPreview | null>(null)
  const [isPreviewLoading, startPreview] = useTransition()
  const [isSubmitting, startSubmit] = useTransition()
  const [placedOrder, setPlacedOrder] =
    useState<PlacedExternalOrderResult | null>(null)
  const [resolvedCustomer, setResolvedCustomer] =
    useState<CustomerLookupData | null>(null)

  const form = useForm<ExternalOrderFormData>({
    resolver: zodResolver(
      externalOrderFormSchema,
    ) as Resolver<ExternalOrderFormData>,
    defaultValues,
  })

  const paymentType = form.watch('paymentType')
  const destinationState = form.watch('address.state')
  const customerName = form.watch('customer.fullName')
  const customerPhone = form.watch('customer.phone')

  const handleCustomerResolved = (customer: CustomerLookupData | null) => {
    setResolvedCustomer(customer)

    if (!customer) {
      form.setValue('savedAddressId', undefined)
      return
    }

    const defaultAddress =
      customer.addresses.find((address) => address.isDefault) ??
      customer.addresses[0]

    if (defaultAddress) {
      form.setValue('savedAddressId', defaultAddress.id)
      form.setValue('address.fullName', defaultAddress.fullName)
      form.setValue('address.phone', defaultAddress.phone)
      form.setValue('address.company', defaultAddress.company ?? '')
      form.setValue('address.addressLine1', defaultAddress.addressLine1)
      form.setValue('address.addressLine2', defaultAddress.addressLine2 ?? '')
      form.setValue('address.city', defaultAddress.city)
      form.setValue(
        'address.state',
        resolveGovernorateSelectValue(defaultAddress.state),
      )
      form.setValue('address.postalCode', defaultAddress.postalCode)
      form.setValue('address.country', defaultAddress.country ?? 'Egypt')
      form.setValue(
        'address.deliveryInstructions',
        defaultAddress.deliveryInstructions ?? '',
      )
    } else {
      form.setValue('savedAddressId', undefined)
      form.setValue('address.fullName', customer.fullName ?? '')
      form.setValue('address.phone', customer.phone ?? customerPhone)
    }
  }

  useEffect(() => {
    form.setValue(
      'items',
      cartLines.map(({ productId, variantId, quantity }) => ({
        productId,
        variantId,
        quantity,
      })),
    )
  }, [cartLines, form])

  useEffect(() => {
    if (cartLines.length === 0) {
      setPreview(null)
      return
    }

    startPreview(async () => {
      const result = await previewExternalOrderTotals({
        items: cartLines.map(({ productId, variantId, quantity }) => ({
          productId,
          variantId,
          quantity,
        })),
        destinationState: destinationState || undefined,
      })

      if (result.success && result.data) {
        setPreview(result.data)
      }
    })
  }, [cartLines, destinationState])

  const handleSubmit = (values: ExternalOrderFormData) => {
    if (cartLines.length === 0) {
      toast.error('Add at least one product')
      return
    }

    startSubmit(async () => {
      const result = await placeExternalOrder(values)

      if (!result.success) {
        toast.error(result.error ?? 'Failed to place order')
        return
      }

      toast.success('External order placed successfully')

      const order = result.data!.order as PlacedExternalOrderResult['order'] & {
        user?: { fullName: string; phone: string | null }
        userAddress_shippingAddressId?: PlacedExternalOrderResult['address']
      }

      setPlacedOrder({
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status ?? 'pending',
          paymentStatus: order.paymentStatus ?? 'pending',
          paymentMethod: order.paymentMethod,
          subtotal: order.subtotal,
          shippingCost: order.shippingCost,
          discountAmount: order.discountAmount,
          totalAmount: order.totalAmount,
          createdAt: order.createdAt,
          notes: order.notes,
        },
        orderItems: result.data!.orderItems.map((item) => ({
          id: item.id,
          productName: item.productName,
          variantName: item.variantName,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal,
        })),
        customer: {
          fullName:
            order.user?.fullName ?? values.customer.fullName,
          phone: order.user?.phone ?? values.customer.phone,
        },
        address: order.userAddress_shippingAddressId ?? values.address,
      })

      form.reset(defaultValues)
      setCartLines([])
      setPreview(null)
      setResolvedCustomer(null)
    })
  }

  if (placedOrder) {
    return (
      <div className="space-y-6">
        <div className="no-print">
          <PageHeader
            title="External Orders"
            description="Order placed successfully."
            actions={
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPlacedOrder(null)}
                >
                  Create another order
                </Button>
                <Button asChild variant="default">
                  <Link href={`/orders/${placedOrder.order.id}`}>
                    View in Orders
                  </Link>
                </Button>
              </div>
            }
          />
        </div>
        <ArabicInvoice data={placedOrder} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="External Orders"
        description="Create orders for customers from social media, WhatsApp, phone, and other offline channels."
      />

      <FormProvider {...form}>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="grid gap-6 lg:grid-cols-3"
          >
            <div className="space-y-6 lg:col-span-2">
              <CustomerSection onCustomerResolved={handleCustomerResolved} />
              <AddressSection
                savedAddresses={resolvedCustomer?.addresses ?? []}
              />
              <ProductCartSection
                lines={cartLines}
                onLinesChange={setCartLines}
              />
              <CheckoutSection
                preview={preview}
                isLoadingPreview={isPreviewLoading}
              />

              <Card>
                <CardHeader>
                  <CardTitle>5. Place Order</CardTitle>
                  <CardDescription>
                    Review and submit the external order.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border bg-muted/30 p-4 text-sm space-y-1">
                    <p>
                      <span className="text-muted-foreground">Customer: </span>
                      {customerName || '—'} ({customerPhone || '—'})
                    </p>
                    <p>
                      <span className="text-muted-foreground">Products: </span>
                      {cartLines.length} line(s)
                    </p>
                    <p>
                      <span className="text-muted-foreground">Payment: </span>
                      {paymentType === 'paid' ? 'Paid' : 'COD'}
                    </p>
                    {preview && (
                      <p>
                        <span className="text-muted-foreground">Total: </span>
                        {preview.total.toFixed(2)} EGP
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium">Order notes</label>
                    <Textarea
                      className="mt-1"
                      rows={2}
                      placeholder="Optional internal notes"
                      {...form.register('notes')}
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={isSubmitting || cartLines.length === 0}
                  >
                    {isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Place External Order
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <OrderSummarySidebar
                preview={preview}
                itemCount={cartLines.reduce((s, l) => s + l.quantity, 0)}
                paymentType={paymentType}
              />
            </div>
          </form>
        </Form>
      </FormProvider>
    </div>
  )
}
