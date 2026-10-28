-- 0112: marks products the seller saved after the AI filled the form (PLAN.md AI-1).
--
-- `ai_source` says how the AI helped: 'autofill_add' (the "Add your product
-- with AI" card on a new product) or 'autofill_edit' (the "Edit with AI" card
-- on an existing one). A product added with AI keeps 'autofill_add' after
-- later AI edits. `ai_assisted_at` is the last save with AI changes. Products
-- saved before this migration, or without AI, stay NULL ("not AI").
--
-- Set only by the dashboard's markProductAiAssisted, after a successful
-- autofill call by the same seller. Read by Admin › Products.
--
-- Additive: old code never writes these columns. Idempotent. The app code
-- selects every products column, so apply this BEFORE deploying it.

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS ai_source text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS ai_assisted_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_ai_source_check') THEN
    ALTER TABLE public.products ADD CONSTRAINT products_ai_source_check
      CHECK (ai_source IS NULL OR ai_source IN ('autofill_add', 'autofill_edit'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS product_ai_source_idx
  ON public.products (ai_source)
  WHERE ai_source IS NOT NULL;
