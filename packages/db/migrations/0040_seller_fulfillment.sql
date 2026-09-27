-- Seller fulfillment configuration.
--
-- A seller tells Tallaby, per operational service, whether they handle it or
-- Tallaby does. Onboarding captures a REQUEST, never a purchase: Tallaby then
-- contacts the seller, the commercial terms are agreed, and an admin activates
-- the service. Three concerns are therefore kept apart:
--
--   fulfillment_plans               what Tallaby offers (admin-managed catalog)
--   seller_fulfillment_services     per seller x service: requested_* (what the
--                                   seller asked for) and active_* (what orders
--                                   actually run under). Only an admin
--                                   activation copies requested -> active, so a
--                                   change request can never break live orders.
--   seller_fulfillment_agreements   the negotiated commercial terms
--
-- seller_fulfillment_profiles holds the onboarding answers that are per seller
-- rather than per service (model, operational estimates, pickup address, terms).
--
-- Service TYPES are an enum, not a table: code branches on them. Only plans
-- are data. Prices/limits are nullable jsonb on purpose - nothing is priced yet
-- and the UI shows "Pricing will be discussed with our team" when null.
--
-- Idempotent, like 0009/0017/0025/0037. Server-side (Drizzle) access only.

DO $$ BEGIN
  CREATE TYPE fulfillment_service_type AS ENUM ('storage', 'packaging', 'delivery', 'customer_service', 'returns');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE fulfillment_provider AS ENUM ('seller', 'tallaby');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE fulfillment_model AS ENUM ('seller_managed', 'tallaby_fulfillment');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE fulfillment_service_status AS ENUM ('requested', 'under_review', 'awaiting_agreement', 'active', 'paused', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE fulfillment_review_status AS ENUM ('pending_contact', 'contacted', 'configured');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE fulfillment_agreement_status AS ENUM ('draft', 'proposed', 'accepted', 'active', 'superseded', 'terminated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fulfillment_plans (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code            text NOT NULL,
  service_type    fulfillment_service_type NOT NULL,
  name_en         text NOT NULL,
  name_ar         text NOT NULL,
  description_en  text,
  description_ar  text,
  -- [{ "en": "...", "ar": "..." }]
  features        jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- Free-form, admin-defined (e.g. { "skus": 500, "units": 2000 }). Null = not set.
  limits          jsonb,
  -- { model, amount, unit, note_en, note_ar }. Null = not priced yet.
  pricing         jsonb,
  -- Delivery plans only; reuses the existing shipping_speed enum.
  shipping_speed  shipping_speed,
  -- e.g. { "governorates": ["CAIRO", "GIZA"] }. Null = confirmed case by case.
  availability    jsonb,
  is_active       boolean NOT NULL DEFAULT true,
  sort_order      integer NOT NULL DEFAULT 0,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  CONSTRAINT fulfillment_plans_code_unique UNIQUE (code),
  -- Target of the composite FKs below: a plan can only be attached to a
  -- seller service row of the same service type.
  CONSTRAINT fulfillment_plans_id_service_type_unique UNIQUE (id, service_type),
  CONSTRAINT fulfillment_plans_features_is_array CHECK (jsonb_typeof(features) = 'array')
);

CREATE INDEX IF NOT EXISTS fulfillment_plans_service_type_idx
  ON fulfillment_plans (service_type, sort_order);

-- ---------------------------------------------------------------------------
-- Per-seller onboarding profile
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS seller_fulfillment_profiles (
  seller_id            uuid PRIMARY KEY REFERENCES sellers (id) ON DELETE CASCADE,
  model                fulfillment_model NOT NULL,
  operational_details  jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- { governorate, city, street, landmark, contactName, contactPhone }
  pickup_address       jsonb,
  submitted_at         timestamptz DEFAULT now(),
  terms_accepted_at    timestamptz,
  terms_version        text,
  review_status        fulfillment_review_status NOT NULL DEFAULT 'pending_contact',
  admin_notes          text,
  reviewed_by          uuid REFERENCES users (id) ON DELETE SET NULL,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS seller_fulfillment_profiles_review_status_idx
  ON seller_fulfillment_profiles (review_status);

-- ---------------------------------------------------------------------------
-- Negotiated terms (created before services so services can reference it)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS seller_fulfillment_agreements (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id            uuid NOT NULL REFERENCES sellers (id) ON DELETE CASCADE,
  service_type         fulfillment_service_type NOT NULL,
  plan_id              uuid,
  -- [{ fee_type, amount, unit, note }]
  rates                jsonb NOT NULL DEFAULT '[]'::jsonb,
  effective_from       date,
  effective_to         date,
  status               fulfillment_agreement_status NOT NULL DEFAULT 'draft',
  notes                text,
  created_by           uuid REFERENCES users (id) ON DELETE SET NULL,
  approved_by          uuid REFERENCES users (id) ON DELETE SET NULL,
  seller_confirmed_at  timestamptz,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now(),
  CONSTRAINT seller_fulfillment_agreements_plan_fk
    FOREIGN KEY (plan_id, service_type) REFERENCES fulfillment_plans (id, service_type),
  CONSTRAINT seller_fulfillment_agreements_rates_is_array CHECK (jsonb_typeof(rates) = 'array'),
  CONSTRAINT seller_fulfillment_agreements_dates_ordered
    CHECK (effective_to IS NULL OR effective_from IS NULL OR effective_to >= effective_from)
);

CREATE INDEX IF NOT EXISTS seller_fulfillment_agreements_seller_idx
  ON seller_fulfillment_agreements (seller_id, service_type);

-- ---------------------------------------------------------------------------
-- Per-seller, per-service configuration: requested vs active
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS seller_fulfillment_services (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id           uuid NOT NULL REFERENCES sellers (id) ON DELETE CASCADE,
  service_type        fulfillment_service_type NOT NULL,
  requested_provider  fulfillment_provider NOT NULL,
  requested_plan_id   uuid,
  requested_config    jsonb NOT NULL DEFAULT '{}'::jsonb,
  requested_at        timestamptz DEFAULT now(),
  active_provider     fulfillment_provider NOT NULL,
  active_plan_id      uuid,
  active_config       jsonb NOT NULL DEFAULT '{}'::jsonb,
  activated_at        timestamptz,
  status              fulfillment_service_status NOT NULL DEFAULT 'requested',
  agreement_id        uuid REFERENCES seller_fulfillment_agreements (id) ON DELETE SET NULL,
  notes               text,
  updated_by          uuid REFERENCES users (id) ON DELETE SET NULL,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),
  CONSTRAINT seller_fulfillment_services_seller_service_unique UNIQUE (seller_id, service_type),
  CONSTRAINT seller_fulfillment_services_requested_plan_fk
    FOREIGN KEY (requested_plan_id, service_type) REFERENCES fulfillment_plans (id, service_type),
  CONSTRAINT seller_fulfillment_services_active_plan_fk
    FOREIGN KEY (active_plan_id, service_type) REFERENCES fulfillment_plans (id, service_type),
  -- Plans are Tallaby offerings; a seller-handled service never carries one.
  CONSTRAINT seller_fulfillment_services_requested_seller_no_plan
    CHECK (requested_provider = 'tallaby' OR requested_plan_id IS NULL),
  CONSTRAINT seller_fulfillment_services_active_seller_no_plan
    CHECK (active_provider = 'tallaby' OR active_plan_id IS NULL)
);

CREATE INDEX IF NOT EXISTS seller_fulfillment_services_status_idx
  ON seller_fulfillment_services (status);

ALTER TABLE fulfillment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_fulfillment_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_fulfillment_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_fulfillment_services ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Seed catalog. No prices, no limits: admins fill those in once agreed.
-- ON CONFLICT DO NOTHING so admin edits are never overwritten by a re-run.
-- ---------------------------------------------------------------------------
INSERT INTO fulfillment_plans
  (code, service_type, name_en, name_ar, description_en, description_ar, features, shipping_speed, sort_order)
VALUES
  ('storage_basic', 'storage', 'Storage Basic', 'التخزين الأساسي',
   'For small and new sellers.', 'للبائعين الصغار والجدد.',
   '[{"en":"Inventory receiving","ar":"استلام المخزون"},{"en":"Inventory storage","ar":"تخزين المخزون"},{"en":"Inventory tracking","ar":"تتبع المخزون"},{"en":"Stock counting","ar":"جرد المخزون"},{"en":"Basic warehouse handling","ar":"مناولة أساسية في المستودع"}]'::jsonb,
   NULL, 10),
  ('storage_growth', 'storage', 'Storage Growth', 'تخزين النمو',
   'For growing sellers.', 'للبائعين في مرحلة النمو.',
   '[{"en":"Larger inventory capacity","ar":"سعة مخزون أكبر"},{"en":"More SKUs","ar":"عدد أكبر من المنتجات"},{"en":"Inventory organization","ar":"تنظيم المخزون"},{"en":"Inventory receiving","ar":"استلام المخزون"},{"en":"Stock reporting","ar":"تقارير المخزون"},{"en":"Inventory reconciliation","ar":"مطابقة المخزون"}]'::jsonb,
   NULL, 20),
  ('storage_business', 'storage', 'Storage Business', 'تخزين الأعمال',
   'For larger sellers.', 'للبائعين الكبار.',
   '[{"en":"Higher storage capacity","ar":"سعة تخزين أعلى"},{"en":"Higher SKU capacity","ar":"عدد منتجات أعلى"},{"en":"Priority receiving","ar":"أولوية في استلام المخزون"},{"en":"Advanced inventory organization","ar":"تنظيم متقدم للمخزون"},{"en":"Advanced inventory reporting","ar":"تقارير مخزون متقدمة"}]'::jsonb,
   NULL, 30),
  ('packaging_standard', 'packaging', 'Standard Packaging', 'التغليف القياسي',
   'For everyday products.', 'للمنتجات العادية.',
   '[{"en":"Standard Tallaby packaging","ar":"تغليف طلبي القياسي"},{"en":"Product protection","ar":"حماية المنتج"},{"en":"Shipping label","ar":"ملصق الشحن"},{"en":"Order preparation","ar":"تجهيز الطلب"}]'::jsonb,
   NULL, 10),
  ('packaging_branded', 'packaging', 'Branded Packaging', 'تغليف بعلامتك التجارية',
   'For sellers who want their own brand on every order.', 'للبائعين الذين يريدون ظهور علامتهم التجارية في كل طلب.',
   '[{"en":"Seller-branded packaging","ar":"تغليف بعلامتك التجارية"},{"en":"Inserts and cards","ar":"بطاقات ومطبوعات داخل الطلب"},{"en":"Branded presentation","ar":"عرض يحمل هويتك"},{"en":"Shipping label","ar":"ملصق الشحن"}]'::jsonb,
   NULL, 20),
  ('packaging_fragile', 'packaging', 'Fragile Packaging', 'تغليف المنتجات القابلة للكسر',
   'For fragile products.', 'للمنتجات القابلة للكسر.',
   '[{"en":"Additional protective materials","ar":"مواد حماية إضافية"},{"en":"Extra product protection","ar":"حماية إضافية للمنتج"},{"en":"Fragile handling","ar":"مناولة خاصة للمنتجات القابلة للكسر"}]'::jsonb,
   NULL, 30),
  ('packaging_gift', 'packaging', 'Gift Packaging', 'تغليف الهدايا',
   'For gift-oriented products.', 'للمنتجات المخصصة للهدايا.',
   '[{"en":"Gift presentation","ar":"عرض مناسب للهدايا"},{"en":"Gift packaging","ar":"تغليف هدايا"},{"en":"Optional card or message","ar":"بطاقة أو رسالة اختيارية"},{"en":"Additional protection","ar":"حماية إضافية"}]'::jsonb,
   NULL, 40),
  ('delivery_standard', 'delivery', 'Standard Delivery', 'التوصيل العادي',
   'Delivery through Tallaby logistics and partner providers.', 'التوصيل عبر شبكة طلبي وشركائها.',
   '[{"en":"Standard delivery service","ar":"خدمة توصيل عادية"},{"en":"Order tracking","ar":"تتبع الطلب"},{"en":"Tallaby logistics network","ar":"شبكة طلبي اللوجستية"}]'::jsonb,
   'standard', 10),
  ('delivery_express', 'delivery', 'Express Delivery', 'التوصيل السريع',
   'Faster delivery with priority handling, where available.', 'توصيل أسرع مع أولوية في التجهيز، حسب التوفر.',
   '[{"en":"Faster delivery","ar":"توصيل أسرع"},{"en":"Priority handling","ar":"أولوية في التجهيز"},{"en":"Order tracking","ar":"تتبع الطلب"}]'::jsonb,
   'expedited', 20),
  ('delivery_same_day', 'delivery', 'Same-Day Delivery', 'التوصيل في نفس اليوم',
   'Same-day delivery in eligible areas.', 'توصيل في نفس اليوم في المناطق المؤهلة.',
   '[{"en":"Same-day service in eligible areas","ar":"خدمة في نفس اليوم في المناطق المؤهلة"},{"en":"Priority logistics","ar":"أولوية لوجستية"}]'::jsonb,
   'same_day', 30),
  ('customer_service_tallaby', 'customer_service', 'Tallaby Customer Service', 'خدمة عملاء طلبي',
   'Tallaby answers your customers on your behalf.', 'يتولى فريق طلبي الرد على عملائك نيابةً عنك.',
   '[{"en":"Order questions","ar":"الاستفسارات عن الطلبات"},{"en":"Delivery questions","ar":"الاستفسارات عن التوصيل"},{"en":"Basic product and order support","ar":"دعم أساسي للمنتجات والطلبات"},{"en":"Customer follow-up","ar":"متابعة العملاء"},{"en":"Escalation to you when needed","ar":"التصعيد إليك عند الحاجة"}]'::jsonb,
   NULL, 10),
  ('returns_tallaby', 'returns', 'Tallaby Returns', 'إدارة المرتجعات من طلبي',
   'Tallaby coordinates returns from request to receiving.', 'تتولى طلبي تنسيق المرتجعات من الطلب حتى الاستلام.',
   '[{"en":"Return requests","ar":"طلبات الإرجاع"},{"en":"Pickup where applicable","ar":"الاستلام من العميل عند الإمكان"},{"en":"Warehouse receiving","ar":"الاستلام في المستودع"},{"en":"Inspection","ar":"الفحص"},{"en":"Return status updates","ar":"تحديثات حالة الإرجاع"},{"en":"Seller notification","ar":"إشعار البائع"}]'::jsonb,
   NULL, 10)
ON CONFLICT (code) DO NOTHING;

COMMENT ON COLUMN sellers.fulfillment_options IS
  'Deprecated: never written. Superseded by seller_fulfillment_profiles / seller_fulfillment_services (0040).';
