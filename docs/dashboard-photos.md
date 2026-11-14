# Seller dashboard illustrations (ChatGPT brief)

33 small, simple pictures for the seller dashboard (`apps/dashboard`): setup steps, empty pages, feature cards and error pages. Owner request 2026-11-14. Nothing is wired yet. Putting the images on the pages is a later task (see the developer note at the end).

## 1. How to use

1. Open one ChatGPT chat. Paste the **style block** (section 2) first, then send the prompts one at a time.
2. Ask for every image as a **square 1024 × 1024 PNG with a transparent background**.
3. Download each image and save it with the **exact file name** into the **exact folder** shown above its table. Folders are under `F:\Programming Projects\tallaby\apps\dashboard\public\illustrations\`. Create them if they don't exist.
4. If an image has any letter, number or logo in it, ask ChatGPT to redraw it without one. Don't keep it.

## 2. Style block (paste this first)

```
You will draw a set of small illustrations for an online-store seller dashboard. Every image in this chat must follow these rules:
- Very simple flat vector illustration, soft rounded shapes, no outlines, no gradients, no texture, no shadows except one soft oval ground shadow.
- One centred subject with plenty of empty space around it (the subject fills about 60% of the square).
- Use only these colours: teal #145163, mid teal #3a7a8c, light teal #cfe0e4, pale teal #eaf2f4, and amber #fdad28 as a small accent (one or two small details only). A tiny bit of white is fine.
- Transparent background, square 1024 x 1024 PNG. The image must look good on both a white page and a very dark teal page (#142126), so don't use black and don't make large areas pure white.
- Absolutely no words, letters, numbers, prices, logos, brand marks or readable UI text anywhere. Screens, labels and papers show only simple blank bars and shapes.
- No people and no faces. A simple hand or object is fine.
- Same style, colours and line weight in every image so they look like one set.
Reply "ready" and wait for my first prompt.
```

Palette source: `apps/dashboard/app/globals.css:175-184` (`--tallaby-teal-*`, `--tallaby-amber-600`). The dark dashboard surface is `--s-surface: #142126` (`globals.css:300`).

## 3. Images

Size columns: **Shown** is how big the picture appears on the page. **Export** is always 1024 × 1024 PNG, transparent.

### 3.1 Onboarding: `public\illustrations\onboarding\` (6)

Folder: `F:\Programming Projects\tallaby\apps\dashboard\public\illustrations\onboarding\`

| File | Where it appears | Shown | Prompt |
|---|---|---|---|
| `setup-product.png` | Home setup step "Add your first product". `app/(main)/_components/setup-home.data.tsx:83`, also `setup-checklist.data.tsx:141` | 88 px | An open cardboard box with a product inside and a small amber plus badge floating above it. |
| `setup-design.png` | Home setup step "Design your store" (template and brand). `setup-home.data.tsx:83`, `setup-checklist.data.tsx:141` | 88 px | A simple web page shape with blank blocks next to a paintbrush and three round colour swatches, one of them amber. |
| `setup-payments.png` | Home setup step "Payments". `setup-home.data.tsx:83`, `setup-checklist.data.tsx:141` | 88 px | A blank payment card and a small stack of coins with an amber check mark badge. |
| `setup-shipping.png` | Home setup step "Shipping". `setup-home.data.tsx:83`, `setup-checklist.data.tsx:141` | 88 px | A small delivery van carrying a box, with a map pin above it. |
| `welcome.png` | Welcome banner after signup. `app/(main)/_components/welcome-banner.client.tsx:19` | 64 px | A small shop front with an awning, a door slightly open, and a few amber confetti pieces around it. |
| `store-published.png` | "Your store is live" pop-up after the first publish. `app/(main)/_components/publish-celebration.client.tsx:53-55` | 112 px | A rocket lifting off from a browser window shape, with a few small amber stars around it. |

### 3.2 Add a product (feature cards): `public\illustrations\features\` (5)

Folder: `F:\Programming Projects\tallaby\apps\dashboard\public\illustrations\features\`

| File | Where it appears | Shown | Prompt |
|---|---|---|---|
| `add-ai.png` | "Add with AI" card on the add-product chooser. `app/(main)/stores/[storeId]/products/add/add-method-chooser.client.tsx:101`. Also the AI step intro, `products/add/ai/ai-add-stage.client.tsx:304` | 72 px | A product photo card with a magic wand above it and small amber sparkles, as if the product details write themselves. |
| `add-url.png` | "Add from a product link" card. `add-method-chooser.client.tsx:124`. Also the link step intro, `products/add/url-add-stage.client.tsx:65` | 72 px | Two chain links joined together, with a small product box coming out of them. |
| `add-file.png` | "Upload a file" card. `add-method-chooser.client.tsx:129`. Also the file drop area, `products/add/from-file/from-file.client.tsx:468` | 72 px | A spreadsheet page of blank grid cells with a small upward arrow above it. |
| `add-manual.png` | "Add by hand" card. `add-method-chooser.client.tsx:134` | 72 px | A pencil writing on a simple blank form with a few empty lines and an amber dot. |
| `ai-assistants.png` | Apps › AI assistants page, above the connection link. `app/(main)/stores/[storeId]/apps/_settings/ai-assistants/ai-assistants.client.tsx:87` | 120 px | A chat bubble and a store box connected by a short plug cable, with a small amber spark at the joint. |

### 3.3 Empty pages: `public\illustrations\empty\` (20)

Folder: `F:\Programming Projects\tallaby\apps\dashboard\public\illustrations\empty\`

All of these replace the small icon in the shared `EmptyState` (`apps/dashboard/components/seller-ui/display.tsx:194`) unless the row says otherwise.

| File | Where it appears | Shown | Prompt |
|---|---|---|---|
| `products.png` | Products list, no products yet. `app/(main)/stores/[storeId]/products/_components/vendor-products.section.tsx:424` | 120 px | An empty open box on a light shelf, with a small amber plus badge beside it. |
| `orders.png` | Orders list, no orders yet. `app/(main)/orders/orders-chunks.tsx:534` (only when `overview.orders === 0`). Also the home "Recent orders" card, `app/(main)/_components/recent-orders.data.tsx:72` | 120 px | An empty shopping bag with its handles up and a small amber bell above it, waiting for the first order. |
| `customers.png` | Orders › Customers, no customers yet. `app/(main)/orders/customers/customers.client.tsx:378` | 120 px | Three simple round contact cards stacked with blank lines, no faces, one with an amber heart. |
| `categories.png` | Products › Categories, none yet. `app/(main)/stores/[storeId]/products/categories-brands/categories-brands.client.tsx:324` (when `k` is categories) | 120 px | Three open folders of different sizes in a neat row, one with an amber tab. |
| `brands.png` | Products › Brands, none yet. Same file, line 324 (when `k` is brands) | 120 px | A blank price tag and a blank round badge hanging together, the badge with a small amber star. |
| `coupons.png` | Coupons, none yet. `app/(main)/coupons/_components/coupons.client.tsx:105` | 120 px | A blank coupon ticket with a dotted cut line and an amber scissors next to it. |
| `discounts.png` | Marketing › Discounts, no rules yet. `app/(main)/marketing/discounts/discount-rules.client.tsx:312` | 120 px | A gift box with a ribbon and a small amber blank price tag tied to it. |
| `reviews.png` | Reviews, none yet. `app/(main)/reviews/reviews.chunks.tsx:129` (only when `rows.length === 0`) | 120 px | A speech bubble with five small stars in it, one star amber. |
| `missed-orders.png` | Orders › Not completed, none. `app/(main)/orders/missed/missed-orders.client.tsx:94` | 120 px | A phone with a blank screen and a small amber check mark, showing nothing was missed. |
| `pending-carts.png` | Orders › Pending carts, none. `app/(main)/orders/pending-carts/pending-carts.client.tsx:53` | 120 px | An empty shopping cart standing still, with a tiny amber clock above it. |
| `blog.png` | Website › Blog, no posts yet. `app/(main)/stores/[storeId]/website/blog/page.tsx:142` | 120 px | An open notebook with blank lines and a pen resting on it, with one amber bookmark. |
| `email-campaigns.png` | Marketing › Email campaigns, none yet. `app/(main)/marketing/emails/email-campaigns.client.tsx:274` | 120 px | A paper plane flying out of an open envelope, with a short dotted trail and an amber dot. |
| `notifications.png` | Notification bell drop-down, nothing yet. `apps/dashboard/components/layout/notification-bell.client.tsx:165-167` (own markup, not `EmptyState`) | 64 px | A quiet bell resting on its side with three tiny amber dots above it, showing all is calm. |
| `media.png` | Website › Media, no files yet. `app/(main)/stores/[storeId]/website/media/media-manager.client.tsx:410` (only the `empty`/`emptyFolder` case) | 120 px | Two stacked blank photo frames with a small mountain and an amber sun shape inside the front one. |
| `shipping-zones.png` | Shipping, no delivery areas yet. `app/(main)/stores/[storeId]/shipping/shipping.client.tsx:172` (dashed box, own markup) | 96 px | A simple folded map with three map pins on it, one pin amber. |
| `apps-installed.png` | Apps, "Installed" tab is empty. `app/(main)/stores/[storeId]/apps/app-center.client.tsx:191` | 120 px | Four rounded app tiles in a grid, three empty and one with an amber plus. |
| `wallet.png` | Wallet, no transactions yet. `app/(main)/wallet/store-wallet.data.tsx:234`. Also Financial, `app/(main)/financial/financial.chunks.tsx:145` | 120 px | A closed wallet with one coin peeking out, the coin amber. |
| `low-stock.png` | Products › Inventory, nothing running low. `app/(main)/stores/[storeId]/products/inventory/inventory.client.tsx:47` | 120 px | Three full stacked boxes with a small amber check mark badge on top. |
| `trash.png` | Products › Trash, empty. `app/(main)/stores/[storeId]/products/trash/trash.client.tsx:82` | 120 px | A clean, empty rounded trash bin with its lid on and a small amber sparkle. |
| `referrals.png` | Earn (affiliate program), no referrals yet. `app/(main)/earn/earn.data.tsx:127` | 120 px | Two small shop fronts connected by a dotted line, with an amber gift box in the middle of the line. |

### 3.4 Status pages: `public\illustrations\status\` (2)

Folder: `F:\Programming Projects\tallaby\apps\dashboard\public\illustrations\status\`

| File | Where it appears | Shown | Prompt |
|---|---|---|---|
| `not-found.png` | Page not found. `app/(main)/not-found.tsx:12` and `app/not-found.tsx:12` | 160 px | A magnifying glass over an empty, blank page shape, with three small amber dots beside it. |
| `error.png` | Something went wrong. `app/(main)/error.tsx:20` | 160 px | A small toolbox with a wrench and a loose bolt next to a blank browser window shape, one amber detail on the wrench. |

**Count:** onboarding 6, features 5, empty 20, status 2 = **33**.

Not included on purpose: the login and signup panel (it already has a drawn dashboard sketch, `app/login/auth-shell.client.tsx`), the Earn hero (it already shows the bonus ring), the store app (PWA) settings (it already has a preview column), tables, settings forms, and every "no matches for your search or filter" state.

## 4. Developer note (for the wiring task)

- Use `next/image` with fixed `width`/`height` equal to the **Shown** size, `alt=""` and `aria-hidden` (the images are decorative, and the title next to them carries the meaning). Don't add `priority` except for `setup-*.png` on the setup-only home.
- Give `EmptyState` (`components/seller-ui/display.tsx:194`) an optional `image?: string` prop that renders in place of `icon`, and keep `icon` as the fallback so a missing file never breaks a page. Show the picture only in the "nothing yet" branch. Filtered or search "no matches" states keep the icon.
- `setup-home.data.tsx:83` and `setup-checklist.data.tsx:141` read the step key, so map `HOME_STEP_ICONS` keys (`product`, `design`, `payments`, `shipping`) to `/illustrations/onboarding/setup-<key>.png`. The checklist card at `setup-checklist.data.tsx` sits on a dark teal background, and the transparent PNGs are drawn for both.
- Dark mode: the dashboard has its own dark theme (`.dark:has(.seller-shell)`, `globals.css:286`). The palette avoids black and large white areas, so no `dark:` filter should be needed. Check each image on `#142126` before shipping. If one looks too bright, use `dark:opacity-90`, not `invert`.
- Before committing, compress the PNGs (they are 1024 px exports shown at 64–160 px). WebP or a lossless PNG squeeze is enough, and keep the file names.
