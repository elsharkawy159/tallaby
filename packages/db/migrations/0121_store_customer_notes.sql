-- 0121: Customer notes and tags (ROADMAP.md F-01c).
--
-- Orders › Customers groups a store's orders into customers (no table of its
-- own). This table holds what the seller writes about one of them: a free
-- note and a few short tags ("VIP", "wholesale", "call before shipping").
--
-- customer_key is the key the Customers page uses: 'p:<phone>' (01XXXXXXXXX
-- for Egyptian mobiles, else the digits typed) or 'u:<user uuid>' when the
-- orders have no usable phone. One row per store and customer.
--
-- Server-only (RLS on, no policies). Additive and idempotent.

CREATE TABLE IF NOT EXISTS public.store_customer_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_key text NOT NULL,
  note text,
  tags text[] NOT NULL DEFAULT '{}',
  updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT store_customer_notes_key_format CHECK (
    customer_key ~ '^p:[0-9]{6,20}$'
    OR customer_key ~ '^u:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  ),
  CONSTRAINT store_customer_notes_note_length CHECK (note IS NULL OR char_length(note) <= 2000),
  CONSTRAINT store_customer_notes_tags_count CHECK (cardinality(tags) <= 10)
);

CREATE UNIQUE INDEX IF NOT EXISTS store_customer_notes_store_key
  ON public.store_customer_notes (store_id, customer_key);

ALTER TABLE public.store_customer_notes ENABLE ROW LEVEL SECURITY;
