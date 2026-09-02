'use client'

import { useRef, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@workspace/ui/components/form'
import { Input } from '@workspace/ui/components/input'
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

interface CustomerSectionProps {
  onCustomerResolved: (customer: CustomerLookupData | null) => void
}

export function CustomerSection({ onCustomerResolved }: CustomerSectionProps) {
  const form = useFormContext<ExternalOrderFormData>()
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [foundCustomer, setFoundCustomer] = useState<CustomerLookupData | null>(
    null,
  )
  const [lookupError, setLookupError] = useState<string | null>(null)
  const lastLookedUpPhoneRef = useRef<string | null>(null)

  const handlePhoneBlur = async () => {
    const phone = form.getValues('customer.phone')?.trim()
    setLookupError(null)

    if (!phone || phone.length < 10) {
      lastLookedUpPhoneRef.current = null
      setFoundCustomer(null)
      form.setValue('customer.customerId', undefined)
      form.setValue('savedAddressId', undefined)
      onCustomerResolved(null)
      return
    }

    if (phone === lastLookedUpPhoneRef.current) {
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
      form.setValue('customer.fullName', result.data.fullName ?? '')
      form.setValue('customer.email', result.data.email ?? '')
      onCustomerResolved(result.data)
    } else {
      setFoundCustomer(null)
      form.setValue('customer.customerId', undefined)
      form.setValue('savedAddressId', undefined)
      onCustomerResolved(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>1. Customer</CardTitle>
        <CardDescription>
          Enter the phone number and tab out to look up an existing customer.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
                  onBlur={(event) => {
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
