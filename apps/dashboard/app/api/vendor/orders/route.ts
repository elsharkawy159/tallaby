import { NextRequest, NextResponse } from "next/server";
import { db } from "@workspace/db";
import {
  orders,
  orderItems,
  users,
  userAddresses,
  products,
  productListings,
  productVariants,
  sellers,
  payments,
  shipments,
  coupons,
  couponUsage,
} from "@workspace/db/src/drizzle/schema";
import {
  orderSearchSchema,
  orderUpdateSchema,
  orderItemUpdateSchema,
} from "@/lib/validations/vendor-schemas";
import {
  eq,
  and,
  desc,
  asc,
  like,
  gte,
  lte,
  inArray,
  sql,
  or,
  not,
  isNull,
  count,
  sum,
  avg,
  max,
  min,
} from "drizzle-orm";

// GET /api/vendor/orders - Get vendor's orders with advanced filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse and validate search parameters
    const searchData = {
      sellerId: searchParams.get("sellerId"),
      query: searchParams.get("query") || "",
      status: searchParams.get("status") || "all",
      dateFrom: searchParams.get("dateFrom"),
      dateTo: searchParams.get("dateTo"),
      minAmount: searchParams.get("minAmount")
        ? parseFloat(searchParams.get("minAmount")!)
        : undefined,
      maxAmount: searchParams.get("maxAmount")
        ? parseFloat(searchParams.get("maxAmount")!)
        : undefined,
      customerEmail: searchParams.get("customerEmail") || "",
      sortBy: searchParams.get("sortBy") || "created_at",
      sortOrder: searchParams.get("sortOrder") || "desc",
      page: parseInt(searchParams.get("page") || "1"),
      limit: Math.min(parseInt(searchParams.get("limit") || "10"), 100),
      includeItems: searchParams.get("includeItems") === "true",
      includeCustomer: searchParams.get("includeCustomer") === "true",
    };

    // Validate seller ID
    if (!searchData.sellerId) {
      return NextResponse.json(
        { error: "Seller ID is required" },
        { status: 400 }
      );
    }

    // Validate search parameters
    try {
      orderSearchSchema.parse(searchData);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid search parameters", details: error },
        { status: 400 }
      );
    }

    const offset = (searchData.page - 1) * searchData.limit;

    // Build query conditions
    const conditions = [eq(orderItems.sellerId, searchData.sellerId)];

    // Text search across multiple fields
    if (searchData.query) {
      conditions.push(
        or(
          like(orders.orderNumber, `%${searchData.query}%`),
          like(orderItems.productName, `%${searchData.query}%`),
          like(orderItems.sku, `%${searchData.query}%`)
        )
      );
    }

    // Status filter
    if (searchData.status && searchData.status !== "all") {
      conditions.push(eq(orderItems.status, searchData.status));
    }

    // Date range filter
    if (searchData.dateFrom) {
      conditions.push(gte(orders.createdAt, searchData.dateFrom));
    }
    if (searchData.dateTo) {
      conditions.push(lte(orders.createdAt, searchData.dateTo));
    }

    // Amount range filter
    if (searchData.minAmount !== undefined) {
      conditions.push(gte(orderItems.total, searchData.minAmount));
    }
    if (searchData.maxAmount !== undefined) {
      conditions.push(lte(orderItems.total, searchData.maxAmount));
    }

    // Customer email filter
    if (searchData.customerEmail) {
      conditions.push(eq(users.email, searchData.customerEmail));
    }

    // Build sort order
    const sortField =
      searchData.sortBy === "total_amount"
        ? orderItems.total
        : searchData.sortBy === "status"
          ? orderItems.status
          : searchData.sortBy === "updated_at"
            ? orders.updatedAt
            : orders.createdAt;

    const sortOrder =
      searchData.sortOrder === "asc" ? asc(sortField) : desc(sortField);

    // Get orders with items using Drizzle
    const vendorOrders = await db
      .select({
        // Order fields
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        subtotal: orders.subtotal,
        shippingCost: orders.shippingCost,
        tax: orders.tax,
        discountAmount: orders.discountAmount,
        totalAmount: orders.totalAmount,
        currency: orders.currency,
        paymentMethod: orders.paymentMethod,
        couponCode: orders.couponCode,
        notes: orders.notes,
        isGift: orders.isGift,
        giftMessage: orders.giftMessage,
        isBusinessOrder: orders.isBusinessOrder,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        processedAt: orders.processedAt,
        shippedAt: orders.shippedAt,
        deliveredAt: orders.deliveredAt,
        cancelledAt: orders.cancelledAt,
        // Order item fields
        itemId: orderItems.id,
        productId: orderItems.productId,
        variantId: orderItems.variantId,
        sku: orderItems.sku,
        productName: orderItems.productName,
        variantName: orderItems.variantName,
        quantity: orderItems.quantity,
        price: orderItems.price,
        subtotal: orderItems.subtotal,
        tax: orderItems.tax,
        shippingCost: orderItems.shippingCost,
        discountAmount: orderItems.discountAmount,
        total: orderItems.total,
        commissionAmount: orderItems.commissionAmount,
        commissionRate: orderItems.commissionRate,
        sellerEarning: orderItems.sellerEarning,
        condition: orderItems.condition,
        fulfillmentType: orderItems.fulfillmentType,
        itemStatus: orderItems.status,
        isReviewed: orderItems.isReviewed,
        isReturned: orderItems.isReturned,
        isRefunded: orderItems.isRefunded,
        refundAmount: orderItems.refundAmount,
        refundReason: orderItems.refundReason,
        shippedAt: orderItems.shippedAt,
        deliveredAt: orderItems.deliveredAt,
        cancelledAt: orderItems.cancelledAt,
        // Customer fields
        customerId: users.id,
        customerEmail: users.email,
        customerFirstName: users.firstName,
        customerLastName: users.lastName,
        customerFullName: users.fullName,
        customerPhone: users.phone,
        // Product fields
        productTitle: products.title,
        productSlug: products.slug,
        // Address fields
        shippingAddressId: orders.shippingAddressId,
        billingAddressId: orders.billingAddressId,
      })
      .from(orders)
      .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
      .innerJoin(users, eq(orders.userId, users.id))
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(and(...conditions))
      .orderBy(sortOrder)
      .limit(searchData.limit)
      .offset(offset);

    // Get total count for pagination
    const totalCount = await db
      .select({ count: count() })
      .from(orders)
      .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
      .where(and(...conditions));

    // Get customer addresses if requested
    let addresses = [];
    if (searchData.includeCustomer && vendorOrders.length > 0) {
      const addressIds = vendorOrders
        .map((order) => [order.shippingAddressId, order.billingAddressId])
        .flat()
        .filter((id) => id !== null);

      if (addressIds.length > 0) {
        addresses = await db
          .select({
            id: userAddresses.id,
            userId: userAddresses.userId,
            addressType: userAddresses.addressType,
            fullName: userAddresses.fullName,
            phone: userAddresses.phone,
            company: userAddresses.company,
            addressLine1: userAddresses.addressLine1,
            addressLine2: userAddresses.addressLine2,
            city: userAddresses.city,
            state: userAddresses.state,
            postalCode: userAddresses.postalCode,
            country: userAddresses.country,
            isDefault: userAddresses.isDefault,
            isBusinessAddress: userAddresses.isBusinessAddress,
            deliveryInstructions: userAddresses.deliveryInstructions,
            accessCode: userAddresses.accessCode,
            latitude: userAddresses.latitude,
            longitude: userAddresses.longitude,
          })
          .from(userAddresses)
          .where(inArray(userAddresses.id, addressIds));
      }
    }

    // Get payment information
    let payments = [];
    if (vendorOrders.length > 0) {
      const orderIds = [...new Set(vendorOrders.map((order) => order.id))];
      payments = await db
        .select({
          id: payments.id,
          orderId: payments.orderId,
          amount: payments.amount,
          method: payments.method,
          currency: payments.currency,
          status: payments.status,
          transactionId: payments.transactionId,
          paymentMethodId: payments.paymentMethodId,
          errorMessage: payments.errorMessage,
          authorizedAt: payments.authorizedAt,
          capturedAt: payments.capturedAt,
          createdAt: payments.createdAt,
          updatedAt: payments.updatedAt,
        })
        .from(payments)
        .where(inArray(payments.orderId, orderIds));
    }

    // Get shipment information
    let shipments = [];
    if (vendorOrders.length > 0) {
      const orderIds = [...new Set(vendorOrders.map((order) => order.id))];
      shipments = await db
        .select({
          id: shipments.id,
          orderId: shipments.orderId,
          sellerId: shipments.sellerId,
          trackingNumber: shipments.trackingNumber,
          carrier: shipments.carrier,
          serviceLevel: shipments.serviceLevel,
          status: shipments.status,
          shippedAt: shipments.shippedAt,
          deliveredAt: shipments.deliveredAt,
          createdAt: shipments.createdAt,
          updatedAt: shipments.updatedAt,
        })
        .from(shipments)
        .where(
          and(
            inArray(shipments.orderId, orderIds),
            eq(shipments.sellerId, searchData.sellerId)
          )
        );
    }

    // Group orders by order ID
    const groupedOrders = vendorOrders.reduce(
      (acc, order) => {
        const orderId = order.id;
        if (!acc[orderId]) {
          acc[orderId] = {
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            paymentStatus: order.paymentStatus,
            subtotal: order.subtotal,
            shippingCost: order.shippingCost,
            tax: order.tax,
            discountAmount: order.discountAmount,
            totalAmount: order.totalAmount,
            currency: order.currency,
            paymentMethod: order.paymentMethod,
            couponCode: order.couponCode,
            notes: order.notes,
            isGift: order.isGift,
            giftMessage: order.giftMessage,
            isBusinessOrder: order.isBusinessOrder,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            processedAt: order.processedAt,
            shippedAt: order.shippedAt,
            deliveredAt: order.deliveredAt,
            cancelledAt: order.cancelledAt,
            customer: {
              id: order.customerId,
              email: order.customerEmail,
              firstName: order.customerFirstName,
              lastName: order.customerLastName,
              fullName: order.customerFullName,
              phone: order.customerPhone,
            },
            items: [],
            payments: payments.filter((p) => p.orderId === orderId),
            shipments: shipments.filter((s) => s.orderId === orderId),
            addresses: {
              shipping: addresses.find((a) => a.id === order.shippingAddressId),
              billing: addresses.find((a) => a.id === order.billingAddressId),
            },
          };
        }

        acc[orderId].items.push({
          id: order.itemId,
          productId: order.productId,
          variantId: order.variantId,
          sku: order.sku,
          productName: order.productName,
          variantName: order.variantName,
          quantity: order.quantity,
          price: order.price,
          subtotal: order.subtotal,
          tax: order.tax,
          shippingCost: order.shippingCost,
          discountAmount: order.discountAmount,
          total: order.total,
          commissionAmount: order.commissionAmount,
          commissionRate: order.commissionRate,
          sellerEarning: order.sellerEarning,
          condition: order.condition,
          fulfillmentType: order.fulfillmentType,
          status: order.itemStatus,
          isReviewed: order.isReviewed,
          isReturned: order.isReturned,
          isRefunded: order.isRefunded,
          refundAmount: order.refundAmount,
          refundReason: order.refundReason,
          shippedAt: order.shippedAt,
          deliveredAt: order.deliveredAt,
          cancelledAt: order.cancelledAt,
          product: {
            title: order.productTitle,
            slug: order.productSlug,
          },
        });

        return acc;
      },
      {} as Record<string, any>
    );

    const ordersList = Object.values(groupedOrders);

    return NextResponse.json({
      orders: ordersList,
      pagination: {
        page: searchData.page,
        limit: searchData.limit,
        total: totalCount[0]?.count || 0,
        totalPages: Math.ceil((totalCount[0]?.count || 0) / searchData.limit),
      },
    });
  } catch (error) {
    console.error("Error fetching vendor orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// POST /api/vendor/orders - Create new order (for testing/demo purposes)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // This endpoint would typically be used for creating test orders
    // In a real application, orders are usually created through the checkout process
    return NextResponse.json(
      { error: "Orders should be created through the checkout process" },
      { status: 405 }
    );
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

// PATCH /api/vendor/orders - Update order status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, updates } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Validate update data
    const validatedUpdates = orderUpdateSchema.parse(updates);

    // Update order in a transaction using Drizzle
    const result = await db.transaction(async (tx) => {
      // Update order
      const [updatedOrder] = await tx
        .update(orders)
        .set({
          status: validatedUpdates.status,
          updatedAt: new Date().toISOString(),
          ...(validatedUpdates.status === "shipped" && {
            shippedAt: new Date().toISOString(),
          }),
          ...(validatedUpdates.status === "delivered" && {
            deliveredAt: new Date().toISOString(),
          }),
          ...(validatedUpdates.status === "cancelled" && {
            cancelledAt: new Date().toISOString(),
          }),
        })
        .where(eq(orders.id, orderId))
        .returning();

      // Update order items
      const updatedItems = await tx
        .update(orderItems)
        .set({
          status: validatedUpdates.status,
          ...(validatedUpdates.status === "shipped" && {
            shippedAt: new Date().toISOString(),
          }),
          ...(validatedUpdates.status === "delivered" && {
            deliveredAt: new Date().toISOString(),
          }),
          ...(validatedUpdates.status === "cancelled" && {
            cancelledAt: new Date().toISOString(),
          }),
        })
        .where(eq(orderItems.orderId, orderId))
        .returning();

      // Create shipment record if shipping
      let shipment = null;
      if (
        validatedUpdates.status === "shipped" &&
        validatedUpdates.trackingNumber
      ) {
        const [newShipment] = await tx
          .insert(shipments)
          .values({
            orderId: orderId,
            sellerId: updatedItems[0]?.sellerId, // Assuming all items have same seller
            trackingNumber: validatedUpdates.trackingNumber,
            carrier: validatedUpdates.trackingUrl ? "custom" : undefined,
            status: "shipped",
            shippedAt: new Date().toISOString(),
          })
          .returning();
        shipment = newShipment;
      }

      return { order: updatedOrder, items: updatedItems, shipment };
    });

    return NextResponse.json({
      message: "Order updated successfully",
      order: result.order,
      items: result.items,
      shipment: result.shipment,
    });
  } catch (error) {
    console.error("Error updating order:", error);

    if (error instanceof Error && error.message.includes("validation")) {
      return NextResponse.json(
        { error: "Invalid update data", details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
