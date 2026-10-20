/**
 * Website-builder routes (spec 2026-10-20-admin-website-builder §5.5): only
 * write roles may open them; the proxy sends a moderator to "/". Pure, so the
 * proxy (no Drizzle) and tests can use it. Actions re-check on the server.
 */
const BUILDER_PATHS = [/^\/stores\/[^/]+\/editor(?:\/|$)/, /^\/templates\/[^/]+\/editor(?:\/|$)/, /^\/sections(?:\/|$)/];

export function isBuilderPath(pathname: string): boolean {
  return BUILDER_PATHS.some((re) => re.test(pathname));
}

export const BUILDER_ROLES = ["admin", "super_admin"] as const;

export function canUseBuilder(role: string | null | undefined): boolean {
  return (BUILDER_ROLES as readonly string[]).includes(role ?? "");
}
