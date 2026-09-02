-- A per-customer notification topic, so the storefront navbar's bell reacts to
-- a new notification instead of only discovering it on the next page load.
--
-- The broadcast is driven by an INSERT trigger on `notifications` rather than
-- from the code that writes the row: notifications are created from several
-- places (shipment status changes in the dispatch app, returns and customer
-- events in the storefront), and putting it on the table means every one of
-- them reaches the bell without each having to remember to publish.
--
-- Every statement is written to be safely re-runnable, matching 0009/0011/0017/
-- 0021/0022's convention — this project's drizzle.__drizzle_migrations table is
-- out of sync with migrations/meta.

-- The payload is a count-free nudge: it says "you have a new notification", not
-- what it says. The navbar refetches through the existing owner-scoped
-- getNotifications()/getUnreadNotificationCount() actions, so nothing about the
-- notification's content crosses the wire.
CREATE OR REPLACE FUNCTION shipping_realtime.broadcast_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
BEGIN
	BEGIN
		PERFORM realtime.send(
			jsonb_build_object('op', tg_op, 'type', new.type::text),
			'notification',
			'user:' || new.user_id::text,
			true
		);
	EXCEPTION WHEN others THEN
		NULL;
	END;

	RETURN NULL;
END;
$fn$;--> statement-breakpoint

DROP TRIGGER IF EXISTS "notifications_realtime_broadcast" ON "public"."notifications";--> statement-breakpoint
CREATE TRIGGER "notifications_realtime_broadcast"
	AFTER INSERT ON "public"."notifications"
	FOR EACH ROW EXECUTE FUNCTION shipping_realtime.broadcast_notification();--> statement-breakpoint

-- Each signed-in user may read their own topic and no one else's.
DROP POLICY IF EXISTS "user_reads_own_topic" ON "realtime"."messages";--> statement-breakpoint
CREATE POLICY "user_reads_own_topic" ON "realtime"."messages"
	FOR SELECT TO authenticated
	USING (realtime.topic() = 'user:' || (SELECT auth.uid())::text);
