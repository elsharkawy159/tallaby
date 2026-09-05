import { pgTable, index, foreignKey, uuid, text, integer, jsonb, timestamp, numeric, varchar, smallint, unique, boolean, pgPolicy, uniqueIndex, real, bigint, date, check, pgView, pgEnum, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const addressType = pgEnum("address_type", ['shipping', 'billing', 'both'])
export const couponType = pgEnum("coupon_type", ['percentage', 'fixed_amount', 'buy_x_get_y', 'free_shipping'])
export const dealType = pgEnum("deal_type", ['daily_deal', 'lightning_deal', 'deal_of_the_day', 'best_deal', 'clearance'])
export const fulfillmentType = pgEnum("fulfillment_type", ['seller_fulfilled', 'platform_fulfilled', 'fba', 'digital'])
export const itemCondition = pgEnum("item_condition", ['new', 'renewed', 'refurbished', 'used_like_new', 'used_very_good', 'used_good', 'used_acceptable'])
export const notificationType = pgEnum("notification_type", ['order_update', 'shipment_update', 'price_drop', 'review_response', 'marketing'])
export const orderStatus = pgEnum("order_status", ['pending', 'payment_processing', 'confirmed', 'shipping_soon', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'refund_requested', 'refunded', 'returned'])
export const orderSource = pgEnum("order_source", ['website', 'external'])
export const paymentStatus = pgEnum("payment_status", ['pending', 'authorized', 'paid', 'failed', 'refunded', 'partially_refunded', 'collected'])
export const promotionType = pgEnum("promotion_type", ['percentage', 'fixed_amount', 'buy_x_get_y', 'free_shipping'])
export const returnReason = pgEnum("return_reason", ['defective', 'damaged', 'wrong_item', 'not_as_described', 'better_price', 'no_longer_needed', 'unauthorized_purchase', 'other'])
export const sellerStatus = pgEnum("seller_status", ['pending', 'approved', 'suspended', 'restricted'])
export const shippingSpeed = pgEnum("shipping_speed", ['standard', 'expedited', 'priority', 'one_day', 'same_day'])
export const userRole = pgEnum("user_role", ['customer', 'seller', 'admin', 'support', 'driver', 'marketing'])
export const productType = pgEnum("product_type", ['physical', 'digital'])
export const productStatus = pgEnum("product_status", ['draft', 'pending', 'active', 'rejected'])
export const transactionType = pgEnum("transaction_type", ['sale', 'refund', 'withdrawal', 'fee'])
export const digitalProductType = pgEnum("digital_product_type", ['digital_download', 'ebook', 'template', 'design_asset', 'audio', 'video', 'course', 'ai_prompt', 'software', 'font', 'printable', 'game_asset', 'gift_card', 'license_key', 'external_access', 'bundle'])
export const digitalDeliveryMethod = pgEnum("digital_delivery_method", ['automatic', 'manual'])
export const digitalFulfillmentStatus = pgEnum("digital_fulfillment_status", ['pending', 'delivered', 'downloaded', 'expired', 'revoked', 'failed'])
export const digitalAccessAction = pgEnum("digital_access_action", ['grant', 'download', 'view', 'resend', 'revoke', 'reinstate'])
export const licenseKeyStatus = pgEnum("license_key_status", ['available', 'reserved', 'assigned', 'revoked'])
export const shipmentStatus = pgEnum("shipment_status", ['pending', 'assigned', 'out_for_delivery', 'delivered', 'failed', 'returned', 'cancelled'])

/**
 * User-wallet enums (migration 0025). Distinct from the seller-only
 * `transaction_type` above, which belongs to `wallet_transactions`/`seller_wallet`
 * and is deliberately left untouched.
 */
export const walletStatus = pgEnum("wallet_status", ['active', 'frozen', 'closed'])
export const walletTransactionType = pgEnum("wallet_transaction_type", ['top_up', 'payout', 'commission', 'order_payment', 'refund', 'adjustment', 'bonus', 'commission_reversal'])
export const walletTransactionStatus = pgEnum("wallet_transaction_status", ['pending', 'completed', 'failed', 'reversed'])
export const walletTopUpStatus = pgEnum("wallet_top_up_status", ['pending', 'processing', 'succeeded', 'failed', 'cancelled'])
export const walletPayoutStatus = pgEnum("wallet_payout_status", ['pending', 'approved', 'processing', 'completed', 'rejected', 'cancelled', 'failed'])

/**
 * Affiliate program (migration 0029). `commission` on `walletTransactionType`
 * above already covers the earn side (reserved for exactly this by 0025's
 * comment); `commission_reversal` is the one additive value this phase adds,
 * for the debit side of a reversed/returned order.
 */
export const affiliateStatus = pgEnum("affiliate_status", ['active', 'inactive'])
export const affiliateCommissionType = pgEnum("affiliate_commission_type", ['commission', 'reversal'])
export const affiliateCommissionStatus = pgEnum("affiliate_commission_status", ['pending', 'earned', 'reversed', 'cancelled'])


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

export const payments = pgTable("payments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	orderId: uuid("order_id").notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	method: text().notNull(),
	currency: text().default('EGP'),
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

export const carts = pgTable("carts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	sessionId: text("session_id"),
	status: text().default('active'),
	currency: text().default('EGP'),
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

export const categories = pgTable("categories", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar(),
	slug: varchar(),
	level: smallint(),
	parentId: uuid("parent_id"),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	imageUrl: text("image_url"),
	nameAr: text("name_ar"),
	/** Denormalized count of storefront-visible (status = active) products. */
	productCount: integer("product_count").default(0).notNull(),
}, (table) => [
	// This table had no indexes at all.
	index("category_slug_idx").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	index("category_parent_id_idx").using("btree", table.parentId.asc().nullsLast().op("uuid_ops")),
	index("category_product_count_idx").using("btree", table.productCount.desc().nullsLast().op("int4_ops")).where(sql`product_count > 0`),
	foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "categories_parent_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
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

export const contacts = pgTable("contacts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	fullName: text("full_name").notNull(),
	email: text().notNull(),
	phone: text(),
	subject: text().notNull(),
	message: text().notNull(),
	requestCall: boolean("request_call").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	isReplied: boolean("is_replied").default(false).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "contacts_user_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	pgPolicy("Enable insert access for all users", { as: "permissive", for: "insert", to: ["public"], withCheck: sql`true`  }),
	pgPolicy("Enable read access for authenticated users", { as: "permissive", for: "select", to: ["authenticated"] }),
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

export const productVariants = pgTable("product_variants", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	productId: uuid("product_id"),
	title: varchar(),
	price: numeric(),
	stock: integer().default(0),
	sku: varchar(),
	imageUrl: varchar("image_url"),
	images: jsonb(),
	isDefault: boolean("is_default").default(false),
	localized: jsonb(),
	position: integer().default(1),
	option1: varchar(),
	option2: varchar(),
	option3: varchar(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	barCode: varchar("bar_code"),
	locale: text().default('en'),
	/** Vendor-set discount expiry for this variant's own price; null = no expiry (toggle off in the dashboard). */
	discountEndsAt: timestamp("discount_ends_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	// No index existed on this FK — every variant lookup by product was a seq scan.
	index("product_variants_product_id_idx").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "product_variants_product_id_fkey"
		}).onDelete("cascade"),
	check("product_variants_stock_non_negative", sql`stock >= 0`),
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
	commissionRate: real("commission_rate").default(sql`'10'`).notNull(),
	isCommissionExempt: boolean("is_commission_exempt").default(false).notNull(),
	freeDelivery: boolean("free_delivery").default(false).notNull(),
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
	stripeOnboardingComplete: boolean("stripe_onboarding_complete").default(false),
	payoutEnabled: boolean("payout_enabled").default(false),
	identityVerified: boolean("identity_verified").default(false),
	identityDocsUrl: text("identity_docs_url"),
	onboardingStep: integer("onboarding_step").default(0),
	onboardingComplete: boolean("onboarding_complete").default(false),
	storeDescription: text("store_description"),
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
	index("seller_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.id],
			foreignColumns: [users.id],
			name: "sellers_id_users_id_fk"
		}).onDelete("cascade"),
	unique("sellers_slug_unique").on(table.slug),
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

/**
 * One row per bulk "Assign" / "Assign all" action from the shipping app's
 * Confirmed tab. `seq` is a human-friendly display id (BATCH-00007);
 * `exportFormat` is null for providers with no sheet handoff (e.g. Tallaby),
 * so the batch detail page can hide the download button without a query.
 */
export const shipmentBatches = pgTable("shipment_batches", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	seq: integer().generatedAlwaysAsIdentity(),
	providerId: uuid("provider_id").notNull(),
	createdBy: uuid("created_by"),
	orderCount: integer("order_count").notNull(),
	exportFormat: text("export_format"),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("shipment_batches_created_at_idx").using("btree", table.createdAt.desc()),
	index("shipment_batches_provider_id_idx").using("btree", table.providerId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.providerId],
			foreignColumns: [shippingProviders.id],
			name: "shipment_batches_provider_id_shipping_providers_id_fk"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "shipment_batches_created_by_users_id_fk"
		}),
]);

/** One row per order in a batch. `riderId` is set only for Tallaby batches. */
export const shipmentBatchItems = pgTable("shipment_batch_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	batchId: uuid("batch_id").notNull(),
	orderId: uuid("order_id").notNull(),
	riderId: uuid("rider_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("shipment_batch_items_order_id_idx").using("btree", table.orderId.asc().nullsLast().op("uuid_ops")),
	unique("shipment_batch_items_batch_id_order_id_unique").on(table.batchId, table.orderId),
	foreignKey({
			columns: [table.batchId],
			foreignColumns: [shipmentBatches.id],
			name: "shipment_batch_items_batch_id_shipment_batches_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "shipment_batch_items_order_id_orders_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.riderId],
			foreignColumns: [users.id],
			name: "shipment_batch_items_rider_id_users_id_fk"
		}),
]);

/**
 * The Auto Confirm / Auto Assign toggles on the shipping app's Orders page.
 * Operation-wide, not per-admin — "auto assign is on" is a property of the
 * dispatch operation, so the boolean primary key with its CHECK makes a second
 * row impossible and no caller has to pick which settings row is authoritative.
 *
 * `autoAssignProviderId` null means our own fleet (the `tallaby` provider,
 * resolved by code at run time); the column exists so auto-assign can later be
 * pointed at a specific external provider without another migration.
 */
export const shippingAutomation = pgTable("shipping_automation", {
	id: boolean().default(true).primaryKey().notNull(),
	autoConfirm: boolean("auto_confirm").default(false).notNull(),
	autoAssign: boolean("auto_assign").default(false).notNull(),
	autoAssignProviderId: uuid("auto_assign_provider_id"),
	updatedBy: uuid("updated_by"),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.autoAssignProviderId],
			foreignColumns: [shippingProviders.id],
			name: "shipping_automation_auto_assign_provider_id_shipping_providers_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [users.id],
			name: "shipping_automation_updated_by_users_id_fk"
		}).onDelete("set null"),
	check("shipping_automation_singleton", sql`id`),
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
	locale: text(),
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
			name: "product_questions_user_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const shippingAddresses = pgTable("shipping_addresses", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "shipping_addresses_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	userId: uuid("user_id").notNull(),
	firstName: text("first_name").notNull(),
	lastName: text("last_name").notNull(),
	addressLine1: text("address_line1").notNull(),
	addressLine2: text("address_line2"),
	city: text().notNull(),
	state: text().notNull(),
	postalCode: text("postal_code").notNull(),
	country: text().default('USA').notNull(),
	phone: text(),
	isDefault: boolean("is_default").default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_shipping_addresses_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "fk_user"
		}).onDelete("cascade"),
	pgPolicy("Users can delete their own shipping addresses", { as: "permissive", for: "delete", to: ["authenticated"] }),
	pgPolicy("Users can insert their own shipping addresses", { as: "permissive", for: "insert", to: ["authenticated"] }),
	pgPolicy("Users can update their own shipping addresses", { as: "permissive", for: "update", to: ["authenticated"] }),
	pgPolicy("Users can view their own shipping addresses", { as: "permissive", for: "select", to: ["authenticated"] }),
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

export const cartItems = pgTable("cart_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	cartId: uuid("cart_id").notNull(),
	productId: uuid("product_id").notNull(),
	sellerId: uuid("seller_id").notNull(),
	quantity: integer().default(1).notNull(),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	savedForLater: boolean("saved_for_later").default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	variant: jsonb(),
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
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "cart_items_product_id_products_id_fk"
		}),
	foreignKey({
			columns: [table.sellerId],
			foreignColumns: [sellers.id],
			name: "cart_items_seller_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

/**
 * Shipping providers available for last-mile delivery (Bosta, ShipBlu,
 * Egypt Post, ...). Deliberately minimal: real carrier API integrations live
 * behind the adapter layer in apps/shipping, keyed off `code`.
 */
export const shippingProviders = pgTable("shipping_providers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	code: text().notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	logoUrl: text("logo_url"),
	contactName: text("contact_name"),
	contactPhone: text("contact_phone"),
	contactEmail: text("contact_email"),
	website: text(),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("shipping_providers_active_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	unique("shipping_providers_code_unique").on(table.code),
]);

/**
 * One shipping record per order. `sellerId` is nullable because a
 * platform-fulfilled last-mile delivery is not tied to a single seller — it
 * carries the whole order to the customer's door. The unique constraint on
 * `orderId` is what lets the shipping app upsert idempotently
 * (insert ... on conflict (order_id) do update).
 */
export const shipments = pgTable("shipments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	orderId: uuid("order_id").notNull(),
	sellerId: uuid("seller_id"),
	providerId: uuid("provider_id"),
	riderId: uuid("rider_id"),
	trackingNumber: text("tracking_number"),
	carrier: text(),
	serviceLevel: text("service_level"),
	shippingLabelUrl: text("shipping_label_url"),
	packageWeight: numeric("package_weight", { precision: 10, scale:  2 }),
	weightUnit: text("weight_unit").default('kg'),
	dimensions: jsonb(),
	cost: numeric({ precision: 10, scale:  2 }).default('0'),
	status: shipmentStatus().default('pending').notNull(),
	failureReason: text("failure_reason"),
	estimatedDeliveryDate: date("estimated_delivery_date"),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	assignedAt: timestamp("assigned_at", { withTimezone: true, mode: 'string' }),
	shippedAt: timestamp("shipped_at", { withTimezone: true, mode: 'string' }),
	deliveredAt: timestamp("delivered_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("shipment_order_id_idx").using("btree", table.orderId.asc().nullsLast().op("uuid_ops")),
	index("shipment_seller_id_idx").using("btree", table.sellerId.asc().nullsLast().op("uuid_ops")),
	index("shipment_tracking_number_idx").using("btree", table.trackingNumber.asc().nullsLast().op("text_ops")),
	index("shipment_rider_id_idx").using("btree", table.riderId.asc().nullsLast().op("uuid_ops")),
	index("shipment_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("shipment_provider_id_idx").using("btree", table.providerId.asc().nullsLast().op("uuid_ops")),
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
	foreignKey({
			columns: [table.providerId],
			foreignColumns: [shippingProviders.id],
			name: "shipments_provider_id_shipping_providers_id_fk"
		}),
	foreignKey({
			columns: [table.riderId],
			foreignColumns: [users.id],
			name: "shipments_rider_id_users_id_fk"
		}),
	unique("shipments_order_id_unique").on(table.orderId),
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
	// Product detail page filters reviews by (productId, status='approved') — status was unindexed.
	index("review_product_status_idx").using("btree", table.productId.asc().nullsLast().op("uuid_ops"), table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "reviews_order_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
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
			name: "reviews_user_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
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
			name: "review_votes_user_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
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

export const sellerPayouts = pgTable("seller_payouts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sellerId: uuid("seller_id").notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	fee: numeric({ precision: 10, scale:  2 }).default('0'),
	taxWithheld: numeric("tax_withheld", { precision: 10, scale:  2 }).default('0'),
	netAmount: numeric("net_amount", { precision: 10, scale:  2 }).notNull(),
	currency: text().default('EGP'),
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
	country: text().default('\'Egypt').notNull(),
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
			name: "wishlist_items_variant_id_fkey"
		}),
	foreignKey({
			columns: [table.wishlistId],
			foreignColumns: [wishlists.id],
			name: "wishlist_items_wishlist_id_wishlists_id_fk"
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

export const orderItems = pgTable("order_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	orderId: uuid("order_id").notNull(),
	productId: uuid("product_id").notNull(),
	variantId: uuid("variant_id"),
	sellerId: uuid("seller_id").notNull(),
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
	currency: text().default('EGP'),
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
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("order_items_order_id_idx").using("btree", table.orderId.asc().nullsLast().op("uuid_ops")),
	index("order_items_product_id_idx").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
	index("order_items_seller_id_idx").using("btree", table.sellerId.asc().nullsLast().op("uuid_ops")),
	index("order_items_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "order_items_order_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "order_items_product_id_products_id_fk"
		}),
	foreignKey({
			columns: [table.sellerId],
			foreignColumns: [sellers.id],
			name: "order_items_seller_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.variantId],
			foreignColumns: [productVariants.id],
			name: "order_items_variant_id_fkey"
		}).onDelete("cascade"),
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
	locale: text().default('en'),
}, (table) => [
	index("brand_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
	uniqueIndex("brand_slug_idx").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	unique("brands_slug_unique").on(table.slug),
]);

export const users = pgTable("users", {
	id: uuid().primaryKey().notNull(),
	email: text(),
	fullName: text("full_name"),
	phone: text(),
	role: userRole().default('customer'),
	avatarUrl: text("avatar_url"),
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
	isGuest: boolean("is_guest").default(false).notNull(),
	/** Rider on/off-duty toggle. Distinct from `isSuspended` (admin-controlled access). */
	isAvailable: boolean("is_available").default(true),
}, (table) => [
	index("user_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("user_name_idx").using("btree", table.fullName.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.referredBy],
			foreignColumns: [table.id],
			name: "users_referred_by_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	unique("users_email_unique").on(table.email),
	unique("users_referral_code_unique").on(table.referralCode),
	pgPolicy("Public users are viewable by everyone.", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	pgPolicy("Users can insert their own profile.", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Users can update own profile.", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Users can read their own profile", { as: "permissive", for: "select", to: ["authenticated"] }),
	pgPolicy("Enable read access for all users", { as: "permissive", for: "select", to: ["public"] }),
]);

export const products = pgTable("products", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	brandId: uuid("brand_id"),
	categoryId: uuid("category_id").notNull(),
	averageRating: real("average_rating"),
	reviewCount: integer("review_count").default(0),
	totalQuestions: integer("total_questions").default(0),
	isPlatformChoice: boolean("is_platform_choice").default(false),
	isMostSelling: boolean("is_most_selling").default(false),
	/** Only status = 'active' products are visible on the storefront. */
	status: productStatus("status").default('pending').notNull(),
	taxClass: text("tax_class").default('standard'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	images: jsonb(),
	sellerId: uuid("seller_id").notNull(),
	sku: text(),
	condition: itemCondition().default('new'),
	conditionDescription: text("condition_description"),
	quantity: numeric().notNull(),
	fulfillmentType: fulfillmentType("fulfillment_type").default('seller_fulfilled'),
	handlingTime: numeric("handling_time").default('1'),
	maxOrderQuantity: integer("max_order_quantity"),
	isFeatured: boolean("is_featured").default(false),
	isTrending: boolean("is_trending").default(false).notNull(),
	isSeasonal: boolean("is_seasonal").default(false).notNull(),
	freeDelivery: boolean("free_delivery").default(false).notNull(),
	dimensions: jsonb(),
	price: jsonb(),
	productType: productType("product_type").default('physical'),
}, (table) => [
	index("product_brand_id_idx").using("btree", table.brandId.asc().nullsLast().op("uuid_ops")),
	index("product_main_category_id_idx").using("btree", table.categoryId.asc().nullsLast().op("uuid_ops")),
	index("product_seller_id_idx").using("btree", table.sellerId.asc().nullsLast().op("uuid_ops")),
	index("product_sku_idx").using("btree", table.sku.asc().nullsLast().op("text_ops")),
	uniqueIndex("unique_product_seller_sku_idx").using("btree", table.sellerId.asc().nullsLast().op("text_ops"), table.sku.asc().nullsLast().op("text_ops")),
	index("product_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	// "newest" sort.
	index("product_created_at_idx").using("btree", table.createdAt.desc()),
	// "rating" sort.
	index("product_rating_idx").using("btree", table.averageRating.desc().nullsLast()),
	// price filter (min/maxPrice) and "price_asc"/"price_desc" sort read price->>'final'.
	index("product_price_final_idx").using("btree", sql`(((price ->> 'final'::text))::numeric)`),
	foreignKey({
			columns: [table.brandId],
			foreignColumns: [brands.id],
			name: "products_brand_id_brands_id_fk"
		}),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "products_category_id_fkey"
		}),
	foreignKey({
			columns: [table.sellerId],
			foreignColumns: [sellers.id],
			name: "products_seller_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Allow authenticated insert access", { as: "permissive", for: "insert", to: ["authenticated"] }),
	pgPolicy("Public full access", { as: "permissive", for: "all", to: ["public"] }),
	pgPolicy("Enable read access for all users", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("Enable insert for authenticated users only", { as: "permissive", for: "insert", to: ["authenticated"] }),
	// Last line of defence behind the atomic decrementStock() WHERE-guard (packages/db/src/inventory).
	check("products_quantity_non_negative", sql`quantity >= 0`),
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
	locale: text().default('en'),
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
			name: "product_answers_seller_id_fkey"
		}).onUpdate("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "product_answers_user_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
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
	currency: text().default('EGP'),
	status: orderStatus().default('pending'),
	paymentStatus: paymentStatus("payment_status").default('pending'),
	paymentMethod: text("payment_method").default('cash').notNull(),
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
	orderSource: orderSource("order_source").default('website').notNull(),
	metadata: jsonb(),
	hasDigitalItems: boolean("has_digital_items").default(false),
	isDigitalOnly: boolean("is_digital_only").default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	processedAt: timestamp("processed_at", { withTimezone: true, mode: 'string' }),
	paidAt: timestamp("paid_at", { withTimezone: true, mode: 'string' }),
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
			name: "orders_user_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	unique("orders_order_number_unique").on(table.orderNumber),
	pgPolicy("Users can insert their own rows", { as: "permissive", for: "insert", to: ["authenticated"] }),
	pgPolicy("Users can view their own rows", { as: "permissive", for: "select", to: ["authenticated"] }),
]);

export const userRewards = pgTable("user_rewards", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	action: text().notNull(),
	points: integer().notNull(),
	referenceId: uuid("reference_id"),
	referenceTable: text("reference_table"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("uniq_referral_reward").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.action.asc().nullsLast().op("text_ops"), table.referenceId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_rewards_user_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const rewardActions = pgTable("reward_actions", {
	id: text().default('').primaryKey().notNull(),
	description: text().notNull(),
	points: integer().notNull(),
	isActive: boolean("is_active").default(true),
	action: text(),
});

export const productTranslations = pgTable("product_translations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	productId: uuid("product_id").notNull(),
	locale: text().notNull(),
	title: text().notNull(),
	description: text(),
	content: text(),
	bulletPoints: jsonb("bullet_points").default([]).notNull(),
	slug: text(),
	metaTitle: text("meta_title"),
	metaDescription: text("meta_description"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("product_translations_locale_idx").using("btree", table.locale.asc().nullsLast().op("text_ops")),
	index("product_translations_product_id_idx").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
	// getProductIdBySlug() is the hottest storefront lookup and had no index on slug at all.
	// Non-unique: existing duplicate/NULL slugs would fail a unique index migration; uniqueness stays app-enforced (see docs).
	index("product_translations_locale_slug_idx").using("btree", table.locale.asc().nullsLast().op("text_ops"), table.slug.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "product_translations_product_id_fkey"
		}).onDelete("cascade"),
	unique("product_translations_product_id_locale_key").on(table.productId, table.locale),
	check("product_translations_locale_check", sql`locale = ANY (ARRAY['en'::text, 'ar'::text])`),
]);
export const userPoints = pgView("user_points", {	userId: uuid("user_id"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	totalPoints: bigint("total_points", { mode: "number" }),
}).as(sql`SELECT user_id, sum(points) AS total_points FROM user_rewards GROUP BY user_id`);

export const digitalProducts = pgTable("digital_products", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	productId: uuid("product_id").notNull(),
	sellerId: uuid("seller_id").notNull(),
	digitalType: digitalProductType("digital_type").default('digital_download').notNull(),
	deliveryMethod: digitalDeliveryMethod("delivery_method").default('automatic').notNull(),
	fileUrl: text("file_url"),
	fileName: text("file_name"),
	fileSize: integer("file_size"),
	fileType: text("file_type"),
	externalUrl: text("external_url"),
	accessInstructions: text("access_instructions"),
	courseContent: jsonb("course_content"),
	requiresLicenseKey: boolean("requires_license_key").default(false),
	downloadLimit: integer("download_limit").default(5),
	downloadExpiryHours: integer("download_expiry_hours").default(72),
	price: numeric({ precision: 10, scale: 2 }).notNull(),
	currency: text().default('EGP'),
	status: text().default('draft'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("digital_products_product_id_idx").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
	index("digital_products_seller_id_idx").using("btree", table.sellerId.asc().nullsLast().op("uuid_ops")),
	index("digital_products_digital_type_idx").using("btree", table.digitalType.asc().nullsLast().op("enum_ops")),
	foreignKey({
		columns: [table.productId],
		foreignColumns: [products.id],
		name: "digital_products_product_id_products_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.sellerId],
		foreignColumns: [sellers.id],
		name: "digital_products_seller_id_sellers_id_fk"
	}).onDelete("cascade"),
]);

export const digitalFiles = pgTable("digital_files", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	digitalProductId: uuid("digital_product_id").notNull(),
	fileName: text("file_name").notNull(),
	fileUrl: text("file_url").notNull(),
	fileSize: integer("file_size").notNull(),
	fileType: text("file_type").notNull(),
	sortOrder: integer("sort_order").default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("digital_files_digital_product_id_idx").using("btree", table.digitalProductId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
		columns: [table.digitalProductId],
		foreignColumns: [digitalProducts.id],
		name: "digital_files_digital_product_id_digital_products_id_fk"
	}).onDelete("cascade"),
]);

export const licenseKeys = pgTable("license_keys", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	digitalProductId: uuid("digital_product_id").notNull(),
	code: text().notNull(),
	status: licenseKeyStatus().default('available').notNull(),
	batchLabel: text("batch_label"),
	assignedToOrderId: uuid("assigned_to_order_id"),
	assignedAt: timestamp("assigned_at", { withTimezone: true, mode: 'string' }),
	revokedAt: timestamp("revoked_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("license_keys_digital_product_id_idx").using("btree", table.digitalProductId.asc().nullsLast().op("uuid_ops")),
	index("license_keys_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	uniqueIndex("license_keys_product_code_idx").using("btree", table.digitalProductId.asc().nullsLast().op("uuid_ops"), table.code.asc().nullsLast().op("text_ops")),
	foreignKey({
		columns: [table.digitalProductId],
		foreignColumns: [digitalProducts.id],
		name: "license_keys_digital_product_id_digital_products_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.assignedToOrderId],
		foreignColumns: [orders.id],
		name: "license_keys_assigned_to_order_id_orders_id_fk"
	}).onDelete("set null"),
]);

export const digitalBundleItems = pgTable("digital_bundle_items", {
	bundleProductId: uuid("bundle_product_id").notNull(),
	childProductId: uuid("child_product_id").notNull(),
	sortOrder: integer("sort_order").default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	primaryKey({ columns: [table.bundleProductId, table.childProductId] }),
	foreignKey({
		columns: [table.bundleProductId],
		foreignColumns: [digitalProducts.id],
		name: "digital_bundle_items_bundle_product_id_digital_products_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.childProductId],
		foreignColumns: [digitalProducts.id],
		name: "digital_bundle_items_child_product_id_digital_products_id_fk"
	}).onDelete("cascade"),
]);

export const digitalOrders = pgTable("digital_orders", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	orderId: uuid("order_id").notNull(),
	orderItemId: uuid("order_item_id"),
	digitalProductId: uuid("digital_product_id").notNull(),
	buyerId: uuid("buyer_id").notNull(),
	licenseKeyId: uuid("license_key_id"),
	fulfillmentStatus: digitalFulfillmentStatus("fulfillment_status").default('pending').notNull(),
	downloadToken: text("download_token").notNull(),
	downloadCount: integer("download_count").default(0),
	maxDownloads: integer("max_downloads").default(5),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }),
	downloadedAt: timestamp("downloaded_at", { withTimezone: true, mode: 'string' }),
	lastAccessedAt: timestamp("last_accessed_at", { withTimezone: true, mode: 'string' }),
	revokedAt: timestamp("revoked_at", { withTimezone: true, mode: 'string' }),
	revokedReason: text("revoked_reason"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	uniqueIndex("digital_orders_download_token_idx").using("btree", table.downloadToken.asc().nullsLast().op("text_ops")),
	index("digital_orders_order_id_idx").using("btree", table.orderId.asc().nullsLast().op("uuid_ops")),
	index("digital_orders_buyer_id_idx").using("btree", table.buyerId.asc().nullsLast().op("uuid_ops")),
	index("digital_orders_fulfillment_status_idx").using("btree", table.fulfillmentStatus.asc().nullsLast().op("enum_ops")),
	foreignKey({
		columns: [table.orderId],
		foreignColumns: [orders.id],
		name: "digital_orders_order_id_orders_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.orderItemId],
		foreignColumns: [orderItems.id],
		name: "digital_orders_order_item_id_order_items_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.digitalProductId],
		foreignColumns: [digitalProducts.id],
		name: "digital_orders_digital_product_id_digital_products_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.buyerId],
		foreignColumns: [users.id],
		name: "digital_orders_buyer_id_users_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.licenseKeyId],
		foreignColumns: [licenseKeys.id],
		name: "digital_orders_license_key_id_license_keys_id_fk"
	}).onDelete("set null"),
]);

export const digitalAccessLogs = pgTable("digital_access_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	digitalOrderId: uuid("digital_order_id").notNull(),
	action: digitalAccessAction().notNull(),
	actorUserId: uuid("actor_user_id"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("digital_access_logs_digital_order_id_idx").using("btree", table.digitalOrderId.asc().nullsLast().op("uuid_ops")),
	index("digital_access_logs_action_idx").using("btree", table.action.asc().nullsLast().op("enum_ops")),
	foreignKey({
		columns: [table.digitalOrderId],
		foreignColumns: [digitalOrders.id],
		name: "digital_access_logs_digital_order_id_digital_orders_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.actorUserId],
		foreignColumns: [users.id],
		name: "digital_access_logs_actor_user_id_users_id_fk"
	}).onDelete("set null"),
]);

export const sellerCategories = pgTable("seller_categories", {
	sellerId: uuid("seller_id").notNull(),
	categoryId: uuid("category_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	primaryKey({ columns: [table.sellerId, table.categoryId] }),
	foreignKey({
		columns: [table.sellerId],
		foreignColumns: [sellers.id],
		name: "seller_categories_seller_id_sellers_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.categoryId],
		foreignColumns: [categories.id],
		name: "seller_categories_category_id_categories_id_fk"
	}).onDelete("cascade"),
]);

export const sellerWallet = pgTable("seller_wallet", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sellerId: uuid("seller_id").notNull(),
	balance: numeric({ precision: 10, scale: 2 }).default('0').notNull(),
	currency: text().default('EGP').notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	uniqueIndex("seller_wallet_seller_id_idx").using("btree", table.sellerId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
		columns: [table.sellerId],
		foreignColumns: [sellers.id],
		name: "seller_wallet_seller_id_sellers_id_fk"
	}).onDelete("cascade"),
]);

export const walletTransactions = pgTable("wallet_transactions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sellerId: uuid("seller_id").notNull(),
	type: transactionType().notNull(),
	amount: numeric({ precision: 10, scale: 2 }).notNull(),
	currency: text().default('EGP'),
	stripeTransferId: text("stripe_transfer_id"),
	orderId: uuid("order_id"),
	description: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("wallet_transactions_seller_id_idx").using("btree", table.sellerId.asc().nullsLast().op("uuid_ops")),
	index("wallet_transactions_type_idx").using("btree", table.type.asc().nullsLast().op("enum_ops")),
	foreignKey({
		columns: [table.sellerId],
		foreignColumns: [sellers.id],
		name: "wallet_transactions_seller_id_sellers_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.orderId],
		foreignColumns: [orders.id],
		name: "wallet_transactions_order_id_orders_id_fk"
	}),
]);

/**
 * One row per transactional email we intend to send. The unique
 * (email_type, reference_id) index is the idempotency claim: an insert that
 * conflicts means another execution already owns that send, so retries,
 * refreshes and duplicated requests cannot produce a second email.
 */
export const emailDeliveries = pgTable("email_deliveries", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	emailType: text("email_type").notNull(),
	/** Domain row the email is about (e.g. orders.id for order confirmations). */
	referenceId: uuid("reference_id"),
	recipient: text().notNull(),
	/** Resend's email id, used to correlate webhook events back to this row. */
	resendEmailId: text("resend_email_id"),
	status: text().default('claimed').notNull(),
	errorMessage: text("error_message"),
	metadata: jsonb(),
	sentAt: timestamp("sent_at", { withTimezone: true, mode: 'string' }),
	deliveredAt: timestamp("delivered_at", { withTimezone: true, mode: 'string' }),
	bouncedAt: timestamp("bounced_at", { withTimezone: true, mode: 'string' }),
	complainedAt: timestamp("complained_at", { withTimezone: true, mode: 'string' }),
	failedAt: timestamp("failed_at", { withTimezone: true, mode: 'string' }),
	lastEventAt: timestamp("last_event_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("email_deliveries_type_reference_idx").using("btree", table.emailType.asc().nullsLast().op("text_ops"), table.referenceId.asc().nullsLast().op("uuid_ops")),
	index("email_deliveries_resend_email_id_idx").using("btree", table.resendEmailId.asc().nullsLast().op("text_ops")),
	index("email_deliveries_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
]);

/**
 * Raw Resend webhook events. `event_id` is the Svix message id — unique, so a
 * retried webhook delivery is recorded (and applied) exactly once.
 */
export const emailEvents = pgTable("email_events", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	eventId: text("event_id").notNull(),
	emailDeliveryId: uuid("email_delivery_id"),
	resendEmailId: text("resend_email_id"),
	type: text().notNull(),
	payload: jsonb(),
	occurredAt: timestamp("occurred_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("email_events_resend_email_id_idx").using("btree", table.resendEmailId.asc().nullsLast().op("text_ops")),
	index("email_events_type_idx").using("btree", table.type.asc().nullsLast().op("text_ops")),
	foreignKey({
		columns: [table.emailDeliveryId],
		foreignColumns: [emailDeliveries.id],
		name: "email_events_email_delivery_id_email_deliveries_id_fk"
	}).onDelete("set null"),
	unique("email_events_event_id_unique").on(table.eventId),
]);

/* ---------------------------------------------------------------------------
 * Centralized user wallet (migration 0025)
 *
 * One wallet per non-guest user. `userWalletTransactions` is the source of
 * truth for every balance movement; `balance` here is a running total that only
 * packages/db/src/wallet/user-wallet.ts may move, always through a single
 * atomic UPDATE ... WHERE. Read that file before touching any of these tables.
 *
 * Separate from the seller-only sellerWallet/walletTransactions above, which
 * stay as they are.
 * ------------------------------------------------------------------------ */

export const userWallets = pgTable("user_wallets", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	/** Total held, including anything reserved. Never negative. */
	balance: numeric({ precision: 10, scale: 2 }).default('0').notNull(),
	/** Held against open payout requests. `balance - reservedBalance` is spendable. */
	reservedBalance: numeric("reserved_balance", { precision: 10, scale: 2 }).default('0').notNull(),
	currency: text().default('EGP').notNull(),
	status: walletStatus().default('active').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("user_wallets_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "user_wallets_user_id_users_id_fk"
	}).onDelete("cascade"),
	unique("user_wallets_user_id_unique").on(table.userId),
	// Owner-scoped read only. There is deliberately no insert/update/delete
	// policy: the anon key can never write a financial row.
	pgPolicy("Users can read their own wallet", { as: "permissive", for: "select", to: ["authenticated"], using: sql`user_id = (SELECT auth.uid())` }),
	// Last line of defence behind the atomic WHERE guard in user-wallet.ts,
	// the same role products_quantity_non_negative plays for stock.
	check("user_wallets_balance_non_negative", sql`balance >= 0`),
	check("user_wallets_reserved_non_negative", sql`reserved_balance >= 0`),
	check("user_wallets_reserved_within_balance", sql`reserved_balance <= balance`),
	check("user_wallets_currency_egp", sql`currency = 'EGP'`),
]);

/**
 * Append-only ledger. A database trigger rejects UPDATE and DELETE — corrections
 * are made by posting a compensating row, never by rewriting history.
 *
 * `amount` is signed: positive credits, negative debits. The unique
 * (type, reference_type, reference_id) index is the idempotency claim — an
 * insert that conflicts means the same domain event was already applied, so a
 * retried webhook cannot credit the wallet twice.
 */
export const userWalletTransactions = pgTable("user_wallet_transactions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	walletId: uuid("wallet_id").notNull(),
	/** Denormalized from the wallet so RLS and per-user history need no join. */
	userId: uuid("user_id").notNull(),
	type: walletTransactionType().notNull(),
	/** Signed. Positive = credit, negative = debit. Never zero. */
	amount: numeric({ precision: 10, scale: 2 }).notNull(),
	/** Generated mirror of amount's sign; readers never re-derive it. */
	direction: text().generatedAlwaysAs(sql`CASE WHEN amount >= 0 THEN 'credit'::text ELSE 'debit'::text END`),
	balanceBefore: numeric("balance_before", { precision: 10, scale: 2 }).notNull(),
	balanceAfter: numeric("balance_after", { precision: 10, scale: 2 }).notNull(),
	currency: text().default('EGP').notNull(),
	status: walletTransactionStatus().default('completed').notNull(),
	/** e.g. 'wallet_top_up', 'wallet_payout_request', 'order'. */
	referenceType: text("reference_type"),
	referenceId: uuid("reference_id"),
	description: text(),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("user_wallet_tx_reference_idx").using("btree", table.type.asc().nullsLast().op("enum_ops"), table.referenceType.asc().nullsLast().op("text_ops"), table.referenceId.asc().nullsLast().op("uuid_ops")).where(sql`reference_id IS NOT NULL`),
	index("user_wallet_tx_wallet_created_idx").using("btree", table.walletId.asc().nullsLast().op("uuid_ops"), table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("user_wallet_tx_user_created_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("user_wallet_tx_type_idx").using("btree", table.type.asc().nullsLast().op("enum_ops")),
	foreignKey({
		columns: [table.walletId],
		foreignColumns: [userWallets.id],
		name: "user_wallet_transactions_wallet_id_user_wallets_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "user_wallet_transactions_user_id_users_id_fk"
	}).onDelete("cascade"),
	pgPolicy("Users can read their own wallet transactions", { as: "permissive", for: "select", to: ["authenticated"], using: sql`user_id = (SELECT auth.uid())` }),
	check("user_wallet_tx_amount_non_zero", sql`amount <> 0`),
	check("user_wallet_tx_balance_arithmetic", sql`balance_after = balance_before + amount`),
	check("user_wallet_tx_balance_non_negative", sql`balance_after >= 0`),
	check("user_wallet_tx_currency_egp", sql`currency = 'EGP'`),
	// NULLs compare as distinct in a unique index, so a row with a reference_id
	// but no reference_type would never conflict — silently disabling the
	// idempotency guard above. The two must travel together.
	check("user_wallet_tx_reference_pair", sql`(reference_id IS NULL) = (reference_type IS NULL)`),
]);

/**
 * A top-up intent. Created before the buyer is sent to the payment provider and
 * moved to 'succeeded' only by a signature-verified provider webhook
 * (apps/backend/src/lib/wallet-top-up.ts). No client-reachable path can mark one
 * successful.
 */
export const walletTopUps = pgTable("wallet_top_ups", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	walletId: uuid("wallet_id").notNull(),
	userId: uuid("user_id").notNull(),
	amount: numeric({ precision: 10, scale: 2 }).notNull(),
	currency: text().default('EGP').notNull(),
	status: walletTopUpStatus().default('pending').notNull(),
	provider: text().default('paymob').notNull(),
	/** The reference we hand the provider, e.g. Paymob's special_reference. */
	providerReference: text("provider_reference"),
	/** The provider's own transaction id, unique per provider once known. */
	providerTransactionId: text("provider_transaction_id"),
	/** The ledger row this top-up produced, once credited. */
	transactionId: uuid("transaction_id"),
	failureReason: text("failure_reason"),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("wallet_top_ups_provider_txn_idx").using("btree", table.provider.asc().nullsLast().op("text_ops"), table.providerTransactionId.asc().nullsLast().op("text_ops")).where(sql`provider_transaction_id IS NOT NULL`),
	index("wallet_top_ups_user_created_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("wallet_top_ups_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
		columns: [table.walletId],
		foreignColumns: [userWallets.id],
		name: "wallet_top_ups_wallet_id_user_wallets_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "wallet_top_ups_user_id_users_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.transactionId],
		foreignColumns: [userWalletTransactions.id],
		name: "wallet_top_ups_transaction_id_fk"
	}).onDelete("set null"),
	pgPolicy("Users can read their own top ups", { as: "permissive", for: "select", to: ["authenticated"], using: sql`user_id = (SELECT auth.uid())` }),
	check("wallet_top_ups_amount_positive", sql`amount > 0`),
	check("wallet_top_ups_currency_egp", sql`currency = 'EGP'`),
]);

/**
 * A payout request. Creating one RESERVES funds (bumps
 * userWallets.reservedBalance); it does not deduct them. Only completion writes
 * a negative ledger row and lowers the balance; rejection, cancellation and
 * failure release the reservation. The partial unique index caps a user at one
 * open request, which is what stops stacked requests from jointly exceeding the
 * available balance.
 */
export const walletPayoutRequests = pgTable("wallet_payout_requests", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	walletId: uuid("wallet_id").notNull(),
	userId: uuid("user_id").notNull(),
	amount: numeric({ precision: 10, scale: 2 }).notNull(),
	currency: text().default('EGP').notNull(),
	status: walletPayoutStatus().default('pending').notNull(),
	/** e.g. 'bank_transfer', 'instapay', 'mobile_wallet'. */
	method: text().notNull(),
	destination: jsonb(),
	adminNotes: text("admin_notes"),
	rejectionReason: text("rejection_reason"),
	externalReference: text("external_reference"),
	/** The negative ledger row this payout produced, once completed. */
	transactionId: uuid("transaction_id"),
	reviewedBy: uuid("reviewed_by"),
	reviewedAt: timestamp("reviewed_at", { withTimezone: true, mode: 'string' }),
	processedAt: timestamp("processed_at", { withTimezone: true, mode: 'string' }),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("wallet_payout_open_request_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")).where(sql`status IN ('pending', 'approved', 'processing')`),
	index("wallet_payout_requests_user_created_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("wallet_payout_requests_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
		columns: [table.walletId],
		foreignColumns: [userWallets.id],
		name: "wallet_payout_requests_wallet_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "wallet_payout_requests_user_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.reviewedBy],
		foreignColumns: [users.id],
		name: "wallet_payout_requests_reviewed_by_fk"
	}).onDelete("set null"),
	foreignKey({
		columns: [table.transactionId],
		foreignColumns: [userWalletTransactions.id],
		name: "wallet_payout_requests_transaction_id_fk"
	}).onDelete("set null"),
	pgPolicy("Users can read their own payout requests", { as: "permissive", for: "select", to: ["authenticated"], using: sql`user_id = (SELECT auth.uid())` }),
	check("wallet_payout_requests_amount_positive", sql`amount > 0`),
	check("wallet_payout_requests_currency_egp", sql`currency = 'EGP'`),
]);

/* --------------------------------------------------------------------------
 * Affiliate program (migration 0029).
 *
 * One affiliate per user, one permanent reusable coupon per affiliate. Order
 * attribution and the eligible-amount/commission figures are captured on
 * `affiliate_commissions` at order-creation time (status 'pending'), so a
 * later change to the coupon or affiliate can never rewrite a historical
 * commission — the same reasoning `order_items.commission_amount` already
 * applies to seller commission.
 * ------------------------------------------------------------------------ */

export const affiliates = pgTable("affiliates", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	couponId: uuid("coupon_id").notNull(),
	status: affiliateStatus().default('active').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("affiliates_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "affiliates_user_id_users_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.couponId],
		foreignColumns: [coupons.id],
		name: "affiliates_coupon_id_coupons_id_fk"
	}),
	// One affiliate account per user, one coupon per affiliate — both directions
	// of "prevent the same user from creating multiple affiliate accounts".
	unique("affiliates_user_id_unique").on(table.userId),
	unique("affiliates_coupon_id_unique").on(table.couponId),
	pgPolicy("Users can read their own affiliate account", { as: "permissive", for: "select", to: ["authenticated"], using: sql`user_id = (SELECT auth.uid())` }),
]);

export const affiliateCommissions = pgTable("affiliate_commissions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	affiliateId: uuid("affiliate_id").notNull(),
	/** Denormalized from affiliates.userId — same reasoning as user_wallet_transactions.userId: RLS and per-user history need no join. */
	userId: uuid("user_id").notNull(),
	orderId: uuid("order_id").notNull(),
	/** Immutable snapshot of which coupon earned this — never re-derived from the coupon table. */
	couponId: uuid("coupon_id").notNull(),
	type: affiliateCommissionType().default('commission').notNull(),
	status: affiliateCommissionStatus().default('pending').notNull(),
	/** Eligible merchandise subtotal the 10% is computed on (excludes shipping), snapshotted at order time. See packages/lib/src/orders/place-order.ts for the pre- vs post-discount decision. */
	orderEligibleAmount: numeric("order_eligible_amount", { precision: 10, scale: 2 }).notNull(),
	/** Audit-only: the order's shipping cost. Never part of commissionAmount. */
	shippingAmount: numeric("shipping_amount", { precision: 10, scale: 2 }).default('0').notNull(),
	commissionRate: real("commission_rate").default(0.1).notNull(),
	/** Always a positive magnitude; `type` (commission/reversal) carries the direction, matching how the wallet ledger's signed amount is derived from direction there but kept unsigned here since a row never mutates. */
	commissionAmount: numeric("commission_amount", { precision: 10, scale: 2 }).notNull(),
	/** Set only on a `type = 'reversal'` row: the earned commission it reverses. */
	parentCommissionId: uuid("parent_commission_id"),
	/** The user_wallet_transactions row this commission/reversal produced, once posted. */
	walletTransactionId: uuid("wallet_transaction_id"),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("affiliate_commissions_affiliate_id_idx").using("btree", table.affiliateId.asc().nullsLast().op("uuid_ops")),
	index("affiliate_commissions_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	index("affiliate_commissions_order_id_idx").using("btree", table.orderId.asc().nullsLast().op("uuid_ops")),
	index("affiliate_commissions_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
		columns: [table.affiliateId],
		foreignColumns: [affiliates.id],
		name: "affiliate_commissions_affiliate_id_affiliates_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "affiliate_commissions_user_id_users_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.orderId],
		foreignColumns: [orders.id],
		name: "affiliate_commissions_order_id_orders_id_fk"
	}),
	foreignKey({
		columns: [table.couponId],
		foreignColumns: [coupons.id],
		name: "affiliate_commissions_coupon_id_coupons_id_fk"
	}),
	foreignKey({
		columns: [table.parentCommissionId],
		foreignColumns: [table.id],
		name: "affiliate_commissions_parent_commission_id_fk"
	}),
	foreignKey({
		columns: [table.walletTransactionId],
		foreignColumns: [userWalletTransactions.id],
		name: "affiliate_commissions_wallet_transaction_id_fk"
	}).onDelete("set null"),
	// Idempotency (invariant: "an order must never generate affiliate commission
	// more than once"): at most one 'commission' row per order...
	uniqueIndex("affiliate_commissions_order_commission_idx").using("btree", table.orderId.asc().nullsLast().op("uuid_ops")).where(sql`type = 'commission'`),
	// ...and at most one reversal per commission being reversed (MVP: full
	// reversal only; a partial-refund reversal amount is computed proportionally
	// but still posts as a single reversal row per parent).
	uniqueIndex("affiliate_commissions_reversal_parent_idx").using("btree", table.parentCommissionId.asc().nullsLast().op("uuid_ops")).where(sql`type = 'reversal'`),
	pgPolicy("Users can read their own affiliate commissions", { as: "permissive", for: "select", to: ["authenticated"], using: sql`user_id = (SELECT auth.uid())` }),
	check("affiliate_commissions_amount_positive", sql`commission_amount > 0`),
	check("affiliate_commissions_order_amount_non_negative", sql`order_eligible_amount >= 0`),
	check("affiliate_commissions_shipping_non_negative", sql`shipping_amount >= 0`),
	// A reversal must reference the commission it reverses; a commission row
	// must not — keeps the two kinds from being confused at the data level.
	check("affiliate_commissions_reversal_has_parent", sql`(type = 'reversal') = (parent_commission_id IS NOT NULL)`),
]);
