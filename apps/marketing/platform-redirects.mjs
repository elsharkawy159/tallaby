/* global process */
// Storefront pages that tallaby.com served while it ran on apps/ecommerce,
// now on two reserved subdomains of the storefront app (owner, 2026-11-19;
// docs/plans/hetzner-migration.md, "Marketing split"): customer pages on
// account.<root>, the template preview on preview.<root>. Old links (emails,
// bookmarks, payment returns) keep working through these 308s, which keep the
// path and the query. Read by next.config.mjs after the rows in redirects.mjs.
//
// The origins mirror accountOrigin() / templatePreviewOrigin() in
// packages/lib/src/storefront/platform-hosts.lib.ts. next.config.mjs runs in
// plain Node, which cannot load that TypeScript module, so the few lines are
// repeated here; platform-redirects.test.ts checks both give the same origins.

/** `NEXT_PUBLIC_ROOT_DOMAIN` reduced like storefrontRootDomain(): `tallaby.com`, `localhost:3000`. */
function rootDomain(root) {
  return (root || "tallaby.com")
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/^www\./, "");
}

/** `https://<subdomain>.<root>`, or `http://` when the root is localhost (development). */
export function platformOrigin(subdomain, root = process.env.NEXT_PUBLIC_ROOT_DOMAIN) {
  const domain = rootDomain(root);
  return `${domain.startsWith("localhost") ? "http" : "https"}://${subdomain}.${domain}`;
}

/** Customer pages served on account.<root> (apps/ecommerce lib/platform-site-routing.ts). */
export const ACCOUNT_PAGES = ["auth", "cart", "orders", "profile", "returns", "shipping", "payment", "cookies"];
/** Pages served on preview.<root>. The card screenshots (/template-previews) stay in this app's public/. */
export const PREVIEW_PAGES = ["template-preview", "dev-library"];

/** `/page` and `/page/...`, Arabic (no prefix) and `/en`, each to the same path on `origin`. */
function pageRedirects(pages, origin) {
  return pages.flatMap((page) =>
    ["", "/en"].flatMap((prefix) =>
      [`${prefix}/${page}`, `${prefix}/${page}/:path*`].map((source) => ({
        source,
        destination: `${origin}${source}`,
        permanent: true,
      })),
    ),
  );
}

/** The redirect rows for `root` (defaults to NEXT_PUBLIC_ROOT_DOMAIN at build time). */
export function platformRedirects(root = process.env.NEXT_PUBLIC_ROOT_DOMAIN) {
  return [
    ...pageRedirects(ACCOUNT_PAGES, platformOrigin("account", root)),
    ...pageRedirects(PREVIEW_PAGES, platformOrigin("preview", root)),
  ];
}
