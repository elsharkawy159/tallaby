'use client'

import { useFormContext } from 'react-hook-form'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@workspace/ui/components/form'
import { Input } from '@workspace/ui/components/input'
import { Textarea } from '@workspace/ui/components/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'
import {
  egyptGovernorateOptions,
  getGovernorateLabel,
  resolveGovernorateSelectValue,
} from '@workspace/lib/address'
import type { ExternalOrderFormData } from '../external-orders.schema'
import {
  NEW_ADDRESS_OPTION,
  type CustomerSavedAddress,
} from '../external-orders.types'

function truncateText(text: string, max = 48): string {
  if (text.length <= max) return text
  return `${text.slice(0, max)}…`
}

function formatAddressLabel(address: CustomerSavedAddress): string {
  const parts = [
    address.addressLine1,
    address.city,
    getGovernorateLabel(address.state) || address.state,
  ].filter(Boolean)
  return truncateText(parts.join(', '), 56)
}

function applyAddressToForm(
  form: ReturnType<typeof useFormContext<ExternalOrderFormData>>,
  address: CustomerSavedAddress,
) {
  form.setValue('savedAddressId', address.id)
  form.setValue('address.fullName', address.fullName)
  form.setValue('address.phone', address.phone)
  form.setValue('address.company', address.company ?? '')
  form.setValue('address.addressLine1', address.addressLine1)
  form.setValue('address.addressLine2', address.addressLine2 ?? '')
  form.setValue('address.city', address.city)
  form.setValue(
    'address.state',
    resolveGovernorateSelectValue(address.state),
  )
  form.setValue('address.postalCode', address.postalCode)
  form.setValue('address.country', address.country ?? 'Egypt')
  form.setValue(
    'address.deliveryInstructions',
    address.deliveryInstructions ?? '',
  )
}

interface AddressSectionProps {
  savedAddresses: CustomerSavedAddress[]
}

export function AddressSection({ savedAddresses }: AddressSectionProps) {
  const form = useFormContext<ExternalOrderFormData>()
  const savedAddressId = form.watch('savedAddressId')

  const handleAddressSelection = (value: string) => {
    if (value === NEW_ADDRESS_OPTION) {
      form.setValue('savedAddressId', undefined)
      const customerName = form.getValues('customer.fullName')
      const customerPhone = form.getValues('customer.phone')
      form.setValue('address.fullName', customerName)
      form.setValue('address.phone', customerPhone)
      form.setValue('address.addressLine1', '')
      form.setValue('address.addressLine2', '')
      form.setValue('address.city', '')
      form.setValue('address.state', '')
      form.setValue('address.postalCode', '')
      form.setValue('address.deliveryInstructions', '')
      return
    }

    const selected = savedAddresses.find((address) => address.id === value)
    if (!selected) return

    applyAddressToForm(form, selected)
  }

  const selectValue =
    savedAddressId &&
    savedAddresses.some((address) => address.id === savedAddressId)
      ? savedAddressId
      : NEW_ADDRESS_OPTION

  return (
    <Card>
      <CardHeader>
        <CardTitle>2. Shipping Address</CardTitle>
        <CardDescription>
          Choose a saved address or enter a new one. Edits to a saved address
          will update it for this customer.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        {savedAddresses.length > 0 && (
          <div className="md:col-span-2 space-y-2">
            <FormLabel>Saved addresses</FormLabel>
            <Select value={selectValue} onValueChange={handleAddressSelection}>
              <SelectTrigger>
                <SelectValue placeholder="Select address" />
              </SelectTrigger>
              <SelectContent>
                {savedAddresses.map((address) => (
                  <SelectItem key={address.id} value={address.id}>
                    {formatAddressLabel(address)}
                  </SelectItem>
                ))}
                <SelectItem value={NEW_ADDRESS_OPTION}>
                  + Add new address
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <FormField
          control={form.control}
          name="address.fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Recipient name *</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address.phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone *</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address.state"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Governorate *</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={resolveGovernorateSelectValue(field.value) || undefined}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select governorate" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {egyptGovernorateOptions.map((gov) => (
                    <SelectItem key={gov.value} value={gov.value}>
                      {gov.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address.city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>City / Area *</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address.addressLine1"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Address *</FormLabel>
              <FormControl>
                <Input placeholder="Street, building" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address.addressLine2"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Floor / Apartment</FormLabel>
              <FormControl>
                <Input placeholder="Optional" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address.postalCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Postal code *</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address.deliveryInstructions"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Delivery notes</FormLabel>
              <FormControl>
                <Textarea rows={2} placeholder="Optional" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  )
}
