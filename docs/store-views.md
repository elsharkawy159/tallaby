# Store views (GTM + GA4)

Sellers see how many people visit each store website under **Store views**
(`/stores/[storeId]/analytics` in the dashboard). PLAN.md SA-01.

## How it works

1. **Storefront (ecommerce app).** Every published storefront page loads
   Tallaby's own GTM container (`STORE_VIEWS_GTM_ID`), in its own data layer
   `tallabyDataLayer`, apart from the seller's own Pixel, GA4 or GTM apps.
   On each page, including client-side navigations, it pushes:

   ```js
   { event: "tallaby_page_view", tallaby_store_id: "<stores.id>", page_location, page_path, page_title }
   ```

   It does not load on draft previews, offline stores, shared pages (checkout,
   orders) or the marketplace. It loads **without** the consent banner (owner
   decision, 2026-10-27); the seller's own apps still wait for consent (D19).
   Code: `apps/ecommerce/components/storefront/store-views-tag.client.tsx`,
   mounted in `storefront-shell.tsx`.
2. **GTM → GA4.** The container sends a GA4 `page_view` with the event
   parameter `store_id` to Tallaby's GA4 property.
3. **Dashboard.** The server calls the GA4 Data API (`runReport`) with a
   service account, filtered on `customEvent:store_id` = the store the seller
   owns (checked by `requireStore`). Code: `apps/dashboard/lib/analytics/`.
4. **Cache.** Results are cached per seller + store + range for 1 hour
   (`createCachedQuery`, tag `storeTags.views(sellerId, storeId)`). The
   **Refresh** button purges that tag (at most once a minute per store) and
   reads GA4 again. Errors are never cached.

## One-time setup

### GA4

1. In Google Analytics, create a property **Tallaby Storefronts** (separate
   from the marketplace property `G-ET1FTMXB9X`). Set its reporting time zone
   to **(GMT+02:00) Cairo** — the dashboard's days are Cairo days.
2. Add a **Web** data stream (any URL, e.g. `https://tallaby.com`). Copy its
   Measurement ID (`G-…`). In the stream's Enhanced measurement settings,
   turn **off** "Page changes based on browser history events" (the tag sends
   its own page views; leaving it on double-counts).
3. Admin › Custom definitions › **Create custom dimension**: name
   `Store ID`, scope **Event**, event parameter `store_id`. Data for a store
   is only reportable after this exists, so create it before going live.
4. Copy the numeric **Property ID** (Admin › Property details) →
   `GA4_PROPERTY_ID` on the dashboard project.

### GTM

1. Create a **Web** container **Tallaby Storefronts** → its id (`GTM-…`) is
   `STORE_VIEWS_GTM_ID` on the ecommerce project.
2. Variables › New › **Data Layer Variable**: name `DLV - tallaby_store_id`,
   variable name `tallaby_store_id`.
3. Triggers › New › **Custom Event**: name `tallaby_page_view`, event name
   `tallaby_page_view`.
4. Tags › New › **Google tag**: tag id = the Measurement ID; configuration
   parameter `send_page_view` = `false`; trigger **Initialization - All Pages**.
5. Tags › New › **Google Analytics: GA4 Event**: Measurement ID as above,
   event name `page_view`, event parameters:
   - `store_id` = `{{DLV - tallaby_store_id}}`
   - `page_location` = `{{Page URL}}`
   - `page_title` = `{{Page Title}}`

   Trigger: `tallaby_page_view`.
6. Preview on a published store (Tag Assistant), check one `page_view` per
   page with `store_id`, then **Submit / Publish** the container.

### Google Cloud service account

1. In Google Cloud (any project), enable the **Google Analytics Data API**.
2. IAM › Service accounts › create `tallaby-store-views`; Keys › Add key ›
   JSON. From the JSON: `client_email` → `GA4_SERVICE_ACCOUNT_EMAIL`,
   `private_key` → `GA4_SERVICE_ACCOUNT_PRIVATE_KEY` (keep the `\n` escapes).
3. In GA4, Admin › Property access management › add the service account's
   email as **Viewer**.
4. Set the three `GA4_*` vars on the **dashboard** Vercel project (server-only;
   never `NEXT_PUBLIC_`) and `STORE_VIEWS_GTM_ID` on the **ecommerce** project,
   then redeploy both.

Until the `GA4_*` vars are set, the page shows "Store views are coming soon".
Until `STORE_VIEWS_GTM_ID` is set, no tag loads on storefronts.

## Limits

- GA4 shows new hits after minutes to hours; "today" is partial.
- Visitors who block Google Tag Manager are not counted.
- Data API quota: the 1-hour cache plus the per-store refresh cooldown keep
  usage to about one request per store, per range, per hour.
