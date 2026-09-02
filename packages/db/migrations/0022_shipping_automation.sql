-- Auto Confirm / Auto Assign toggles, plus the customer order-tracking topic.
--
-- Three things:
--   1. `shipping_automation` — a single settings row behind the two toggles on
--      the Orders page.
--   2. A pg_net webhook so the automation runs headless. A website order that
--      lands at 3am must not wait for a dispatcher to open the page, and the
--      assignment logic (queue-weighted rider split, batch creation, the
--      all-or-nothing guarantee) already lives in TypeScript — so the trigger
--      does not reimplement it, it just POSTs to the dispatch app and lets the
--      existing bulkConfirmOrders/bulkAssignProvider run.
--   3. An `order:<uuid>` broadcast topic so a customer's tracking page updates
--      itself, readable only by the customer who owns that order.
--
-- Every statement is written to be safely re-runnable, matching 0009/0011/0017/
-- 0021's convention — this project's drizzle.__drizzle_migrations table is out
-- of sync with migrations/meta.

-- ---------------------------------------------------------------------------
-- 1. Settings
-- ---------------------------------------------------------------------------

-- Single-row table: the `id boolean PRIMARY KEY CHECK (id)` idiom makes a
-- second row impossible at the schema level, so no caller has to decide which
-- settings row is the real one. These are operation-wide, not per-admin —
-- "auto assign is on" is a property of the dispatch operation.
CREATE TABLE IF NOT EXISTS "shipping_automation" (
	"id" boolean PRIMARY KEY DEFAULT true NOT NULL,
	"auto_confirm" boolean DEFAULT false NOT NULL,
	"auto_assign" boolean DEFAULT false NOT NULL,
	-- Null means "our own fleet" (the tallaby provider, resolved by code at
	-- run time). The column exists so auto-assign can later be pointed at a
	-- specific external provider without another migration.
	"auto_assign_provider_id" uuid,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "shipping_automation_singleton" CHECK ("id")
);--> statement-breakpoint

DO $$ BEGIN
	ALTER TABLE "shipping_automation" ADD CONSTRAINT "shipping_automation_auto_assign_provider_id_shipping_providers_id_fk"
		FOREIGN KEY ("auto_assign_provider_id") REFERENCES "public"."shipping_providers"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

DO $$ BEGIN
	ALTER TABLE "shipping_automation" ADD CONSTRAINT "shipping_automation_updated_by_users_id_fk"
		FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

INSERT INTO "shipping_automation" ("id") VALUES (true) ON CONFLICT ("id") DO NOTHING;--> statement-breakpoint

-- RLS on with no policy, matching `shipments`: this table is read and written
-- only by Drizzle as the database owner, and leaving RLS off would expose it
-- through PostgREST (the state 0013_rls_disabled_in_public flags on
-- shipment_batches today).
ALTER TABLE "shipping_automation" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- 2. Headless automation webhook
--
-- Config lives in Vault rather than in this file or a table, so the shared
-- secret is encrypted at rest and never lands in a migration or a git diff.
-- Both secrets are optional: when either is missing the trigger is a no-op, so
-- a fresh branch database simply runs without automation instead of erroring
-- on every order insert.
--
--   select vault.create_secret('https://dispatch.tallaby.com', 'shipping_automation_url');
--   select vault.create_secret('<random>', 'shipping_automation_secret');
-- ---------------------------------------------------------------------------

-- pg_net always creates and owns its own `net` schema, whatever schema the
-- extension itself is registered in.
CREATE EXTENSION IF NOT EXISTS pg_net;--> statement-breakpoint

CREATE OR REPLACE FUNCTION shipping_realtime.notify_automation(kind text, order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
DECLARE
	base_url text;
	secret text;
BEGIN
	SELECT decrypted_secret INTO base_url
	FROM vault.decrypted_secrets WHERE name = 'shipping_automation_url';

	SELECT decrypted_secret INTO secret
	FROM vault.decrypted_secrets WHERE name = 'shipping_automation_secret';

	IF base_url IS NULL OR secret IS NULL THEN
		RETURN;
	END IF;

	-- Fire-and-forget: pg_net queues the request and returns immediately, so
	-- the order write never waits on the dispatch app, and a dispatch app that
	-- is down or slow cannot block checkout.
	PERFORM net.http_post(
		url := base_url || '/api/automation',
		headers := jsonb_build_object(
			'Content-Type', 'application/json',
			'x-automation-secret', secret
		),
		body := jsonb_build_object('kind', kind, 'orderId', order_id),
		timeout_milliseconds := 5000
	);
EXCEPTION WHEN others THEN
	-- Automation is a convenience. It must never roll back an order.
	NULL;
END;
$fn$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION shipping_realtime.on_order_automation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
DECLARE
	settings record;
BEGIN
	SELECT auto_confirm, auto_assign INTO settings FROM public.shipping_automation WHERE id;

	IF NOT FOUND THEN
		RETURN NULL;
	END IF;

	-- A prepaid order skips Pending entirely (see stageConditions() in
	-- orders.query.ts), so it lands straight in the Confirmed stage and only
	-- the assign hook applies.
	IF settings.auto_confirm
		AND new.status = 'pending'::public.order_status
		AND (new.payment_status IS NULL OR new.payment_status NOT IN ('paid', 'collected'))
	THEN
		PERFORM shipping_realtime.notify_automation('confirm', new.id);
	END IF;

	IF settings.auto_assign
		AND (
			new.status = 'confirmed'::public.order_status
			OR (new.status = 'pending'::public.order_status
				AND new.payment_status IN ('paid', 'collected'))
		)
	THEN
		PERFORM shipping_realtime.notify_automation('assign', new.id);
	END IF;

	RETURN NULL;
END;
$fn$;--> statement-breakpoint

DROP TRIGGER IF EXISTS "orders_automation_insert" ON "public"."orders";--> statement-breakpoint
CREATE TRIGGER "orders_automation_insert"
	AFTER INSERT ON "public"."orders"
	FOR EACH ROW EXECUTE FUNCTION shipping_realtime.on_order_automation();--> statement-breakpoint

-- Same guard as the realtime broadcast trigger: only a status/payment move can
-- change which stage an order sits in, so ordinary column churn never fires a
-- webhook.
DROP TRIGGER IF EXISTS "orders_automation_update" ON "public"."orders";--> statement-breakpoint
CREATE TRIGGER "orders_automation_update"
	AFTER UPDATE ON "public"."orders"
	FOR EACH ROW
	WHEN (
		old.status IS DISTINCT FROM new.status
		OR old.payment_status IS DISTINCT FROM new.payment_status
	)
	EXECUTE FUNCTION shipping_realtime.on_order_automation();--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- 3. Customer order-tracking topic
-- ---------------------------------------------------------------------------

-- The topic name carries an order id, which arrives as untrusted text from the
-- subscriber. Parsing it with a regex guard rather than a bare ::uuid cast
-- keeps a malformed topic from raising inside an RLS check.
CREATE OR REPLACE FUNCTION shipping_realtime.can_read_order_topic(topic text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $fn$
DECLARE
	raw text;
BEGIN
	IF topic IS NULL OR left(topic, 6) <> 'order:' THEN
		RETURN false;
	END IF;

	raw := substring(topic FROM 7);

	IF raw !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
		RETURN false;
	END IF;

	RETURN EXISTS (
		SELECT 1 FROM public.orders o
		WHERE o.id = raw::uuid
			AND o.user_id = (SELECT auth.uid())
	);
END;
$fn$;--> statement-breakpoint

DROP POLICY IF EXISTS "shipping_customer_reads_own_order_topic" ON "realtime"."messages";--> statement-breakpoint
CREATE POLICY "shipping_customer_reads_own_order_topic" ON "realtime"."messages"
	FOR SELECT TO authenticated
	USING (shipping_realtime.can_read_order_topic(realtime.topic()));--> statement-breakpoint

-- Extend the existing broadcasts with the per-order topic. Bodies are otherwise
-- unchanged from 0021.
CREATE OR REPLACE FUNCTION shipping_realtime.broadcast_shipment_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
DECLARE
	rec record;
	prev_rider uuid;
	payload jsonb;
BEGIN
	IF tg_op = 'DELETE' THEN
		rec := old;
	ELSIF tg_op = 'UPDATE' THEN
		rec := new;
		prev_rider := old.rider_id;
	ELSE
		rec := new;
	END IF;

	payload := jsonb_build_object(
		'op', tg_op,
		'shipmentId', rec.id,
		'orderId', rec.order_id,
		'status', rec.status::text,
		'riderId', rec.rider_id,
		'prevRiderId', prev_rider
	);

	BEGIN
		PERFORM realtime.send(payload, 'shipment', 'dispatch', true);

		IF rec.rider_id IS NOT NULL THEN
			PERFORM realtime.send(payload, 'shipment', 'rider:' || rec.rider_id::text, true);
		END IF;

		IF prev_rider IS NOT NULL AND prev_rider IS DISTINCT FROM rec.rider_id THEN
			PERFORM realtime.send(payload, 'shipment', 'rider:' || prev_rider::text, true);
		END IF;

		-- The customer's tracking page. Rider identity is deliberately not sent
		-- here — the payload the customer receives is the shipment status only.
		PERFORM realtime.send(
			jsonb_build_object('op', tg_op, 'orderId', rec.order_id, 'status', rec.status::text),
			'shipment', 'order:' || rec.order_id::text, true
		);
	EXCEPTION WHEN others THEN
		NULL;
	END;

	RETURN NULL;
END;
$fn$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION shipping_realtime.broadcast_order_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
DECLARE
	payload jsonb;
BEGIN
	payload := jsonb_build_object(
		'op', tg_op,
		'orderId', new.id,
		'status', new.status::text,
		'paymentStatus', new.payment_status::text
	);

	BEGIN
		PERFORM realtime.send(payload, 'order', 'dispatch', true);
		PERFORM realtime.send(payload, 'order', 'order:' || new.id::text, true);
	EXCEPTION WHEN others THEN
		NULL;
	END;

	RETURN NULL;
END;
$fn$;
