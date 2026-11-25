-- 0180_whatsapp.sql: WhatsApp order notifications (ROADMAP.md F-109;
-- design in docs/whatsapp.md §3).
--
-- One Tallaby number sends order updates for every store, with Tallaby's own
-- utility templates (packages/lib/src/whatsapp/templates.lib.ts). Nothing
-- sends until admin turns `whatsapp_settings.enabled` on, the backend env is
-- set, the store has WhatsApp on and the order has the shopper's consent.
--
--  1. whatsapp_settings: one row (id = 1), seeded off and free.
--  2. store_whatsapp_settings: a store's on/off and chosen events. No row
--     means the admin default (`stores_default_on`) applies.
--  3. whatsapp_contacts: consent and opt-out per phone (E.164 digits, no '+').
--     Opt-out is global per phone, for every store.
--  4. whatsapp_messages: the outbox and the history (dedupe_key UNIQUE, wamid
--     UNIQUE). An in-session `reply` may have no order or store (a reply to
--     STOP); every order event row names its seller, store and order.
--  5. whatsapp_inbound: Meta inbound messages, deduped by wamid.
--  6. whatsapp_templates: Meta's state of each code template × language.
--  7. seller_notifications_type_check: widened from its live definition with
--     whatsapp_order_confirmed and whatsapp_order_cancelled.
--
-- Money: the seller price is integer US cents (0 for now: free, D3); Meta's
-- cost is integer micro-USD. No ledger or wallet is touched here.
--
-- Delete rules (0134): seller, store and order rows CASCADE to their messages;
-- people and "last store" pointers are SET NULL; an inbound row outlives its
-- order (SET NULL).
--
-- Server-only: RLS on, no policies. Additive and idempotent: safe to re-run.
-- NOT applied anywhere yet. Apply on staging, then production with owner
-- approval, BEFORE deploying code that reads these tables.
--
-- Rollback (before any message is sent): DROP the six tables and restore the
-- seller_notifications type check without the two WhatsApp types.

-- ── 1. whatsapp_settings ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.whatsapp_settings (
  id integer PRIMARY KEY DEFAULT 1,
  enabled boolean NOT NULL DEFAULT false,
  stores_default_on boolean NOT NULL DEFAULT false,
  seller_price_usd_cents integer NOT NULL DEFAULT 0,
  -- Micro-USD per message by Meta pricing category.
  meta_rate_micros jsonb NOT NULL DEFAULT '{"utility": 3600, "authentication": 3600, "marketing": 64400, "service": 3600}'::jsonb,
  events_enabled text[] NOT NULL DEFAULT ARRAY['order_placed', 'order_confirmed', 'order_shipped', 'order_out_for_delivery', 'order_delivered', 'order_cancelled'],
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  CONSTRAINT whatsapp_settings_updated_by_fkey FOREIGN KEY (updated_by)
    REFERENCES public.users(id) ON DELETE SET NULL,
  CONSTRAINT whatsapp_settings_singleton_check CHECK (id = 1),
  CONSTRAINT whatsapp_settings_price_check CHECK (seller_price_usd_cents >= 0),
  CONSTRAINT whatsapp_settings_rates_check CHECK (jsonb_typeof(meta_rate_micros) = 'object'),
  CONSTRAINT whatsapp_settings_events_check CHECK (events_enabled <@ ARRAY['order_placed', 'order_confirmed', 'order_shipped', 'order_out_for_delivery', 'order_delivered', 'order_cancelled'])
);

INSERT INTO public.whatsapp_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.whatsapp_settings ENABLE ROW LEVEL SECURITY;

-- ── 2. store_whatsapp_settings ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.store_whatsapp_settings (
  store_id uuid PRIMARY KEY,
  seller_id uuid NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  events text[] NOT NULL DEFAULT ARRAY['order_placed', 'order_confirmed', 'order_shipped', 'order_out_for_delivery', 'order_delivered', 'order_cancelled'],
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT store_whatsapp_settings_store_id_fkey FOREIGN KEY (store_id)
    REFERENCES public.stores(id) ON DELETE CASCADE,
  CONSTRAINT store_whatsapp_settings_seller_id_fkey FOREIGN KEY (seller_id)
    REFERENCES public.sellers(id) ON DELETE CASCADE,
  CONSTRAINT store_whatsapp_settings_events_check CHECK (events <@ ARRAY['order_placed', 'order_confirmed', 'order_shipped', 'order_out_for_delivery', 'order_delivered', 'order_cancelled'])
);

CREATE INDEX IF NOT EXISTS store_whatsapp_settings_seller_idx ON public.store_whatsapp_settings (seller_id);

ALTER TABLE public.store_whatsapp_settings ENABLE ROW LEVEL SECURITY;

-- ── 3. whatsapp_contacts ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.whatsapp_contacts (
  -- E.164 digits without '+', e.g. 201012345678.
  phone text PRIMARY KEY,
  -- Meta business-scoped user id (BSUID), when Meta sends one.
  wa_user_id text,
  opted_in_at timestamptz,
  opted_out_at timestamptz,
  opt_in_source text,
  consent_version text,
  last_store_id uuid,
  -- The last inbound message: opens the 24 h service window.
  last_inbound_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT whatsapp_contacts_last_store_id_fkey FOREIGN KEY (last_store_id)
    REFERENCES public.stores(id) ON DELETE SET NULL,
  CONSTRAINT whatsapp_contacts_phone_check CHECK (phone ~ '^[1-9][0-9]{7,14}$'),
  CONSTRAINT whatsapp_contacts_opt_in_source_check CHECK (opt_in_source IS NULL OR opt_in_source IN ('checkout')),
  CONSTRAINT whatsapp_contacts_wa_user_id_check CHECK (wa_user_id IS NULL OR char_length(wa_user_id) BETWEEN 1 AND 200),
  CONSTRAINT whatsapp_contacts_consent_version_check CHECK (consent_version IS NULL OR char_length(consent_version) BETWEEN 1 AND 50)
);

CREATE INDEX IF NOT EXISTS whatsapp_contacts_wa_user_id_idx ON public.whatsapp_contacts (wa_user_id) WHERE wa_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS whatsapp_contacts_last_store_idx ON public.whatsapp_contacts (last_store_id) WHERE last_store_id IS NOT NULL;

ALTER TABLE public.whatsapp_contacts ENABLE ROW LEVEL SECURITY;

-- ── 4. whatsapp_messages ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid,
  store_id uuid,
  order_id uuid,
  event text NOT NULL,
  -- order:<orderId>:<event> or reply:<inboundWamid>
  dedupe_key text NOT NULL,
  to_phone text NOT NULL,
  locale text NOT NULL DEFAULT 'ar',
  kind text NOT NULL DEFAULT 'template',
  template_name text,
  template_language text,
  -- The rendered parameters (no secrets).
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'queued',
  attempts integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  claimed_at timestamptz,
  wamid text,
  error_code integer,
  error_title text,
  error_detail text,
  pricing_category text,
  pricing_type text,
  meta_cost_micros integer,
  price_usd_cents integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  failed_at timestamptz,
  CONSTRAINT whatsapp_messages_dedupe_key_key UNIQUE (dedupe_key),
  CONSTRAINT whatsapp_messages_wamid_key UNIQUE (wamid),
  CONSTRAINT whatsapp_messages_seller_id_fkey FOREIGN KEY (seller_id)
    REFERENCES public.sellers(id) ON DELETE CASCADE,
  CONSTRAINT whatsapp_messages_store_id_fkey FOREIGN KEY (store_id)
    REFERENCES public.stores(id) ON DELETE CASCADE,
  CONSTRAINT whatsapp_messages_order_id_fkey FOREIGN KEY (order_id)
    REFERENCES public.orders(id) ON DELETE CASCADE,
  CONSTRAINT whatsapp_messages_event_check CHECK (event IN (
    'order_placed', 'order_confirmed', 'order_shipped', 'order_out_for_delivery',
    'order_delivered', 'order_cancelled', 'reply'
  )),
  -- Every order event names its seller, store and order.
  CONSTRAINT whatsapp_messages_order_event_check CHECK (event = 'reply' OR (seller_id IS NOT NULL AND store_id IS NOT NULL AND order_id IS NOT NULL)),
  CONSTRAINT whatsapp_messages_dedupe_key_check CHECK (char_length(dedupe_key) BETWEEN 1 AND 200),
  CONSTRAINT whatsapp_messages_to_phone_check CHECK (to_phone ~ '^[1-9][0-9]{7,14}$'),
  CONSTRAINT whatsapp_messages_locale_check CHECK (locale IN ('ar', 'en')),
  CONSTRAINT whatsapp_messages_kind_check CHECK (kind IN ('template', 'text')),
  CONSTRAINT whatsapp_messages_template_check CHECK (kind <> 'template' OR (template_name IS NOT NULL AND template_language IS NOT NULL)),
  CONSTRAINT whatsapp_messages_payload_check CHECK (jsonb_typeof(payload) = 'object' AND octet_length(payload::text) <= 16384),
  CONSTRAINT whatsapp_messages_status_check CHECK (status IN ('queued', 'sending', 'sent', 'delivered', 'read', 'failed', 'skipped', 'unknown')),
  CONSTRAINT whatsapp_messages_attempts_check CHECK (attempts BETWEEN 0 AND 100),
  CONSTRAINT whatsapp_messages_error_title_check CHECK (error_title IS NULL OR char_length(error_title) <= 500),
  CONSTRAINT whatsapp_messages_error_detail_check CHECK (error_detail IS NULL OR char_length(error_detail) <= 2000),
  CONSTRAINT whatsapp_messages_meta_cost_check CHECK (meta_cost_micros IS NULL OR meta_cost_micros >= 0),
  CONSTRAINT whatsapp_messages_price_check CHECK (price_usd_cents >= 0)
);

-- The dispatcher's claim.
CREATE INDEX IF NOT EXISTS whatsapp_messages_queued_idx ON public.whatsapp_messages (next_attempt_at) WHERE status = 'queued';
-- The seller's history and stats.
CREATE INDEX IF NOT EXISTS whatsapp_messages_store_created_idx ON public.whatsapp_messages (store_id, created_at DESC);
-- Admin failed messages and usage.
CREATE INDEX IF NOT EXISTS whatsapp_messages_status_created_idx ON public.whatsapp_messages (status, created_at DESC);
-- FK lookups when an order is deleted.
CREATE INDEX IF NOT EXISTS whatsapp_messages_order_idx ON public.whatsapp_messages (order_id) WHERE order_id IS NOT NULL;

ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- ── 5. whatsapp_inbound ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.whatsapp_inbound (
  -- Meta's inbound message id: the dedupe.
  wamid text PRIMARY KEY,
  from_phone text,
  wa_user_id text,
  type text NOT NULL,
  context_wamid text,
  body text,
  action text NOT NULL DEFAULT 'other',
  order_id uuid,
  result text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT whatsapp_inbound_order_id_fkey FOREIGN KEY (order_id)
    REFERENCES public.orders(id) ON DELETE SET NULL,
  CONSTRAINT whatsapp_inbound_sender_check CHECK (num_nonnulls(from_phone, wa_user_id) >= 1),
  CONSTRAINT whatsapp_inbound_from_phone_check CHECK (from_phone IS NULL OR from_phone ~ '^[1-9][0-9]{7,14}$'),
  CONSTRAINT whatsapp_inbound_type_check CHECK (char_length(type) BETWEEN 1 AND 50),
  CONSTRAINT whatsapp_inbound_body_check CHECK (body IS NULL OR char_length(body) <= 1000),
  CONSTRAINT whatsapp_inbound_action_check CHECK (action IN ('confirm', 'cancel', 'stop', 'other')),
  CONSTRAINT whatsapp_inbound_result_check CHECK (result IS NULL OR result IN ('confirmed', 'cancelled', 'already', 'refused', 'not_found', 'opted_out', 'ignored'))
);

-- The 90-day clean-up.
CREATE INDEX IF NOT EXISTS whatsapp_inbound_created_idx ON public.whatsapp_inbound (created_at);
CREATE INDEX IF NOT EXISTS whatsapp_inbound_order_idx ON public.whatsapp_inbound (order_id) WHERE order_id IS NOT NULL;

ALTER TABLE public.whatsapp_inbound ENABLE ROW LEVEL SECURITY;

-- ── 6. whatsapp_templates ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
  name text NOT NULL,
  language text NOT NULL,
  meta_template_id text,
  category text,
  status text NOT NULL DEFAULT 'not_submitted',
  rejected_reason text,
  quality text,
  synced_at timestamptz,
  CONSTRAINT whatsapp_templates_pkey PRIMARY KEY (name, language),
  CONSTRAINT whatsapp_templates_name_check CHECK (name ~ '^[a-z0-9_]{1,512}$'),
  CONSTRAINT whatsapp_templates_language_check CHECK (language IN ('ar', 'en')),
  CONSTRAINT whatsapp_templates_status_check CHECK (status IN ('not_submitted', 'pending', 'approved', 'rejected', 'paused', 'disabled'))
);

ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

-- ── 7. Seller bell types, widened from the live definition ───────────────
DO $$
DECLARE
  def text;
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['whatsapp_order_confirmed', 'whatsapp_order_cancelled'] LOOP
    SELECT pg_get_constraintdef(oid) INTO def FROM pg_constraint
    WHERE conname = 'seller_notifications_type_check'
      AND conrelid = 'public.seller_notifications'::regclass;
    IF def IS NOT NULL AND def NOT LIKE '%''' || t || '''%' THEN
      EXECUTE 'ALTER TABLE public.seller_notifications DROP CONSTRAINT seller_notifications_type_check';
      EXECUTE 'ALTER TABLE public.seller_notifications ADD CONSTRAINT seller_notifications_type_check ' ||
        regexp_replace(def, '\]', ', ''' || t || '''::text]');
    END IF;
  END LOOP;
END $$;
