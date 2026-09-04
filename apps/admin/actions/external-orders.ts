'use server'

import { randomUUID } from 'node:crypto'
import {
  db,
  users,
  userAddresses,
  products,
  productVariants,
  carts,
  cartItems,
  orders,
  eq,
  and,
  or,
  like,
  desc,
  sql,
} from '@workspace/db'
import { getServiceClient } from '@workspace/db/supabase/service'
import { resolveGovernorateSelectValue } from '@workspace/lib/address'
import {
  calculateLocationShippingCost,
  normalizeEgyptianMobile,
} from '@workspace/lib/shipping'
import { placeOrderFromCart } from '@workspace/lib/orders'
import { fulfillDigitalOrderItems } from '@workspace/lib/digital'
import {
  applyInvalidation,
  invalidateProductInventory,
} from '@workspace/cache'
import { getAdminUser } from './auth'
import {
  externalOrderFormSchema,
  externalOrderPreviewSchema,
} from '@/app/(dashboard)/external-orders/external-orders.schema'

type ProductPrice = {
  base: number
  list: number
  final: number
}

function syntheticEmailForPhone(normalizedPhone: string): string {
  return `external+${normalizedPhone.replace(/\D/g, '')}@orders.tallaby.local`
}

async function resolveCustomer(input: {
  customerId?: string
  fullName: string
  phone: string
  email?: string
}) {
  const normalizedPhone = normalizeEgyptianMobile(input.phone)
  if (!normalizedPhone) {
    return { success: false as const, error: 'Invalid phone number' }
  }

  if (input.customerId) {
    const existing = await db.query.users.findFirst({
      where: and(eq(users.id, input.customerId), eq(users.role, 'customer')),
    })
    if (!existing) {
      return { success: false as const, error: 'Customer not found' }
    }
    return { success: true as const, data: existing }
  }

  const email = input.email?.trim() || undefined

  const byPhone = await db.query.users.findFirst({
    where: and(eq(users.phone, normalizedPhone), eq(users.role, 'customer')),
  })
  if (byPhone) {
    return { success: true as const, data: byPhone }
  }

  if (email) {
    const byEmail = await db.query.users.findFirst({
      where: and(eq(users.email, email), eq(users.role, 'customer')),
    })
    if (byEmail) {
      return { success: true as const, data: byEmail }
    }
  }

  const supabase = getServiceClient()
  const authEmail = email ?? syntheticEmailForPhone(normalizedPhone)
  const tempPassword = randomUUID()

  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email: authEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: input.fullName },
    })

  if (authError || !authData.user) {
    return {
      success: false as const,
      error: authError?.message ?? 'Failed to create customer account',
    }
  }

  const [created] = await db
    .insert(users)
    .values({
      id: authData.user.id,
      email: authEmail,
      fullName: input.fullName,
      phone: normalizedPhone,
      role: 'customer',
      isGuest: false,
      isVerified: true,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        fullName: input.fullName,
        phone: normalizedPhone,
        email: authEmail,
        role: 'customer',
        updatedAt: new Date().toISOString(),
      },
    })
    .returning()

  if (!created) {
    return { success: false as const, error: 'Failed to create customer record' }
  }

  return { success: true as const, data: created }
}

type ResolvedLine = {
  productId: string
  variantId?: string
  quantity: number
  price: number
  sellerId: string
  variantData: Record<string, unknown> | null
  product: {
    id: string
    status: string
    productType: string | null
    freeDelivery: boolean | null
    dimensions: unknown
    quantity: string | number | null
    sku: string | null
    sellerId: string
    sellerFreeDelivery: boolean | null
  }
}

async function resolveLineItems(
  items: Array<{ productId: string; variantId?: string; quantity: number }>,
): Promise<
  | { success: true; data: ResolvedLine[] }
  | { success: false; error: string }
> {
  const resolved: ResolvedLine[] = []

  for (const item of items) {
    const product = await db.query.products.findFirst({
      where: and(
        eq(products.id, item.productId),
        eq(products.status, 'active'),
      ),
      with: {
        seller: {
          columns: {
            freeDelivery: true,
          },
        },
      },
    })

    if (!product) {
      return {
        success: false,
        error: `Product not found or inactive: ${item.productId}`,
      }
    }

    let variant = null
    let variantData: Record<string, unknown> | null = null
    let price = Number((product.price as ProductPrice)?.final) || 0

    if (item.variantId) {
      variant = await db.query.productVariants.findFirst({
        where: and(
          eq(productVariants.id, item.variantId),
          eq(productVariants.productId, item.productId),
        ),
      })

      if (!variant) {
        return { success: false, error: 'Selected product variant not found' }
      }

      if (Number(variant.stock ?? 0) < item.quantity) {
        return {
          success: false,
          error: `Insufficient stock for ${product.sku ?? product.id}`,
        }
      }

      price = Number(variant.price ?? 0)
      variantData = {
        id: variant.id,
        title: variant.title,
        price: variant.price,
        option1: variant.option1,
        option2: variant.option2,
        option3: variant.option3,
        sku: variant.sku,
        imageUrl: variant.imageUrl,
      }
    } else if (Number(product.quantity ?? 0) < item.quantity) {
      return {
        success: false,
        error: `Insufficient stock for ${product.sku ?? product.id}`,
      }
    }

    resolved.push({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      price,
      sellerId: product.sellerId,
      variantData,
      product: {
        id: product.id,
        status: product.status,
        productType: product.productType,
        freeDelivery: product.freeDelivery,
        dimensions: product.dimensions,
        quantity: product.quantity,
        sku: product.sku,
        sellerId: product.sellerId,
        sellerFreeDelivery: product.seller?.freeDelivery ?? null,
      },
    })
  }

  return { success: true, data: resolved }
}

export async function lookupCustomerByPhone(phone: string) {
  try {
    await getAdminUser()

    const normalizedPhone = normalizeEgyptianMobile(phone)
    if (!normalizedPhone) {
      return { success: false, error: 'Invalid phone number' }
    }

    const customer = await db.query.users.findFirst({
      where: and(eq(users.phone, normalizedPhone), eq(users.role, 'customer')),
    })

    if (!customer) {
      return { success: true, data: null }
    }

    const addresses = await db.query.userAddresses.findMany({
      where: eq(userAddresses.userId, customer.id),
      orderBy: [desc(userAddresses.isDefault), desc(userAddresses.createdAt)],
    })

    return {
      success: true,
      data: {
        id: customer.id,
        fullName: customer.fullName,
        phone: customer.phone,
        email: customer.email,
        addresses: addresses.map((addr) => ({
          id: addr.id,
          addressType: addr.addressType ?? 'shipping',
          fullName: addr.fullName,
          phone: addr.phone,
          company: addr.company ?? undefined,
          addressLine1: addr.addressLine1,
          addressLine2: addr.addressLine2 ?? undefined,
          city: addr.city,
          state: resolveGovernorateSelectValue(addr.state),
          postalCode: addr.postalCode,
          country: addr.country ?? 'Egypt',
          isDefault: addr.isDefault ?? false,
          isBusinessAddress: addr.isBusinessAddress ?? false,
          deliveryInstructions: addr.deliveryInstructions ?? undefined,
          latitude: addr.latitude ?? undefined,
          longitude: addr.longitude ?? undefined,
        })),
      },
    }
  } catch (error) {
    console.error('lookupCustomerByPhone:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Lookup failed',
    }
  }
}

export async function searchProductsForExternalOrder(query: string) {
  try {
    await getAdminUser()

    const trimmed = query.trim()
    if (trimmed.length < 2) {
      return { success: true, data: [] }
    }

    const pattern = `%${trimmed}%`
    const rows = await db.query.products.findMany({
      where: and(
        eq(products.status, 'active'),
        or(
          like(products.sku, pattern),
          sql`EXISTS (
            SELECT 1 FROM product_translations pt
            WHERE pt.product_id = ${products.id}
            AND pt.locale = 'en'
            AND pt.title ILIKE ${pattern}
          )`,
        ),
      ),
      with: {
        productTranslations: {
          columns: { locale: true, title: true },
        },
        productVariants: {
          columns: {
            id: true,
            title: true,
            price: true,
            stock: true,
            sku: true,
            option1: true,
            option2: true,
            option3: true,
            imageUrl: true,
          },
        },
      },
      limit: 20,
    })

    const data = rows.map((product) => {
      const enTitle =
        product.productTranslations.find((t) => t.locale === 'en')?.title ??
        product.productTranslations[0]?.title ??
        product.sku ??
        'Product'

      const price = Number((product.price as ProductPrice)?.final) || 0
      const images = (product.images as string[] | null) ?? []

      return {
        id: product.id,
        title: enTitle,
        sku: product.sku,
        price,
        image: images[0] ?? null,
        stock: product.quantity,
        productType: product.productType,
        variants: product.productVariants.map((v) => ({
          id: v.id,
          title: v.title,
          label:
            v.title ||
            [v.option1, v.option2, v.option3].filter(Boolean).join(', '),
          price: Number(v.price ?? 0),
          stock: Number(v.stock ?? 0),
          sku: v.sku,
          imageUrl: v.imageUrl,
        })),
      }
    })

    return { success: true, data }
  } catch (error) {
    console.error('searchProductsForExternalOrder:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Search failed',
    }
  }
}

export async function previewExternalOrderTotals(input: unknown) {
  try {
    await getAdminUser()

    const parsed = externalOrderPreviewSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Invalid preview data',
      }
    }

    const linesResult = await resolveLineItems(parsed.data.items)
    if (!linesResult.success) {
      return { success: false, error: linesResult.error }
    }

    const subtotal = linesResult.data.reduce(
      (sum, line) => sum + line.price * line.quantity,
      0,
    )

    const shippingCost =
      calculateLocationShippingCost({
        items: linesResult.data.map((line) => ({
          quantity: line.quantity,
          price: line.price,
          sellerId: line.sellerId,
          product: {
            productType: line.product.productType,
            freeDelivery: line.product.freeDelivery,
            dimensions: line.product.dimensions,
            sellerId: line.product.sellerId,
            seller: { freeDelivery: line.product.sellerFreeDelivery },
          },
        })),
        destinationState: parsed.data.destinationState,
        cartSubtotal: subtotal,
      }) ?? 0

    const itemCount = linesResult.data.reduce(
      (sum, line) => sum + line.quantity,
      0,
    )

    return {
      success: true,
      data: {
        subtotal,
        shippingCost,
        discountAmount: 0,
        total: subtotal + shippingCost,
        itemCount,
      },
    }
  } catch (error) {
    console.error('previewExternalOrderTotals:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Preview failed',
    }
  }
}

export async function placeExternalOrder(input: unknown) {
  try {
    const adminUser = await getAdminUser()

    const parsed = externalOrderFormSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Invalid order data',
      }
    }

    const { customer, address, savedAddressId, items, paymentType, notes } =
      parsed.data

    const customerResult = await resolveCustomer(customer)
    if (!customerResult.success) {
      return { success: false, error: customerResult.error }
    }
    const userId = customerResult.data.id

    const linesResult = await resolveLineItems(items)
    if (!linesResult.success) {
      return { success: false, error: linesResult.error }
    }

    const isDigitalOnly = linesResult.data.every(
      (line) => line.product.productType === 'digital',
    )

    let shippingAddressId: string | undefined

    const result = await db.transaction(async (tx) => {
      if (!isDigitalOnly) {
        const normalizedState = resolveGovernorateSelectValue(address.state)

        if (savedAddressId) {
          const existingAddress = await tx.query.userAddresses.findFirst({
            where: and(
              eq(userAddresses.id, savedAddressId),
              eq(userAddresses.userId, userId),
            ),
          })

          if (!existingAddress) {
            throw new Error('Selected shipping address not found for customer')
          }

          await tx
            .update(userAddresses)
            .set({
              fullName: address.fullName,
              phone: address.phone,
              company: address.company,
              addressLine1: address.addressLine1,
              addressLine2: address.addressLine2,
              city: address.city,
              state: normalizedState || address.state,
              postalCode: address.postalCode,
              country: address.country ?? 'Egypt',
              deliveryInstructions: address.deliveryInstructions,
              latitude: address.latitude,
              longitude: address.longitude,
            })
            .where(eq(userAddresses.id, savedAddressId))

          shippingAddressId = savedAddressId
        } else {
          const [newAddress] = await tx
            .insert(userAddresses)
            .values({
              userId,
              addressType: 'shipping',
              fullName: address.fullName,
              phone: address.phone,
              company: address.company,
              addressLine1: address.addressLine1,
              addressLine2: address.addressLine2,
              city: address.city,
              state: normalizedState || address.state,
              postalCode: address.postalCode,
              country: address.country ?? 'Egypt',
              isDefault: address.isDefault ?? false,
              isBusinessAddress: address.isBusinessAddress ?? false,
              deliveryInstructions: address.deliveryInstructions,
              latitude: address.latitude,
              longitude: address.longitude,
            })
            .returning()

          shippingAddressId = newAddress!.id
        }
      }

      const [cart] = await tx
        .insert(carts)
        .values({ userId, status: 'active', currency: 'EGP' })
        .returning()

      for (const line of linesResult.data) {
        await tx.insert(cartItems).values({
          cartId: cart!.id,
          productId: line.productId,
          sellerId: line.sellerId,
          quantity: line.quantity,
          price: line.price.toString(),
          variant: line.variantData,
        } as typeof cartItems.$inferInsert)
      }

      return { cartId: cart!.id, shippingAddressId }
    })

    const paidAt = new Date().toISOString()
    const paymentOverrides =
      paymentType === 'paid'
        ? {
            paymentMethod: 'cash',
            paymentStatus: 'paid' as const,
            status: 'confirmed' as const,
            paidAt,
            recordPayment: true,
          }
        : {
            paymentMethod: 'cash_on_delivery',
            paymentStatus: 'pending' as const,
            status: 'pending' as const,
          }

    const orderResult = await placeOrderFromCart({
      userId,
      cartId: result.cartId,
      shippingAddressId: result.shippingAddressId,
      paymentMethod: paymentOverrides.paymentMethod,
      notes,
      orderSource: 'external',
      skipCoupons: true,
      locale: 'ar',
      paymentOverrides,
    })

    if (!orderResult.success) {
      return { success: false, error: orderResult.error }
    }

    const { order, orderItems: createdItems, inventoryItems } = orderResult.data

    await applyInvalidation(invalidateProductInventory(inventoryItems), {
      from: 'ecommerce',
      mode: 'action',
    })

    if (paymentType === 'paid' && order.hasDigitalItems) {
      const fulfillment = await fulfillDigitalOrderItems(order.id, {
        actorUserId: adminUser.user?.id,
      })
      if (!fulfillment.success) {
        console.error('placeExternalOrder: digital fulfillment failed:', fulfillment.error)
      }
    }

    const fullOrder = await db.query.orders.findFirst({
      where: eq(orders.id, order.id),
      with: {
        orderItems: true,
        userAddress_shippingAddressId: true,
        user: {
          columns: { fullName: true, phone: true, email: true },
        },
      },
    })

    return {
      success: true,
      data: {
        order: fullOrder ?? order,
        orderItems: createdItems,
      },
    }
  } catch (error) {
    console.error('placeExternalOrder:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to place external order',
    }
  }
}
