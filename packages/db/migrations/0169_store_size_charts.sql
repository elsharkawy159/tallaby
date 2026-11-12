-- 0169: Size Chart app (ROADMAP.md F-92).
--
-- A store's size charts ("T-shirts", "Pants", "Shoes"…): what the shopper types
-- (height, weight, foot length…), the sizes with a range per measurement, and
-- the products or store categories each chart is applied to. The storefront
-- product page shows "Find my size" when the store has the `size_chart` app
-- installed (store_app_installs, 0139) and the product has a chart. Uninstalling
-- the app keeps these rows.
--
-- `definition` is validated by `sizeChartDefinitionSchema` in
-- packages/lib/src/size-charts/size-chart.lib.ts (≤ 8 inputs, ≤ 30 sizes);
-- the code also caps a store at 20 charts. Structured data only, never markup.
--
-- A product gets at most one chart per store from its own assignment and one
-- from its category (`seller_product_categories`, per store since 0163); the
-- product's own wins. A target's store must be its chart's store (composite FK).
--
-- Additive and idempotent. Server-only (RLS on, no policies). The dashboard
-- Apps › Size chart page reads both tables, so apply on staging, then
-- production, BEFORE deploying. (The storefront read tolerates the tables
-- being absent and just shows no chart.)

CREATE TABLE IF NOT EXISTS public.store_size_charts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id   uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  store_id    uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  -- {"ar": "...", "en": "..."}
  name        jsonb NOT NULL,
  definition  jsonb NOT NULL,
  position    integer NOT NULL DEFAULT 0,
  created_by  uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT store_size_charts_name_check CHECK (jsonb_typeof(name) = 'object' AND octet_length(name::text) <= 1024),
  CONSTRAINT store_size_charts_definition_check CHECK (jsonb_typeof(definition) = 'object' AND octet_length(definition::text) <= 65536),
  CONSTRAINT store_size_charts_id_store_key UNIQUE (id, store_id)
);

CREATE INDEX IF NOT EXISTS store_size_charts_store_idx ON public.store_size_charts (store_id, position);
CREATE INDEX IF NOT EXISTS store_size_charts_seller_idx ON public.store_size_charts (seller_id);

CREATE TABLE IF NOT EXISTS public.store_size_chart_targets (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chart_id     uuid NOT NULL,
  store_id     uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  seller_id    uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  product_id   uuid REFERENCES public.products(id) ON DELETE CASCADE,
  category_id  uuid REFERENCES public.seller_product_categories(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT store_size_chart_targets_chart_fkey FOREIGN KEY (chart_id, store_id)
    REFERENCES public.store_size_charts (id, store_id) ON DELETE CASCADE,
  CONSTRAINT store_size_chart_targets_one_check CHECK (num_nonnulls(product_id, category_id) = 1)
);

-- One chart per product, and per category, in a store.
CREATE UNIQUE INDEX IF NOT EXISTS store_size_chart_targets_product_key
  ON public.store_size_chart_targets (store_id, product_id) WHERE product_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS store_size_chart_targets_category_key
  ON public.store_size_chart_targets (store_id, category_id) WHERE category_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS store_size_chart_targets_chart_idx ON public.store_size_chart_targets (chart_id);
-- FK lookups when a product or category is deleted.
CREATE INDEX IF NOT EXISTS store_size_chart_targets_product_idx ON public.store_size_chart_targets (product_id) WHERE product_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS store_size_chart_targets_category_idx ON public.store_size_chart_targets (category_id) WHERE category_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS store_size_chart_targets_seller_idx ON public.store_size_chart_targets (seller_id);

-- Server-only.
ALTER TABLE public.store_size_charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_size_chart_targets ENABLE ROW LEVEL SECURITY;

-- Rollback: DROP TABLE public.store_size_chart_targets; DROP TABLE public.store_size_charts;
