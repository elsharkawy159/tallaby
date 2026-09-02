CREATE TABLE IF NOT EXISTS "email_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email_type" text NOT NULL,
	"reference_id" uuid,
	"recipient" text NOT NULL,
	"resend_email_id" text,
	"status" text DEFAULT 'claimed' NOT NULL,
	"error_message" text,
	"metadata" jsonb,
	"sent_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"bounced_at" timestamp with time zone,
	"complained_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"last_event_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" text NOT NULL,
	"email_delivery_id" uuid,
	"resend_email_id" text,
	"type" text NOT NULL,
	"payload" jsonb,
	"occurred_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_events_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
ALTER TABLE "email_events" DROP CONSTRAINT IF EXISTS "email_events_email_delivery_id_email_deliveries_id_fk";
--> statement-breakpoint
ALTER TABLE "email_events" ADD CONSTRAINT "email_events_email_delivery_id_email_deliveries_id_fk" FOREIGN KEY ("email_delivery_id") REFERENCES "public"."email_deliveries"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "email_deliveries_type_reference_idx" ON "email_deliveries" USING btree ("email_type" text_ops,"reference_id" uuid_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_deliveries_resend_email_id_idx" ON "email_deliveries" USING btree ("resend_email_id" text_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_deliveries_status_idx" ON "email_deliveries" USING btree ("status" text_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_events_resend_email_id_idx" ON "email_events" USING btree ("resend_email_id" text_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_events_type_idx" ON "email_events" USING btree ("type" text_ops);
