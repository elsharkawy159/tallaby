'use client'

import { useRef, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { ClipboardPaste, Sparkles, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@workspace/ui/components/form'
import { Input } from '@workspace/ui/components/input'
import { Textarea } from '@workspace/ui/components/textarea'
import { Button } from '@workspace/ui/components/button'
import { Badge } from '@workspace/ui/components/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'
import { lookupCustomerByPhone } from '@/actions/external-orders'
import type { ExternalOrderFormData } from '../external-orders.schema'
import type { CustomerLookupData } from '../external-orders.types'
import { GOVERNORATE_AR, parseCustomerPaste } from './customer-paste.lib'

export interface CustomerResolvedOptions {
  /** Keep the address already in the form instead of the saved default. */
  keepAddress?: boolean
}

type PasteFillField =
  | 'customer.fullName'
  | 'customer.phone'
  | 'address.fullName'
  | 'address.phone'
  | 'address.addressLine1'
  | 'address.addressLine2'
  | 'address.city'
  | 'address.state'
  | 'address.deliveryInstructions'

interface CustomerSectionProps {
  onCustomerResolved: (
    customer: CustomerLookupData | null,
    options?: CustomerResolvedOptions,
  ) => void
}

export function CustomerSection({ onCustomerResolved }: CustomerSectionProps) {
  const form = useFormContext<ExternalOrderFormData>()
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [foundCustomer, setFoundCustomer] = useState<CustomerLookupData | null>(
    null,
  )
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [pasteText, setPasteText] = useState('')
  const [detected, setDetected] = useState<string[]>([])
  const lastLookedUpPhoneRef = useRef<string | null>(null)

  const lookupPhone = async (
    rawPhone: string | undefined,
    options: CustomerResolvedOptions = {},
  ) => {
    const phone = rawPhone?.trim()
    setLookupError(null)

    if (!phone || phone.length < 10) {
      lastLookedUpPhoneRef.current = null
      setFoundCustomer(null)
      form.setValue('customer.customerId', undefined)
      form.setValue('savedAddressId', undefined)
      onCustomerResolved(null, options)
      return
    }

    if (phone === lastLookedUpPhoneRef.current && !options.keepAddress) {
      return
    }

    lastLookedUpPhoneRef.current = phone

    setIsLookingUp(true)
    const result = await lookupCustomerByPhone(phone)
    setIsLookingUp(false)

    if (!result.success) {
      lastLookedUpPhoneRef.current = null
      setLookupError(result.error ?? 'Lookup failed')
      return
    }

    if (result.data) {
      setFoundCustomer(result.data)
      form.setValue('customer.customerId', result.data.id)
      // A pasted name is what the customer gave for this order; keep it.
      if (!options.keepAddress || !form.getValues('customer.fullName')) {
        form.setValue('customer.fullName', result.data.fullName ?? '')
      }
      form.setValue('customer.email', result.data.email ?? '')
      onCustomerResolved(result.data, options)
    } else {
      setFoundCustomer(null)
      form.setValue('customer.customerId', undefined)
      form.setValue('savedAddressId', undefined)
      onCustomerResolved(null, options)
    }
  }

  const handlePhoneBlur = () => lookupPhone(form.getValues('customer.phone'))

  const applyPaste = (text: string) => {
    if (!text.trim()) return

    const parsed = parseCustomerPaste(text)
    const set = (name: PasteFillField, value: string) =>
      form.setValue(name, value, { shouldDirty: true })
    const found: string[] = []

    if (parsed.fullName) {
      set('customer.fullName', parsed.fullName)
      set('address.fullName', parsed.fullName)
      found.push(`Name: ${parsed.fullName}`)
    }
    if (parsed.phone) {
      set('customer.phone', parsed.phone)
      set('address.phone', parsed.phone)
      found.push(`Phone: ${parsed.phone}`)
    }
    if (parsed.addressLine1) {
      set('address.addressLine1', parsed.addressLine1)
      set('address.addressLine2', parsed.addressLine2)
      found.push('Address')
    }
    if (parsed.state) {
      set('address.state', parsed.state)
      found.push(`Governorate: ${GOVERNORATE_AR[parsed.state] ?? parsed.state}`)
    }
    if (parsed.city) {
      set('address.city', parsed.city)
      found.push(`City: ${parsed.city}`)
    }

    const instructions = [
      parsed.extraPhones.length
        ? `رقم إضافي: ${parsed.extraPhones.join(' / ')}`
        : '',
      parsed.notes,
    ]
      .filter(Boolean)
      .join(' — ')
    if (instructions) {
      set('address.deliveryInstructions', instructions)
      found.push('Delivery notes')
    }

    setDetected(found)

    if (found.length === 0) {
      toast.error('Could not detect any customer details in the pasted text')
      return
    }

    form.setValue('savedAddressId', undefined)
    void form.trigger(['customer', 'address'])
    toast.success('Customer details filled — review before placing the order')

    if (parsed.phone) {
      void lookupPhone(parsed.phone, { keepAddress: true })
    }
  }

  const clearPaste = () => {
    setPasteText('')
    setDetected([])
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>1. Customer</CardTitle>
        <CardDescription>
          Paste the customer&apos;s message to fill everything at once, or enter
          the phone number and tab out to look up an existing customer.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 rounded-lg border border-dashed bg-muted/30 p-3">
          <label
            htmlFor="customer-paste"
            className="flex items-center gap-2 text-sm font-medium"
          >
            <ClipboardPaste className="h-4 w-4" />
            Quick fill from pasted details
          </label>
          <Textarea
            id="customer-paste"
            dir="auto"
            rows={4}
            value={pasteText}
            placeholder={'الاسم: …\nالعنوان: …\nالمحافظة\n01xxxxxxxxx'}
            onChange={(event) => setPasteText(event.target.value)}
            onPaste={(event) => {
              const text = event.clipboardData.getData('text')
              if (!text.trim()) return
              event.preventDefault()
              setPasteText(text)
              applyPaste(text)
            }}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => applyPaste(pasteText)}
              disabled={!pasteText.trim()}
            >
              <Sparkles className="mr-1 h-4 w-4" />
              Fill form
            </Button>
            {pasteText && (
              <Button type="button" size="sm" variant="ghost" onClick={clearPaste}>
                <X className="mr-1 h-4 w-4" />
                Clear
              </Button>
            )}
            {detected.map((item) => (
              <Badge key={item} variant="outline" className="font-normal">
                {item}
              </Badge>
            ))}
          </div>
        </div>

        {foundCustomer && (
          <Badge variant="secondary" className="mb-2">
            Existing customer: {foundCustomer.fullName}
          </Badge>
        )}
        {isLookingUp && (
          <p className="text-sm text-muted-foreground">Looking up customer…</p>
        )}
        {lookupError && (
          <p className="text-sm text-destructive">{lookupError}</p>
        )}

        <FormField
          control={form.control}
          name="customer.phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone *</FormLabel>
              <FormControl>
                <Input
                  placeholder="01xxxxxxxxx"
                  {...field}
                  onChange={(event) => {
                    field.onChange(event)
                    if (event.target.value.trim() !== lastLookedUpPhoneRef.current) {
                      setFoundCustomer(null)
                    }
                  }}
                  onBlur={() => {
                    field.onBlur()
                    void handlePhoneBlur()
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="customer.fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full name *</FormLabel>
              <FormControl>
                <Input placeholder="Customer full name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="customer.email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email (optional)</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="customer@email.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  )
}
