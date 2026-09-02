-- Supabase Realtime for the shipping/dispatch surfaces.
--
-- Transport is *broadcast from the database*, not `postgres_changes`. The
-- shipping app reads through Drizzle as the database owner, so `shipments` has
-- RLS enabled with no policies and `orders` only exposes a customer's own rows.
-- Making postgres_changes deliver anything would mean granting `authenticated`
-- SELECT on shipments/orders — handing every signed-in rider the whole order
-- book and its customer records via the anon key. It also cannot express the
-- one event that matters most: telling rider A a shipment was moved *away* from
-- them, because the updated row carries rider B's id.
--
-- So triggers publish a minimal {ids, status} payload to private topics and the
-- client refetches through the existing server-authorized query. Authorization
-- lives in two RLS policies on `realtime.messages`; no business table's policies
-- are touched, nothing joins the `supabase_realtime` publication, and no
-- replica identity changes.
--
-- Topics:
--   'dispatch'      — the admin surface (verified, unsuspended role='admin')
--   'rider:<uuid>'  — exactly one rider
--
-- Every statement is written to be safely re-runnable, matching 0009/0011/0017's
-- convention — this project's drizzle.__drizzle_migrations table is out of sync
-- with migrations/meta.

-- ---------------------------------------------------------------------------
-- Private schema
--
-- These live outside `public` on purpose. PostgREST exposes `public`, so a
-- SECURITY DEFINER function there is also an RPC endpoint any anon caller can
-- POST to (Supabase's database linter flags exactly this). Revoking EXECUTE
-- instead would be the wrong lever: `orders` has an INSERT policy for
-- `authenticated`, so a signed-in insert needs execute rights on that table's
-- trigger function, and revoking it would break order creation. An unexposed
-- schema removes the endpoint while leaving every write path intact.
-- ---------------------------------------------------------------------------

CREATE SCHEMA IF NOT EXISTS shipping_realtime;--> statement-breakpoint
GRANT USAGE ON SCHEMA shipping_realtime TO anon, authenticated, service_role;--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Topic authorization
-- ---------------------------------------------------------------------------

-- Mirrors requireShippingAdmin() in apps/shipping/lib/auth.ts. SECURITY DEFINER
-- so the realtime.messages policy can read public.users without the subscriber
-- gaining any new access of its own.
CREATE OR REPLACE FUNCTION shipping_realtime.is_shipping_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $fn$
	SELECT EXISTS (
		SELECT 1
		FROM public.users u
		WHERE u.id = (SELECT auth.uid())
			AND u.role = 'admin'::public.user_role
			AND u.is_verified
			AND NOT u.is_suspended
	);
$fn$;--> statement-breakpoint

-- `realtime.messages` already has RLS enabled and is owned by
-- supabase_realtime_admin, which `postgres` is not a member of — an
-- ALTER TABLE ... ENABLE ROW LEVEL SECURITY here would fail with "must be
-- owner of table messages". Creating policies on it is permitted; enabling RLS
-- is not, and is unnecessary. With RLS on and no policy the table denies
-- everything, so the two policies below are the entire client-visible surface.
--
-- SELECT only, and deliberately no INSERT policy: clients receive broadcasts
-- but can never send one, so a rider cannot forge a dispatch event. Only the
-- SECURITY DEFINER triggers below publish.
DROP POLICY IF EXISTS "shipping_rider_reads_own_topic" ON "realtime"."messages";--> statement-breakpoint
CREATE POLICY "shipping_rider_reads_own_topic" ON "realtime"."messages"
	FOR SELECT TO authenticated
	USING (realtime.topic() = 'rider:' || (SELECT auth.uid())::text);--> statement-breakpoint

DROP POLICY IF EXISTS "shipping_admin_reads_dispatch" ON "realtime"."messages";--> statement-breakpoint
CREATE POLICY "shipping_admin_reads_dispatch" ON "realtime"."messages"
	FOR SELECT TO authenticated
	USING (realtime.topic() = 'dispatch' AND shipping_realtime.is_shipping_admin());--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Trigger functions
--
-- Payloads carry ids and status only. No customer name, address, phone or COD
-- amount ever crosses the wire, so a misrouted message cannot leak one rider's
-- customer data to another. The client treats the event purely as "refetch".
--
-- Every realtime.send() is wrapped in its own exception block: a Realtime
-- outage must never roll back a delivery. (realtime.send already swallows its
-- own errors into a WARNING; this is belt and braces against that changing.)
-- ---------------------------------------------------------------------------

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
	-- NEW is unset in a DELETE trigger and OLD in an INSERT trigger; touching
	-- either raises at runtime, so branch on TG_OP explicitly.
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

		-- On reassignment the *previous* rider has to be told as well, or the
		-- delivery lingers in their list forever: the updated row no longer
		-- carries their id, so nothing row-scoped would ever reach them.
		IF prev_rider IS NOT NULL AND prev_rider IS DISTINCT FROM rec.rider_id THEN
			PERFORM realtime.send(payload, 'shipment', 'rider:' || prev_rider::text, true);
		END IF;
	EXCEPTION WHEN others THEN
		NULL;
	END;

	RETURN NULL;
END;
$fn$;--> statement-breakpoint

-- Orders, not shipments, are what a brand-new website order shows up as — the
-- Pending and Confirmed tabs list orders that have no shipment row yet, so the
-- shipments trigger alone would never announce them.
CREATE OR REPLACE FUNCTION shipping_realtime.broadcast_order_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
BEGIN
	BEGIN
		PERFORM realtime.send(
			jsonb_build_object(
				'op', tg_op,
				'orderId', new.id,
				'status', new.status::text,
				'paymentStatus', new.payment_status::text
			),
			'order', 'dispatch', true
		);
	EXCEPTION WHEN others THEN
		NULL;
	END;

	RETURN NULL;
END;
$fn$;--> statement-breakpoint

-- Riders hear about their own row too, so a duty toggle on one device settles
-- on the rider's other devices.
CREATE OR REPLACE FUNCTION shipping_realtime.broadcast_rider_change()
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
		'riderId', new.id,
		'isAvailable', new.is_available,
		'isSuspended', new.is_suspended
	);

	BEGIN
		PERFORM realtime.send(payload, 'rider', 'dispatch', true);
		PERFORM realtime.send(payload, 'rider', 'rider:' || new.id::text, true);
	EXCEPTION WHEN others THEN
		NULL;
	END;

	RETURN NULL;
END;
$fn$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION shipping_realtime.broadcast_batch_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
BEGIN
	BEGIN
		PERFORM realtime.send(
			jsonb_build_object(
				'op', tg_op,
				'batchId', new.id,
				'providerId', new.provider_id
			),
			'batch', 'dispatch', true
		);
	EXCEPTION WHEN others THEN
		NULL;
	END;

	RETURN NULL;
END;
$fn$;--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Triggers
--
-- Row-level and on the table itself, so every writer is covered — the admin
-- actions, the rider actions, bulk assign, and future writes from the
-- ecommerce app — without a second write path or any duplicated business logic.
--
-- A bulk assign of N orders emits N dispatch messages inside one transaction.
-- That is intentional: the client debounces a burst into a single refresh, and
-- realtime.messages is partitioned and auto-pruned.
-- ---------------------------------------------------------------------------

DROP TRIGGER IF EXISTS "shipments_realtime_broadcast" ON "public"."shipments";--> statement-breakpoint
CREATE TRIGGER "shipments_realtime_broadcast"
	AFTER INSERT OR UPDATE OR DELETE ON "public"."shipments"
	FOR EACH ROW EXECUTE FUNCTION shipping_realtime.broadcast_shipment_change();--> statement-breakpoint

DROP TRIGGER IF EXISTS "orders_realtime_broadcast_insert" ON "public"."orders";--> statement-breakpoint
CREATE TRIGGER "orders_realtime_broadcast_insert"
	AFTER INSERT ON "public"."orders"
	FOR EACH ROW EXECUTE FUNCTION shipping_realtime.broadcast_order_change();--> statement-breakpoint

-- Guarded so the ordinary updated_at/metadata churn on an order does not
-- broadcast; only the two columns the dispatch views actually read.
DROP TRIGGER IF EXISTS "orders_realtime_broadcast_update" ON "public"."orders";--> statement-breakpoint
CREATE TRIGGER "orders_realtime_broadcast_update"
	AFTER UPDATE ON "public"."orders"
	FOR EACH ROW
	WHEN (
		old.status IS DISTINCT FROM new.status
		OR old.payment_status IS DISTINCT FROM new.payment_status
	)
	EXECUTE FUNCTION shipping_realtime.broadcast_order_change();--> statement-breakpoint

DROP TRIGGER IF EXISTS "users_realtime_broadcast_insert" ON "public"."users";--> statement-breakpoint
CREATE TRIGGER "users_realtime_broadcast_insert"
	AFTER INSERT ON "public"."users"
	FOR EACH ROW
	WHEN (new.role::text = 'driver')
	EXECUTE FUNCTION shipping_realtime.broadcast_rider_change();--> statement-breakpoint

DROP TRIGGER IF EXISTS "users_realtime_broadcast_update" ON "public"."users";--> statement-breakpoint
CREATE TRIGGER "users_realtime_broadcast_update"
	AFTER UPDATE ON "public"."users"
	FOR EACH ROW
	WHEN (
		new.role::text = 'driver'
		AND (
			old.is_available IS DISTINCT FROM new.is_available
			OR old.is_suspended IS DISTINCT FROM new.is_suspended
			OR old.is_verified IS DISTINCT FROM new.is_verified
			OR old.full_name IS DISTINCT FROM new.full_name
			OR old.phone IS DISTINCT FROM new.phone
			OR old.role IS DISTINCT FROM new.role
		)
	)
	EXECUTE FUNCTION shipping_realtime.broadcast_rider_change();--> statement-breakpoint

DROP TRIGGER IF EXISTS "shipment_batches_realtime_broadcast" ON "public"."shipment_batches";--> statement-breakpoint
CREATE TRIGGER "shipment_batches_realtime_broadcast"
	AFTER INSERT ON "public"."shipment_batches"
	FOR EACH ROW EXECUTE FUNCTION shipping_realtime.broadcast_batch_change();--> statement-breakpoint

-- An earlier revision of this migration created these in `public`. Dropped
-- last, after the triggers and the policy above have been repointed.
DROP FUNCTION IF EXISTS public.broadcast_shipment_change();--> statement-breakpoint
DROP FUNCTION IF EXISTS public.broadcast_order_change();--> statement-breakpoint
DROP FUNCTION IF EXISTS public.broadcast_rider_change();--> statement-breakpoint
DROP FUNCTION IF EXISTS public.broadcast_batch_change();--> statement-breakpoint
DROP FUNCTION IF EXISTS public.is_shipping_admin();
