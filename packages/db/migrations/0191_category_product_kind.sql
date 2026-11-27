-- 0191: Physical and digital Tallaby categories (ROADMAP.md F-108e).
--
-- `categories.product_kind` says which product type a Tallaby category is for:
-- 'physical' (every existing row, by the default) or 'digital'. The seller
-- product form shows only the categories of the product's type, and the server
-- refuses a product saved with a category of the other kind
-- (`category_kind_mismatch`, @workspace/lib/products/category-kind).
--
-- The trigger `categories_product_kind_guard` keeps a whole branch one kind,
-- on every insert and on updates of parent_id / product_kind:
--   * a category has its parent's kind;
--   * a category's kind can't change while it has children (they would be of
--     the other kind). Refused, never cascaded.
-- Errors are SQLSTATE 23514 (check_violation). The parent row is read FOR SHARE.
--
-- Then a seed, insert-only by slug (never updates or deletes a row; every slug
-- starts with `digital-`, so none clashes with a physical one): the root
-- "Digital products" (level 1), its main categories (level 2) and their
-- sub-categories (level 3), all digital. A row whose parent is missing or not
-- digital is skipped.
--
-- Additive and idempotent. Drizzle selects every `categories` column, so apply
-- on staging, then production (owner approval), BEFORE deploying the code that
-- ships with it.

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS product_kind text NOT NULL DEFAULT 'physical';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'categories_product_kind_check') THEN
    ALTER TABLE public.categories
      ADD CONSTRAINT categories_product_kind_check CHECK (product_kind IN ('physical', 'digital'));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.categories_product_kind_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_parent_kind text;
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    SELECT p.product_kind INTO v_parent_kind
    FROM categories p
    WHERE p.id = NEW.parent_id
    FOR SHARE;

    IF FOUND AND v_parent_kind <> NEW.product_kind THEN
      RAISE EXCEPTION 'categories: % is %, its parent % is %', NEW.id, NEW.product_kind, NEW.parent_id, v_parent_kind
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  IF TG_OP = 'UPDATE'
     AND NEW.product_kind IS DISTINCT FROM OLD.product_kind
     AND EXISTS (SELECT 1 FROM categories c WHERE c.parent_id = NEW.id) THEN
    RAISE EXCEPTION 'categories: % has sub-categories, so its kind can''t change', NEW.id
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS categories_product_kind_guard ON public.categories;
CREATE TRIGGER categories_product_kind_guard
  BEFORE INSERT OR UPDATE OF parent_id, product_kind ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.categories_product_kind_guard();

-- The digital pack. Columns: slug, parent slug, level, English name, Arabic name.
-- A plain temp table (no ON COMMIT DROP: the runner may autocommit each statement), dropped at the end.
DROP TABLE IF EXISTS pg_temp.digital_category_seed;
CREATE TEMP TABLE digital_category_seed (
  sort int,
  slug text,
  parent_slug text,
  level smallint,
  name text,
  name_ar text
);

INSERT INTO digital_category_seed (sort, slug, parent_slug, level, name, name_ar) VALUES
  (1, 'digital-products', NULL, 1, 'Digital products', 'منتجات رقمية'),

  (10, 'digital-ebooks', 'digital-products', 2, 'E-books & guides', 'كتب إلكترونية وأدلة'),
  (11, 'digital-ebooks-novels', 'digital-ebooks', 3, 'Novels & stories', 'روايات وقصص'),
  (12, 'digital-ebooks-self-development', 'digital-ebooks', 3, 'Self-development', 'تنمية ذاتية'),
  (13, 'digital-ebooks-business', 'digital-ebooks', 3, 'Business & marketing', 'إدارة أعمال وتسويق'),
  (14, 'digital-ebooks-cooking', 'digital-ebooks', 3, 'Cooking & recipes', 'طبخ ووصفات'),
  (15, 'digital-ebooks-religious', 'digital-ebooks', 3, 'Religious books', 'كتب دينية'),
  (16, 'digital-ebooks-children', 'digital-ebooks', 3, 'Children''s books', 'كتب أطفال'),
  (17, 'digital-ebooks-study-notes', 'digital-ebooks', 3, 'Study notes & summaries', 'مذكرات وملخصات دراسية'),

  (20, 'digital-courses', 'digital-products', 2, 'Courses & learning', 'دورات وتعليم'),
  (21, 'digital-courses-video', 'digital-courses', 3, 'Video courses', 'دورات فيديو'),
  (22, 'digital-courses-languages', 'digital-courses', 3, 'Language learning', 'تعلم اللغات'),
  (23, 'digital-courses-exam-prep', 'digital-courses', 3, 'Exam prep', 'الاستعداد للامتحانات'),
  (24, 'digital-courses-worksheets', 'digital-courses', 3, 'Worksheets & workbooks', 'أوراق عمل وكراسات تدريب'),
  (25, 'digital-courses-professional', 'digital-courses', 3, 'Professional skills', 'مهارات مهنية'),

  (30, 'digital-cutting-files', 'digital-products', 2, 'Cutting & CNC files', 'ملفات القص وCNC'),
  (31, 'digital-cutting-laser', 'digital-cutting-files', 3, 'Laser cutting files (DXF, SVG)', 'ملفات قص ليزر (DXF وSVG)'),
  (32, 'digital-cutting-cnc-router', 'digital-cutting-files', 3, 'CNC router files', 'ملفات راوتر CNC'),
  (33, 'digital-cutting-plotter', 'digital-cutting-files', 3, 'Plotter & vinyl files (PLT)', 'ملفات بلوتر وفينيل (PLT)'),
  (34, 'digital-cutting-embroidery', 'digital-cutting-files', 3, 'Embroidery files', 'ملفات تطريز'),
  (35, 'digital-cutting-3d-printing', 'digital-cutting-files', 3, '3D printing files (STL)', 'ملفات طباعة ثلاثية الأبعاد (STL)'),

  (40, 'digital-design', 'digital-products', 2, 'Design & graphics', 'تصميم وجرافيك'),
  (41, 'digital-design-logos', 'digital-design', 3, 'Logos & brand kits', 'شعارات وهويات بصرية'),
  (42, 'digital-design-social-media', 'digital-design', 3, 'Social media templates', 'قوالب لمواقع التواصل'),
  (43, 'digital-design-mockups', 'digital-design', 3, 'Mockups', 'نماذج عرض (Mockups)'),
  (44, 'digital-design-illustrations', 'digital-design', 3, 'Illustrations & clipart', 'رسومات وكليب آرت'),
  (45, 'digital-design-icons', 'digital-design', 3, 'Icons', 'أيقونات'),
  (46, 'digital-design-fonts', 'digital-design', 3, 'Fonts', 'خطوط'),
  (47, 'digital-design-photoshop-illustrator', 'digital-design', 3, 'Photoshop & Illustrator files', 'ملفات Photoshop وIllustrator'),
  (48, 'digital-design-canva', 'digital-design', 3, 'Canva templates', 'قوالب Canva'),

  (50, 'digital-printables', 'digital-products', 2, 'Printables', 'ملفات جاهزة للطباعة'),
  (51, 'digital-printables-planners', 'digital-printables', 3, 'Planners & calendars', 'مخططات وتقويمات'),
  (52, 'digital-printables-wall-art', 'digital-printables', 3, 'Wall art', 'لوحات حائط'),
  (53, 'digital-printables-kids', 'digital-printables', 3, 'Kids activities & coloring', 'أنشطة وتلوين للأطفال'),
  (54, 'digital-printables-invitations', 'digital-printables', 3, 'Invitations & cards', 'دعوات وبطاقات'),
  (55, 'digital-printables-stickers', 'digital-printables', 3, 'Stickers & labels', 'ملصقات وستيكرز'),

  (60, 'digital-templates', 'digital-products', 2, 'Templates & documents', 'قوالب ومستندات'),
  (61, 'digital-templates-cv', 'digital-templates', 3, 'CV & resume', 'سيرة ذاتية'),
  (62, 'digital-templates-business-documents', 'digital-templates', 3, 'Business documents', 'مستندات أعمال'),
  (63, 'digital-templates-spreadsheets', 'digital-templates', 3, 'Spreadsheets (Excel)', 'جداول Excel'),
  (64, 'digital-templates-presentations', 'digital-templates', 3, 'Presentations', 'عروض تقديمية'),
  (65, 'digital-templates-notion', 'digital-templates', 3, 'Notion templates', 'قوالب Notion'),

  (70, 'digital-engineering', 'digital-products', 2, 'Engineering & architecture', 'هندسة وعمارة'),
  (71, 'digital-engineering-autocad', 'digital-engineering', 3, 'AutoCAD drawings (DWG)', 'رسومات AutoCAD (DWG)'),
  (72, 'digital-engineering-3d-models', 'digital-engineering', 3, '3D models', 'نماذج ثلاثية الأبعاد'),
  (73, 'digital-engineering-interior', 'digital-engineering', 3, 'Interior design plans', 'تصميمات ديكور داخلي'),
  (74, 'digital-engineering-structural-mep', 'digital-engineering', 3, 'Structural & MEP drawings', 'رسومات إنشائية وكهروميكانيكية'),

  (80, 'digital-photo-video', 'digital-products', 2, 'Photos & video', 'صور وفيديو'),
  (81, 'digital-photo-stock', 'digital-photo-video', 3, 'Stock photos', 'صور جاهزة للاستخدام'),
  (82, 'digital-photo-lightroom-presets', 'digital-photo-video', 3, 'Lightroom presets', 'فلاتر Lightroom (Presets)'),
  (83, 'digital-video-templates', 'digital-photo-video', 3, 'Video templates', 'قوالب فيديو'),
  (84, 'digital-video-luts', 'digital-photo-video', 3, 'LUTs & color grading', 'ملفات LUT وتلوين الفيديو'),
  (85, 'digital-video-stock-footage', 'digital-photo-video', 3, 'Stock footage', 'مقاطع فيديو جاهزة'),

  (90, 'digital-audio', 'digital-products', 2, 'Music & audio', 'موسيقى وصوتيات'),
  (91, 'digital-audio-music', 'digital-audio', 3, 'Music tracks', 'مقطوعات موسيقية'),
  (92, 'digital-audio-sound-effects', 'digital-audio', 3, 'Sound effects', 'مؤثرات صوتية'),
  (93, 'digital-audio-audiobooks-podcasts', 'digital-audio', 3, 'Audiobooks & podcasts', 'كتب صوتية وبودكاست'),
  (94, 'digital-audio-religious', 'digital-audio', 3, 'Religious audio', 'صوتيات دينية'),
  (95, 'digital-audio-voice-over', 'digital-audio', 3, 'Voice-over packs', 'تعليق صوتي'),

  (100, 'digital-software', 'digital-products', 2, 'Software & code', 'برامج وأكواد'),
  (101, 'digital-software-apps', 'digital-software', 3, 'Apps & tools', 'تطبيقات وأدوات'),
  (102, 'digital-software-website-themes', 'digital-software', 3, 'Website themes & templates', 'قوالب مواقع إلكترونية'),
  (103, 'digital-software-plugins', 'digital-software', 3, 'Plugins & extensions', 'إضافات (Plugins)'),
  (104, 'digital-software-scripts', 'digital-software', 3, 'Scripts & code', 'سكريبتات وأكواد'),
  (105, 'digital-software-game-assets', 'digital-software', 3, 'Game assets', 'عناصر للألعاب (Game assets)'),

  (110, 'digital-patterns', 'digital-products', 2, 'Sewing & craft patterns', 'باترونات خياطة وأشغال يدوية'),
  (111, 'digital-patterns-sewing', 'digital-patterns', 3, 'Sewing patterns', 'باترونات خياطة'),
  (112, 'digital-patterns-crochet-knitting', 'digital-patterns', 3, 'Crochet & knitting patterns', 'باترونات كروشيه وتريكو'),
  (113, 'digital-patterns-crafts', 'digital-patterns', 3, 'Craft templates', 'قوالب أشغال يدوية'),

  (120, 'digital-ai-prompts', 'digital-products', 2, 'AI prompts & workflows', 'أوامر وخطوات عمل للذكاء الاصطناعي'),
  (130, 'digital-other', 'digital-products', 2, 'Other digital files', 'ملفات رقمية أخرى');

-- One level at a time, so each row's parent exists before it.
DO $$
DECLARE
  v_level smallint;
BEGIN
  FOREACH v_level IN ARRAY ARRAY[1, 2, 3]::smallint[] LOOP
    INSERT INTO public.categories (name, name_ar, slug, level, parent_id, product_kind)
    SELECT s.name, s.name_ar, s.slug, s.level, p.id, 'digital'
    FROM digital_category_seed s
    LEFT JOIN LATERAL (
      SELECT c.id FROM public.categories c
      WHERE c.slug = s.parent_slug AND c.product_kind = 'digital'
      ORDER BY c.created_at
      LIMIT 1
    ) p ON true
    WHERE s.level = v_level
      AND (s.parent_slug IS NULL OR p.id IS NOT NULL)
      AND NOT EXISTS (SELECT 1 FROM public.categories c WHERE c.slug = s.slug)
    ORDER BY s.sort;
  END LOOP;
END $$;

DROP TABLE IF EXISTS pg_temp.digital_category_seed;
