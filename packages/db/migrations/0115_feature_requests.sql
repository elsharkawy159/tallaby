-- 0115: public seller roadmap (dashboard.tallaby.com/roadmap).
--
-- `feature_requests` holds every roadmap card: ideas sellers suggest (status
-- 'waiting', `seller_id` set) and items the Tallaby team adds (`seller_id`
-- NULL, optional English copy in `title_en` / `description_en`, `roadmap_ref`
-- = the ROADMAP.md feature id). The team moves a card between columns by
-- changing `status`; `hidden_at` takes a card off the page (spam, duplicates).
--
-- `feature_request_votes` is one vote per seller per card; the vote count is
-- computed from it, so it can never drift.
--
-- Server-only: RLS on with no policies (the page reads through Drizzle).
-- A seller suggestion also drops a `feature_request_created` row into the
-- admin bell (0098's `admin_notifications`); Admin › Roadmap manages the cards.
-- Additive and idempotent; the seed is insert-only, keyed by `roadmap_ref`.

CREATE TABLE IF NOT EXISTS public.feature_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'waiting',
  category text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  title_en text,
  description_en text,
  seller_id uuid REFERENCES public.sellers(id) ON DELETE SET NULL,
  roadmap_ref text,
  launched_at date,
  hidden_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT feature_requests_status_check
    CHECK (status IN ('waiting', 'planned', 'in_progress', 'launched')),
  CONSTRAINT feature_requests_category_check
    CHECK (category IN ('orders', 'payments', 'shipping', 'products', 'marketing', 'website', 'reports', 'other')),
  CONSTRAINT feature_requests_title_check CHECK (char_length(title) BETWEEN 3 AND 120),
  CONSTRAINT feature_requests_description_check CHECK (char_length(description) <= 2000),
  CONSTRAINT feature_requests_roadmap_ref_key UNIQUE (roadmap_ref)
);

CREATE INDEX IF NOT EXISTS feature_requests_status_idx
  ON public.feature_requests (status, created_at DESC)
  WHERE hidden_at IS NULL;
CREATE INDEX IF NOT EXISTS feature_requests_seller_created_idx
  ON public.feature_requests (seller_id, created_at DESC)
  WHERE seller_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.feature_request_votes (
  request_id uuid NOT NULL REFERENCES public.feature_requests(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (request_id, seller_id)
);

CREATE INDEX IF NOT EXISTS feature_request_votes_seller_idx
  ON public.feature_request_votes (seller_id);

ALTER TABLE public.feature_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_request_votes ENABLE ROW LEVEL SECURITY;

-- Admin bell: a seller suggested an idea. Same rules as 0098: never blocks the
-- insert, one row per card. The type list is 0098's plus the new type. Guarded:
-- a later migration (0116) widens the list again, so a re-run must not narrow it.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'admin_notifications_type_check'
      AND pg_get_constraintdef(oid) LIKE '%feature_request_created%'
  ) THEN
    ALTER TABLE public.admin_notifications DROP CONSTRAINT IF EXISTS admin_notifications_type_check;
    ALTER TABLE public.admin_notifications ADD CONSTRAINT admin_notifications_type_check CHECK (
      type IN ('seller_created', 'store_created', 'store_published', 'top_up_requested', 'feature_request_created')
    );
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.notify_admin_feature_request_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
BEGIN
  IF new.seller_id IS NULL THEN
    RETURN NULL;
  END IF;
  BEGIN
    INSERT INTO public.admin_notifications (type, data, seller_id, dedupe_key)
    VALUES (
      'feature_request_created',
      jsonb_build_object(
        'title', new.title,
        'requestId', new.id,
        'storeName', (
          SELECT s.name FROM public.stores s
          WHERE s.seller_id = new.seller_id AND s.deleted_at IS NULL
          ORDER BY s.is_primary DESC, s.created_at ASC
          LIMIT 1
        )
      ),
      new.seller_id,
      'feature_request_created:' || new.id::text
    )
    ON CONFLICT (dedupe_key) DO NOTHING;
  EXCEPTION WHEN others THEN
    RAISE WARNING 'notify_admin_feature_request_created: %', sqlerrm;
  END;
  RETURN NULL;
END;
$fn$;

DROP TRIGGER IF EXISTS feature_requests_notify_admin_created ON public.feature_requests;
CREATE TRIGGER feature_requests_notify_admin_created
  AFTER INSERT ON public.feature_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_feature_request_created();

-- Seed: the team's roadmap from ROADMAP.md (§2.1 live, §3 priority order).
-- P0/P1 features are 'planned'; P2/P3 stay 'waiting' so sellers can vote them up.
INSERT INTO public.feature_requests
  (roadmap_ref, status, category, title, description, title_en, description_en, launched_at)
VALUES
  -- Launched (the coupon pop-up is in progress: its migration 0114 is not applied yet)
  ('L-ai-products', 'launched', 'products',
   'إضافة المنتجات بالذكاء الاصطناعي',
   'ارفع صور المنتج أو ملف PDF أو نصاً، ويكتب الذكاء الاصطناعي الاسم والوصف وبيانات السيو بالعربية والإنجليزية.',
   'Add products with AI',
   'Upload product photos, a PDF or text, and AI writes the name, description and SEO in Arabic and English.',
   '2026-10-27'),
  ('L-bosta', 'launched', 'shipping',
   'ربط مباشر مع بوسطة',
   'اربط حساب بوسطة بمتجرك وأنشئ الشحنات وتابع حالتها من داخل صفحة الطلب.',
   'Bosta shipping integration',
   'Connect your Bosta account, create shipments and track them from the order page.',
   '2026-10-26'),
  ('L-coupon-popup', 'in_progress', 'marketing',
   'كوبون منبثق على موقع المتجر',
   'اعرض كوبون الخصم كنافذة منبثقة عند الدخول أو الخروج، مع عداد تنازلي في صفحة المنتج.',
   'Coupon pop-up on the store website',
   'Show a coupon as a pop-up on entry or exit, with a countdown on the product page.',
   NULL),
  ('L-seller-reviews', 'launched', 'products',
   'تقييمات حقيقية ومشاهدات مباشرة',
   'أضف تقييمات عملائك الحقيقية من نموذج المنتج، وأظهر عدد من يشاهدون المنتج الآن.',
   'Real reviews and live views',
   'Add your customers'' real reviews from the product form and show how many people are viewing a product.',
   '2026-10-27'),
  ('L-templates', 'launched', 'website',
   'أكثر من 100 قالب لموقع المتجر',
   'قوالب جاهزة لكل نشاط مع صفحة منتج قابلة للتعديل بالكامل من محرر الموقع.',
   '100+ store website templates',
   'Ready-made templates for every niche, with a product page you can fully edit in the website builder.',
   '2026-10-24'),
  ('L-sheets', 'launched', 'orders',
   'تصدير الطلبات إلى Google Sheets',
   'كل طلب جديد يُضاف تلقائياً إلى جدول Google Sheets الخاص بك.',
   'Google Sheets order export',
   'Every new order is added to your Google Sheet automatically.',
   NULL),
  ('L-pixels', 'launched', 'marketing',
   'بكسل ميتا وتيك توك وسناب شات',
   'اربط Meta Pixel وConversions API وTikTok وSnapchat وGA4 لتتبع إعلاناتك.',
   'Meta, TikTok and Snapchat pixels',
   'Connect Meta Pixel and Conversions API, TikTok, Snapchat and GA4 to track your ads.',
   NULL),
  ('L-shopify-import', 'launched', 'products',
   'استيراد المنتجات من Shopify وExcel',
   'انقل منتجاتك من متجر Shopify أو من ملف Excel في خطوات قليلة.',
   'Import products from Shopify and Excel',
   'Move your products from a Shopify store or an Excel file in a few steps.',
   NULL),
  -- Planned (P0 / P1)
  ('F-02', 'planned', 'orders',
   'الحماية من الطلبات الوهمية',
   'قائمة حظر للأرقام، وتأكيد الطلب عبر واتساب، وتنبيه للطلبات المشكوك فيها.',
   'Fake-order protection',
   'A phone blocklist, order confirmation by WhatsApp and a warning on risky orders.', NULL),
  ('F-03', 'planned', 'orders',
   'الطلبات المتروكة والتذكير بها',
   'شاهد العملاء الذين بدأوا الطلب ولم يكملوه، وذكّرهم لإكماله.',
   'Missed orders and reminders',
   'See customers who started checkout but did not finish, and remind them.', NULL),
  ('F-01', 'planned', 'orders',
   'قائمة العملاء',
   'كل عملاء متجرك في مكان واحد مع عدد الطلبات وإجمالي المشتريات.',
   'Customers list',
   'All your store''s customers in one place, with their order count and total spend.', NULL),
  ('F-04', 'planned', 'orders',
   'الفواتير وتصدير الطلبات',
   'اطبع الفاتورة وبوليصة التغليف، وصدّر الطلبات إلى ملف Excel.',
   'Invoices and order export',
   'Print invoices and packing slips, and export orders to Excel.', NULL),
  ('F-05', 'planned', 'orders',
   'إنشاء طلب يدوي',
   'سجّل الطلبات التي تأتيك بالهاتف أو واتساب من لوحة التحكم.',
   'Manual orders',
   'Record orders that come by phone or WhatsApp from the dashboard.', NULL),
  ('F-34', 'planned', 'products',
   'شارة "الكمية محدودة"',
   'أظهر للعميل أن المخزون قارب على النفاد لتشجيعه على الشراء.',
   'Low-stock badge',
   'Show customers that stock is running low to encourage them to buy.', NULL),
  ('F-35', 'planned', 'products',
   'سلة المحذوفات للمنتجات',
   'استرجع أي منتج محذوف خلال 30 يوماً.',
   'Product trash',
   'Restore any deleted product within 30 days.', NULL),
  ('F-36', 'planned', 'website',
   'تطبيق المتجر على الموبايل',
   'يثبّت العميل متجرك كتطبيق باسم متجرك وشعاره.',
   'Store app',
   'Customers install your store as an app with your store''s name and logo.', NULL),
  ('F-25', 'planned', 'website',
   'إعدادات نموذج الطلب وصفحة الشكر',
   'اختر الحقول التي تظهر في نموذج الطلب، وخصص صفحة الشكر بعد الشراء.',
   'Checkout form and thank-you page settings',
   'Choose the fields on the checkout form and customise the thank-you page.', NULL),
  ('F-22', 'planned', 'marketing',
   'إشعارات المبيعات الأخيرة',
   'نافذة صغيرة تعرض الطلبات الحقيقية الأخيرة لزيادة ثقة الزوار.',
   'Recent sales pop-up',
   'A small pop-up with real recent orders to build visitor trust.', NULL),
  ('F-24', 'planned', 'products',
   'تعديل المنتجات بالجملة',
   'غيّر الأسعار والمخزون والحالة لعدة منتجات مرة واحدة.',
   'Bulk product editing',
   'Change prices, stock and status for many products at once.', NULL),
  ('F-15', 'planned', 'reports',
   'تقارير أفضل ومشاهدات لكل منتج',
   'تقارير مبيعات أوضح وعدد المشاهدات لكل منتج.',
   'Better reports and per-product views',
   'Clearer sales reports and view counts for every product.', NULL),
  ('F-06', 'planned', 'orders',
   'إشعار فوري بكل طلب جديد',
   'تنبيه على الموبايل لحظة وصول طلب جديد.',
   'New-order push alerts',
   'A phone notification the moment a new order arrives.', NULL),
  ('F-11', 'planned', 'marketing',
   'كتالوج المنتجات لميتا وجوجل وتيك توك',
   'رابط كتالوج يتحدث تلقائياً لإعلانات المنتجات الديناميكية.',
   'Product feeds for Meta, Google and TikTok',
   'A catalog feed that updates itself, for dynamic product ads.', NULL),
  ('F-09', 'planned', 'other',
   'حسابات الموظفين والصلاحيات',
   'أضف فريقك وحدد ما يمكن لكل شخص رؤيته وتعديله.',
   'Staff accounts and permissions',
   'Add your team and choose what each person can see and change.', NULL),
  ('F-10', 'planned', 'products',
   'تنبيهات المخزون وسجل الحركة',
   'تنبيه عند قرب نفاد منتج، وسجل لكل تغيير في المخزون.',
   'Inventory alerts and stock history',
   'An alert when a product runs low, and a log of every stock change.', NULL),
  ('F-12', 'planned', 'shipping',
   'شركات شحن إضافية',
   'ربط شركات شحن أخرى غير بوسطة.',
   'More shipping carriers',
   'Connect more shipping companies besides Bosta.', NULL),
  -- Waiting (open for votes)
  ('F-13', 'waiting', 'marketing',
   'خصومات تلقائية وهدية مجانية',
   'خصم تلقائي عند حد أدنى للطلب أو هدية مع منتجات معينة، بدون كود.',
   'Automatic discounts and free gifts',
   'An automatic discount above a minimum order, or a free gift, with no code.', NULL),
  ('F-14', 'waiting', 'orders',
   'رسائل الطلب للعميل عبر واتساب',
   'رسالة تلقائية للعميل عند تأكيد الطلب وشحنه وتسليمه.',
   'Order messages to customers on WhatsApp',
   'Automatic messages when an order is confirmed, shipped and delivered.', NULL),
  ('F-16', 'waiting', 'marketing',
   'حملات بريد وواتساب',
   'أرسل العروض لعملائك عبر البريد أو واتساب، وأنشئ جماهير لإعادة الاستهداف.',
   'Email and WhatsApp campaigns',
   'Send offers to customers by email or WhatsApp, and build retargeting audiences.', NULL),
  ('F-23', 'waiting', 'products',
   'تنبيه عند توفر المنتج والطلب المسبق',
   'يسجل العميل ليصله إشعار عند عودة المنتج، أو يطلبه قبل توفره.',
   'Back-in-stock alerts and pre-orders',
   'Customers sign up to hear when a product is back, or order it before it arrives.', NULL),
  ('F-26', 'waiting', 'reports',
   'روابط تتبع الحملات (UTM)',
   'اعرف كم طلباً جاء من كل حملة أو مؤثر.',
   'Campaign tracking links (UTM)',
   'See how many orders came from each campaign or influencer.', NULL),
  ('F-17', 'waiting', 'other',
   'واجهة برمجية API وWebhooks',
   'اربط متجرك بأنظمتك الخاصة.',
   'Public API and webhooks',
   'Connect your store to your own systems.', NULL),
  ('F-19', 'waiting', 'payments',
   'بطاقات الهدايا ورصيد العميل',
   'بيع بطاقات هدايا وأضف رصيداً لعملائك.',
   'Gift cards and store credit',
   'Sell gift cards and give customers store credit.', NULL),
  ('F-20', 'waiting', 'marketing',
   'نقاط الولاء',
   'يكسب العميل نقاطاً مع كل طلب ويستبدلها بخصم.',
   'Loyalty points',
   'Customers earn points on every order and redeem them for a discount.', NULL),
  ('F-27', 'waiting', 'website',
   'اختبارات A/B',
   'جرّب نسختين من صفحة وشاهد أيهما يبيع أكثر.',
   'A/B tests',
   'Try two versions of a page and see which one sells more.', NULL),
  ('F-28', 'waiting', 'products',
   'أسعار الجملة',
   'سعر مختلف عند شراء كمية أكبر أو لعملاء الجملة.',
   'Wholesale pricing',
   'A different price for larger quantities or wholesale customers.', NULL),
  ('F-31', 'waiting', 'orders',
   'نقطة بيع للمحل (كاشير)',
   'بيع في محلك من نفس المخزون والطلبات.',
   'Point of sale (cashier)',
   'Sell in your shop from the same stock and orders.', NULL)
ON CONFLICT (roadmap_ref) DO NOTHING;
