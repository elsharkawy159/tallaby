import { z } from "zod";

/**
 * The App Center manifest format (ROADMAP.md F-93, docs/apps-platform.md).
 * One manifest per app or integration, in `./manifests/<id>.ts`. Pure data:
 * no secrets, no store data, no server code. Install state lives in the
 * database (`store_app_installs`, `store_integrations`, `agent_grants`), and
 * the install, secret and billing logic stays in `@workspace/lib` server code.
 */

/** Stable ids. They equal the old catalog keys and `store_integrations.provider` values, so installs keep working. */
export const APP_IDS = [
  "ai_assistants",
  "size_chart",
  "meta_pixel",
  "google_analytics",
  "google_tag_manager",
  "meta_capi",
  "tiktok_pixel",
  "snapchat_pixel",
  "product_feeds",
  "bosta",
  "wassalha",
  "mylerz",
  "jt_express",
  "aramex",
  "paymob",
  "kashier",
  "paytabs",
  "moyasar",
  "paylink",
  "tabby",
  "paypal",
  "tallaby_pay",
  "google_sheets",
  "shopify_import",
  "customer_notifications",
  "sms",
] as const;
export type AppId = (typeof APP_IDS)[number];

/** `app`: built by Tallaby, runs inside Tallaby. `integration`: connects the store to another company's service. */
export const APP_KINDS = ["app", "integration"] as const;
export type AppKind = (typeof APP_KINDS)[number];

/** The App Center's categories, in display order (the old catalog's groups). */
export const APP_CATEGORIES = ["ai", "storefront", "tracking", "shipping", "payments", "data", "messaging"] as const;
export type AppCategory = (typeof APP_CATEGORIES)[number];

/** How the app works, shown as a tag on its card (the old catalog's `kind`). */
export const APP_MECHANISMS = [
  "script",
  "server",
  "import",
  "account",
  "carrier",
  "sheet",
  "gateway",
  "agent",
  "notifications",
  "widget",
  "feed",
] as const;
export type AppMechanism = (typeof APP_MECHANISMS)[number];

export const APP_STATUSES = ["live", "beta", "coming_soon"] as const;
export type AppStatus = (typeof APP_STATUSES)[number];

/**
 * - `toggle`: one click installs it through the install engine (`store_app_installs`; a paid app is charged).
 * - `connect`: the seller connects an account or pastes an id or key (`store_integrations`, `agent_grants`).
 * - `request`: not open yet; the seller asks for it (`store_app_requests`, F-62).
 * - `builtin`: comes with every store, nothing to install.
 */
export const APP_INSTALL_MODES = ["toggle", "connect", "request", "builtin"] as const;
export type AppInstallMode = (typeof APP_INSTALL_MODES)[number];

/**
 * Which settings screen the dashboard renders at `/stores/:storeId/apps/:slug/settings`.
 * The dashboard maps every key to an existing component (`settings-registry.client.tsx`);
 * the map is typed `Record<AppSettingsRoute, …>`, so a new key does not compile until it has one.
 */
export const APP_SETTINGS_ROUTES = [
  "identifier",
  "meta_capi",
  "google_sheets",
  "shopify_import",
  "bosta",
  "wassalha",
  "gateway",
  "size_chart",
  "ai_assistants",
  "product_feeds",
] as const;
export type AppSettingsRoute = (typeof APP_SETTINGS_ROUTES)[number];

/** Where the app shows up or acts. Data only: nothing reads these to grant access yet. */
export const APP_SURFACES = [
  "storefront.product_page",
  "storefront.script",
  "storefront.checkout",
  "server.events",
  "orders",
  "orders.export",
  "shipping",
  "payments",
  "catalog.import",
  "catalog.feed",
  "customer.messages",
  "agent",
] as const;
export type AppSurface = (typeof APP_SURFACES)[number];

export const APP_PLANS = ["free", "pro"] as const;
export type AppPlan = (typeof APP_PLANS)[number];

/** Who builds and supports the app. Only Tallaby for now; third-party developers get their own ids later. */
export const APP_DEVELOPERS = {
  tallaby: { name: { ar: "طلبي", en: "Tallaby" }, url: "https://tallaby.com" },
} as const;
export type AppDeveloperId = keyof typeof APP_DEVELOPERS;

const localized = z.strictObject({ ar: z.string().trim().min(1), en: z.string().trim().min(1) });
export type LocalizedText = z.infer<typeof localized>;

const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/);
const cents = z.number().int().positive();

/** Same shape as `AppPricing` in @workspace/lib/billing (US cents); the lib adapter checks they stay equal. */
export const appPricingSchema = z.discriminatedUnion("model", [
  z.strictObject({ model: z.literal("free") }),
  z.strictObject({ model: z.literal("one_time"), usdCents: cents }),
  z.strictObject({ model: z.literal("monthly"), usdCents: cents }),
  z.strictObject({ model: z.literal("per_order"), usdCents: cents }),
  z.strictObject({ model: z.literal("usage"), usdCents: cents, unit: z.enum(["action", "minute", "hour", "day"]) }),
]);
export type AppManifestPricing = z.infer<typeof appPricingSchema>;

export const appManifestSchema = z
  .strictObject({
    id: z.enum(APP_IDS),
    /** The URL segment: `/stores/:storeId/apps/:slug`. Kebab case, so the old `/apps/bosta` and `/apps/size-chart` links still resolve. */
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    kind: z.enum(APP_KINDS),
    category: z.enum(APP_CATEGORIES),
    mechanism: z.enum(APP_MECHANISMS),
    name: localized,
    /** The company behind the service (Meta, Bosta …), or Tallaby. */
    vendor: localized,
    /** One or two sentences for the card. */
    summary: localized,
    /** The detail page's paragraph. */
    description: localized,
    /** What it does on the store, a few short lines for the detail page. */
    highlights: z.array(localized).max(5),
    /** Latin names and synonyms, so an Arabic seller's Latin search still finds it. */
    keywords: z.array(z.string().min(1)).default([]),
    icon: z.strictObject({
      background: hex,
      foreground: hex,
      /** A dark tile gets a light inner ring. */
      dark: z.boolean().optional(),
      /** The brand's own square logo, a path under the dashboard's `public/` (e.g. `/app-logos/bosta.png`). */
      image: z.string().regex(/^\/[\w./-]+\.(png|svg|webp)$/).optional(),
    }),
    screenshots: z.array(z.strictObject({ src: z.string().regex(/^\/[\w./-]+\.(png|jpg|webp)$/), alt: localized })).max(8),
    pricing: appPricingSchema,
    /** The other company charges its own fees on its own account (shipping, card fees). Tallaby takes nothing. */
    providerFees: z.boolean().default(false),
    plans: z.array(z.enum(APP_PLANS)).min(1),
    developer: z.enum(Object.keys(APP_DEVELOPERS) as [AppDeveloperId, ...AppDeveloperId[]]),
    status: z.enum(APP_STATUSES),
    installMode: z.enum(APP_INSTALL_MODES),
    /** Null for an app that is not built yet, or that has nothing to set (it only installs). */
    settingsRoute: z.enum(APP_SETTINGS_ROUTES).nullable(),
    surfaces: z.array(z.enum(APP_SURFACES)),
    /** Other apps it needs first (data only). */
    requires: z.array(z.enum(APP_IDS)).default([]),
    /** Public help page on tallaby.com. */
    docsUrl: z.url({ protocol: /^https$/ }).optional(),
    /**
     * Server-side wiring, never sent by the public API. `provider` is the
     * `store_integrations.provider` the app stores its connection in.
     */
    internal: z
      .strictObject({
        provider: z.string().regex(/^[a-z_]+$/).optional(),
      })
      .default({}),
  })
  .superRefine((manifest, ctx) => {
    if (manifest.slug !== manifest.id.replaceAll("_", "-")) {
      ctx.addIssue({ code: "custom", path: ["slug"], message: "slug must be the id in kebab case" });
    }
    if (manifest.status === "coming_soon" && manifest.installMode !== "request" && manifest.settingsRoute !== null) {
      ctx.addIssue({ code: "custom", path: ["settingsRoute"], message: "a coming-soon app has no settings yet" });
    }
    if (manifest.installMode === "request" && manifest.status === "live") {
      ctx.addIssue({ code: "custom", path: ["installMode"], message: "a live app is not requested" });
    }
    if (manifest.requires.includes(manifest.id)) {
      ctx.addIssue({ code: "custom", path: ["requires"], message: "an app cannot require itself" });
    }
  });

/** What a manifest file declares (defaults optional). */
export type AppManifestInput = z.input<typeof appManifestSchema> & { id: AppId };
/** A validated manifest. */
export type AppManifest = z.output<typeof appManifestSchema> & { id: AppId };

/**
 * Declares one app. Typed only: validation runs once in `registry.ts` (and the
 * tests), so a bad manifest fails at import, never in a seller's request.
 */
export function defineApp<const T extends AppManifestInput>(manifest: T): T {
  return manifest;
}
