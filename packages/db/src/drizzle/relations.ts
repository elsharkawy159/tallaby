import { relations } from "drizzle-orm/relations";
import {
  reviews,
  reviewComments,
  sellers,
  users,
  userAddresses,
  orders,
  orderItems,
  products,
  productVariants,
  categories,
  paymentMethods,
  returns,
  coupons,
  couponUsage,
  shipments,
  wishlists,
  carts,
  payments,
  refunds,
  sellerDocuments,
  userDevices,
  wishlistItems,
  cartItems,
  brands,
  productQuestions,
  sellerPayouts,
  deliveries,
  notifications,
  productAnswers,
  reviewVotes,
  returnItems,
  searchLogs,
  shipmentItems,
  sellerPayoutItems,
  shippingAddresses,
} from "./schema";

export const reviewCommentsRelations = relations(reviewComments, ({ one }) => ({
  review: one(reviews, {
    fields: [reviewComments.reviewId],
    references: [reviews.id],
  }),
  seller: one(sellers, {
    fields: [reviewComments.sellerId],
    references: [sellers.id],
  }),
  user: one(users, {
    fields: [reviewComments.userId],
    references: [users.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one, many }) => ({
  reviewComments: many(reviewComments),
  reviewVotes: many(reviewVotes),
  order: one(orders, {
    fields: [reviews.orderId],
    references: [orders.id],
  }),
  orderItem: one(orderItems, {
    fields: [reviews.orderItemId],
    references: [orderItems.id],
  }),
  product: one(products, {
    fields: [reviews.productId],
    references: [products.id],
  }),
  seller: one(sellers, {
    fields: [reviews.sellerId],
    references: [sellers.id],
  }),
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
}));

export const sellersRelations = relations(sellers, ({ one, many }) => ({
  reviewComments: many(reviewComments),
  orderItems: many(orderItems),
  shipments: many(shipments),
  coupons: many(coupons),
  sellerDocuments: many(sellerDocuments),
  user: one(users, {
    fields: [sellers.id],
    references: [users.id],
  }),
  cartItems: many(cartItems),
  products: many(products),
  sellerPayouts: many(sellerPayouts),
  productAnswers: many(productAnswers),
  reviews: many(reviews),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  reviewComments: many(reviewComments),
  userAddresses: many(userAddresses),
  paymentMethods: many(paymentMethods),
  returns: many(returns),
  user: one(users, {
    fields: [users.referredBy],
    references: [users.id],
    relationName: "users_referredBy_users_id",
  }),
  users: many(users, {
    relationName: "users_referredBy_users_id",
  }),
  couponUsages: many(couponUsage),
  wishlists: many(wishlists),
  carts: many(carts),
  refunds: many(refunds),
  sellerDocuments: many(sellerDocuments),
  sellers: many(sellers),
  userDevices: many(userDevices),
  productQuestions: many(productQuestions),
  orders: many(orders),
  deliveries: many(deliveries),
  notifications: many(notifications),
  productAnswers: many(productAnswers),
  reviewVotes: many(reviewVotes),
  searchLogs: many(searchLogs),
  reviews: many(reviews),
  shippingAddresses: many(shippingAddresses),
}));

export const userAddressesRelations = relations(
  userAddresses,
  ({ one, many }) => ({
    user: one(users, {
      fields: [userAddresses.userId],
      references: [users.id],
    }),
    paymentMethods: many(paymentMethods),
    orders_billingAddressId: many(orders, {
      relationName: "orders_billingAddressId_userAddresses_id",
    }),
    orders_shippingAddressId: many(orders, {
      relationName: "orders_shippingAddressId_userAddresses_id",
    }),
  })
);

export const orderItemsRelations = relations(orderItems, ({ one, many }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  seller: one(sellers, {
    fields: [orderItems.sellerId],
    references: [sellers.id],
  }),
  productVariant: one(productVariants, {
    fields: [orderItems.variantId],
    references: [productVariants.id],
  }),
  returnItems: many(returnItems),
  reviews: many(reviews),
  shipmentItems: many(shipmentItems),
  sellerPayoutItems: many(sellerPayoutItems),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  orderItems: many(orderItems),
  returns: many(returns),
  couponUsages: many(couponUsage),
  shipments: many(shipments),
  payments: many(payments),
  refunds: many(refunds),
  userAddress_billingAddressId: one(userAddresses, {
    fields: [orders.billingAddressId],
    references: [userAddresses.id],
    relationName: "orders_billingAddressId_userAddresses_id",
  }),
  cart: one(carts, {
    fields: [orders.cartId],
    references: [carts.id],
  }),
  userAddress_shippingAddressId: one(userAddresses, {
    fields: [orders.shippingAddressId],
    references: [userAddresses.id],
    relationName: "orders_shippingAddressId_userAddresses_id",
  }),
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  reviews: many(reviews),
  sellerPayoutItems: many(sellerPayoutItems),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  orderItems: many(orderItems),
  wishlistItems: many(wishlistItems),
  cartItems: many(cartItems),
  brand: one(brands, {
    fields: [products.brandId],
    references: [brands.id],
  }),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  seller: one(sellers, {
    fields: [products.sellerId],
    references: [sellers.id],
  }),
  productQuestions: many(productQuestions),
  productVariants: many(productVariants),
  searchLogs: many(searchLogs),
  reviews: many(reviews),
}));

export const productVariantsRelations = relations(
  productVariants,
  ({ one, many }) => ({
    orderItems: many(orderItems),
    wishlistItems: many(wishlistItems),
    product: one(products, {
      fields: [productVariants.productId],
      references: [products.id],
    }),
  })
);

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  category: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "categories_parentId_categories_id",
  }),
  categories: many(categories, {
    relationName: "categories_parentId_categories_id",
  }),
  products: many(products),
}));

export const paymentMethodsRelations = relations(
  paymentMethods,
  ({ one, many }) => ({
    userAddress: one(userAddresses, {
      fields: [paymentMethods.billingAddressId],
      references: [userAddresses.id],
    }),
    user: one(users, {
      fields: [paymentMethods.userId],
      references: [users.id],
    }),
    payments: many(payments),
  })
);

export const returnsRelations = relations(returns, ({ one, many }) => ({
  order: one(orders, {
    fields: [returns.orderId],
    references: [orders.id],
  }),
  user: one(users, {
    fields: [returns.userId],
    references: [users.id],
  }),
  refunds: many(refunds),
  returnItems: many(returnItems),
}));

export const couponUsageRelations = relations(couponUsage, ({ one }) => ({
  coupon: one(coupons, {
    fields: [couponUsage.couponId],
    references: [coupons.id],
  }),
  order: one(orders, {
    fields: [couponUsage.orderId],
    references: [orders.id],
  }),
  user: one(users, {
    fields: [couponUsage.userId],
    references: [users.id],
  }),
}));

export const couponsRelations = relations(coupons, ({ one, many }) => ({
  couponUsages: many(couponUsage),
  seller: one(sellers, {
    fields: [coupons.sellerId],
    references: [sellers.id],
  }),
}));

export const shipmentsRelations = relations(shipments, ({ one, many }) => ({
  order: one(orders, {
    fields: [shipments.orderId],
    references: [orders.id],
  }),
  seller: one(sellers, {
    fields: [shipments.sellerId],
    references: [sellers.id],
  }),
  deliveries: many(deliveries),
  shipmentItems: many(shipmentItems),
}));

export const wishlistsRelations = relations(wishlists, ({ one, many }) => ({
  user: one(users, {
    fields: [wishlists.userId],
    references: [users.id],
  }),
  wishlistItems: many(wishlistItems),
}));

export const cartsRelations = relations(carts, ({ one, many }) => ({
  user: one(users, {
    fields: [carts.userId],
    references: [users.id],
  }),
  cartItems: many(cartItems),
  orders: many(orders),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
  paymentMethod: one(paymentMethods, {
    fields: [payments.paymentMethodId],
    references: [paymentMethods.id],
  }),
}));

export const refundsRelations = relations(refunds, ({ one }) => ({
  order: one(orders, {
    fields: [refunds.orderId],
    references: [orders.id],
  }),
  user: one(users, {
    fields: [refunds.refundedBy],
    references: [users.id],
  }),
  return: one(returns, {
    fields: [refunds.returnId],
    references: [returns.id],
  }),
}));

export const sellerDocumentsRelations = relations(
  sellerDocuments,
  ({ one }) => ({
    user: one(users, {
      fields: [sellerDocuments.reviewedBy],
      references: [users.id],
    }),
    seller: one(sellers, {
      fields: [sellerDocuments.sellerId],
      references: [sellers.id],
    }),
  })
);

export const userDevicesRelations = relations(userDevices, ({ one }) => ({
  user: one(users, {
    fields: [userDevices.userId],
    references: [users.id],
  }),
}));

export const wishlistItemsRelations = relations(wishlistItems, ({ one }) => ({
  product: one(products, {
    fields: [wishlistItems.productId],
    references: [products.id],
  }),
  productVariant: one(productVariants, {
    fields: [wishlistItems.variantId],
    references: [productVariants.id],
  }),
  wishlist: one(wishlists, {
    fields: [wishlistItems.wishlistId],
    references: [wishlists.id],
  }),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, {
    fields: [cartItems.cartId],
    references: [carts.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
  seller: one(sellers, {
    fields: [cartItems.sellerId],
    references: [sellers.id],
  }),
}));

export const brandsRelations = relations(brands, ({ many }) => ({
  products: many(products),
}));

export const productQuestionsRelations = relations(
  productQuestions,
  ({ one, many }) => ({
    product: one(products, {
      fields: [productQuestions.productId],
      references: [products.id],
    }),
    user: one(users, {
      fields: [productQuestions.userId],
      references: [users.id],
    }),
    productAnswers: many(productAnswers),
  })
);

export const sellerPayoutsRelations = relations(
  sellerPayouts,
  ({ one, many }) => ({
    seller: one(sellers, {
      fields: [sellerPayouts.sellerId],
      references: [sellers.id],
    }),
    sellerPayoutItems: many(sellerPayoutItems),
  })
);

export const deliveriesRelations = relations(deliveries, ({ one }) => ({
  user: one(users, {
    fields: [deliveries.driverId],
    references: [users.id],
  }),
  shipment: one(shipments, {
    fields: [deliveries.shipmentId],
    references: [shipments.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const productAnswersRelations = relations(productAnswers, ({ one }) => ({
  productQuestion: one(productQuestions, {
    fields: [productAnswers.questionId],
    references: [productQuestions.id],
  }),
  seller: one(sellers, {
    fields: [productAnswers.sellerId],
    references: [sellers.id],
  }),
  user: one(users, {
    fields: [productAnswers.userId],
    references: [users.id],
  }),
}));

export const reviewVotesRelations = relations(reviewVotes, ({ one }) => ({
  review: one(reviews, {
    fields: [reviewVotes.reviewId],
    references: [reviews.id],
  }),
  user: one(users, {
    fields: [reviewVotes.userId],
    references: [users.id],
  }),
}));

export const returnItemsRelations = relations(returnItems, ({ one }) => ({
  orderItem: one(orderItems, {
    fields: [returnItems.orderItemId],
    references: [orderItems.id],
  }),
  return: one(returns, {
    fields: [returnItems.returnId],
    references: [returns.id],
  }),
}));

export const searchLogsRelations = relations(searchLogs, ({ one }) => ({
  product: one(products, {
    fields: [searchLogs.clickedProductId],
    references: [products.id],
  }),
  user: one(users, {
    fields: [searchLogs.userId],
    references: [users.id],
  }),
}));

export const shipmentItemsRelations = relations(shipmentItems, ({ one }) => ({
  orderItem: one(orderItems, {
    fields: [shipmentItems.orderItemId],
    references: [orderItems.id],
  }),
  shipment: one(shipments, {
    fields: [shipmentItems.shipmentId],
    references: [shipments.id],
  }),
}));

export const sellerPayoutItemsRelations = relations(
  sellerPayoutItems,
  ({ one }) => ({
    order: one(orders, {
      fields: [sellerPayoutItems.orderId],
      references: [orders.id],
    }),
    orderItem: one(orderItems, {
      fields: [sellerPayoutItems.orderItemId],
      references: [orderItems.id],
    }),
    sellerPayout: one(sellerPayouts, {
      fields: [sellerPayoutItems.payoutId],
      references: [sellerPayouts.id],
    }),
  })
);

export const shippingAddressesRelations = relations(
  shippingAddresses,
  ({ one }) => ({
    user: one(users, {
      fields: [shippingAddresses.userId],
      references: [users.id],
    }),
  })
);
