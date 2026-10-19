import { pgTable, index, foreignKey, uuid, text, integer, jsonb, timestamp, numeric, varchar, smallint, unique, boolean, pgPolicy, uniqueIndex, real, bigint, date, check, pgView, pgEnum, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const addressType = pgEnum("address_type", ['shipping', 'billing', 'both'])
export const couponType = pgEnum("coupon_type", ['percentage', 'fixed_amount', 'buy_x_get_y', 'free_shipping'])
export const dealType = pgEnum("deal_type", ['daily_deal', 'lightning_deal', 'deal_of_the_day', 'best_deal', 'clearance'])
export const fulfillmentType = pgEnum("fulfillment_type", ['seller_fulfilled', 'platform_fulfilled', 'fba', 'digital'])
export const itemCondition = pgEnum("item_condition", ['new', 'renewed', 'refurbished', 'used_like_new', 'used_very_good', 'used_good', 'used_acceptable'])
export const notificationType = pgEnum("notification_type", ['order_update', 'shipment_update', 'price_drop', 'review_response', 'marketing'])
export const orderStatus = pgEnum("order_status", ['pending', 'payment_processing', 'confirmed', 'shipping_soon', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'refund_requested', 'refunded', 'returned'])
export const orderSource = pgEnum("order_source", ['website', 'external', 'storefront'])
export const paymentStatus = pgEnum("payment_status", ['pending', 'authorized', 'paid', 'failed', 'refunded', 'partially_refunded', 'collected'])
export const promotionType = pgEnum("promotion_type", ['percentage', 'fixed_amount', 'buy_x_get_y', 'free_shipping'])
export const returnReason = pgEnum("return_reason", ['defective', 'damaged', 'wrong_item', 'not_as_described', 'better_price', 'no_longer_needed', 'unauthorized_purchase', 'other'])
export const sellerStatus = pgEnum("seller_status", ['pending', 'approved', 'suspended', 'restricted'])
export const shippingSpeed = pgEnum("shipping_speed", ['standard', 'expedited', 'priority', 'one_day', 'same_day'])
export const userRole = pgEnum("user_role", ['customer', 'seller', 'admin', 'support', 'driver', 'marketing'])
export const productType = pgEnum("product_type", ['physical', 'digital'])
export const productStatus = pgEnum("product_status", ['draft', 'pending', 'active', 'rejected'])
/** Seller ledger entry types; top_up, service_charge, adjustment and fee_reversal added for the store wallet (0060). */
export const transactionType = pgEnum("transaction_type", ['sale', 'refund', 'withdrawal', 'fee', 'top_up', 'service_charge', 'adjustment', 'fee_reversal'])
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

/**
 * Seller fulfillment (migration 0040). Service types are structural (code
 * branches on them); only plans are admin-managed data. Mirrored as plain
 * constants in `@workspace/lib/fulfillment` for client-safe use.
 */
export const fulfillmentServiceType = pgEnum("fulfillment_service_type", ['storage', 'packaging', 'delivery', 'customer_service', 'returns'])
export const fulfillmentProvider = pgEnum("fulfillment_provider", ['seller', 'tallaby'])
export const fulfillmentModel = pgEnum("fulfillment_model", ['seller_managed', 'tallaby_fulfillment'])
export const fulfillmentServiceStatus = pgEnum("fulfillment_service_status", ['requested', 'under_review', 'awaiting_agreement', 'active', 'paused', 'rejected'])
export const fulfillmentReviewStatus = pgEnum("fulfillment_review_status", ['pending_contact', 'contacted', 'configured'])
export const fulfillmentAgreementStatus = pgEnum("fulfillment_agreement_status", ['draft', 'proposed', 'accepted', 'active', 'superseded', 'terminated'])

/** Order-level discount line stored on orders.discounts (jsonb). */
export type OrderDiscountType =
	| 'coupon'
	| 'free_shipping_coupon'
	| 'threshold_free_shipping'
	| 'seller_free_shipping'
	/** Admin-entered discount (external-order pricing, or an order price edit). */
	| 'manual_adjustment'

export type OrderCouponDiscountType =
	| 'percentage'
	| 'fixed_amount'
	| 'buy_x_get_y'
	| 'free_shipping'

export interface OrderDiscountLine {
	type: OrderDiscountType
	label: string
	amount: string
	code?: string
	couponId?: string
	couponDiscountType?: OrderCouponDiscountType
}

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
	reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true, mode: 'string' }),
	reminderSentBy: uuid("reminder_sent_by"),
	/** NULL = tallaby.com marketplace cart; set = that seller's storefront cart (0045). */
	storeSellerId: uuid("store_seller_id"),
	/** The storefront cart's store (0050). Filled from the primary store by trigger when omitted. */
	storeId: uuid("store_id"),
}, (table) => [
	index("cart_session_id_idx").using("btree", table.sessionId.asc().nullsLast().op("text_ops")),
	index("cart_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	index("carts_status_last_activity_idx").using("btree", table.status.asc().nullsLast().op("text_ops"), table.lastActivity.desc().nullsLast().op("timestamptz_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "carts_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.reminderSentBy],
			foreignColumns: [users.id],
			name: "carts_reminder_sent_by_fkey"
		}).onDelete("set null"),
	index("carts_user_store_status_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.storeSellerId.asc().nullsLast().op("uuid_ops"), table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.storeSellerId],
			foreignColumns: [sellers.id],
			name: "carts_store_seller_id_fkey"
		}).onDelete("cascade"),
	index("carts_user_store_id_status_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.storeId.asc().nullsLast().op("uuid_ops"), table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "carts_store_id_fkey"
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
	// 0049: the authenticated read-all policy was dropped (exposed every submission).
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
	price: jsonb(),
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
	commissionRate: real("commission_rate").default(sql`'5'`).notNull(),
	isCommissionExempt: boolean("is_commission_exempt").default(false).notNull(),
	freeDelivery: boolean("free_delivery").default(false).notNull(),
	feeStructure: jsonb("fee_structure"),
	taxInformation: jsonb("tax_information"),
	paymentDetails: jsonb("payment_details"),
	storeRating: real("store_rating"),
	positiveRatingPercent: real("positive_rating_percent"),
	totalRatings: integer("total_ratings").default(0),
	productCount: integer("product_count").default(0),
	/** @deprecated Never written. Superseded by seller_fulfillment_profiles / seller_fulfillment_services (0040). */
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
	/** Storefront at {subdomain}.tallaby.com. Leave unset on insert: a DB trigger replaces the '' default (0044). */
	subdomain: text().default('').notNull(),
	subdomainUpdatedAt: timestamp("subdomain_updated_at", { withTimezone: true, mode: 'string' }),
	/** What the store sells, shown on its storefront (0046). */
	storeCategory: text("store_category"),
	storeCategoryAr: text("store_category_ar"),
	/** Account plan id; limits live in @workspace/lib/plans (0050). */
	plan: text().default('free').notNull(),
	planStartedAt: timestamp("plan_started_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	planExpiresAt: timestamp("plan_expires_at", { withTimezone: true, mode: 'string' }),
	/** Audited admin override of the plan's store limit (D27). NULL = plan limit. */
	maxStoresOverride: integer("max_stores_override"),
	/** Platform fee plan (flat EGP 5 since 0067); amounts live in @workspace/lib/orders/platform-fee. */
	feePlan: text("fee_plan").default('flat_5').notNull(),
	/** 7-day no-fee trial from the first store's created_at; every seller was backfilled true (0067). */
	feeTrialEligible: boolean("fee_trial_eligible").default(true).notNull(),
	/** Set once by startFeeTrialIfNeeded (stores insert trigger, 0067), with feeTrialEndsAt. */
	feeTrialStartedAt: timestamp("fee_trial_started_at", { withTimezone: true, mode: 'string' }),
	feeTrialEndsAt: timestamp("fee_trial_ends_at", { withTimezone: true, mode: 'string' }),
	/** 'store_created' (0067) | 'publish' | 'product_active' | 'admin' (0059). */
	feeTrialStartTrigger: text("fee_trial_start_trigger"),
	feePlanEffectiveAt: timestamp("fee_plan_effective_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	uniqueIndex("sellers_subdomain_key").using("btree", table.subdomain.asc().nullsLast().op("text_ops")),
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

/** Subdomains a seller used before; the storefront redirects them (0044). */
export const sellerSubdomainRedirects = pgTable("seller_subdomain_redirects", {
	subdomain: text().primaryKey().notNull(),
	sellerId: uuid("seller_id").notNull(),
	/** The store the old subdomain belonged to (0050). Filled from the primary store by trigger when omitted. */
	storeId: uuid("store_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("seller_subdomain_redirects_seller_id_idx").using("btree", table.sellerId.asc().nullsLast().op("uuid_ops")),
	index("seller_subdomain_redirects_store_id_idx").using("btree", table.storeId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.sellerId],
			foreignColumns: [sellers.id],
			name: "seller_subdomain_redirects_seller_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "seller_subdomain_redirects_store_id_fkey"
		}).onDelete("cascade"),
]);

/** A seller's own domain for their storefront, e.g. faster-eg.com (0048). Apex only; www redirects in Vercel. */
export const sellerCustomDomains = pgTable("seller_custom_domains", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sellerId: uuid("seller_id").notNull(),
	/** The store this domain serves (0050). Filled from the primary store by trigger when omitted. */
	storeId: uuid("store_id"),
	domain: text().notNull(),
	/** pending | active | failed */
	status: text().default('pending').notNull(),
	/** DNS records Vercel asks for to prove ownership (TXT), when it asks. */
	verification: jsonb(),
	lastError: text("last_error"),
	verifiedAt: timestamp("verified_at", { withTimezone: true, mode: 'string' }),
	lastCheckedAt: timestamp("last_checked_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("seller_custom_domains_seller_id_key").using("btree", table.sellerId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("seller_custom_domains_domain_key").using("btree", table.domain.asc().nullsLast().op("text_ops")),
	index("seller_custom_domains_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	uniqueIndex("seller_custom_domains_store_id_key").using("btree", table.storeId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.sellerId],
			foreignColumns: [sellers.id],
			name: "seller_custom_domains_seller_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "seller_custom_domains_store_id_fkey"
		}).onDelete("cascade"),
]);

/** Single-use codes carrying a session from tallaby.com to a custom domain (0048). */
export const authHandoffCodes = pgTable("auth_handoff_codes", {
	codeHash: text("code_hash").primaryKey().notNull(),
	targetOrigin: text("target_origin").notNull(),
	accessToken: text("access_token").notNull(),
	refreshToken: text("refresh_token").notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("auth_handoff_codes_expires_at_idx").using("btree", table.expiresAt.asc().nullsLast().op("timestamptz_ops")),
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

/**
 * Links a rider (`users.role = 'driver'`) to the seller who manages them from
 * the seller dashboard. `rider_id` is unique — a rider serves one seller.
 */
export const sellerRiders = pgTable("seller_riders", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sellerId: uuid("seller_id").notNull(),
	riderId: uuid("rider_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("seller_riders_seller_id_idx").using("btree", table.sellerId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.sellerId],
			foreignColumns: [sellers.id],
			name: "seller_riders_seller_id_sellers_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.riderId],
			foreignColumns: [users.id],
			name: "seller_riders_rider_id_users_id_fk"
		}).onDelete("cascade"),
	unique("seller_riders_rider_id_unique").on(table.riderId),
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
		}).onDelete("set null"),
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
		}).onDelete("set null"),
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
	// 0049: public read-all, self insert and self update were dropped, and
	// INSERT/UPDATE/DELETE revoked from anon/authenticated (role self-escalation).
	pgPolicy("Users can read their own profile", { as: "permissive", for: "select", to: ["authenticated"], using: sql`(auth.uid() = id)` }),
]);

/**
 * The seller's own categories (0068): per seller, shared by their stores, never
 * shared with other sellers. `categories` is only the pack they pick from.
 */
export const sellerProductCategories = pgTable("seller_product_categories", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sellerId: uuid("seller_id").notNull(),
	name: text().notNull(),
	nameAr: text("name_ar"),
	/** The pack item it was picked from; null for the seller's own. */
	sourceCategoryId: uuid("source_category_id"),
	imageUrl: text("image_url"),
	position: integer().default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("seller_product_categories_name_key").using("btree", table.sellerId, sql`lower(btrim(${table.name}))`),
	uniqueIndex("seller_product_categories_source_key").using("btree", table.sellerId, table.sourceCategoryId).where(sql`source_category_id IS NOT NULL`),
	index("seller_product_categories_seller_idx").using("btree", table.sellerId, table.position),
	foreignKey({
			columns: [table.sellerId],
			foreignColumns: [sellers.id],
			name: "seller_product_categories_seller_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.sourceCategoryId],
			foreignColumns: [categories.id],
			name: "seller_product_categories_source_category_id_fkey"
		}).onDelete("set null"),
	check("seller_product_categories_name_check", sql`length(btrim(name)) BETWEEN 1 AND 80`),
]);

/** The seller's own brands (0068); `brands` is only the pack they pick from. */
export const sellerProductBrands = pgTable("seller_product_brands", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sellerId: uuid("seller_id").notNull(),
	name: text().notNull(),
	nameAr: text("name_ar"),
	sourceBrandId: uuid("source_brand_id"),
	logoUrl: text("logo_url"),
	position: integer().default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("seller_product_brands_name_key").using("btree", table.sellerId, sql`lower(btrim(${table.name}))`),
	uniqueIndex("seller_product_brands_source_key").using("btree", table.sellerId, table.sourceBrandId).where(sql`source_brand_id IS NOT NULL`),
	index("seller_product_brands_seller_idx").using("btree", table.sellerId, table.position),
	foreignKey({
			columns: [table.sellerId],
			foreignColumns: [sellers.id],
			name: "seller_product_brands_seller_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.sourceBrandId],
			foreignColumns: [brands.id],
			name: "seller_product_brands_source_brand_id_fkey"
		}).onDelete("set null"),
	check("seller_product_brands_name_check", sql`length(btrim(name)) BETWEEN 1 AND 80`),
]);

export const products = pgTable("products", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	brandId: uuid("brand_id"),
	categoryId: uuid("category_id").notNull(),
	/** The seller's own category / brand (0068, optional); the trigger keeps them to this seller's lists. */
	sellerCategoryId: uuid("seller_category_id"),
	sellerBrandId: uuid("seller_brand_id"),
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
	sponsored: boolean("sponsored").default(false).notNull(),
	freeDelivery: boolean("free_delivery").default(false).notNull(),
	/** Ad landing pages: product page shows "Buy Now" and goes straight to checkout. */
	directCheckout: boolean("direct_checkout").default(false).notNull(),
	dimensions: jsonb(),
	price: jsonb(),
	productType: productType("product_type").default('physical'),
}, (table) => [
	index("product_brand_id_idx").using("btree", table.brandId.asc().nullsLast().op("uuid_ops")),
	index("product_main_category_id_idx").using("btree", table.categoryId.asc().nullsLast().op("uuid_ops")),
	index("product_seller_category_id_idx").using("btree", table.sellerCategoryId).where(sql`seller_category_id IS NOT NULL`),
	index("product_seller_brand_id_idx").using("btree", table.sellerBrandId).where(sql`seller_brand_id IS NOT NULL`),
	foreignKey({
			columns: [table.sellerCategoryId],
			foreignColumns: [sellerProductCategories.id],
			name: "products_seller_category_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.sellerBrandId],
			foreignColumns: [sellerProductBrands.id],
			name: "products_seller_brand_id_fkey"
		}).onDelete("set null"),
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
	// 0049: insert / "Public full access" policies dropped and writes revoked from anon/authenticated.
	pgPolicy("Enable read access for all users", { as: "permissive", for: "select", to: ["public"] }),
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
	/** Breakdown of each order-level discount; sum of amounts equals discount_amount. */
	discounts: jsonb().$type<OrderDiscountLine[]>().default([]).notNull(),
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
	/** Storefront orders: the store they were placed on (0050). NULL for marketplace orders. */
	storeId: uuid("store_id"),
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
	index("orders_store_id_idx").using("btree", table.storeId.asc().nullsLast().op("uuid_ops")).where(sql`store_id IS NOT NULL`),
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "orders_store_id_fkey"
		}).onDelete("set null"),
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
	/** Signed: the store wallet may go negative (0060). Changed only by postStoreWalletEntry. */
	balance: numeric({ precision: 10, scale: 2 }).default('0').notNull(),
	currency: text().default('EGP').notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	status: walletStatus().default('active').notNull(),
	/** How far below zero optional purchases may take it; NULL = DEFAULT_NEGATIVE_LIMIT, i.e. 0 (D21, 0060). Fees ignore it. */
	negativeLimit: numeric("negative_limit", { precision: 10, scale: 2 }),
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
	/** The store the entry belongs to, for per-store reporting; NULL for account-level entries (0060). */
	storeId: uuid("store_id"),
	/** Idempotency claim: unique per (seller, type, reference_type, reference_id) (0060). */
	referenceType: text("reference_type"),
	referenceId: text("reference_id"),
	balanceBefore: numeric("balance_before", { precision: 10, scale: 2 }),
	balanceAfter: numeric("balance_after", { precision: 10, scale: 2 }),
	metadata: jsonb(),
	createdBy: uuid("created_by"),
}, (table) => [
	uniqueIndex("wallet_transactions_reference_once").using("btree", table.sellerId, table.type, table.referenceType, table.referenceId).where(sql`reference_type IS NOT NULL`),
	uniqueIndex("wallet_transactions_sale_once").using("btree", table.sellerId, table.orderId).where(sql`type = 'sale' AND reference_type IS NULL`),
	index("wallet_transactions_store_id_idx").using("btree", table.storeId.asc().nullsLast().op("uuid_ops")),
	index("wallet_transactions_order_id_idx").using("btree", table.orderId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
		columns: [table.storeId],
		foreignColumns: [stores.id],
		name: "wallet_transactions_store_id_fkey"
	}).onDelete("set null"),
	foreignKey({
		columns: [table.createdBy],
		foreignColumns: [users.id],
		name: "wallet_transactions_created_by_fkey"
	}).onDelete("set null"),
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
	/**
	 * Set on delivery to deliveredAt + RETURN_WINDOW_DAYS. Null until delivered.
	 * Wallet credit (earn) only runs once eligible_at <= now and the order is still delivered.
	 */
	eligibleAt: timestamp("eligible_at", { withTimezone: true, mode: 'string' }),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("affiliate_commissions_affiliate_id_idx").using("btree", table.affiliateId.asc().nullsLast().op("uuid_ops")),
	index("affiliate_commissions_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	index("affiliate_commissions_order_id_idx").using("btree", table.orderId.asc().nullsLast().op("uuid_ops")),
	index("affiliate_commissions_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("affiliate_commissions_pending_eligible_at_idx").using("btree", table.status.asc().nullsLast().op("enum_ops"), table.eligibleAt.asc().nullsLast().op("timestamptz_ops")).where(sql`type = 'commission' AND status = 'pending'`),
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

/**
 * Admin-managed catalog of Tallaby fulfillment plans (migration 0040).
 * `pricing` and `limits` are deliberately nullable: nothing is priced yet, and
 * a null price renders as "Pricing will be discussed with our team".
 */
export const fulfillmentPlans = pgTable("fulfillment_plans", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	code: text().notNull(),
	serviceType: fulfillmentServiceType("service_type").notNull(),
	nameEn: text("name_en").notNull(),
	nameAr: text("name_ar").notNull(),
	descriptionEn: text("description_en"),
	descriptionAr: text("description_ar"),
	features: jsonb().default([]).notNull(),
	limits: jsonb(),
	pricing: jsonb(),
	shippingSpeed: shippingSpeed("shipping_speed"),
	availability: jsonb(),
	isActive: boolean("is_active").default(true).notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("fulfillment_plans_service_type_idx").using("btree", table.serviceType.asc().nullsLast().op("enum_ops"), table.sortOrder.asc().nullsLast().op("int4_ops")),
	unique("fulfillment_plans_code_unique").on(table.code),
	unique("fulfillment_plans_id_service_type_unique").on(table.id, table.serviceType),
	check("fulfillment_plans_features_is_array", sql`jsonb_typeof(features) = 'array'`),
]);

/** One per seller: the onboarding answers that aren't per-service. */
export const sellerFulfillmentProfiles = pgTable("seller_fulfillment_profiles", {
	sellerId: uuid("seller_id").primaryKey().notNull(),
	model: fulfillmentModel().notNull(),
	operationalDetails: jsonb("operational_details").default({}).notNull(),
	pickupAddress: jsonb("pickup_address"),
	submittedAt: timestamp("submitted_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	termsAcceptedAt: timestamp("terms_accepted_at", { withTimezone: true, mode: 'string' }),
	termsVersion: text("terms_version"),
	reviewStatus: fulfillmentReviewStatus("review_status").default('pending_contact').notNull(),
	adminNotes: text("admin_notes"),
	reviewedBy: uuid("reviewed_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("seller_fulfillment_profiles_review_status_idx").using("btree", table.reviewStatus.asc().nullsLast().op("enum_ops")),
	foreignKey({
		columns: [table.sellerId],
		foreignColumns: [sellers.id],
		name: "seller_fulfillment_profiles_seller_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.reviewedBy],
		foreignColumns: [users.id],
		name: "seller_fulfillment_profiles_reviewed_by_fkey"
	}).onDelete("set null"),
]);

/** Negotiated commercial terms for one seller service. Separate from the request. */
export const sellerFulfillmentAgreements = pgTable("seller_fulfillment_agreements", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sellerId: uuid("seller_id").notNull(),
	serviceType: fulfillmentServiceType("service_type").notNull(),
	planId: uuid("plan_id"),
	rates: jsonb().default([]).notNull(),
	effectiveFrom: date("effective_from"),
	effectiveTo: date("effective_to"),
	status: fulfillmentAgreementStatus().default('draft').notNull(),
	notes: text(),
	createdBy: uuid("created_by"),
	approvedBy: uuid("approved_by"),
	sellerConfirmedAt: timestamp("seller_confirmed_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("seller_fulfillment_agreements_seller_idx").using("btree", table.sellerId.asc().nullsLast().op("uuid_ops"), table.serviceType.asc().nullsLast().op("enum_ops")),
	foreignKey({
		columns: [table.sellerId],
		foreignColumns: [sellers.id],
		name: "seller_fulfillment_agreements_seller_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.planId, table.serviceType],
		foreignColumns: [fulfillmentPlans.id, fulfillmentPlans.serviceType],
		name: "seller_fulfillment_agreements_plan_fk"
	}),
	foreignKey({
		columns: [table.createdBy],
		foreignColumns: [users.id],
		name: "seller_fulfillment_agreements_created_by_fkey"
	}).onDelete("set null"),
	foreignKey({
		columns: [table.approvedBy],
		foreignColumns: [users.id],
		name: "seller_fulfillment_agreements_approved_by_fkey"
	}).onDelete("set null"),
	check("seller_fulfillment_agreements_rates_is_array", sql`jsonb_typeof(rates) = 'array'`),
	check("seller_fulfillment_agreements_dates_ordered", sql`effective_to IS NULL OR effective_from IS NULL OR effective_to >= effective_from`),
]);

/**
 * One row per seller x service. `requested_*` is what the seller asked for;
 * `active_*` is what orders run under. Only an admin activation copies
 * requested -> active, so a pending request never changes live behavior.
 */
export const sellerFulfillmentServices = pgTable("seller_fulfillment_services", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sellerId: uuid("seller_id").notNull(),
	serviceType: fulfillmentServiceType("service_type").notNull(),
	requestedProvider: fulfillmentProvider("requested_provider").notNull(),
	requestedPlanId: uuid("requested_plan_id"),
	requestedConfig: jsonb("requested_config").default({}).notNull(),
	requestedAt: timestamp("requested_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	activeProvider: fulfillmentProvider("active_provider").notNull(),
	activePlanId: uuid("active_plan_id"),
	activeConfig: jsonb("active_config").default({}).notNull(),
	activatedAt: timestamp("activated_at", { withTimezone: true, mode: 'string' }),
	status: fulfillmentServiceStatus().default('requested').notNull(),
	agreementId: uuid("agreement_id"),
	notes: text(),
	updatedBy: uuid("updated_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("seller_fulfillment_services_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	unique("seller_fulfillment_services_seller_service_unique").on(table.sellerId, table.serviceType),
	foreignKey({
		columns: [table.sellerId],
		foreignColumns: [sellers.id],
		name: "seller_fulfillment_services_seller_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.requestedPlanId, table.serviceType],
		foreignColumns: [fulfillmentPlans.id, fulfillmentPlans.serviceType],
		name: "seller_fulfillment_services_requested_plan_fk"
	}),
	foreignKey({
		columns: [table.activePlanId, table.serviceType],
		foreignColumns: [fulfillmentPlans.id, fulfillmentPlans.serviceType],
		name: "seller_fulfillment_services_active_plan_fk"
	}),
	foreignKey({
		columns: [table.agreementId],
		foreignColumns: [sellerFulfillmentAgreements.id],
		name: "seller_fulfillment_services_agreement_id_fkey"
	}).onDelete("set null"),
	foreignKey({
		columns: [table.updatedBy],
		foreignColumns: [users.id],
		name: "seller_fulfillment_services_updated_by_fkey"
	}).onDelete("set null"),
	check("seller_fulfillment_services_requested_seller_no_plan", sql`requested_provider = 'tallaby' OR requested_plan_id IS NULL`),
	check("seller_fulfillment_services_active_seller_no_plan", sql`active_provider = 'tallaby' OR active_plan_id IS NULL`),
]);

export const adRequestStatus = pgEnum("ad_request_status", ['pending', 'approved', 'active', 'completed', 'rejected'])

/**
 * A seller's request to advertise one product with a paid ad package. The
 * package catalog lives in code; `amount` snapshots its price at submit time.
 */
export const adCampaignRequests = pgTable("ad_campaign_requests", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sellerId: uuid("seller_id").notNull(),
	productId: uuid("product_id").notNull(),
	packageKey: text("package_key").notNull(),
	amount: numeric({ precision: 10, scale: 2 }).notNull(),
	currency: text().default('EGP').notNull(),
	paymentMethod: text("payment_method").default('vodafone_cash').notNull(),
	payerPhone: text("payer_phone").notNull(),
	transferReference: text("transfer_reference"),
	status: adRequestStatus().default('pending').notNull(),
	adminNotes: text("admin_notes"),
	startsAt: timestamp("starts_at", { withTimezone: true, mode: 'string' }),
	endsAt: timestamp("ends_at", { withTimezone: true, mode: 'string' }),
	reviewedAt: timestamp("reviewed_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("ad_campaign_requests_seller_created_idx").using("btree", table.sellerId.asc().nullsLast().op("uuid_ops"), table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("ad_campaign_requests_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	uniqueIndex("ad_campaign_requests_open_product_idx").using("btree", table.productId.asc().nullsLast().op("uuid_ops")).where(sql`status IN ('pending', 'approved', 'active')`),
	foreignKey({
		columns: [table.sellerId],
		foreignColumns: [sellers.id],
		name: "ad_campaign_requests_seller_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.productId],
		foreignColumns: [products.id],
		name: "ad_campaign_requests_product_id_fkey"
	}).onDelete("cascade"),
]);

// ---------------------------------------------------------------------------
// Multi-store tenant + website builder (0050–0057, PLAN.md §11).
// All server-only (RLS enabled, no policies). Every query must check that the
// store belongs to the session's seller and filter child rows by store_id.
// ---------------------------------------------------------------------------

/** The tenant: one storefront. A seller owns up to plan.maxStores stores (0050). */
export const stores = pgTable("stores", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sellerId: uuid("seller_id").notNull(),
	name: text().notNull(),
	subdomain: text().notNull(),
	/** Exactly one per seller. Its subdomain mirrors sellers.subdomain (triggers in 0050). */
	isPrimary: boolean("is_primary").default(false).notNull(),
	/** active | archived | suspended */
	status: text().default('active').notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	logoUrl: text("logo_url"),
	faviconUrl: text("favicon_url"),
	bannerUrl: text("banner_url"),
	description: text(),
	storeCategory: text("store_category"),
	storeCategoryAr: text("store_category_ar"),
	defaultLocale: text("default_locale").default('ar').notNull(),
	supportedLocales: text("supported_locales").array().default(["ar", "en"]).notNull(),
	contact: jsonb().default({}).notNull(),
	seo: jsonb().default({}).notNull(),
	settings: jsonb().default({}).notNull(),
	/** all | selected (store_products) */
	catalogMode: text("catalog_mode").default('all').notNull(),
	templateKey: text("template_key").default('tallaby-classic').notNull(),
	previousTemplateKey: text("previous_template_key"),
	/** draft | published | unpublished */
	siteStatus: text("site_status").default('draft').notNull(),
	schemaVersion: integer("schema_version").default(1).notNull(),
	sharedHeader: jsonb("shared_header"),
	sharedFooter: jsonb("shared_footer"),
	publishedRevisionId: uuid("published_revision_id"),
	firstPublishedAt: timestamp("first_published_at", { withTimezone: true, mode: 'string' }),
	lastPublishedAt: timestamp("last_published_at", { withTimezone: true, mode: 'string' }),
	subdomainUpdatedAt: timestamp("subdomain_updated_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("stores_subdomain_key").using("btree", table.subdomain.asc().nullsLast().op("text_ops")),
	uniqueIndex("stores_one_primary").using("btree", table.sellerId.asc().nullsLast().op("uuid_ops")).where(sql`is_primary`),
	index("stores_seller_idx").using("btree", table.sellerId.asc().nullsLast().op("uuid_ops")).where(sql`deleted_at IS NULL`),
	foreignKey({
			columns: [table.sellerId],
			foreignColumns: [sellers.id],
			name: "stores_seller_id_fkey"
		}).onDelete("cascade"),
	// stores_published_revision_id_fkey → store_site_revisions(id) ON DELETE SET NULL exists
	// in SQL (0051); not declared here because the circular reference breaks type inference.
	check("stores_status_check", sql`status IN ('active', 'archived', 'suspended')`),
	check("stores_catalog_mode_check", sql`catalog_mode IN ('all', 'selected')`),
	check("stores_site_status_check", sql`site_status IN ('draft', 'published', 'unpublished')`),
	check("stores_default_locale_check", sql`default_locale IN ('ar', 'en')`),
	check("stores_subdomain_format", sql`subdomain ~ '^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$' AND position('--' IN subdomain) = 0 AND NOT is_reserved_subdomain(subdomain)`),
]);

/** A store's selected catalog, used only when stores.catalog_mode = 'selected' (0050). */
export const storeProducts = pgTable("store_products", {
	storeId: uuid("store_id").notNull(),
	productId: uuid("product_id").notNull(),
	position: integer().default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	primaryKey({ columns: [table.storeId, table.productId], name: "store_products_pkey" }),
	index("store_products_product_idx").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "store_products_store_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "store_products_product_id_fkey"
		}).onDelete("cascade"),
]);

/** Theme tokens per store (0051). No custom CSS column by design. */
export const storeDesignSystems = pgTable("store_design_systems", {
	storeId: uuid("store_id").primaryKey().notNull(),
	colors: jsonb().default({}).notNull(),
	typography: jsonb().default({}).notNull(),
	spacing: jsonb().default({}).notNull(),
	version: integer().default(0).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "store_design_systems_store_id_fkey"
		}).onDelete("cascade"),
]);

/** Builder page drafts (0051). The public storefront never reads this table. */
export const storePages = pgTable("store_pages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	storeId: uuid("store_id").notNull(),
	slug: text().notNull(),
	isHome: boolean("is_home").default(false).notNull(),
	name: jsonb().default({}).notNull(),
	seo: jsonb().default({}).notNull(),
	draftContent: jsonb("draft_content").default({ sections: [] }).notNull(),
	/** Optimistic concurrency: UPDATE … WHERE draft_version = :clientVersion. */
	draftVersion: integer("draft_version").default(1).notNull(),
	useSharedHeader: boolean("use_shared_header").default(true).notNull(),
	useSharedFooter: boolean("use_shared_footer").default(true).notNull(),
	showInNav: boolean("show_in_nav").default(true).notNull(),
	orderIndex: integer("order_index").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("store_pages_store_slug_key").using("btree", table.storeId.asc().nullsLast().op("uuid_ops"), table.slug.asc().nullsLast().op("text_ops")),
	uniqueIndex("store_pages_one_home").using("btree", table.storeId.asc().nullsLast().op("uuid_ops")).where(sql`is_home`),
	index("store_pages_store_order_idx").using("btree", table.storeId.asc().nullsLast().op("uuid_ops"), table.orderIndex.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "store_pages_store_id_fkey"
		}).onDelete("cascade"),
	check("store_pages_slug_format", sql`slug ~ '^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$'`),
]);

/** Immutable publish snapshots (append-only trigger, 0051). */
export const storeSiteRevisions = pgTable("store_site_revisions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	storeId: uuid("store_id").notNull(),
	revisionNumber: integer("revision_number").notNull(),
	schemaVersion: integer("schema_version").notNull(),
	templateKey: text("template_key").notNull(),
	/** Validated SiteConfig (@workspace/store-sections). */
	snapshot: jsonb().notNull(),
	publishedBy: uuid("published_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("store_site_revisions_store_number_key").using("btree", table.storeId.asc().nullsLast().op("uuid_ops"), table.revisionNumber.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "store_site_revisions_store_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.publishedBy],
			foreignColumns: [users.id],
			name: "store_site_revisions_published_by_fkey"
		}).onDelete("set null"),
	check("store_site_revisions_number_positive", sql`revision_number > 0`),
]);

/** Global, admin-authored templates (0052). 'tallaby-classic' is the default. */
export const templates = pgTable("templates", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	key: text().notNull(),
	name: jsonb().notNull(),
	description: jsonb().default({}).notNull(),
	category: text().default('general').notNull(),
	thumbnailUrl: text("thumbnail_url"),
	previewUrl: text("preview_url"),
	isDefault: boolean("is_default").default(false).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	isPremium: boolean("is_premium").default(false).notNull(),
	price: numeric({ precision: 10, scale: 2 }),
	sortOrder: integer("sort_order").default(0).notNull(),
	currentVersionId: uuid("current_version_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("templates_key_key").on(table.key),
	uniqueIndex("templates_one_default").using("btree", table.isDefault.asc().nullsLast().op("bool_ops")).where(sql`is_default`),
	// templates_current_version_id_fkey → template_versions(id) ON DELETE SET NULL exists
	// in SQL (0052); not declared here because the circular reference breaks type inference.
	check("templates_price_check", sql`price IS NULL OR price >= 0`),
]);

export const templateVersions = pgTable("template_versions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	templateId: uuid("template_id").notNull(),
	version: integer().notNull(),
	schemaVersion: integer("schema_version").notNull(),
	/** SiteConfig */
	config: jsonb().notNull(),
	changelog: text(),
	publishedBy: uuid("published_by"),
	publishedAt: timestamp("published_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("template_versions_template_version_key").on(table.templateId, table.version),
	foreignKey({
			columns: [table.templateId],
			foreignColumns: [templates.id],
			name: "template_versions_template_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.publishedBy],
			foreignColumns: [users.id],
			name: "template_versions_published_by_fkey"
		}).onDelete("set null"),
]);

export const templateInstalls = pgTable("template_installs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	templateId: uuid("template_id").notNull(),
	templateVersionId: uuid("template_version_id"),
	storeId: uuid("store_id").notNull(),
	installedBy: uuid("installed_by"),
	installedAt: timestamp("installed_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	/** Drafts just before this install (0064), restored by "Undo template change". */
	previousDraft: jsonb("previous_draft"),
	undoneAt: timestamp("undone_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("template_installs_store_idx").using("btree", table.storeId.asc().nullsLast().op("uuid_ops"), table.installedAt.desc().nullsFirst().op("timestamptz_ops")),
	foreignKey({
			columns: [table.templateId],
			foreignColumns: [templates.id],
			name: "template_installs_template_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.templateVersionId],
			foreignColumns: [templateVersions.id],
			name: "template_installs_template_version_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "template_installs_store_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.installedBy],
			foreignColumns: [users.id],
			name: "template_installs_installed_by_fkey"
		}).onDelete("set null"),
]);

/** Seller media library folders; store_id NULL = shared by the seller's stores (0053). */
export const mediaFolders = pgTable("media_folders", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sellerId: uuid("seller_id").notNull(),
	storeId: uuid("store_id"),
	parentId: uuid("parent_id"),
	name: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("media_folders_seller_idx").using("btree", table.sellerId.asc().nullsLast().op("uuid_ops"), table.storeId.asc().nullsLast().op("uuid_ops")),
	index("media_folders_parent_idx").using("btree", table.parentId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.sellerId],
			foreignColumns: [sellers.id],
			name: "media_folders_seller_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "media_folders_store_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "media_folders_parent_id_fkey"
		}).onDelete("cascade"),
	check("media_folders_name_length", sql`char_length(name) BETWEEN 1 AND 120`),
]);

/** Uploaded files in the `store-media` bucket, path '{seller_id}/{store_id|shared}/…' (0053). */
export const mediaAssets = pgTable("media_assets", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sellerId: uuid("seller_id").notNull(),
	storeId: uuid("store_id"),
	folderId: uuid("folder_id"),
	bucket: text().default('store-media').notNull(),
	storagePath: text("storage_path").notNull(),
	filename: text().notNull(),
	mimeType: text("mime_type").notNull(),
	bytes: bigint({ mode: "number" }).notNull(),
	width: integer(),
	height: integer(),
	altText: jsonb("alt_text").default({}).notNull(),
	contentHash: text("content_hash"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("media_assets_bucket_path_key").on(table.bucket, table.storagePath),
	index("media_assets_seller_created_idx").using("btree", table.sellerId.asc().nullsLast().op("uuid_ops"), table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("media_assets_store_idx").using("btree", table.storeId.asc().nullsLast().op("uuid_ops")),
	index("media_assets_folder_idx").using("btree", table.folderId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.sellerId],
			foreignColumns: [sellers.id],
			name: "media_assets_seller_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "media_assets_store_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.folderId],
			foreignColumns: [mediaFolders.id],
			name: "media_assets_folder_id_fkey"
		}).onDelete("set null"),
	check("media_assets_bytes_check", sql`bytes >= 0`),
	check("media_assets_path_owner", sql`storage_path LIKE seller_id::text || '/%'`),
]);

/** Reusable builder sections saved by the seller (0053). */
export const savedBlocks = pgTable("saved_blocks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	storeId: uuid("store_id").notNull(),
	authorId: uuid("author_id"),
	name: varchar({ length: 200 }).notNull(),
	description: text(),
	blockType: varchar("block_type", { length: 40 }).default('section').notNull(),
	content: jsonb().notNull(),
	thumbnailUrl: text("thumbnail_url"),
	usageCount: integer("usage_count").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("saved_blocks_store_idx").using("btree", table.storeId.asc().nullsLast().op("uuid_ops"), table.updatedAt.desc().nullsFirst().op("timestamptz_ops")),
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "saved_blocks_store_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [users.id],
			name: "saved_blocks_author_id_fkey"
		}).onDelete("set null"),
]);

/** Per-store forms (0054). */
export const storeForms = pgTable("store_forms", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	storeId: uuid("store_id").notNull(),
	key: text().notNull(),
	name: text().notNull(),
	description: text(),
	fields: jsonb().default([]).notNull(),
	settings: jsonb().default({}).notNull(),
	/** active | disabled */
	status: text().default('active').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("store_forms_store_key_key").on(table.storeId, table.key),
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "store_forms_store_id_fkey"
		}).onDelete("cascade"),
	check("store_forms_status_check", sql`status IN ('active', 'disabled')`),
	check("store_forms_key_format", sql`key ~ '^[a-z0-9][a-z0-9_-]{0,62}$'`),
]);

/** Form submissions: customer PII, 12-month retention (D28) (0054). */
export const storeFormSubmissions = pgTable("store_form_submissions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	storeId: uuid("store_id").notNull(),
	formId: uuid("form_id").notNull(),
	userId: uuid("user_id"),
	name: text(),
	email: text(),
	phone: text(),
	message: text(),
	data: jsonb().default({}).notNull(),
	/** new | read | archived | spam */
	status: text().default('new').notNull(),
	sourceUrl: text("source_url"),
	ipHash: text("ip_hash"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("store_form_submissions_store_created_idx").using("btree", table.storeId.asc().nullsLast().op("uuid_ops"), table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("store_form_submissions_form_idx").using("btree", table.formId.asc().nullsLast().op("uuid_ops"), table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "store_form_submissions_store_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.formId],
			foreignColumns: [storeForms.id],
			name: "store_form_submissions_form_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "store_form_submissions_user_id_fkey"
		}).onDelete("set null"),
	check("store_form_submissions_status_check", sql`status IN ('new', 'read', 'archived', 'spam')`),
]);

/** Per-store CMS collections; the blog is kind = 'blog' (0055). */
export const cmsCollections = pgTable("cms_collections", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	storeId: uuid("store_id").notNull(),
	kind: text().default('custom').notNull(),
	name: text().notNull(),
	slug: varchar({ length: 128 }).notNull(),
	description: text(),
	icon: text(),
	fields: jsonb().default([]).notNull(),
	primaryFieldKey: text("primary_field_key"),
	slugFieldKey: text("slug_field_key"),
	settings: jsonb().default({}).notNull(),
	isSystem: boolean("is_system").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("cms_collections_store_slug_key").on(table.storeId, table.slug),
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "cms_collections_store_id_fkey"
		}).onDelete("cascade"),
	check("cms_collections_slug_format", sql`slug ~ '^[a-z0-9](?:[a-z0-9-]{0,126}[a-z0-9])?$'`),
]);

export const cmsItems = pgTable("cms_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	collectionId: uuid("collection_id").notNull(),
	/** Must equal the collection's store_id (trigger, 0055). */
	storeId: uuid("store_id").notNull(),
	slug: varchar({ length: 200 }).notNull(),
	/** draft | published | archived */
	status: text().default('draft').notNull(),
	data: jsonb().default({}).notNull(),
	seo: jsonb().default({}).notNull(),
	publishedAt: timestamp("published_at", { withTimezone: true, mode: 'string' }),
	orderIndex: integer("order_index").default(0).notNull(),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("cms_items_collection_slug_key").on(table.collectionId, table.slug),
	index("cms_items_store_collection_status_idx").using("btree", table.storeId.asc().nullsLast().op("uuid_ops"), table.collectionId.asc().nullsLast().op("uuid_ops"), table.status.asc().nullsLast().op("text_ops"), table.orderIndex.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.collectionId],
			foreignColumns: [cmsCollections.id],
			name: "cms_items_collection_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "cms_items_store_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "cms_items_created_by_fkey"
		}).onDelete("set null"),
	check("cms_items_status_check", sql`status IN ('draft', 'published', 'archived')`),
]);

export const cmsItemRevisions = pgTable("cms_item_revisions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	itemId: uuid("item_id").notNull(),
	data: jsonb().notNull(),
	reason: text().default('manual').notNull(),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("cms_item_revisions_item_idx").using("btree", table.itemId.asc().nullsLast().op("uuid_ops"), table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	foreignKey({
			columns: [table.itemId],
			foreignColumns: [cmsItems.id],
			name: "cms_item_revisions_item_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "cms_item_revisions_created_by_fkey"
		}).onDelete("set null"),
]);

/** Per-store apps/integrations. config = public ids only; secrets encrypted app-side (0056). */
export const storeIntegrations = pgTable("store_integrations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	storeId: uuid("store_id").notNull(),
	sellerId: uuid("seller_id").notNull(),
	provider: text().notNull(),
	/** connected | error | disconnected */
	status: text().default('disconnected').notNull(),
	config: jsonb().default({}).notNull(),
	credentialsEncrypted: text("credentials_encrypted"),
	scopes: text().array().default([]).notNull(),
	externalAccountId: text("external_account_id"),
	lastError: text("last_error"),
	lastSyncedAt: timestamp("last_synced_at", { withTimezone: true, mode: 'string' }),
	connectedBy: uuid("connected_by"),
	connectedAt: timestamp("connected_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("store_integrations_store_provider_key").on(table.storeId, table.provider),
	index("store_integrations_error_idx").using("btree", table.updatedAt.desc().nullsFirst().op("timestamptz_ops")).where(sql`status = 'error'`),
	index("store_integrations_seller_idx").using("btree", table.sellerId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "store_integrations_store_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.sellerId],
			foreignColumns: [sellers.id],
			name: "store_integrations_seller_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.connectedBy],
			foreignColumns: [users.id],
			name: "store_integrations_connected_by_fkey"
		}).onDelete("set null"),
	check("store_integrations_status_check", sql`status IN ('connected', 'error', 'disconnected')`),
	check("store_integrations_provider_check", sql`provider IN ('meta_pixel', 'meta_capi', 'google_analytics', 'google_tag_manager', 'tiktok_pixel', 'snapchat_pixel', 'google_sheets', 'shopify_import')`),
]);

/** Append-only audit of sensitive store settings changes (0058). Details are masked. */
export const storeSettingsAudit = pgTable("store_settings_audit", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	storeId: uuid("store_id").notNull(),
	sellerId: uuid("seller_id").notNull(),
	actorId: uuid("actor_id"),
	/** payments | shipping | domain */
	section: text().notNull(),
	action: text().notNull(),
	changes: jsonb().default({}).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("store_settings_audit_store_idx").using("btree", table.storeId.asc().nullsLast().op("uuid_ops"), table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("store_settings_audit_seller_idx").using("btree", table.sellerId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "store_settings_audit_store_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.sellerId],
			foreignColumns: [sellers.id],
			name: "store_settings_audit_seller_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.actorId],
			foreignColumns: [users.id],
			name: "store_settings_audit_actor_id_fkey"
		}).onDelete("set null"),
	check("store_settings_audit_section_check", sql`section IN ('payments', 'shipping', 'domain')`),
]);

/** Own-delivery shipping zones per store (0057). One enabled zone per governorate. */
export const storeShippingZones = pgTable("store_shipping_zones", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	storeId: uuid("store_id").notNull(),
	name: jsonb().notNull(),
	governorates: text().array().notNull(),
	price: numeric({ precision: 10, scale: 2 }).notNull(),
	perKgSurcharge: numeric("per_kg_surcharge", { precision: 10, scale: 2 }).default('0').notNull(),
	freeOver: numeric("free_over", { precision: 10, scale: 2 }),
	deliveryDaysMin: integer("delivery_days_min").default(1).notNull(),
	deliveryDaysMax: integer("delivery_days_max").default(3).notNull(),
	codEnabled: boolean("cod_enabled").default(true).notNull(),
	enabled: boolean().default(true).notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("store_shipping_zones_store_idx").using("btree", table.storeId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "store_shipping_zones_store_id_fkey"
		}).onDelete("cascade"),
	check("store_shipping_zones_price_check", sql`price >= 0`),
	check("store_shipping_zones_per_kg_check", sql`per_kg_surcharge >= 0`),
	check("store_shipping_zones_free_over_check", sql`free_over IS NULL OR free_over >= 0`),
	check("store_shipping_zones_days_check", sql`delivery_days_min >= 0 AND delivery_days_max >= delivery_days_min`),
	check("store_shipping_zones_governorates_check", sql`cardinality(governorates) > 0`),
]);

/** Store-wallet top-ups, confirmed only by the provider webhook (0060, P6-09/P6-10). */
export const sellerWalletTopUps = pgTable("seller_wallet_top_ups", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sellerId: uuid("seller_id").notNull(),
	amount: numeric({ precision: 10, scale: 2 }).notNull(),
	currency: text().default('EGP').notNull(),
	status: walletTopUpStatus().default('pending').notNull(),
	provider: text().default('kashier').notNull(),
	/** Kashier merchantOrderId "stopup_<uuid>". */
	providerReference: text("provider_reference"),
	providerTransactionId: text("provider_transaction_id"),
	transactionId: uuid("transaction_id"),
	failureReason: text("failure_reason"),
	metadata: jsonb(),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("seller_wallet_top_ups_provider_txn").using("btree", table.provider, table.providerTransactionId).where(sql`provider_transaction_id IS NOT NULL`),
	uniqueIndex("seller_wallet_top_ups_provider_ref").using("btree", table.provider, table.providerReference).where(sql`provider_reference IS NOT NULL`),
	index("seller_wallet_top_ups_seller_idx").using("btree", table.sellerId, table.createdAt.desc()),
	foreignKey({
			columns: [table.sellerId],
			foreignColumns: [sellers.id],
			name: "seller_wallet_top_ups_seller_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.transactionId],
			foreignColumns: [walletTransactions.id],
			name: "seller_wallet_top_ups_transaction_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "seller_wallet_top_ups_created_by_fkey"
		}).onDelete("set null"),
	check("seller_wallet_top_ups_amount_check", sql`amount > 0`),
	check("seller_wallet_top_ups_currency_check", sql`currency = 'EGP'`),
]);

/**
 * Append-only log of admin overrides on a seller account or store (0063, P9-02):
 * plan, store limit, fee plan, trial, exemption, negative limit, store
 * unpublish/suspend, wallet adjustments. Written in the same transaction as the
 * change. Never holds secrets or payment details.
 */
export const adminAuditLog = pgTable("admin_audit_log", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	actorId: uuid("actor_id"),
	/** Null only for platform-wide actions such as template changes (0069). */
	sellerId: uuid("seller_id"),
	storeId: uuid("store_id"),
	/** What a platform row changed, e.g. 'template' + template id (0069). */
	targetType: text("target_type"),
	targetId: text("target_id"),
	action: text().notNull(),
	before: jsonb().default({}).notNull(),
	after: jsonb().default({}).notNull(),
	reason: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("admin_audit_log_seller_idx").using("btree", table.sellerId.asc().nullsLast().op("uuid_ops"), table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("admin_audit_log_store_idx").using("btree", table.storeId.asc().nullsLast().op("uuid_ops")).where(sql`store_id IS NOT NULL`),
	index("admin_audit_log_actor_idx").using("btree", table.actorId.asc().nullsLast().op("uuid_ops")).where(sql`actor_id IS NOT NULL`),
	foreignKey({
			columns: [table.actorId],
			foreignColumns: [users.id],
			name: "admin_audit_log_actor_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.sellerId],
			foreignColumns: [sellers.id],
			name: "admin_audit_log_seller_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "admin_audit_log_store_id_fkey"
		}).onDelete("set null"),
	check("admin_audit_log_action_check", sql`action ~ '^[a-z][a-z_]{2,63}$'`),
	check("admin_audit_log_reason_check", sql`char_length(btrim(reason)) BETWEEN 3 AND 1000`),
	check("admin_audit_log_target_check", sql`seller_id IS NOT NULL OR (store_id IS NULL AND target_type IS NOT NULL AND target_id IS NOT NULL)`),
	check("admin_audit_log_target_type_check", sql`target_type IS NULL OR target_type ~ '^[a-z][a-z_]{2,31}
`),
	index("admin_audit_log_created_idx").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
]);

/** tallaby.com newsletter sign-ups (0072). Server-only: RLS on, no policies. Emails are stored lowercased. */
export const newsletterSubscribers = pgTable("newsletter_subscribers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: text().notNull(),
	locale: text().default('ar').notNull(),
	source: text().default('blog').notNull(),
	/** 'subscribed' | 'unsubscribed' */
	status: text().default('subscribed').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	uniqueIndex("newsletter_subscribers_email_key").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("newsletter_subscribers_created_idx").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	check("newsletter_subscribers_email_check", sql`length(email) BETWEEN 3 AND 200 AND email = lower(email)`),
	check("newsletter_subscribers_locale_check", sql`locale IN ('ar', 'en')`),
	check("newsletter_subscribers_source_check", sql`source ~ '^[a-z][a-z_-]{1,31}$'`),
	check("newsletter_subscribers_status_check", sql`status IN ('subscribed', 'unsubscribed')`),
]);
