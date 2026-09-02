import { z } from 'zod'
import { addressSchema } from '@workspace/lib/address'

export const externalOrderCustomerSchema = z.object({
  customerId: z.string().uuid().optional(),
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .min(4, 'Full name must be at least 4 characters'),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(
      /^(?:\+20|20|0)?1[0125][0-9]{8}$/,
      'Please enter a valid Egyptian mobile number',
    ),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
})

export const externalOrderLineItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
})

export const externalOrderPaymentTypeSchema = z.enum(['cod', 'paid'])

export const externalOrderFormSchema = z.object({
  customer: externalOrderCustomerSchema,
  address: addressSchema.omit({ id: true, userId: true }),
  savedAddressId: z.string().uuid().optional(),
  items: z
    .array(externalOrderLineItemSchema)
    .min(1, 'Add at least one product'),
  paymentType: externalOrderPaymentTypeSchema,
  notes: z.string().optional(),
})

export type ExternalOrderFormData = z.infer<typeof externalOrderFormSchema>
export type ExternalOrderLineItem = z.infer<typeof externalOrderLineItemSchema>

export const externalOrderPreviewSchema = z.object({
  items: z.array(externalOrderLineItemSchema).min(1),
  destinationState: z.string().optional(),
})
