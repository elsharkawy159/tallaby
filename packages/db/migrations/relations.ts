import { relations } from "drizzle-orm/relations";
import { users, deliveries, shipments, orders, payments, paymentMethods, carts, categories, sellers, coupons, notifications, userAddresses, refunds, returns, products, productVariants, orderItems, shipmentItems, productQuestions, shippingAddresses, couponUsage, cartItems, reviews, returnItems, reviewVotes, searchLogs, sellerDocuments, sellerPayoutItems, sellerPayouts, reviewComments, userDevices, wishlistItems, wishlists, productAnswers, brands } from "./schema";

export const deliveriesRelations = relations(deliveries, ({one}) => ({
	user: one(users, {
		fields: [deliveries.driverId],
		references: [users.id]
	}),
	shipment: one(shipments, {
		fields: [deliveries.shipmentId],
		references: [shipments.id]
	}),
}));

export const usersRelations = relations(users, ({one, many}) => ({
	deliveries: many(deliveries),
	carts: many(carts),
	notifications: many(notifications),
	paymentMethods: many(paymentMethods),
	refunds: many(refunds),
	sellers: many(sellers),
	productQuestions: many(productQuestions),
	shippingAddresses: many(shippingAddresses),
	couponUsages: many(couponUsage),
	returns: many(returns),
	reviews: many(reviews),
	reviewVotes: many(reviewVotes),
	searchLogs: many(searchLogs),
	sellerDocuments: many(sellerDocuments),
	reviewComments: many(reviewComments),
	userAddresses: many(userAddresses),
	userDevices: many(userDevices),
	wishlists: many(wishlists),
	user: one(users, {
		fields: [users.referredBy],
		references: [users.id],
		relationName: "users_referredBy_users_id"
	}),
	users: many(users, {
		relationName: "users_referredBy_users_id"
	}),
	productAnswers: many(productAnswers),
	orders: many(orders),
}));

export const shipmentsRelations = relations(shipments, ({one, many}) => ({
	deliveries: many(deliveries),
	shipmentItems: many(shipmentItems),
	order: one(orders, {
		fields: [shipments.orderId],
		references: [orders.id]
	}),
	seller: one(sellers, {
		fields: [shipments.sellerId],
		references: [sellers.id]
	}),
}));

export const paymentsRelations = relations(payments, ({one}) => ({
	order: one(orders, {
		fields: [payments.orderId],
		references: [orders.id]
	}),
	paymentMethod: one(paymentMethods, {
		fields: [payments.paymentMethodId],
		references: [paymentMethods.id]
	}),
}));

export const ordersRelations = relations(orders, ({one, many}) => ({
	payments: many(payments),
	refunds: many(refunds),
	couponUsages: many(couponUsage),
	shipments: many(shipments),
	returns: many(returns),
	reviews: many(reviews),
	sellerPayoutItems: many(sellerPayoutItems),
	orderItems: many(orderItems),
	userAddress_billingAddressId: one(userAddresses, {
		fields: [orders.billingAddressId],
		references: [userAddresses.id],
		relationName: "orders_billingAddressId_userAddresses_id"
	}),
	cart: one(carts, {
		fields: [orders.cartId],
		references: [carts.id]
	}),
	userAddress_shippingAddressId: one(userAddresses, {
		fields: [orders.shippingAddressId],
		references: [userAddresses.id],
		relationName: "orders_shippingAddressId_userAddresses_id"
	}),
	user: one(users, {
		fields: [orders.userId],
		references: [users.id]
	}),
}));

export const paymentMethodsRelations = relations(paymentMethods, ({one, many}) => ({
	payments: many(payments),
	userAddress: one(userAddresses, {
		fields: [paymentMethods.billingAddressId],
		references: [userAddresses.id]
	}),
	user: one(users, {
		fields: [paymentMethods.userId],
		references: [users.id]
	}),
}));

export const cartsRelations = relations(carts, ({one, many}) => ({
	user: one(users, {
		fields: [carts.userId],
		references: [users.id]
	}),
	cartItems: many(cartItems),
	orders: many(orders),
}));

export const categoriesRelations = relations(categories, ({one, many}) => ({
	category: one(categories, {
		fields: [categories.parentId],
		references: [categories.id],
		relationName: "categories_parentId_categories_id"
	}),
	categories: many(categories, {
		relationName: "categories_parentId_categories_id"
	}),
	products: many(products),
}));

export const couponsRelations = relations(coupons, ({one, many}) => ({
	seller: one(sellers, {
		fields: [coupons.sellerId],
		references: [sellers.id]
	}),
	couponUsages: many(couponUsage),
}));

export const sellersRelations = relations(sellers, ({one, many}) => ({
	coupons: many(coupons),
	user: one(users, {
		fields: [sellers.id],
		references: [users.id]
	}),
	cartItems: many(cartItems),
	shipments: many(shipments),
	reviews: many(reviews),
	sellerDocuments: many(sellerDocuments),
	sellerPayouts: many(sellerPayouts),
	reviewComments: many(reviewComments),
	orderItems: many(orderItems),
	productAnswers: many(productAnswers),
	products: many(products),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	user: one(users, {
		fields: [notifications.userId],
		references: [users.id]
	}),
}));

export const userAddressesRelations = relations(userAddresses, ({one, many}) => ({
	paymentMethods: many(paymentMethods),
	user: one(users, {
		fields: [userAddresses.userId],
		references: [users.id]
	}),
	orders_billingAddressId: many(orders, {
		relationName: "orders_billingAddressId_userAddresses_id"
	}),
	orders_shippingAddressId: many(orders, {
		relationName: "orders_shippingAddressId_userAddresses_id"
	}),
}));

export const refundsRelations = relations(refunds, ({one}) => ({
	order: one(orders, {
		fields: [refunds.orderId],
		references: [orders.id]
	}),
	user: one(users, {
		fields: [refunds.refundedBy],
		references: [users.id]
	}),
	return: one(returns, {
		fields: [refunds.returnId],
		references: [returns.id]
	}),
}));

export const returnsRelations = relations(returns, ({one, many}) => ({
	refunds: many(refunds),
	order: one(orders, {
		fields: [returns.orderId],
		references: [orders.id]
	}),
	user: one(users, {
		fields: [returns.userId],
		references: [users.id]
	}),
	returnItems: many(returnItems),
}));

export const productVariantsRelations = relations(productVariants, ({one, many}) => ({
	product: one(products, {
		fields: [productVariants.productId],
		references: [products.id]
	}),
	wishlistItems: many(wishlistItems),
	orderItems: many(orderItems),
}));

export const productsRelations = relations(products, ({one, many}) => ({
	productVariants: many(productVariants),
	productQuestions: many(productQuestions),
	cartItems: many(cartItems),
	reviews: many(reviews),
	searchLogs: many(searchLogs),
	wishlistItems: many(wishlistItems),
	orderItems: many(orderItems),
	brand: one(brands, {
		fields: [products.brandId],
		references: [brands.id]
	}),
	category: one(categories, {
		fields: [products.categoryId],
		references: [categories.id]
	}),
	seller: one(sellers, {
		fields: [products.sellerId],
		references: [sellers.id]
	}),
}));

export const shipmentItemsRelations = relations(shipmentItems, ({one}) => ({
	orderItem: one(orderItems, {
		fields: [shipmentItems.orderItemId],
		references: [orderItems.id]
	}),
	shipment: one(shipments, {
		fields: [shipmentItems.shipmentId],
		references: [shipments.id]
	}),
}));

export const orderItemsRelations = relations(orderItems, ({one, many}) => ({
	shipmentItems: many(shipmentItems),
	reviews: many(reviews),
	returnItems: many(returnItems),
	sellerPayoutItems: many(sellerPayoutItems),
	order: one(orders, {
		fields: [orderItems.orderId],
		references: [orders.id]
	}),
	product: one(products, {
		fields: [orderItems.productId],
		references: [products.id]
	}),
	seller: one(sellers, {
		fields: [orderItems.sellerId],
		references: [sellers.id]
	}),
	productVariant: one(productVariants, {
		fields: [orderItems.variantId],
		references: [productVariants.id]
	}),
}));

export const productQuestionsRelations = relations(productQuestions, ({one, many}) => ({
	product: one(products, {
		fields: [productQuestions.productId],
		references: [products.id]
	}),
	user: one(users, {
		fields: [productQuestions.userId],
		references: [users.id]
	}),
	productAnswers: many(productAnswers),
}));

export const shippingAddressesRelations = relations(shippingAddresses, ({one}) => ({
	user: one(users, {
		fields: [shippingAddresses.userId],
		references: [users.id]
	}),
}));

export const couponUsageRelations = relations(couponUsage, ({one}) => ({
	coupon: one(coupons, {
		fields: [couponUsage.couponId],
		references: [coupons.id]
	}),
	order: one(orders, {
		fields: [couponUsage.orderId],
		references: [orders.id]
	}),
	user: one(users, {
		fields: [couponUsage.userId],
		references: [users.id]
	}),
}));

export const cartItemsRelations = relations(cartItems, ({one}) => ({
	cart: one(carts, {
		fields: [cartItems.cartId],
		references: [carts.id]
	}),
	product: one(products, {
		fields: [cartItems.productId],
		references: [products.id]
	}),
	seller: one(sellers, {
		fields: [cartItems.sellerId],
		references: [sellers.id]
	}),
}));

export const reviewsRelations = relations(reviews, ({one, many}) => ({
	order: one(orders, {
		fields: [reviews.orderId],
		references: [orders.id]
	}),
	orderItem: one(orderItems, {
		fields: [reviews.orderItemId],
		references: [orderItems.id]
	}),
	product: one(products, {
		fields: [reviews.productId],
		references: [products.id]
	}),
	seller: one(sellers, {
		fields: [reviews.sellerId],
		references: [sellers.id]
	}),
	user: one(users, {
		fields: [reviews.userId],
		references: [users.id]
	}),
	reviewVotes: many(reviewVotes),
	reviewComments: many(reviewComments),
}));

export const returnItemsRelations = relations(returnItems, ({one}) => ({
	orderItem: one(orderItems, {
		fields: [returnItems.orderItemId],
		references: [orderItems.id]
	}),
	return: one(returns, {
		fields: [returnItems.returnId],
		references: [returns.id]
	}),
}));

export const reviewVotesRelations = relations(reviewVotes, ({one}) => ({
	review: one(reviews, {
		fields: [reviewVotes.reviewId],
		references: [reviews.id]
	}),
	user: one(users, {
		fields: [reviewVotes.userId],
		references: [users.id]
	}),
}));

export const searchLogsRelations = relations(searchLogs, ({one}) => ({
	product: one(products, {
		fields: [searchLogs.clickedProductId],
		references: [products.id]
	}),
	user: one(users, {
		fields: [searchLogs.userId],
		references: [users.id]
	}),
}));

export const sellerDocumentsRelations = relations(sellerDocuments, ({one}) => ({
	user: one(users, {
		fields: [sellerDocuments.reviewedBy],
		references: [users.id]
	}),
	seller: one(sellers, {
		fields: [sellerDocuments.sellerId],
		references: [sellers.id]
	}),
}));

export const sellerPayoutItemsRelations = relations(sellerPayoutItems, ({one}) => ({
	order: one(orders, {
		fields: [sellerPayoutItems.orderId],
		references: [orders.id]
	}),
	orderItem: one(orderItems, {
		fields: [sellerPayoutItems.orderItemId],
		references: [orderItems.id]
	}),
	sellerPayout: one(sellerPayouts, {
		fields: [sellerPayoutItems.payoutId],
		references: [sellerPayouts.id]
	}),
}));

export const sellerPayoutsRelations = relations(sellerPayouts, ({one, many}) => ({
	sellerPayoutItems: many(sellerPayoutItems),
	seller: one(sellers, {
		fields: [sellerPayouts.sellerId],
		references: [sellers.id]
	}),
}));

export const reviewCommentsRelations = relations(reviewComments, ({one}) => ({
	review: one(reviews, {
		fields: [reviewComments.reviewId],
		references: [reviews.id]
	}),
	seller: one(sellers, {
		fields: [reviewComments.sellerId],
		references: [sellers.id]
	}),
	user: one(users, {
		fields: [reviewComments.userId],
		references: [users.id]
	}),
}));

export const userDevicesRelations = relations(userDevices, ({one}) => ({
	user: one(users, {
		fields: [userDevices.userId],
		references: [users.id]
	}),
}));

export const wishlistItemsRelations = relations(wishlistItems, ({one}) => ({
	product: one(products, {
		fields: [wishlistItems.productId],
		references: [products.id]
	}),
	productVariant: one(productVariants, {
		fields: [wishlistItems.variantId],
		references: [productVariants.id]
	}),
	wishlist: one(wishlists, {
		fields: [wishlistItems.wishlistId],
		references: [wishlists.id]
	}),
}));

export const wishlistsRelations = relations(wishlists, ({one, many}) => ({
	wishlistItems: many(wishlistItems),
	user: one(users, {
		fields: [wishlists.userId],
		references: [users.id]
	}),
}));

export const productAnswersRelations = relations(productAnswers, ({one}) => ({
	productQuestion: one(productQuestions, {
		fields: [productAnswers.questionId],
		references: [productQuestions.id]
	}),
	seller: one(sellers, {
		fields: [productAnswers.sellerId],
		references: [sellers.id]
	}),
	user: one(users, {
		fields: [productAnswers.userId],
		references: [users.id]
	}),
}));

export const brandsRelations = relations(brands, ({many}) => ({
	products: many(products),
}));