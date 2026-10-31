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
4. **Cache.** Results are cached per seller + store + range for 5 minutes
   (`STORE_VIEWS_TTL_SECONDS`, `createCachedQuery`, tag
   `storeTags.views(sellerId, storeId)`). An open Store views page re-reads
   its numbers every 5 minutes while the tab is visible, and on coming back
   to a tab hidden longer than that (`useAutoRefresh`, owner 2026-10-31), so
   sellers don't have to press **Refresh**. Refresh still purges the tag (at
   most once a minute per store) and reads GA4 again. Errors are never cached.

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
   variable name `tallaby_store_id`. Add a second one, `DLV - page_title`,
   variable name `page_title` (web containers have no built-in Page Title).
3. Triggers › New › **Custom Event**: name `tallaby_page_view`, event name
   `tallaby_page_view`.
4. Tags › New › **Google tag**: tag id = the Measurement ID; configuration
   parameter `send_page_view` = `false`; trigger **Initialization - All Pages**.
5. Tags › New › **Google Analytics: GA4 Event**: Measurement ID as above,
   event name `page_view`, event parameters:
   - `store_id` = `{{DLV - tallaby_store_id}}`
   - `page_location` = `{{Page URL}}`
   - `page_title` = `{{DLV - page_title}}`

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

## Debugging "Store visits = 0"

`0` on the dashboard means GA4 answered but has no processed rows for the
store; `—` means GA4 is not configured or the read failed (check the logs).

1. Run `pnpm --filter dashboard ga4:check [storeId]` (needs the dashboard
   `.env`, read-only). It prints realtime hits, processed `page_view`s per
   day, and sessions per `store_id`, and how to read them.
2. Realtime rows but no processed days: GA4 has not processed the hits yet
   (hours; 24–48 h on a new property). GA4's "active users in the last 30
   minutes" is realtime and does not mean the Data API has the data.
3. On the storefront, `window.tallabyDataLayer` must hold a
   `tallaby_page_view` with the store id, and the `collect?v=2` request must
   carry `ep.store_id=<uuid>`. If not, check `STORE_VIEWS_GTM_ID` on the
   ecommerce deploy and that the GTM container is **published**.
4. Once data exists, a cached `0` can stay for up to 5 minutes: wait, or
   press **Refresh** on Store views (it also clears the home card).

The local `GA4_SERVICE_ACCOUNT_PRIVATE_KEY` must be wrapped in matching
quotes (`'-----BEGIN …-----\n'`); a stray quote inside the PEM breaks
signing and the dashboard shows `—`.

## Limits

- GA4 shows new hits after minutes to hours; "today" is partial.
- Visitors who block Google Tag Manager are not counted.
- Data API quota: the 5-minute cache plus the per-store refresh cooldown keep
  usage to at most about 12 requests per store, per range, per hour, and only
  while a seller has the page open (hidden tabs don't poll). If GA4 quota
  errors show up as sellers grow, raise `STORE_VIEWS_TTL_SECONDS`.
