/**
 * Where a seller goes right after signup when they came for the AI Store
 * Builder (F-54): `/ai-builder`, or `/ai-builder?intake=<uuid>` for a hero
 * composer intake (F-82d); or for Pro (tallaby.com's Pro button): `/settings/plan`,
 * where the seller upgrades through the normal flow (a redirect hint only,
 * never a plan change). Never a free redirect: anything else is null.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type AfterSignupPath = "/ai-builder" | `/ai-builder?intake=${string}` | "/settings/plan";

export function afterSignupPath(next: unknown): AfterSignupPath | null {
  if (typeof next !== "string") return null;
  if (next === "/ai-builder") return "/ai-builder";
  if (next === "/settings/plan") return "/settings/plan";
  const match = /^\/ai-builder\?intake=([^&#]+)$/.exec(next);
  return match && UUID.test(match[1]!) ? `/ai-builder?intake=${match[1]!.toLowerCase()}` : null;
}

/** `path` plus query parameters, whether or not it already has a query. */
export function withQuery(path: string, params: Record<string, string | undefined>): string {
  const query = new URLSearchParams(Object.entries(params).filter((entry): entry is [string, string] => Boolean(entry[1]))).toString();
  if (!query) return path;
  return `${path}${path.includes("?") ? "&" : "?"}${query}`;
}
