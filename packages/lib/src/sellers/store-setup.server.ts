import { sql, type SQL } from "drizzle-orm";
import type { StoreSetupFlags } from "./store-setup.lib";

/**
 * The store setup flags as SQL columns (store-setup.lib.ts), for a query over
 * `sellers s` and `stores st` where `st` is one of `s`'s stores. Moved here
 * unchanged from the dashboard home (home.queries.ts) so the home and the setup
 * reminder emails (F-94) read the same rule. `productScope` narrows the product
 * check to the store (`productInStore`/`productInStoreOf`, appended after
 * `p.status = 'active'`); an empty SQL keeps the whole account.
 */
export const storeSetupFlagColumns = (productScope: SQL) => sql`
      EXISTS (SELECT 1 FROM products p WHERE p.seller_id = s.id AND p.status = 'active'${productScope}) AS setup_product,
      -- st is already limited to this seller (join below), so st.id scopes the child rows.
      -- Same rule as storeTemplateChosen (@workspace/lib): the Classic placeholder drafts are not a choice.
      coalesce(st.first_published_at IS NOT NULL OR st.site_status IN ('published', 'unpublished')
        OR EXISTS (SELECT 1 FROM template_installs ti WHERE ti.store_id = st.id AND ti.undone_at IS NULL), false) AS setup_template,
      -- Brand identity: a logo, or the design system saved after the latest template install
      -- (an install rewrites the design system in the same transaction, so it is not "after").
      coalesce(nullif(st.logo_url, '') IS NOT NULL
        OR EXISTS (SELECT 1 FROM store_design_systems ds WHERE ds.store_id = st.id
          AND ds.updated_at > (SELECT max(ti.installed_at) FROM template_installs ti
            WHERE ti.store_id = st.id AND ti.undone_at IS NULL)), false) AS setup_brand,
      coalesce(st.settings ? 'shipping'
        OR EXISTS (SELECT 1 FROM store_shipping_zones z WHERE z.store_id = st.id), false) AS setup_shipping,
      -- settings.payments is written only by the seller's own save (Store settings › Payment methods);
      -- a new store has none and checkout falls back to the defaults. A connected card gateway counts too.
      coalesce(st.settings ? 'payments'
        OR EXISTS (SELECT 1 FROM store_integrations si WHERE si.store_id = st.id AND si.seller_id = s.id
          AND si.provider IN ('paymob', 'kashier') AND si.status = 'connected'), false) AS setup_payments,
      coalesce(st.site_status = 'published', false) AS setup_publish
`;

export const toStoreSetupFlags = (row: Record<string, unknown>): StoreSetupFlags => ({
  template: Boolean(row.setup_template),
  brand: Boolean(row.setup_brand),
  product: Boolean(row.setup_product),
  publish: Boolean(row.setup_publish),
  shipping: Boolean(row.setup_shipping),
  payments: Boolean(row.setup_payments),
});
