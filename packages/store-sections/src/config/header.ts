/**
 * The site header never has vertical padding on phones (owner, 2026-10-20,
 * asked again 2026-10-23): the header's root section gets padding-top and
 * padding-bottom 0 at the mobile breakpoint, whatever the design or the seller
 * set. Stored sites from before `0084` still carry the section's 40px mobile
 * default, and the DB copies of templates are the master copy, so this runs
 * on save (`sanitizeSiteConfig`) and wherever a header is drawn. Desktop and
 * tablet padding are kept. Never mutates its input.
 */
import type { SectionInstance } from "./schema";

const FLUSH = { paddingTop: 0, paddingBottom: 0 };

function flushMobile(breakpoints: Record<string, Record<string, unknown>> | undefined): Record<string, Record<string, unknown>> | undefined {
  const mobile = breakpoints?.mobile;
  if (mobile?.paddingTop === 0 && mobile.paddingBottom === 0) return breakpoints;
  return { ...breakpoints, mobile: { ...mobile, ...FLUSH } };
}

export function flushHeaderOnMobile(header: SectionInstance): SectionInstance;
export function flushHeaderOnMobile(header: SectionInstance | null | undefined): SectionInstance | null | undefined;
export function flushHeaderOnMobile(header: SectionInstance | null | undefined): SectionInstance | null | undefined {
  if (!header) return header;
  const [root, ...rest] = header.componentTree ?? [];
  if (root?.type !== "section") return header;
  const breakpointStyles = flushMobile(root.breakpointStyles);
  if (breakpointStyles === root.breakpointStyles) return header;
  return { ...header, componentTree: [{ ...root, breakpointStyles }, ...rest] };
}
