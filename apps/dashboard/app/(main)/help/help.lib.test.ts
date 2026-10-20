import { describe, expect, it } from "vitest";
import { HELP_SHORTCUTS, HELP_TOPICS, resolveHelpHref, resolveHelpLink } from "./help.lib";
import en from "../../../messages/en.json";
import ar from "../../../messages/ar.json";

describe("help links", () => {
  it("fills the selected store, or falls back to the stores list", () => {
    expect(resolveHelpHref("/stores/[storeId]/shipping", "abc")).toBe("/stores/abc/shipping");
    expect(resolveHelpHref("/stores/[storeId]/shipping", null)).toBe("/stores");
    expect(resolveHelpHref("/orders", null)).toBe("/orders");
  });

  it("hides builder links when the builder is off", () => {
    const builder = { nav: "websiteBuilder", href: "/stores/[storeId]/editor", builder: true };
    expect(resolveHelpLink(builder, { storeId: "s1", builder: false })).toBeUndefined();
    expect(resolveHelpLink(builder, { storeId: "s1", builder: true })).toEqual({ nav: "websiteBuilder", href: "/stores/s1/editor" });
  });

  it("has every string in both languages", () => {
    for (const messages of [en, ar] as Record<string, any>[]) {
      for (const topic of HELP_TOPICS) {
        expect(messages.help.topics[topic.key]).toBeTypeOf("string");
        for (const faq of topic.faqs) {
          expect(messages.help.faqs[faq.key]?.question).toBeTypeOf("string");
          expect(messages.help.faqs[faq.key]?.answer).toBeTypeOf("string");
          if (faq.link) expect(messages.nav[faq.link.nav]).toBeTypeOf("string");
        }
      }
      for (const link of HELP_SHORTCUTS) expect(messages.nav[link.nav]).toBeTypeOf("string");
    }
  });
});
