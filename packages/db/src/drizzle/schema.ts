import { pgTable, uniqueIndex, unique, uuid, text, boolean, jsonb, integer, timestamp, index, foreignKey, numeric, real, date, primaryKey, pgEnum } from "drizzle-orm/pg-core"

export const addressType = pgEnum("address_type", ['shipping', 'billing', 'both'])
export const couponType = pgEnum("coupon_type", ['percentage', 'fixed_amount', 'buy_x_get_y', 'free_shipping'])
export const dealType = pgEnum("deal_type", ['daily_deal', 'lightning_deal', 'deal_of_the_day', 'best_deal', 'clearance'])
export const fulfillmentType = pgEnum("fulfillment_type", ['seller_fulfilled', 'platform_fulfilled', 'fba', 'digital'])
export const itemCondition = pgEnum("item_condition", ['new', 'renewed', 'refurbished', 'used_like_new', 'used_very_good', 'used_good', 'used_acceptable'])
export const notificationType = pgEnum("notification_type", ['order_update', 'shipment_update', 'price_drop', 'restock', 'review_response', 'marketing'])
export const orderStatus = pgEnum("order_status", ['pending', 'payment_processing', 'confirmed', 'shipping_soon', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'refund_requested', 'refunded', 'returned'])
export const paymentStatus = pgEnum("payment_status", ['pending', 'authorized', 'paid', 'failed', 'refunded', 'partially_refunded'])
export const promotionType = pgEnum("promotion_type", ['percentage', 'fixed_amount', 'buy_x_get_y', 'free_shipping'])
export const returnReason = pgEnum("return_reason", ['defective', 'damaged', 'wrong_item', 'not_as_described', 'better_price', 'no_longer_needed', 'unauthorized_purchase', 'other'])
export const sellerStatus = pgEnum("seller_status", ['pending', 'approved', 'suspended', 'restricted'])
export const shippingSpeed = pgEnum("shipping_speed", ['standard', 'expedited', 'priority', 'one_day', 'same_day'])
export const userRole = pgEnum("user_role", ['customer', 'seller', 'admin', 'support', 'driver'])


export const attributes = pgTable("attributes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	description: text(),
	type: text().notNull(),
	isRequired: boolean("is_required").default(false),
	isFilterable: boolean("is_filterable").default(false),
	isSearchable: boolean("is_searchable").default(false),
	isComparable: boolean("is_comparable").default(false),
	isVisibleOnFront: boolean("is_visible_on_front").default(true),
	isUsedInAdmin: boolean("is_used_in_admin").default(true),
	validationRules: jsonb("validation_rules"),
	defaultValue: text("default_value"),
	displayOrder: integer("display_order").default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	uniqueIndex("attribute_slug_idx").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	unique("attributes_slug_unique").on(table.slug),
]);

export const cartItems = pgTable("cart_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	cartId: uuid("cart_id").notNull(),
	productId: uuid("product_id").notNull(),
	variantId: uuid("variant_id"),
	sellerId: uuid("seller_id").notNull(),
	listingId: uuid("listing_id"),
	quantity: integer().default(1).notNull(),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	savedForLater: boolean("saved_for_later").default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("cart_items_cart_id_idx").using("btree", table.cartId.asc().nullsLast().op("uuid_ops")),
	index("cart_items_product_id_idx").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
	index("cart_items_seller_id_idx").using("btree", table.sellerId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.cartId],
			foreignColumns: [carts.id],
			name: "cart_items_cart_id_carts_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.listingId],
			foreignColumns: [productListings.id],
			name: "cart_items_listing_id_product_listings_id_fk"
		}),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "cart_items_product_id_products_id_fk"
		}),
	foreignKey({
			columns: [table.sellerId],
			foreignColumns: [sellers.id],
			name: "cart_items_seller_id_sellers_id_fk"
		}),
	foreignKey({
			columns: [table.variantId],
			foreignColumns: [productVariants.id],
			name: "cart_items_variant_id_product_variants_id_fk"
		}),
]);

export const brands = pgTable("brands", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	logoUrl: text("logo_url"),
	description: text(),
	website: text(),
	isVerified: boolean("is_verified").default(false),
	isOfficial: boolean("is_official").default(false),
	averageRating: real("average_rating"),
	reviewCount: integer("review_count").default(0),
	productCount: integer("product_count").default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("brand_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
	uniqueIndex("brand_slug_idx").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	unique("brands_slug_unique").on(table.slug),
]);

export const categoryAttributes = pgTable("category_attributes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	categoryId: uuid("category_id").notNull(),
	attributeId: uuid("attribute_id").notNull(),
	isRequired: boolean("is_required").default(false),
	displayOrder: integer("display_order").default(0),
}, (table) => [
	uniqueIndex("category_attribute_idx").using("btree", table.categoryId.asc().nullsLast().op("uuid_ops"), table.attributeId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.attributeId],
			foreignColumns: [attributes.id],
			name: "category_attributes_attribute_id_attributes_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "category_attributes_category_id_categories_id_fk"
		}).onDelete("cascade"),
]);

export const categories = pgTable("categories", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	parentId: uuid("parent_id"),
	name: text().notNull(),
	slug: text().notNull(),
	description: text(),
	imageUrl: text("image_url"),
	iconUrl: text("icon_url"),
	level: integer().default(1).notNull(),
	displayOrder: integer("display_order").default(0),
	isActive: boolean("is_active").default(true),
	showInMenu: boolean("show_in_menu").default(true),
	showInHomeSlider: boolean("show_in_home_slider").default(false),
	metaTitle: text("meta_title"),
	metaDescription: text("meta_description"),
	metaKeywords: text("meta_keywords"),
	attributes: jsonb(),
	commissionRate: real("commission_rate"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("category_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
	index("category_parent_id_idx").using("btree", table.parentId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("category_slug_idx").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "categories_parent_id_categories_id_fk"
		}),
]);

export const categoryPath = pgTable("category_path", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	categoryId: uuid("category_id").notNull(),
	pathId: uuid("path_id").notNull(),
	level: integer().notNull(),
}, (table) => [
	uniqueIndex("category_path_idx").using("btree", table.categoryId.asc().nullsLast().op("uuid_ops"), table.pathId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "category_path_category_id_categories_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.pathId],
			foreignColumns: [categories.id],
			name: "category_path_path_id_categories_id_fk"
		}).onDelete("cascade"),
]);

export const coupons = pgTable("coupons", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sellerId: uuid("seller_id"),
	code: text().notNull(),
	name: text().notNull(),
	description: text(),
	discountType: couponType("discount_type").notNull(),
	discountValue: numeric("discount_value", { precision: 10, scale:  2 }).notNull(),
	minimumPurchase: numeric("minimum_purchase", { precision: 10, scale:  2 }),
	maximumDiscount: numeric("maximum_discount", { precision: 10, scale:  2 }),
	isActive: boolean("is_active").default(true),
	isOneTimeUse: boolean("is_one_time_use").default(false),
	usageLimit: integer("usage_limit"),
	usageCount: integer("usage_count").default(0),
	perUserLimit: integer("per_user_limit"),
	applicableTo: jsonb("applicable_to"),
	excludeItems: jsonb("exclude_items"),
	startsAt: timestamp("starts_at", { withTimezone: true, mode: 'string' }).notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("coupon_code_idx").using("btree", table.code.asc().nullsLast().op("text_ops")),
	index("coupon_seller_id_idx").using("btree", table.sellerId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.sellerId],
			foreignColumns: [sellers.id],
			name: "coupons_seller_id_sellers_id_fk"
		}),
	unique("coupons_code_unique").on(table.code),
]);

export const deliveries = pgTable("deliveries", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	shipmentId: uuid("shipment_id").notNull(),
	driverId: uuid("driver_id"),
	status: text().default('pending'),
	deliveryNotes: text("delivery_notes"),
	attemptCount: integer("attempt_count").default(0),
	recipientName: text("recipient_name"),
	proofOfDelivery: jsonb("proof_of_delivery"),
	receivedAt: timestamp("received_at", { withTimezone: true, mode: 'string' }),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'string' }),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("delivery_driver_id_idx").using("btree", table.driverId.asc().nullsLast().op("uuid_ops")),
	index("delivery_shipment_id_idx").using("btree", table.shipmentId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.driverId],
			foreignColumns: [users.id],
			name: "deliveries_driver_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.shipmentId],
			foreignColumns: [shipments.id],
			name: "deliveries_shipment_id_shipments_id_fk"
		}).onDelete("cascade"),
]);

export const deals = pgTable("deals", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	dealType: dealType("deal_type").notNull(),
	sellerId: uuid("seller_id"),
	discountType: promotionType("discount_type").notNull(),
	discountValue: numeric("discount_value", { precision: 10, scale:  2 }).notNull(),
	isActive: boolean("is_active").default(true),
	featuredImageUrl: text("featured_image_url"),
	badgeText: text("badge_text"),
	targetItems: jsonb("target_items").notNull(),
	totalAvailable: integer("total_available"),
	soldCount: integer("sold_count").default(0),
	startsAt: timestamp("starts_at", { withTimezone: true, mode: 'string' }).notNull(),
	endsAt: timestamp("ends_at", { withTimezone: true, mode: 'string' }).notNull(),
	dealUrl: text("deal_url"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("deal_seller_id_idx").using("btree", table.sellerId.asc().nullsLast().op("uuid_ops")),
	index("deal_type_idx").using("btree", table.dealType.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.sellerId],
			foreignColumns: [sellers.id],
			name: "deals_seller_id_sellers_id_fk"
		}),
]);

export const notifications = pgTable("notifications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	type: notificationType().notNull(),
	title: text().notNull(),
	message: text().notNull(),
	data: jsonb(),
	isRead: boolean("is_read").default(false),
	readAt: timestamp("read_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("notification_type_idx").using("btree", table.type.asc().nullsLast().op("enum_ops")),
	index("notification_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "notifications_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const orderItems = pgTable("order_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	orderId: uuid("order_id").notNull(),
	productId: uuid("product_id").notNull(),
	variantId: uuid("variant_id"),
	sellerId: uuid("seller_id").notNull(),
	listingId: uuid("listing_id"),
	sku: text().notNull(),
	productName: text("product_name").notNull(),
	variantName: text("variant_name"),
	quantity: integer().default(1).notNull(),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	subtotal: numeric({ precision: 10, scale:  2 }).notNull(),
	tax: numeric({ precision: 10, scale:  2 }).default('0'),
	shippingCost: numeric("shipping_cost", { precision: 10, scale:  2 }).default('0'),
	discountAmount: numeric("discount_amount", { precision: 10, scale:  2 }).default('0'),
	total: numeric({ precision: 10, scale:  2 }).notNull(),
	commissionAmount: numeric("commission_amount", { precision: 10, scale:  2 }).notNull(),
	commissionRate: real("commission_rate").notNull(),
	sellerEarning: numeric("seller_earning", { precision: 10, scale:  2 }).notNull(),
	currency: text().default('USD'),
	condition: itemCondition().default('new'),
	fulfillmentType: fulfillmentType("fulfillment_type").default('seller_fulfilled'),
	status: orderStatus().default('pending'),
	isReviewed: boolean("is_reviewed").default(false),
	isReturned: boolean("is_returned").default(false),
	isRefunded: boolean("is_refunded").default(false),
	refundAmount: numeric("refund_amount", { precision: 10, scale:  2 }),
	refundReason: text("refund_reason"),
	refundedAt: timestamp("refunded_at", { withTimezone: true, mode: 'string' }),
	shippedAt: timestamp("shipped_at", { withTimezone: true, mode: 'string' }),
	deliveredAt: timestamp("delivered_at", { withTimezone: true, mode: 'string' }),
	cancelledAt: timestamp("cancelled_at", { withTimezone: true, mode: 'string' }),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("order_items_order_id_idx").using("btree", table.orderId.asc().nullsLast().op("uuid_ops")),
	index("order_items_product_id_idx").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
	index("order_items_seller_id_idx").using("btree", table.sellerId.asc().nullsLast().op("uuid_ops")),
	index("order_items_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.listingId],
			foreignColumns: [productListings.id],
			name: "order_items_listing_id_product_listings_id_fk"
		}),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "order_items_order_id_orders_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "order_items_product_id_products_id_fk"
		}),
	foreignKey({
			columns: [table.sellerId],
			foreignColumns: [sellers.id],
			name: "order_items_seller_id_sellers_id_fk"
		}),
	foreignKey({
			columns: [table.variantId],
			foreignColumns: [productVariants.id],
			name: "order_items_variant_id_product_variants_id_fk"
		}),
]);

export const orders = pgTable("orders", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	orderNumber: text("order_number").notNull(),
	userId: uuid("user_id").notNull(),
	cartId: uuid("cart_id"),
	subtotal: numeric({ precision: 10, scale:  2 }).notNull(),
	shippingCost: numeric("shipping_cost", { precision: 10, scale:  2 }).default('0'),
	tax: numeric({ precision: 10, scale:  2 }).default('0'),
	discountAmount: numeric("discount_amount", { precision: 10, scale:  2 }).default('0'),
	giftWrapCost: numeric("gift_wrap_cost", { precision: 10, scale:  2 }).default('0'),
	totalAmount: numeric("total_amount", { precision: 10, scale:  2 }).notNull(),
	currency: text().default('USD'),
	status: orderStatus().default('pending'),
	paymentStatus: paymentStatus("payment_status").default('pending'),
	paymentMethod: text("payment_method").notNull(),
	shippingAddressId: uuid("shipping_address_id"),
	billingAddressId: uuid("billing_address_id"),
	isGift: boolean("is_gift").default(false),
	giftMessage: text("gift_message"),
	couponCode: text("coupon_code"),
	notes: text(),
	isBusinessOrder: boolean("is_business_order").default(false),
	customerIp: text("customer_ip"),
	customerUserAgent: text("customer_user_agent"),
	referralSource: text("referral_source"),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	processedAt: timestamp("processed_at", { withTimezone: true, mode: 'string' }),
	shippedAt: timestamp("shipped_at", { withTimezone: true, mode: 'string' }),
	deliveredAt: timestamp("delivered_at", { withTimezone: true, mode: 'string' }),
	cancelledAt: timestamp("cancelled_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("order_number_idx").using("btree", table.orderNumber.asc().nullsLast().op("text_ops")),
	index("order_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("order_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.billingAddressId],
			foreignColumns: [userAddresses.id],
			name: "orders_billing_address_id_user_addresses_id_fk"
		}),
	foreignKey({
			columns: [table.cartId],
			foreignColumns: [carts.id],
			name: "orders_cart_id_carts_id_fk"
		}),
	foreignKey({
			columns: [table.shippingAddressId],
			foreignColumns: [userAddresses.id],
			name: "orders_shipping_address_id_user_addresses_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "orders_user_id_users_id_fk"
		}),
	unique("orders_order_number_unique").on(table.orderNumber),
]);

export const productAnswers = pgTable("product_answers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	questionId: uuid("question_id").notNull(),
	userId: uuid("user_id").notNull(),
	sellerId: uuid("seller_id"),
	answer: text().notNull(),
	isAnonymous: boolean("is_anonymous").default(false),
	isVerified: boolean("is_verified").default(false),
	voteCount: integer("vote_count").default(0),
	status: text().default('pending'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("answer_question_id_idx").using("btree", table.questionId.asc().nullsLast().op("uuid_ops")),
	index("answer_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.questionId],
			foreignColumns: [productQuestions.id],
			name: "product_answers_question_id_product_questions_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.sellerId],
			foreignColumns: [sellers.id],
			name: "product_answers_seller_id_sellers_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "product_answers_user_id_users_id_fk"
		}),
]);

export const productAttributes = pgTable("product_attributes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	productId: uuid("product_id").notNull(),
	attributeId: uuid("attribute_id").notNull(),
	attributeValueId: uuid("attribute_value_id"),
	customValue: text("custom_value"),
	displayOrder: integer("display_order").default(0),
}, (table) => [
	index("prod_attr_attribute_id_idx").using("btree", table.attributeId.asc().nullsLast().op("uuid_ops")),
	index("prod_attr_product_id_idx").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("product_attribute_idx").using("btree", table.productId.asc().nullsLast().op("uuid_ops"), table.attributeId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.attributeId],
			foreignColumns: [attributes.id],
			name: "product_attributes_attribute_id_attributes_id_fk"
		}),
	foreignKey({
			columns: [table.attributeValueId],
			foreignColumns: [attributeValues.id],
			name: "product_attributes_attribute_value_id_attribute_values_id_fk"
		}),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "product_attributes_product_id_products_id_fk"
		}).onDelete("cascade"),
]);

export const paymentMethods = pgTable("payment_methods", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	type: text().notNull(),
	provider: text(),
	isDefault: boolean("is_default").default(false),
	paymentData: jsonb("payment_data"),
	nickname: text(),
	expiryMonth: text("expiry_month"),
	expiryYear: text("expiry_year"),
	last4: text(),
	billingAddressId: uuid("billing_address_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("payment_methods_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.billingAddressId],
			foreignColumns: [userAddresses.id],
			name: "payment_methods_billing_address_id_user_addresses_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "payment_methods_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const payments = pgTable("payments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	orderId: uuid("order_id").notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	method: text().notNull(),
	currency: text().default('USD'),
	status: paymentStatus().default('pending'),
	transactionId: text("transaction_id"),
	paymentMethodId: uuid("payment_method_id"),
	paymentData: jsonb("payment_data"),
	errorMessage: text("error_message"),
	authorizedAt: timestamp("authorized_at", { withTimezone: true, mode: 'string' }),
	capturedAt: timestamp("captured_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("payment_order_id_idx").using("btree", table.orderId.asc().nullsLast().op("uuid_ops")),
	index("payment_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "payments_order_id_orders_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.paymentMethodId],
			foreignColumns: [paymentMethods.id],
			name: "payments_payment_method_id_payment_methods_id_fk"
		}),
]);

export const productQuestions = pgTable("product_questions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	productId: uuid("product_id").notNull(),
	userId: uuid("user_id").notNull(),
	question: text().notNull(),
	isAnonymous: boolean("is_anonymous").default(false),
	status: text().default('pending'),
	voteCount: integer("vote_count").default(0),
	isAnswered: boolean("is_answered").default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("question_product_id_idx").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
	index("question_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "product_questions_product_id_products_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "product_questions_user_id_users_id_fk"
		}),
]);

export const productImages = pgTable("product_images", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	productId: uuid("product_id").notNull(),
	variantId: uuid("variant_id"),
	url: text().notNull(),
	altText: text("alt_text"),
	position: integer().default(0),
	isPrimary: boolean("is_primary").default(false),
	width: integer(),
	height: integer(),
	size: integer(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("prod_img_product_id_idx").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
	index("prod_img_variant_id_idx").using("btree", table.variantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "product_images_product_id_products_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.variantId],
			foreignColumns: [productVariants.id],
			name: "product_images_variant_id_product_variants_id_fk"
		}).onDelete("cascade"),
]);

export const productListings = pgTable("product_listings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	productId: uuid("product_id").notNull(),
	variantId: uuid("variant_id"),
	sellerId: uuid("seller_id").notNull(),
	sku: text().notNull(),
	condition: itemCondition().default('new'),
	conditionDescription: text("condition_description"),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	salePrice: numeric("sale_price", { precision: 10, scale:  2 }),
	quantity: integer().default(0).notNull(),
	fulfillmentType: fulfillmentType("fulfillment_type").default('seller_fulfilled'),
	handlingTime: integer("handling_time").default(1),
	restockDate: date("restock_date"),
	maxOrderQuantity: integer("max_order_quantity"),
	isFeatured: boolean("is_featured").default(false),
	isBuyBox: boolean("is_buy_box").default(false),
	isActive: boolean("is_active").default(true),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("listing_product_id_idx").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
	index("listing_seller_id_idx").using("btree", table.sellerId.asc().nullsLast().op("uuid_ops")),
	index("listing_variant_id_idx").using("btree", table.variantId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("unique_listing_idx").using("btree", table.productId.asc().nullsLast().op("uuid_ops"), table.variantId.asc().nullsLast().op("uuid_ops"), table.sellerId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "product_listings_product_id_products_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.sellerId],
			foreignColumns: [sellers.id],
			name: "product_listings_seller_id_sellers_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.variantId],
			foreignColumns: [productVariants.id],
			name: "product_listings_variant_id_product_variants_id_fk"
		}).onDelete("cascade"),
]);

export const refunds = pgTable("refunds", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	orderId: uuid("order_id").notNull(),
	returnId: uuid("return_id"),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	reason: text().notNull(),
	refundMethod: text("refund_method").notNull(),
	status: text().default('pending'),
	transactionId: text("transaction_id"),
	notes: text(),
	refundedBy: uuid("refunded_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	processedAt: timestamp("processed_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("refund_order_id_idx").using("btree", table.orderId.asc().nullsLast().op("uuid_ops")),
	index("refund_return_id_idx").using("btree", table.returnId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "refunds_order_id_orders_id_fk"
		}),
	foreignKey({
			columns: [table.refundedBy],
			foreignColumns: [users.id],
			name: "refunds_refunded_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.returnId],
			foreignColumns: [returns.id],
			name: "refunds_return_id_returns_id_fk"
		}),
]);

export const productViews = pgTable("product_views", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	productId: uuid("product_id").notNull(),
	userId: uuid("user_id"),
	sessionId: text("session_id"),
	ip: text(),
	userAgent: text("user_agent"),
	referrer: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("product_views_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("product_views_product_id_idx").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
	index("product_views_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "product_views_product_id_products_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "product_views_user_id_users_id_fk"
		}),
]);

export const returnItems = pgTable("return_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	returnId: uuid("return_id").notNull(),
	orderItemId: uuid("order_item_id").notNull(),
	quantity: integer().notNull(),
	reason: returnReason().notNull(),
	condition: text().notNull(),
	details: text(),
	refundAmount: numeric("refund_amount", { precision: 10, scale:  2 }),
	status: text().default('pending'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("return_items_order_item_id_idx").using("btree", table.orderItemId.asc().nullsLast().op("uuid_ops")),
	index("return_items_return_id_idx").using("btree", table.returnId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.orderItemId],
			foreignColumns: [orderItems.id],
			name: "return_items_order_item_id_order_items_id_fk"
		}),
	foreignKey({
			columns: [table.returnId],
			foreignColumns: [returns.id],
			name: "return_items_return_id_returns_id_fk"
		}).onDelete("cascade"),
]);

export const products = pgTable("products", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: text().notNull(),
	slug: text().notNull(),
	description: text(),
	bulletPoints: jsonb("bullet_points"),
	brandId: uuid("brand_id"),
	mainCategoryId: uuid("main_category_id").notNull(),
	listPrice: numeric("list_price", { precision: 10, scale:  2 }),
	basePrice: numeric("base_price", { precision: 10, scale:  2 }).notNull(),
	averageRating: real("average_rating"),
	reviewCount: integer("review_count").default(0),
	totalQuestions: integer("total_questions").default(0),
	isActive: boolean("is_active").default(true),
	isAdult: boolean("is_adult").default(false),
	isPlatformChoice: boolean("is_platform_choice").default(false),
	isBestSeller: boolean("is_best_seller").default(false),
	taxClass: text("tax_class").default('standard'),
	metaTitle: text("meta_title"),
	metaDescription: text("meta_description"),
	metaKeywords: text("meta_keywords"),
	searchKeywords: text("search_keywords"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("product_brand_id_idx").using("btree", table.brandId.asc().nullsLast().op("uuid_ops")),
	index("product_main_category_id_idx").using("btree", table.mainCategoryId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("product_slug_idx").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	index("product_title_idx").using("btree", table.title.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.brandId],
			foreignColumns: [brands.id],
			name: "products_brand_id_brands_id_fk"
		}),
	foreignKey({
			columns: [table.mainCategoryId],
			foreignColumns: [categories.id],
			name: "products_main_category_id_categories_id_fk"
		}),
	unique("products_slug_unique").on(table.slug),
]);

export const reviews = pgTable("reviews", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	productId: uuid("product_id"),
	sellerId: uuid("seller_id"),
	orderId: uuid("order_id"),
	orderItemId: uuid("order_item_id"),
	rating: integer().notNull(),
	title: text(),
	comment: text(),
	images: jsonb(),
	isVerifiedPurchase: boolean("is_verified_purchase").default(false),
	isAnonymous: boolean("is_anonymous").default(false),
	status: text().default('pending'),
	helpfulCount: integer("helpful_count").default(0),
	unhelpfulCount: integer("unhelpful_count").default(0),
	reportCount: integer("report_count").default(0),
	reviewType: text("review_type").default('product'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("review_product_id_idx").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
	index("review_seller_id_idx").using("btree", table.sellerId.asc().nullsLast().op("uuid_ops")),
	index("review_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "reviews_order_id_orders_id_fk"
		}),
	foreignKey({
			columns: [table.orderItemId],
			foreignColumns: [orderItems.id],
			name: "reviews_order_item_id_order_items_id_fk"
		}),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "reviews_product_id_products_id_fk"
		}),
	foreignKey({
			columns: [table.sellerId],
			foreignColumns: [sellers.id],
			name: "reviews_seller_id_sellers_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "reviews_user_id_users_id_fk"
		}),
]);

export const reviewVotes = pgTable("review_votes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	reviewId: uuid("review_id").notNull(),
	userId: uuid("user_id").notNull(),
	isHelpful: boolean("is_helpful").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	uniqueIndex("review_vote_user_idx").using("btree", table.reviewId.asc().nullsLast().op("uuid_ops"), table.userId.asc().nullsLast().op("uuid_ops")),
	index("review_votes_review_id_idx").using("btree", table.reviewId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.reviewId],
			foreignColumns: [reviews.id],
			name: "review_votes_review_id_reviews_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "review_votes_user_id_users_id_fk"
		}),
]);

export const searchLogs = pgTable("search_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	sessionId: text("session_id"),
	query: text().notNull(),
	filters: jsonb(),
	sort: text(),
	resultCount: integer("result_count"),
	clickedProductId: uuid("clicked_product_id"),
	ip: text(),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("search_logs_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("search_logs_query_idx").using("btree", table.query.asc().nullsLast().op("text_ops")),
	index("search_logs_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.clickedProductId],
			foreignColumns: [products.id],
			name: "search_logs_clicked_product_id_products_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "search_logs_user_id_users_id_fk"
		}),
]);

export const sellerDocuments = pgTable("seller_documents", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sellerId: uuid("seller_id").notNull(),
	documentType: text("document_type").notNull(),
	fileUrl: text("file_url").notNull(),
	status: text().default('pending'),
	notes: text(),
	expiryDate: date("expiry_date"),
	uploadedAt: timestamp("uploaded_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	reviewedAt: timestamp("reviewed_at", { withTimezone: true, mode: 'string' }),
	reviewedBy: uuid("reviewed_by"),
}, (table) => [
	index("seller_docs_seller_id_idx").using("btree", table.sellerId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.reviewedBy],
			foreignColumns: [users.id],
			name: "seller_documents_reviewed_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.sellerId],
			foreignColumns: [sellers.id],
			name: "seller_documents_seller_id_sellers_id_fk"
		}).onDelete("cascade"),
]);

export const sellerPayouts = pgTable("seller_payouts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sellerId: uuid("seller_id").notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	fee: numeric({ precision: 10, scale:  2 }).default('0'),
	taxWithheld: numeric("tax_withheld", { precision: 10, scale:  2 }).default('0'),
	netAmount: numeric("net_amount", { precision: 10, scale:  2 }).notNull(),
	currency: text().default('USD'),
	status: text().default('pending'),
	method: text().notNull(),
	reference: text(),
	destinationAccount: jsonb("destination_account"),
	scheduledFor: timestamp("scheduled_for", { withTimezone: true, mode: 'string' }).notNull(),
	processedAt: timestamp("processed_at", { withTimezone: true, mode: 'string' }),
	periodStart: timestamp("period_start", { withTimezone: true, mode: 'string' }).notNull(),
	periodEnd: timestamp("period_end", { withTimezone: true, mode: 'string' }).notNull(),
	orderCount: integer("order_count").notNull(),
	statementUrl: text("statement_url"),
	notes: text(),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("payouts_seller_id_idx").using("btree", table.sellerId.asc().nullsLast().op("uuid_ops")),
	index("payouts_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.sellerId],
			foreignColumns: [sellers.id],
			name: "seller_payouts_seller_id_sellers_id_fk"
		}).onDelete("cascade"),
]);

export const shipmentItems = pgTable("shipment_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	shipmentId: uuid("shipment_id").notNull(),
	orderItemId: uuid("order_item_id").notNull(),
	quantity: integer().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("shipment_items_order_item_id_idx").using("btree", table.orderItemId.asc().nullsLast().op("uuid_ops")),
	index("shipment_items_shipment_id_idx").using("btree", table.shipmentId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.orderItemId],
			foreignColumns: [orderItems.id],
			name: "shipment_items_order_item_id_order_items_id_fk"
		}),
	foreignKey({
			columns: [table.shipmentId],
			foreignColumns: [shipments.id],
			name: "shipment_items_shipment_id_shipments_id_fk"
		}).onDelete("cascade"),
]);

export const returns = pgTable("returns", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	orderId: uuid("order_id").notNull(),
	userId: uuid("user_id").notNull(),
	rmaNumber: text("rma_number"),
	status: text().default('requested'),
	returnReason: returnReason("return_reason").notNull(),
	returnType: text("return_type").default('refund'),
	additionalDetails: text("additional_details"),
	totalAmount: numeric("total_amount", { precision: 10, scale:  2 }).notNull(),
	returnShippingPaid: boolean("return_shipping_paid").default(false),
	returnShippingLabel: text("return_shipping_label"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	receivedAt: timestamp("received_at", { withTimezone: true, mode: 'string' }),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("return_order_id_idx").using("btree", table.orderId.asc().nullsLast().op("uuid_ops")),
	index("return_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("return_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "returns_order_id_orders_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "returns_user_id_users_id_fk"
		}),
	unique("returns_rma_number_unique").on(table.rmaNumber),
]);

export const sellers = pgTable("sellers", {
	id: uuid().primaryKey().notNull(),
	businessName: text("business_name").notNull(),
	displayName: text("display_name").notNull(),
	slug: text().notNull(),
	description: text(),
	logoUrl: text("logo_url"),
	bannerUrl: text("banner_url"),
	taxId: text("tax_id"),
	businessType: text("business_type").notNull(),
	registrationNumber: text("registration_number"),
	legalAddress: jsonb("legal_address").notNull(),
	status: sellerStatus().default('pending'),
	verificationDetails: jsonb("verification_details"),
	returnPolicy: text("return_policy"),
	shippingPolicy: text("shipping_policy"),
	isVerified: boolean("is_verified").default(false),
	approvedCategories: jsonb("approved_categories"),
	supportEmail: text("support_email").notNull(),
	supportPhone: text("support_phone"),
	commissionRate: real("commission_rate").default(15).notNull(),
	feeStructure: jsonb("fee_structure"),
	taxInformation: jsonb("tax_information"),
	paymentDetails: jsonb("payment_details"),
	storeRating: real("store_rating"),
	positiveRatingPercent: real("positive_rating_percent"),
	totalRatings: integer("total_ratings").default(0),
	productCount: integer("product_count").default(0),
	fulfillmentOptions: jsonb("fulfillment_options"),
	payoutSchedule: text("payout_schedule").default('biweekly'),
	lastPayoutDate: timestamp("last_payout_date", { withTimezone: true, mode: 'string' }),
	lastPayoutAmount: numeric("last_payout_amount", { precision: 10, scale:  2 }),
	walletBalance: numeric("wallet_balance", { precision: 10, scale:  2 }).default('0'),
	stripeAccountId: text("stripe_account_id"),
	externalIds: jsonb("external_ids"),
	sellerLevel: text("seller_level").default('standard'),
	joinDate: timestamp("join_date", { withTimezone: true, mode: 'string' }).defaultNow(),
	sellerMetrics: jsonb("seller_metrics"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("seller_business_name_idx").using("btree", table.businessName.asc().nullsLast().op("text_ops")),
	index("seller_display_name_idx").using("btree", table.displayName.asc().nullsLast().op("text_ops")),
	uniqueIndex("seller_slug_idx").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.id],
			foreignColumns: [users.id],
			name: "sellers_id_users_id_fk"
		}).onDelete("cascade"),
	unique("sellers_slug_unique").on(table.slug),
]);

export const sellerPayoutItems = pgTable("seller_payout_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	payoutId: uuid("payout_id").notNull(),
	orderId: uuid("order_id").notNull(),
	orderItemId: uuid("order_item_id").notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	commission: numeric({ precision: 10, scale:  2 }).notNull(),
	refund: numeric({ precision: 10, scale:  2 }).default('0'),
	netAmount: numeric("net_amount", { precision: 10, scale:  2 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("payout_items_order_id_idx").using("btree", table.orderId.asc().nullsLast().op("uuid_ops")),
	index("payout_items_payout_id_idx").using("btree", table.payoutId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "seller_payout_items_order_id_orders_id_fk"
		}),
	foreignKey({
			columns: [table.orderItemId],
			foreignColumns: [orderItems.id],
			name: "seller_payout_items_order_item_id_order_items_id_fk"
		}),
	foreignKey({
			columns: [table.payoutId],
			foreignColumns: [sellerPayouts.id],
			name: "seller_payout_items_payout_id_seller_payouts_id_fk"
		}).onDelete("cascade"),
]);

export const userAddresses = pgTable("user_addresses", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	addressType: addressType("address_type").default('both'),
	fullName: text("full_name").notNull(),
	phone: text().notNull(),
	company: text(),
	addressLine1: text("address_line1").notNull(),
	addressLine2: text("address_line2"),
	city: text().notNull(),
	state: text().notNull(),
	postalCode: text("postal_code").notNull(),
	country: text().notNull(),
	isDefault: boolean("is_default").default(false),
	isBusinessAddress: boolean("is_business_address").default(false),
	deliveryInstructions: text("delivery_instructions"),
	accessCode: text("access_code"),
	latitude: real(),
	longitude: real(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("address_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_addresses_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const attributeValues = pgTable("attribute_values", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	attributeId: uuid("attribute_id").notNull(),
	value: text().notNull(),
	displayValue: text("display_value"),
	colorCode: text("color_code"),
	imageUrl: text("image_url"),
	displayOrder: integer("display_order").default(0),
}, (table) => [
	index("attr_val_attr_id_idx").using("btree", table.attributeId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("attr_val_unique_idx").using("btree", table.attributeId.asc().nullsLast().op("text_ops"), table.value.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.attributeId],
			foreignColumns: [attributes.id],
			name: "attribute_values_attribute_id_attributes_id_fk"
		}).onDelete("cascade"),
]);

export const carts = pgTable("carts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	sessionId: text("session_id"),
	status: text().default('active'),
	currency: text().default('USD'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	lastActivity: timestamp("last_activity", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("cart_session_id_idx").using("btree", table.sessionId.asc().nullsLast().op("text_ops")),
	index("cart_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "carts_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const productVariants = pgTable("product_variants", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	productId: uuid("product_id").notNull(),
	sku: text().notNull(),
	name: text().notNull(),
	attributes: jsonb().notNull(),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	listPrice: numeric("list_price", { precision: 10, scale:  2 }),
	isDefault: boolean("is_default").default(false),
	weight: numeric({ precision: 6, scale:  2 }),
	dimensions: jsonb(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("variant_product_id_idx").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("variant_sku_idx").using("btree", table.sku.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "product_variants_product_id_products_id_fk"
		}).onDelete("cascade"),
	unique("product_variants_sku_unique").on(table.sku),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: text().notNull(),
	hashedPassword: text("hashed_password").notNull(),
	firstName: text("first_name").notNull(),
	lastName: text("last_name").notNull(),
	fullName: text("full_name").notNull(),
	phone: text(),
	role: userRole().default('customer').notNull(),
	avatar: text(),
	isVerified: boolean("is_verified").default(false),
	isSuspended: boolean("is_suspended").default(false),
	lastLoginAt: timestamp("last_login_at", { withTimezone: true, mode: 'string' }),
	timezone: text(),
	preferredLanguage: text("preferred_language").default('en'),
	referralCode: text("referral_code"),
	referredBy: uuid("referred_by"),
	defaultCurrency: text("default_currency").default('EGP'),
	receiveMarketingEmails: boolean("receive_marketing_emails").default(true),
	hasTwoFactorAuth: boolean("has_two_factor_auth").default(false),
	twoFactorMethod: text("two_factor_method"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("user_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("user_name_idx").using("btree", table.fullName.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.referredBy],
			foreignColumns: [table.id],
			name: "users_referred_by_users_id_fk"
		}),
	unique("users_email_unique").on(table.email),
	unique("users_referral_code_unique").on(table.referralCode),
]);

export const couponUsage = pgTable("coupon_usage", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	couponId: uuid("coupon_id").notNull(),
	userId: uuid("user_id").notNull(),
	orderId: uuid("order_id").notNull(),
	discountAmount: numeric("discount_amount", { precision: 10, scale:  2 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("coupon_usage_coupon_id_idx").using("btree", table.couponId.asc().nullsLast().op("uuid_ops")),
	index("coupon_usage_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.couponId],
			foreignColumns: [coupons.id],
			name: "coupon_usage_coupon_id_coupons_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "coupon_usage_order_id_orders_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "coupon_usage_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const shipments = pgTable("shipments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	orderId: uuid("order_id").notNull(),
	sellerId: uuid("seller_id").notNull(),
	trackingNumber: text("tracking_number"),
	carrier: text(),
	serviceLevel: text("service_level"),
	shippingLabelUrl: text("shipping_label_url"),
	packageWeight: numeric("package_weight", { precision: 10, scale:  2 }),
	weightUnit: text("weight_unit").default('kg'),
	dimensions: jsonb(),
	cost: numeric({ precision: 10, scale:  2 }).default('0'),
	status: text().default('pending'),
	estimatedDeliveryDate: date("estimated_delivery_date"),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	shippedAt: timestamp("shipped_at", { withTimezone: true, mode: 'string' }),
	deliveredAt: timestamp("delivered_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("shipment_order_id_idx").using("btree", table.orderId.asc().nullsLast().op("uuid_ops")),
	index("shipment_seller_id_idx").using("btree", table.sellerId.asc().nullsLast().op("uuid_ops")),
	index("shipment_tracking_number_idx").using("btree", table.trackingNumber.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "shipments_order_id_orders_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.sellerId],
			foreignColumns: [sellers.id],
			name: "shipments_seller_id_sellers_id_fk"
		}),
]);

export const reviewComments = pgTable("review_comments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	reviewId: uuid("review_id").notNull(),
	userId: uuid("user_id").notNull(),
	sellerId: uuid("seller_id"),
	comment: text().notNull(),
	isAnonymous: boolean("is_anonymous").default(false),
	status: text().default('pending'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("review_comments_review_id_idx").using("btree", table.reviewId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.reviewId],
			foreignColumns: [reviews.id],
			name: "review_comments_review_id_reviews_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.sellerId],
			foreignColumns: [sellers.id],
			name: "review_comments_seller_id_sellers_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "review_comments_user_id_users_id_fk"
		}),
]);

export const userDevices = pgTable("user_devices", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	deviceId: text("device_id").notNull(),
	deviceName: text("device_name"),
	deviceType: text("device_type"),
	lastIp: text("last_ip"),
	lastUserAgent: text("last_user_agent"),
	lastLocation: jsonb("last_location"),
	isTrusted: boolean("is_trusted").default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	lastUsedAt: timestamp("last_used_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("user_devices_device_id_idx").using("btree", table.deviceId.asc().nullsLast().op("text_ops")),
	index("user_devices_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_devices_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const wishlists = pgTable("wishlists", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	name: text().default('My Wishlist').notNull(),
	description: text(),
	isDefault: boolean("is_default").default(false),
	isPublic: boolean("is_public").default(false),
	shareUrl: text("share_url"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("wishlist_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "wishlists_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const wishlistItems = pgTable("wishlist_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	wishlistId: uuid("wishlist_id").notNull(),
	productId: uuid("product_id").notNull(),
	variantId: uuid("variant_id"),
	addedAt: timestamp("added_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	notes: text(),
	quantity: integer().default(1),
	priority: integer().default(0),
}, (table) => [
	uniqueIndex("unique_wishlist_item_idx").using("btree", table.wishlistId.asc().nullsLast().op("uuid_ops"), table.productId.asc().nullsLast().op("uuid_ops"), table.variantId.asc().nullsLast().op("uuid_ops")),
	index("wishlist_items_product_id_idx").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
	index("wishlist_items_wishlist_id_idx").using("btree", table.wishlistId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "wishlist_items_product_id_products_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.variantId],
			foreignColumns: [productVariants.id],
			name: "wishlist_items_variant_id_product_variants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.wishlistId],
			foreignColumns: [wishlists.id],
			name: "wishlist_items_wishlist_id_wishlists_id_fk"
		}).onDelete("cascade"),
]);

export const productCategories = pgTable("product_categories", {
	productId: uuid("product_id").notNull(),
	categoryId: uuid("category_id").notNull(),
	isPrimary: boolean("is_primary").default(false),
}, (table) => [
	index("prod_cat_category_id_idx").using("btree", table.categoryId.asc().nullsLast().op("uuid_ops")),
	index("prod_cat_product_id_idx").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "product_categories_category_id_categories_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "product_categories_product_id_products_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.productId, table.categoryId], name: "product_categories_product_id_category_id_pk"}),
]);
