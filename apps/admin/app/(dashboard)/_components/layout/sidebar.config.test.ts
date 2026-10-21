import { describe, expect, it } from "vitest";
import {
  PINNED_SECTION_KEY,
  activeHref,
  activeSectionKey,
  isActiveHref,
  sectionCount,
  sidebarSections,
  visibleSections,
} from "./sidebar.config";
import { EMPTY_SIDEBAR_COUNTS } from "./sidebar.types";

const allLinks = sidebarSections.flatMap((section) => section.links);

describe("admin sidebar config", () => {
  it("has unique keys and hrefs", () => {
    expect(new Set(allLinks.map((link) => link.key)).size).toBe(allLinks.length);
    expect(new Set(allLinks.map((link) => link.href)).size).toBe(allLinks.length);
  });

  it("only uses count keys that the counts query returns", () => {
    for (const link of allLinks) {
      if (link.countKey) expect(EMPTY_SIDEBAR_COUNTS).toHaveProperty(link.countKey);
    }
  });

  it("lists Sellers directly above Customers", () => {
    const people = sidebarSections.find((section) => section.key === "people")!;
    const keys = people.links.map((link) => link.key);
    expect(keys.indexOf("customers")).toBe(keys.indexOf("sellers") + 1);
  });

  it("gives every group at least one visible link", () => {
    for (const section of sidebarSections) {
      expect(section.links.some((link) => !link.hidden)).toBe(true);
    }
  });

  it("has unique section keys and a pinned Overview", () => {
    expect(new Set(sidebarSections.map((section) => section.key)).size).toBe(sidebarSections.length);
    expect(sidebarSections[0]?.key).toBe(PINNED_SECTION_KEY);
  });

  it("does not render the pages hidden for the SaaS pivot", () => {
    const visible = visibleSections().flatMap((section) => section.links.map((link) => link.href));
    expect(visible).not.toContain("/external-orders");
    expect(visible).not.toContain("/pricing-calculator");
  });
});

describe("active link", () => {
  it("matches home only exactly", () => {
    expect(isActiveHref("/", "/")).toBe(true);
    expect(isActiveHref("/orders", "/")).toBe(false);
  });

  it("matches child routes", () => {
    expect(activeHref("/fulfillment/abc")).toBe("/fulfillment");
    expect(activeHref("/sellers/123")).toBe("/sellers");
  });

  it("never matches a hidden link", () => {
    expect(activeHref("/external-orders")).toBeNull();
  });

  it("does not match a sibling that only shares a prefix", () => {
    expect(isActiveHref("/stores-archive", "/stores")).toBe(false);
  });
});

describe("groups", () => {
  it("finds the group of the active page", () => {
    expect(activeSectionKey("/stores/abc")).toBe("stores");
    expect(activeSectionKey("/wallets/sellers/1")).toBe("money");
    expect(activeSectionKey("/")).toBe("overview");
    expect(activeSectionKey("/external-orders")).toBeNull();
  });

  it("sums only visible badge counts", () => {
    const sales = sidebarSections.find((section) => section.key === "sales")!;
    const counts = { ...EMPTY_SIDEBAR_COUNTS, pendingOrders: 3, unremindedCarts: 2, pendingSellers: 9 };
    expect(sectionCount(sales, counts)).toBe(5);
  });
});
