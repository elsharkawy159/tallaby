import { describe, expect, it } from "vitest";
import { flushHeaderOnMobile } from "./header";
import { sanitizeSiteConfig } from "./sanitize";
import type { SectionInstance, SiteConfig } from "./schema";
import { CODE_TEMPLATES } from "../templates/catalog";

const header = (mobile?: Record<string, unknown>): SectionInstance => ({
  id: "hdr",
  sectionId: "custom-section",
  version: 1,
  props: {},
  componentTree: [
    {
      id: "root",
      type: "section",
      props: {},
      style: { paddingTop: 16, paddingBottom: 16 },
      ...(mobile && { breakpointStyles: { mobile, tablet: { paddingTop: 12 } } }),
      children: [],
    },
  ],
});

describe("flushHeaderOnMobile", () => {
  it("zeroes the root section's mobile padding-y (a pre-0084 header's 40px)", () => {
    const out = flushHeaderOnMobile(header({ paddingTop: 40, paddingBottom: 40, gap: 8 }));
    const root = out.componentTree![0]!;
    expect(root.breakpointStyles).toEqual({ mobile: { paddingTop: 0, paddingBottom: 0, gap: 8 }, tablet: { paddingTop: 12 } });
    expect(root.style).toEqual({ paddingTop: 16, paddingBottom: 16 });
  });

  it("adds a mobile style when the header has none, and never mutates its input", () => {
    const input = header();
    const out = flushHeaderOnMobile(input);
    expect(out.componentTree![0]!.breakpointStyles).toEqual({ mobile: { paddingTop: 0, paddingBottom: 0 } });
    expect(input.componentTree![0]!.breakpointStyles).toBeUndefined();
  });

  it("returns a flush header as it is", () => {
    const input = header({ paddingTop: 0, paddingBottom: 0 });
    expect(flushHeaderOnMobile(input)).toBe(input);
    expect(flushHeaderOnMobile(null)).toBeNull();
  });

  it("runs on save (sanitizeSiteConfig)", () => {
    const config = { ...CODE_TEMPLATES[0]!.config(), header: header({ paddingTop: 40, paddingBottom: 40 }) } as SiteConfig;
    expect(sanitizeSiteConfig(config).header!.componentTree![0]!.breakpointStyles?.mobile).toEqual({ paddingTop: 0, paddingBottom: 0 });
  });

  it.each(CODE_TEMPLATES.map((t) => [t.key, t] as const))("%s: the header is already flush on mobile", (_key, template) => {
    const h = template.config().header!;
    expect(flushHeaderOnMobile(h)).toBe(h);
  });
});
