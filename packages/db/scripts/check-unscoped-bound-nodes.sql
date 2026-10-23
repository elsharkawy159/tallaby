-- check-unscoped-bound-nodes.sql: READ-ONLY pre-deploy check for the template product page branch
-- (spec docs/superpowers/specs/2026-10-23-template-product-page-design.md, Task 3).
--
-- Since that branch, a node with a `bind` prop that is not inside a data list (productList,
-- categoryList, postList) and not on the product page renders NOTHING on the public storefront
-- (before, it drew its authored text). This query counts such nodes in every place a tree lives,
-- so the owner can see whether any live site or seed would lose content.
--
-- Counted: nodes whose `type` takes a binding (heading, paragraph, text, badge, blockQuote, image,
-- button, linkBlock, textLink: BIND_TARGET in packages/store-sections/src/elements/render.tsx) with
-- a string `props.bind`, and no productList/categoryList/postList ancestor. Pages with
-- kind = 'product' are left out: there the page's product is the scope. Library sections of the
-- `product-page` category are reported on their own row, since they are meant for that page.
--
-- Run (read-only; it only SELECTs):
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f packages/db/scripts/check-unscoped-bound-nodes.sql
-- or paste it into the Supabase SQL editor. Every count should be 0. A non-zero row names the
-- source; `refs` lists up to 20 row ids (store id, page id, template key or section key) to inspect.

BEGIN TRANSACTION READ ONLY;

WITH RECURSIVE
-- Each tree document to scan; SiteConfig-shaped ones (snapshots, template configs) without their product page.
roots(source, ref, doc) AS (
  SELECT 'store_pages.draft_content', p.id::text, p.draft_content
  FROM store_pages p
  JOIN stores s ON s.id = p.store_id AND s.deleted_at IS NULL
  -- to_jsonb: works before 0099 too (no kind column: every page is a normal page).
  WHERE coalesce(to_jsonb(p)->>'kind', 'page') <> 'product'
  UNION ALL
  SELECT 'stores.shared_header/footer', s.id::text, jsonb_build_array(s.shared_header, s.shared_footer)
  FROM stores s
  WHERE s.deleted_at IS NULL AND (s.shared_header IS NOT NULL OR s.shared_footer IS NOT NULL)
  UNION ALL
  SELECT 'store_site_revisions (live snapshot)', s.id::text,
         jsonb_build_object(
           'header', r.snapshot->'header',
           'footer', r.snapshot->'footer',
           'pages', (SELECT coalesce(jsonb_agg(pg), '[]'::jsonb)
                     FROM jsonb_array_elements(CASE WHEN jsonb_typeof(r.snapshot->'pages') = 'array' THEN r.snapshot->'pages' ELSE '[]'::jsonb END) pg
                     WHERE coalesce(pg->>'kind', 'page') <> 'product'))
  FROM stores s
  JOIN store_site_revisions r ON r.id = s.published_revision_id
  WHERE s.deleted_at IS NULL
  UNION ALL
  SELECT CASE WHEN l.category = 'product-page' THEN 'library_sections (product-page category)' ELSE 'library_sections' END,
         l.key, jsonb_build_array(l.tree, l.draft_tree)
  FROM library_sections l
  WHERE l.deleted_at IS NULL
  UNION ALL
  SELECT 'templates (current version / draft_config)', t.key,
         (SELECT jsonb_agg(jsonb_build_object(
                   'header', c->'header',
                   'footer', c->'footer',
                   'pages', (SELECT coalesce(jsonb_agg(pg), '[]'::jsonb)
                             FROM jsonb_array_elements(CASE WHEN jsonb_typeof(c->'pages') = 'array' THEN c->'pages' ELSE '[]'::jsonb END) pg
                             WHERE coalesce(pg->>'kind', 'page') <> 'product')))
          FROM (SELECT v.config AS c UNION ALL SELECT t.draft_config WHERE t.draft_config IS NOT NULL) configs)
  FROM templates t
  LEFT JOIN template_versions v ON v.id = t.current_version_id
  WHERE t.deleted_at IS NULL
),
-- Every object/array inside each document; `scoped` = some ancestor is a data list.
walk(source, ref, v, scoped) AS (
  SELECT source, ref, doc, false FROM roots WHERE doc IS NOT NULL
  UNION ALL
  SELECT w.source, w.ref, c.v,
         w.scoped OR (jsonb_typeof(w.v) = 'object' AND coalesce(w.v->>'type' IN ('productList', 'categoryList', 'postList'), false))
  FROM walk w
  CROSS JOIN LATERAL (
    SELECT e.value AS v FROM jsonb_each(CASE WHEN jsonb_typeof(w.v) = 'object' THEN w.v ELSE '{}'::jsonb END) e
    UNION ALL
    SELECT a.value FROM jsonb_array_elements(CASE WHEN jsonb_typeof(w.v) = 'array' THEN w.v ELSE '[]'::jsonb END) a
  ) c
  WHERE jsonb_typeof(c.v) IN ('object', 'array')
),
hits AS (
  SELECT source, ref
  FROM walk
  WHERE jsonb_typeof(v) = 'object'
    AND NOT scoped
    AND jsonb_typeof(v->'props'->'bind') = 'string'
    AND v->>'type' IN ('heading', 'paragraph', 'text', 'badge', 'blockQuote', 'image', 'button', 'linkBlock', 'textLink')
),
sources(source) AS (
  VALUES ('store_pages.draft_content'), ('stores.shared_header/footer'), ('store_site_revisions (live snapshot)'),
         ('library_sections'), ('library_sections (product-page category)'), ('templates (current version / draft_config)')
)
SELECT s.source,
       count(h.ref) AS unscoped_bound_nodes,
       count(DISTINCT h.ref) AS rows_affected,
       (SELECT string_agg(r, ', ') FROM (SELECT DISTINCT h2.ref AS r FROM hits h2 WHERE h2.source = s.source ORDER BY 1 LIMIT 20) x) AS refs
FROM sources s
LEFT JOIN hits h ON h.source = s.source
GROUP BY s.source
ORDER BY s.source;

ROLLBACK;
