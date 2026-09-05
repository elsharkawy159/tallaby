import { relations } from "drizzle-orm/relations";
import { users, deliveries, shipments, orders, payments, paymentMethods, carts, categories, sellers, coupons, notifications, contacts, userAddresses, products, productVariants, refunds, returns, orderItems, shipmentItems, productQuestions, shippingAddresses, couponUsage, cartItems, reviews, returnItems, reviewVotes, searchLogs, sellerDocuments, sellerPayoutItems, sellerPayouts, reviewComments, userDevices, wishlistItems, wishlists, brands, productAnswers, userRewards, productTranslations, digitalProducts, digitalOrders, sellerCategories, sellerWallet, walletTransactions, digitalFiles, licenseKeys, digitalBundleItems, digitalAccessLogs, shippingProviders, shipmentBatches, shipmentBatchItems, userWallets, userWalletTransactions, walletTopUps, walletPayoutRequests, affiliates, affiliateCommissions } from "./schema";

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
	shipments: many(shipments),
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
	userRewards: many(userRewards),
	digitalOrders: many(digitalOrders),
	digitalAccessLogs: many(digitalAccessLogs),
	shipmentBatches: many(shipmentBatches),
	shipmentBatchItems: many(shipmentBatchItems),
	userWallet: one(userWallets),
	userWalletTransactions: many(userWalletTransactions),
	walletTopUps: many(walletTopUps),
	walletPayoutRequests_userId: many(walletPayoutRequests, {
		relationName: "walletPayoutRequests_userId_users_id"
	}),
	walletPayoutRequests_reviewedBy: many(walletPayoutRequests, {
		relationName: "walletPayoutRequests_reviewedBy_users_id"
	}),
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
	provider: one(shippingProviders, {
		fields: [shipments.providerId],
		references: [shippingProviders.id]
	}),
	rider: one(users, {
		fields: [shipments.riderId],
		references: [users.id]
	}),
}));

export const shippingProvidersRelations = relations(shippingProviders, ({many}) => ({
	shipments: many(shipments),
	shipmentBatches: many(shipmentBatches),
}));

export const shipmentBatchesRelations = relations(shipmentBatches, ({one, many}) => ({
	provider: one(shippingProviders, {
		fields: [shipmentBatches.providerId],
		references: [shippingProviders.id]
	}),
	createdByUser: one(users, {
		fields: [shipmentBatches.createdBy],
		references: [users.id]
	}),
	items: many(shipmentBatchItems),
}));

export const shipmentBatchItemsRelations = relations(shipmentBatchItems, ({one}) => ({
	batch: one(shipmentBatches, {
		fields: [shipmentBatchItems.batchId],
		references: [shipmentBatches.id]
	}),
	order: one(orders, {
		fields: [shipmentBatchItems.orderId],
		references: [orders.id]
	}),
	rider: one(users, {
		fields: [shipmentBatchItems.riderId],
		references: [users.id]
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
	digitalOrders: many(digitalOrders),
	walletTransactions: many(walletTransactions),
	shipmentBatchItems: many(shipmentBatchItems),
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
	products: many(products),
	productAnswers: many(productAnswers),
	digitalProducts: many(digitalProducts),
	sellerWallet: many(sellerWallet),
	sellerCategories: many(sellerCategories),
	walletTransactions: many(walletTransactions),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	user: one(users, {
		fields: [notifications.userId],
		references: [users.id]
	}),
}));

export const contactsRelations = relations(contacts, ({one}) => ({
	user: one(users, {
		fields: [contacts.userId],
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
	digitalProducts: many(digitalProducts),
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
	productTranslations: many(productTranslations),
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
	digitalOrders: many(digitalOrders),
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

export const brandsRelations = relations(brands, ({many}) => ({
	products: many(products),
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

export const userRewardsRelations = relations(userRewards, ({one}) => ({
	user: one(users, {
		fields: [userRewards.userId],
		references: [users.id]
	}),
}));

export const productTranslationsRelations = relations(productTranslations, ({one}) => ({
	product: one(products, {
		fields: [productTranslations.productId],
		references: [products.id]
	}),
}));

export const digitalProductsRelations = relations(digitalProducts, ({one, many}) => ({
	product: one(products, {
		fields: [digitalProducts.productId],
		references: [products.id]
	}),
	seller: one(sellers, {
		fields: [digitalProducts.sellerId],
		references: [sellers.id]
	}),
	digitalOrders: many(digitalOrders),
	digitalFiles: many(digitalFiles),
	licenseKeys: many(licenseKeys),
	bundleItems: many(digitalBundleItems, {
		relationName: "digital_bundle_items_bundle_product_id_digital_products_id_fk"
	}),
	bundleOf: many(digitalBundleItems, {
		relationName: "digital_bundle_items_child_product_id_digital_products_id_fk"
	}),
}));

export const digitalFilesRelations = relations(digitalFiles, ({one}) => ({
	digitalProduct: one(digitalProducts, {
		fields: [digitalFiles.digitalProductId],
		references: [digitalProducts.id]
	}),
}));

export const licenseKeysRelations = relations(licenseKeys, ({one, many}) => ({
	digitalProduct: one(digitalProducts, {
		fields: [licenseKeys.digitalProductId],
		references: [digitalProducts.id]
	}),
	assignedOrder: one(orders, {
		fields: [licenseKeys.assignedToOrderId],
		references: [orders.id]
	}),
	digitalOrders: many(digitalOrders),
}));

export const digitalBundleItemsRelations = relations(digitalBundleItems, ({one}) => ({
	bundleProduct: one(digitalProducts, {
		fields: [digitalBundleItems.bundleProductId],
		references: [digitalProducts.id],
		relationName: "digital_bundle_items_bundle_product_id_digital_products_id_fk"
	}),
	childProduct: one(digitalProducts, {
		fields: [digitalBundleItems.childProductId],
		references: [digitalProducts.id],
		relationName: "digital_bundle_items_child_product_id_digital_products_id_fk"
	}),
}));

export const digitalOrdersRelations = relations(digitalOrders, ({one, many}) => ({
	order: one(orders, {
		fields: [digitalOrders.orderId],
		references: [orders.id]
	}),
	orderItem: one(orderItems, {
		fields: [digitalOrders.orderItemId],
		references: [orderItems.id]
	}),
	digitalProduct: one(digitalProducts, {
		fields: [digitalOrders.digitalProductId],
		references: [digitalProducts.id]
	}),
	buyer: one(users, {
		fields: [digitalOrders.buyerId],
		references: [users.id]
	}),
	licenseKey: one(licenseKeys, {
		fields: [digitalOrders.licenseKeyId],
		references: [licenseKeys.id]
	}),
	accessLogs: many(digitalAccessLogs),
}));

export const digitalAccessLogsRelations = relations(digitalAccessLogs, ({one}) => ({
	digitalOrder: one(digitalOrders, {
		fields: [digitalAccessLogs.digitalOrderId],
		references: [digitalOrders.id]
	}),
	actor: one(users, {
		fields: [digitalAccessLogs.actorUserId],
		references: [users.id]
	}),
}));

export const sellerCategoriesRelations = relations(sellerCategories, ({one}) => ({
	seller: one(sellers, {
		fields: [sellerCategories.sellerId],
		references: [sellers.id]
	}),
	category: one(categories, {
		fields: [sellerCategories.categoryId],
		references: [categories.id]
	}),
}));

export const sellerWalletRelations = relations(sellerWallet, ({one}) => ({
	seller: one(sellers, {
		fields: [sellerWallet.sellerId],
		references: [sellers.id]
	}),
}));

export const walletTransactionsRelations = relations(walletTransactions, ({one}) => ({
	seller: one(sellers, {
		fields: [walletTransactions.sellerId],
		references: [sellers.id]
	}),
	order: one(orders, {
		fields: [walletTransactions.orderId],
		references: [orders.id]
	}),
}));

/* Centralized user wallet (migration 0025). */

export const userWalletsRelations = relations(userWallets, ({one, many}) => ({
	user: one(users, {
		fields: [userWallets.userId],
		references: [users.id]
	}),
	transactions: many(userWalletTransactions),
	topUps: many(walletTopUps),
	payoutRequests: many(walletPayoutRequests, {
		relationName: "walletPayoutRequests_walletId_userWallets_id"
	}),
}));

export const userWalletTransactionsRelations = relations(userWalletTransactions, ({one}) => ({
	wallet: one(userWallets, {
		fields: [userWalletTransactions.walletId],
		references: [userWallets.id]
	}),
	user: one(users, {
		fields: [userWalletTransactions.userId],
		references: [users.id]
	}),
}));

export const walletTopUpsRelations = relations(walletTopUps, ({one}) => ({
	wallet: one(userWallets, {
		fields: [walletTopUps.walletId],
		references: [userWallets.id]
	}),
	user: one(users, {
		fields: [walletTopUps.userId],
		references: [users.id]
	}),
	transaction: one(userWalletTransactions, {
		fields: [walletTopUps.transactionId],
		references: [userWalletTransactions.id]
	}),
}));

export const walletPayoutRequestsRelations = relations(walletPayoutRequests, ({one}) => ({
	wallet: one(userWallets, {
		fields: [walletPayoutRequests.walletId],
		references: [userWallets.id],
		relationName: "walletPayoutRequests_walletId_userWallets_id"
	}),
	// Two FKs point at users (requester and reviewing admin), so both sides
	// need an explicit relationName to stay unambiguous.
	user: one(users, {
		fields: [walletPayoutRequests.userId],
		references: [users.id],
		relationName: "walletPayoutRequests_userId_users_id"
	}),
	reviewer: one(users, {
		fields: [walletPayoutRequests.reviewedBy],
		references: [users.id],
		relationName: "walletPayoutRequests_reviewedBy_users_id"
	}),
	transaction: one(userWalletTransactions, {
		fields: [walletPayoutRequests.transactionId],
		references: [userWalletTransactions.id]
	}),
}));

/* Affiliate program (migration 0029). */

export const affiliatesRelations = relations(affiliates, ({one, many}) => ({
	user: one(users, {
		fields: [affiliates.userId],
		references: [users.id]
	}),
	coupon: one(coupons, {
		fields: [affiliates.couponId],
		references: [coupons.id]
	}),
	commissions: many(affiliateCommissions),
}));

export const affiliateCommissionsRelations = relations(affiliateCommissions, ({one, many}) => ({
	affiliate: one(affiliates, {
		fields: [affiliateCommissions.affiliateId],
		references: [affiliates.id]
	}),
	user: one(users, {
		fields: [affiliateCommissions.userId],
		references: [users.id]
	}),
	order: one(orders, {
		fields: [affiliateCommissions.orderId],
		references: [orders.id]
	}),
	coupon: one(coupons, {
		fields: [affiliateCommissions.couponId],
		references: [coupons.id]
	}),
	parentCommission: one(affiliateCommissions, {
		fields: [affiliateCommissions.parentCommissionId],
		references: [affiliateCommissions.id],
		relationName: "affiliateCommissions_parentCommissionId_affiliateCommissions_id"
	}),
	reversals: many(affiliateCommissions, {
		relationName: "affiliateCommissions_parentCommissionId_affiliateCommissions_id"
	}),
	walletTransaction: one(userWalletTransactions, {
		fields: [affiliateCommissions.walletTransactionId],
		references: [userWalletTransactions.id]
	}),
}));
