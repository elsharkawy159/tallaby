import { relations } from "drizzle-orm/relations";
import {
  carts,
  cartItems,
  products,
  sellers,
  productVariants,
  attributes,
  categoryAttributes,
  categories,
  categoryPath,
  coupons,
  users,
  deliveries,
  shipments,
  deals,
  notifications,
  orderItems,
  orders,
  userAddresses,
  productQuestions,
  productAnswers,
  productAttributes,
  attributeValues,
  paymentMethods,
  payments,
  refunds,
  returns,
  returnItems,
  brands,
  reviews,
  reviewVotes,
  searchLogs,
  sellerDocuments,
  sellerPayouts,
  shipmentItems,
  sellerPayoutItems,
  couponUsage,
  reviewComments,
  userDevices,
  wishlists,
  wishlistItems,
  productCategories,
} from "./schema";

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
  productVariant: one(productVariants, {
    fields: [cartItems.variantId],
    references: [productVariants.id],
  }),
}));

export const cartsRelations = relations(carts, ({ one, many }) => ({
  cartItems: many(cartItems),
  orders: many(orders),
  user: one(users, {
    fields: [carts.userId],
    references: [users.id],
  }),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  cartItems: many(cartItems),
  orderItems: many(orderItems),
  productAttributes: many(productAttributes),
  productQuestions: many(productQuestions),
  brand: one(brands, {
    fields: [products.brandId],
    references: [brands.id],
  }),
  category: one(categories, {
    fields: [products.mainCategoryId],
    references: [categories.id],
  }),
  seller: one(sellers, {
    fields: [products.sellerId],
    references: [sellers.id],
  }),
  reviews: many(reviews),
  searchLogs: many(searchLogs),
  productVariants: many(productVariants),
  wishlistItems: many(wishlistItems),
  productCategories: many(productCategories),
}));

export const sellersRelations = relations(sellers, ({ one, many }) => ({
  cartItems: many(cartItems),
  coupons: many(coupons),
  deals: many(deals),
  orderItems: many(orderItems),
  productAnswers: many(productAnswers),
  products: many(products),
  reviews: many(reviews),
  sellerDocuments: many(sellerDocuments),
  sellerPayouts: many(sellerPayouts),
  shipments: many(shipments),
  reviewComments: many(reviewComments),
}));

export const productVariantsRelations = relations(
  productVariants,
  ({ one, many }) => ({
    cartItems: many(cartItems),
    orderItems: many(orderItems),
    product: one(products, {
      fields: [productVariants.productId],
      references: [products.id],
    }),
  })
);

export const categoryAttributesRelations = relations(
  categoryAttributes,
  ({ one }) => ({
    attribute: one(attributes, {
      fields: [categoryAttributes.attributeId],
      references: [attributes.id],
    }),
    category: one(categories, {
      fields: [categoryAttributes.categoryId],
      references: [categories.id],
    }),
  })
);

export const attributesRelations = relations(attributes, ({ many }) => ({
  categoryAttributes: many(categoryAttributes),
  productAttributes: many(productAttributes),
  attributeValues: many(attributeValues),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  categoryAttributes: many(categoryAttributes),
  category: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "categories_parentId_categories_id",
  }),
  categories: many(categories, {
    relationName: "categories_parentId_categories_id",
  }),
  categoryPaths_categoryId: many(categoryPath, {
    relationName: "categoryPath_categoryId_categories_id",
  }),
  categoryPaths_pathId: many(categoryPath, {
    relationName: "categoryPath_pathId_categories_id",
  }),
  products: many(products),
  productCategories: many(productCategories),
}));

export const categoryPathRelations = relations(categoryPath, ({ one }) => ({
  category_categoryId: one(categories, {
    fields: [categoryPath.categoryId],
    references: [categories.id],
    relationName: "categoryPath_categoryId_categories_id",
  }),
  category_pathId: one(categories, {
    fields: [categoryPath.pathId],
    references: [categories.id],
    relationName: "categoryPath_pathId_categories_id",
  }),
}));

export const couponsRelations = relations(coupons, ({ one, many }) => ({
  seller: one(sellers, {
    fields: [coupons.sellerId],
    references: [sellers.id],
  }),
  couponUsages: many(couponUsage),
}));

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

export const usersRelations = relations(users, ({ one, many }) => ({
  deliveries: many(deliveries),
  notifications: many(notifications),
  orders: many(orders),
  productAnswers: many(productAnswers),
  paymentMethods: many(paymentMethods),
  productQuestions: many(productQuestions),
  refunds: many(refunds),
  reviews: many(reviews),
  reviewVotes: many(reviewVotes),
  searchLogs: many(searchLogs),
  sellerDocuments: many(sellerDocuments),
  returns: many(returns),
  sellers: many(sellers),
  userAddresses: many(userAddresses),
  carts: many(carts),
  user: one(users, {
    fields: [users.referredBy],
    references: [users.id],
    relationName: "users_referredBy_users_id",
  }),
  users: many(users, {
    relationName: "users_referredBy_users_id",
  }),
  couponUsages: many(couponUsage),
  reviewComments: many(reviewComments),
  userDevices: many(userDevices),
  wishlists: many(wishlists),
}));

export const shipmentsRelations = relations(shipments, ({ one, many }) => ({
  deliveries: many(deliveries),
  shipmentItems: many(shipmentItems),
  order: one(orders, {
    fields: [shipments.orderId],
    references: [orders.id],
  }),
  seller: one(sellers, {
    fields: [shipments.sellerId],
    references: [sellers.id],
  }),
}));

export const dealsRelations = relations(deals, ({ one }) => ({
  seller: one(sellers, {
    fields: [deals.sellerId],
    references: [sellers.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

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
  payments: many(payments),
  refunds: many(refunds),
  reviews: many(reviews),
  returns: many(returns),
  sellerPayoutItems: many(sellerPayoutItems),
  couponUsages: many(couponUsage),
  shipments: many(shipments),
}));

export const userAddressesRelations = relations(
  userAddresses,
  ({ one, many }) => ({
    orders_billingAddressId: many(orders, {
      relationName: "orders_billingAddressId_userAddresses_id",
    }),
    orders_shippingAddressId: many(orders, {
      relationName: "orders_shippingAddressId_userAddresses_id",
    }),
    paymentMethods: many(paymentMethods),
    user: one(users, {
      fields: [userAddresses.userId],
      references: [users.id],
    }),
  })
);

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

export const productQuestionsRelations = relations(
  productQuestions,
  ({ one, many }) => ({
    productAnswers: many(productAnswers),
    product: one(products, {
      fields: [productQuestions.productId],
      references: [products.id],
    }),
    user: one(users, {
      fields: [productQuestions.userId],
      references: [users.id],
    }),
  })
);

export const productAttributesRelations = relations(
  productAttributes,
  ({ one }) => ({
    attribute: one(attributes, {
      fields: [productAttributes.attributeId],
      references: [attributes.id],
    }),
    attributeValue: one(attributeValues, {
      fields: [productAttributes.attributeValueId],
      references: [attributeValues.id],
    }),
    product: one(products, {
      fields: [productAttributes.productId],
      references: [products.id],
    }),
  })
);

export const attributeValuesRelations = relations(
  attributeValues,
  ({ one, many }) => ({
    productAttributes: many(productAttributes),
    attribute: one(attributes, {
      fields: [attributeValues.attributeId],
      references: [attributes.id],
    }),
  })
);

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

export const returnsRelations = relations(returns, ({ one, many }) => ({
  refunds: many(refunds),
  returnItems: many(returnItems),
  order: one(orders, {
    fields: [returns.orderId],
    references: [orders.id],
  }),
  user: one(users, {
    fields: [returns.userId],
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

export const brandsRelations = relations(brands, ({ many }) => ({
  products: many(products),
}));

export const reviewsRelations = relations(reviews, ({ one, many }) => ({
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
  reviewVotes: many(reviewVotes),
  reviewComments: many(reviewComments),
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

export const userDevicesRelations = relations(userDevices, ({ one }) => ({
  user: one(users, {
    fields: [userDevices.userId],
    references: [users.id],
  }),
}));

export const wishlistsRelations = relations(wishlists, ({ one, many }) => ({
  user: one(users, {
    fields: [wishlists.userId],
    references: [users.id],
  }),
  wishlistItems: many(wishlistItems),
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

export const productCategoriesRelations = relations(
  productCategories,
  ({ one }) => ({
    category: one(categories, {
      fields: [productCategories.categoryId],
      references: [categories.id],
    }),
    product: one(products, {
      fields: [productCategories.productId],
      references: [products.id],
    }),
  })
);
