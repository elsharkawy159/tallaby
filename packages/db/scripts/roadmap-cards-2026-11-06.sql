-- Public /roadmap cards, 2026-11-06 launch (ROADMAP.md §7 "Public /roadmap cards").
-- PRODUCTION ONLY: `feature_requests` exists on production only (0115 was never
-- applied on staging). Run once, with owner approval, in one transaction, AFTER
-- the 2026-11-06 deploy is live and the smoke tests pass (owner: mark what this
-- deploy ships as launched).
--
--  * launched = sellers can use it on production after this deploy.
--  * Cards whose remaining parts are not built stay in_progress
--    (F-12 more carriers, F-16 WhatsApp campaigns, F-23 pre-orders).
--  * Owner-delayed features are waiting, so sellers can vote on them.
--  * New cards are insert-only by roadmap_ref; status moves are guarded on the
--    old status, so a card someone already moved in Admin is left alone.
--  * The guard at the end aborts (rolls back everything) if the counts differ.

BEGIN;

-- 1. Status moves -----------------------------------------------------------
-- Push alerts went live on 2026-10-30 (0124 on production).
UPDATE public.feature_requests SET status = 'launched', launched_at = DATE '2026-10-30', updated_at = now()
 WHERE roadmap_ref = 'F-06' AND status = 'in_progress';
-- Shipped by the 2026-11-06 deploy.
UPDATE public.feature_requests SET status = 'launched', launched_at = DATE '2026-11-06', updated_at = now()
 WHERE roadmap_ref IN ('F-02', 'F-13', 'F-39') AND status = 'in_progress';
UPDATE public.feature_requests SET status = 'launched', launched_at = DATE '2026-11-06', updated_at = now()
 WHERE roadmap_ref IN ('F-05', 'F-32') AND status = 'planned';
-- Delayed by the owner (2026-11-04): open for votes again.
UPDATE public.feature_requests SET status = 'waiting', updated_at = now()
 WHERE roadmap_ref = 'F-09' AND status = 'planned';

-- 2. New cards ----------------------------------------------------------------
INSERT INTO public.feature_requests
  (roadmap_ref, status, category, title, description, title_en, description_en, launched_at)
VALUES
  -- Live before today, and among the most voted on the EasyOrders roadmap (exact launch date unknown: NULL).
  ('L-product-export', 'launched', 'products',
   'تصدير المنتجات إلى Excel',
   'نزّل كل منتجاتك في ملف Excel بضغطة واحدة، وعدّلها ثم ارفعها مرة أخرى.',
   'Export products to Excel',
   'Download all your products as an Excel file in one click, edit them and upload them again.',
   NULL),
  ('L-bilingual-store', 'launched', 'website',
   'متجر بالعربية والإنجليزية',
   'متجرك يعمل باللغتين، ويختار العميل لغته من أعلى الصفحة.',
   'Store in Arabic and English',
   'Your store works in both languages, and the customer picks one at the top of the page.',
   NULL),

  -- Shipped by the 2026-11-06 deploy.
  ('F-07', 'launched', 'marketing',
   'عروض الكمية: اشترِ أكثر ووفّر',
   'عروض مثل «اشترِ 2 بخصم 10%» على صفحة المنتج، ويظهر السعر بعد الخصم في السلة.',
   'Quantity offers: buy more, save more',
   'Offers like "buy 2, save 10%" on the product page, with the discounted price shown in the cart.',
   DATE '2026-11-06'),
  ('F-72', 'launched', 'products',
   'حد أدنى لكمية الطلب لكل منتج',
   'حدّد أقل كمية يمكن طلبها من المنتج، ويُطبَّق ذلك في السلة وصفحة الدفع.',
   'Minimum order quantity per product',
   'Set the smallest quantity a customer can order, enforced in the cart and at checkout.',
   DATE '2026-11-06'),
  ('F-64', 'launched', 'website',
   'صفحة دفع بسيطة في خطوة واحدة',
   'كل بيانات الطلب في صفحة واحدة قصيرة، فيُكمل العميل طلبه أسرع.',
   'Simple one-page checkout',
   'All the order details on one short page, so customers finish their order faster.',
   DATE '2026-11-06'),
  ('F-61', 'launched', 'website',
   'البيع لدول أخرى بعملة متجرك',
   'شغّل متجرًا يبيع خارج مصر بعملته الخاصة، مع أرقام هواتف من دول أخرى.',
   'Sell abroad in your store''s own currency',
   'Run a store that sells outside Egypt in its own currency, with phone numbers from other countries.',
   DATE '2026-11-06'),
  ('F-29', 'launched', 'other',
   'إدارة متجرك من Claude وChatGPT',
   'اربط حسابك بمساعد الذكاء الاصطناعي، وأضف المنتجات وعدّلها بالمحادثة.',
   'Manage your store from Claude and ChatGPT',
   'Connect your account to an AI assistant and add or edit products by chatting.',
   DATE '2026-11-06'),
  ('F-77', 'launched', 'website',
   'اطلب قالبًا لنشاطك',
   'لم تجد قالبًا يناسبك؟ أرسل لنا رابطًا أو صورة أو وصفًا، ونبلغك عند تجهيزه.',
   'Request a theme for your business',
   'Can''t find a theme that fits? Send us a link, a photo or a description, and we''ll tell you when it''s ready.',
   DATE '2026-11-06'),

  -- Open for votes: asked for a lot on the EasyOrders roadmap.
  ('F-21', 'waiting', 'payments',
   'عربون قبل شحن طلب الدفع عند الاستلام',
   'اطلب من العميل دفع نسبة من قيمة الطلب (مثل 20%) قبل الشحن، لتقليل الطلبات الوهمية والمرتجعات.',
   'Deposit before shipping a cash-on-delivery order',
   'Ask the customer to pay part of the order (for example 20%) before shipping, to cut fake orders and returns.',
   NULL),
  ('F-80', 'waiting', 'products',
   'ترتيب خيارات المنتج وقيمها',
   'غيّر ترتيب الخيارات (المقاس، اللون…) وقيم كل خيار كما تريد أن تظهر في صفحة المنتج.',
   'Reorder product options and values',
   'Change the order of options (size, colour…) and their values as you want them on the product page.',
   NULL),
  ('F-81', 'waiting', 'products',
   'تحسين صور المنتجات بالذكاء الاصطناعي',
   'خلفية بيضاء نظيفة وإضاءة أفضل لصور منتجاتك بضغطة واحدة.',
   'Improve product photos with AI',
   'A clean white background and better light for your product photos in one click.',
   NULL)
ON CONFLICT (roadmap_ref) DO NOTHING;

-- 3. Guard ------------------------------------------------------------------
DO $$
DECLARE
  n_launched int; n_waiting int;
BEGIN
  SELECT count(*) INTO n_launched FROM public.feature_requests
   WHERE roadmap_ref IN ('F-06', 'F-02', 'F-13', 'F-39', 'F-05', 'F-32', 'L-product-export', 'L-bilingual-store',
                         'F-07', 'F-72', 'F-64', 'F-61', 'F-29', 'F-77')
     AND status = 'launched';
  SELECT count(*) INTO n_waiting FROM public.feature_requests
   WHERE roadmap_ref IN ('F-09', 'F-21', 'F-80', 'F-81') AND status = 'waiting';
  IF n_launched <> 14 OR n_waiting <> 4 THEN
    RAISE EXCEPTION 'roadmap cards guard: launched %, waiting % (expected 14, 4)', n_launched, n_waiting;
  END IF;
END $$;

COMMIT;
