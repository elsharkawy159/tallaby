/**
 * Microsoft Clarity on the seller dashboard (dashboard.tallaby.com) only:
 * never in apps/admin, apps/ecommerce (storefronts, tallaby.com) or
 * apps/shipping. The project id is public (it ships in the page).
 *
 * - Loads only in a production build on Vercel's production environment
 *   (`shouldLoadClarity`, decided on the server), and then only on the real
 *   dashboard host and never inside a frame (`isClarityAllowedHere`, in the
 *   browser), so dev, previews, staging and localhost send nothing.
 * - Sessions are identified by the seller's internal id only, plus a `plan`
 *   tag. Never a name, email or phone (privacy rule).
 * - Typed input is masked by Clarity; screens with money, keys or customer
 *   contact details also carry `data-clarity-mask="true"`.
 */

/** Tallaby's Clarity project (owner, 2026-11-14). */
export const DEFAULT_CLARITY_PROJECT_ID = "zda9ar0rwv";

/** The only host Clarity may record on. */
export const CLARITY_HOSTS: readonly string[] = ["dashboard.tallaby.com"];

const PROJECT_ID_RE = /^[a-z0-9]{6,32}$/;

/** `NEXT_PUBLIC_CLARITY_ID` overrides the default; an invalid value means no Clarity. */
export function clarityProjectId(override: string | null | undefined): string | null {
  const id = (override ?? "").trim() || DEFAULT_CLARITY_PROJECT_ID;
  return PROJECT_ID_RE.test(id) ? id : null;
}

/** Server side: production build on Vercel production, with a valid id. */
export function shouldLoadClarity(env: {
  nodeEnv: string | undefined;
  vercelEnv: string | undefined;
  projectId: string | null;
}): boolean {
  return env.nodeEnv === "production" && env.vercelEnv === "production" && env.projectId !== null;
}

/** The project id to load in this deployment, or null (server components). */
export function enabledClarityProjectId(env: Record<string, string | undefined> = process.env): string | null {
  const projectId = clarityProjectId(env.NEXT_PUBLIC_CLARITY_ID);
  return shouldLoadClarity({ nodeEnv: env.NODE_ENV, vercelEnv: env.VERCEL_ENV, projectId }) ? projectId : null;
}

export function isClarityHost(host: string | null | undefined): boolean {
  const hostname = String(host ?? "").trim().toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
  return CLARITY_HOSTS.includes(hostname);
}

export type ClarityFn = ((...args: unknown[]) => void) & { q?: unknown[][] };

export type ClarityWindow = {
  clarity?: ClarityFn;
  self: unknown;
  top: unknown;
  location: { hostname: string };
};

/** Browser side: the dashboard host, top-level window only (no builder canvas or other frame). */
export function isClarityAllowedHere(win: ClarityWindow | null): boolean {
  if (!win) return false;
  return isClarityHost(win.location.hostname) && win.self === win.top;
}

export function clarityTagSrc(projectId: string): string {
  return `https://www.clarity.ms/tag/${encodeURIComponent(projectId)}`;
}

/**
 * Calls `clarity(...args)` where Clarity may run, installing the same queue
 * stub as Microsoft's snippet first, so calls made before the tag loads are
 * replayed by it. A no-op anywhere else.
 */
export function callClarity(win: ClarityWindow | null, ...args: unknown[]): void {
  if (!win || !isClarityAllowedHere(win)) return;
  if (!win.clarity) {
    const stub: ClarityFn = function (...a: unknown[]) {
      (stub.q = stub.q || []).push(a);
    };
    win.clarity = stub;
  }
  win.clarity(...args);
}

/** The internal seller id (a UUID) is the only identity Clarity ever gets. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function identifySeller(win: ClarityWindow | null, sellerId: string, plan: string | null): void {
  if (!UUID_RE.test(sellerId)) return;
  callClarity(win, "identify", sellerId);
  if (plan && /^[a-z_]{1,20}$/.test(plan)) callClarity(win, "set", "plan", plan);
}

declare global {
  interface Window {
    clarity?: ClarityFn;
  }
}
