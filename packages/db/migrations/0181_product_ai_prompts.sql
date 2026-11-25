-- 0181: What the seller typed for an AI product fill (owner, 2026-11-26).
--
-- Admin › Products › <product> shows the prompt behind a product made or
-- edited with AI, so the team can investigate a bad result. Until now nothing
-- kept it: ai_usage_logs (0110) has only model, tokens and cost, and
-- products.ai_source / ai_assisted_at (0112) only say that AI was used.
--
-- One row per successful autofill call (dashboard /api/ai/product-autofill,
-- source 'seller'; Admin › Store › Products › Fill with AI, source 'admin'):
-- the text as typed (trimmed, capped at AUTOFILL_LIMITS.maxTextLength = 1500),
-- the number of photos and whether a PDF was sent. Never the photos, the PDF
-- or the current-listing JSON of an edit. `product_id` stays NULL until the
-- product is saved: markProductAiAssisted (dashboard) or the Admin create then
-- links the seller+store's unlinked rows of the last 24 hours to it
-- (`linkAutofillPrompts` in packages/lib/src/products/ai-prompts.server.ts).
--
-- Additive and idempotent. Server-only (RLS on, no policies). Not applied yet:
-- apply on staging, then production with owner approval. The code tolerates
-- the table being absent (recording and linking are skipped, Admin shows
-- "Prompt not recorded"), so it can land before or after the deploy.

CREATE TABLE IF NOT EXISTS public.product_ai_prompts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id    uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  store_id     uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id   uuid REFERENCES public.products(id) ON DELETE CASCADE,
  mode         text NOT NULL,
  -- 'seller' = the seller's dashboard; 'admin' = an admin filling a product for the store.
  source       text NOT NULL DEFAULT 'seller',
  admin_id     uuid REFERENCES public.users(id) ON DELETE SET NULL,
  prompt_text  text NOT NULL,
  image_count  integer NOT NULL DEFAULT 0,
  has_pdf      boolean NOT NULL DEFAULT false,
  cached       boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  linked_at    timestamptz,
  CONSTRAINT product_ai_prompts_mode_check CHECK (mode IN ('add', 'edit')),
  CONSTRAINT product_ai_prompts_source_check CHECK (source IN ('seller', 'admin')),
  CONSTRAINT product_ai_prompts_text_check CHECK (char_length(prompt_text) <= 1500),
  CONSTRAINT product_ai_prompts_image_count_check CHECK (image_count >= 0)
);

-- Linking: a seller+store's unlinked rows, newest first.
CREATE INDEX IF NOT EXISTS product_ai_prompts_unlinked_idx
  ON public.product_ai_prompts (seller_id, store_id, created_at DESC) WHERE product_id IS NULL;
-- Admin's product page (and the FK lookup when a product is deleted).
CREATE INDEX IF NOT EXISTS product_ai_prompts_product_idx
  ON public.product_ai_prompts (product_id, created_at) WHERE product_id IS NOT NULL;
-- FK lookups when a store is deleted.
CREATE INDEX IF NOT EXISTS product_ai_prompts_store_idx ON public.product_ai_prompts (store_id);

-- Server-only.
ALTER TABLE public.product_ai_prompts ENABLE ROW LEVEL SECURITY;

-- Rollback: DROP TABLE public.product_ai_prompts;
