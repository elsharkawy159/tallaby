import { describe, expect, it } from "vitest";
import { sellerNotificationHref, sellerNotificationValues, SELLER_NOTIFICATION_TYPES, ADMIN_NOTIFICATION_TYPES, adminNotificationHref } from "../notifications/notifications.lib";
import {
  buildThemeRequestImagePath,
  isHttpsUrl,
  isOpenThemeRequest,
  isOwnThemeRequestImagePath,
  MAX_OPEN_THEME_REQUESTS,
  planThemeRequestUpdate,
  THEME_REQUEST_IMAGE_MAX_BYTES,
  themeRequestImageProblem,
  themeRequestInputSchema,
  themeRequestNotification,
  themeRequestsPath,
  themeRequestUpdateSchema,
} from "./theme-requests.lib";

const SELLER = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const FILE = "33333333-3333-4333-8333-333333333333";
const STORE = "44444444-4444-4444-8444-444444444444";
const REQ = "55555555-5555-4555-8555-555555555555";

describe("isHttpsUrl", () => {
  it("accepts public https addresses only", () => {
    expect(isHttpsUrl("https://example.com/shop")).toBe(true);
    expect(isHttpsUrl("https://www.zara.com/eg/en/")).toBe(true);
    expect(isHttpsUrl("http://example.com")).toBe(false);
    expect(isHttpsUrl("javascript:alert(1)")).toBe(false);
    expect(isHttpsUrl("ftp://example.com")).toBe(false);
    expect(isHttpsUrl("https://user:pass@example.com")).toBe(false);
    expect(isHttpsUrl("https://localhost")).toBe(false);
    expect(isHttpsUrl("https://exa mple.com")).toBe(false);
    expect(isHttpsUrl("example.com")).toBe(false);
    expect(isHttpsUrl(`https://example.com/${"a".repeat(500)}`)).toBe(false);
  });
});

describe("themeRequestInputSchema", () => {
  const base = { storeId: STORE };

  it("needs at least one of URL, image or description", () => {
    expect(themeRequestInputSchema.safeParse({ ...base }).success).toBe(false);
    expect(themeRequestInputSchema.safeParse({ ...base, description: "   ", note: "only a note" }).success).toBe(false);
    expect(themeRequestInputSchema.safeParse({ ...base, referenceUrl: "https://a.com" }).success).toBe(true);
    expect(themeRequestInputSchema.safeParse({ ...base, description: "Calm colours" }).success).toBe(true);
    expect(themeRequestInputSchema.safeParse({ ...base, imagePaths: [`${SELLER}/${FILE}.png`] }).success).toBe(true);
  });

  it("rejects a non-https URL and trims empty fields to null", () => {
    const bad = themeRequestInputSchema.safeParse({ ...base, referenceUrl: "http://a.com", description: "x" });
    expect(bad.success).toBe(false);
    const ok = themeRequestInputSchema.parse({ ...base, referenceUrl: "  ", description: " Calm ", note: "" });
    expect(ok).toMatchObject({ referenceUrl: null, description: "Calm", note: null, imagePaths: [] });
  });

  it("caps images at 3 and text lengths", () => {
    const four = Array.from({ length: 4 }, (_, i) => `${SELLER}/${FILE.slice(0, -1)}${i}.png`);
    expect(themeRequestInputSchema.safeParse({ ...base, imagePaths: four }).success).toBe(false);
    expect(themeRequestInputSchema.safeParse({ ...base, description: "a".repeat(2001) }).success).toBe(false);
    expect(themeRequestInputSchema.safeParse({ ...base, description: "x", note: "a".repeat(1001) }).success).toBe(false);
    expect(themeRequestInputSchema.safeParse({ storeId: "not-a-uuid", description: "x" }).success).toBe(false);
  });
});

describe("images", () => {
  it("allows JPEG, PNG and WebP up to 5 MB", () => {
    expect(themeRequestImageProblem({ type: "image/png", size: 1000 })).toBeNull();
    expect(themeRequestImageProblem({ type: "image/webp", size: THEME_REQUEST_IMAGE_MAX_BYTES })).toBeNull();
    expect(themeRequestImageProblem({ type: "image/gif", size: 1000 })).toBe("type");
    expect(themeRequestImageProblem({ type: "image/svg+xml", size: 1000 })).toBe("type");
    expect(themeRequestImageProblem({ type: "image/jpeg", size: THEME_REQUEST_IMAGE_MAX_BYTES + 1 })).toBe("size");
    expect(themeRequestImageProblem({ type: "image/jpeg", size: 0 })).toBe("size");
  });

  it("builds and checks paths in the seller's own folder", () => {
    const path = buildThemeRequestImagePath(SELLER, FILE, "image/jpeg");
    expect(path).toBe(`${SELLER}/${FILE}.jpg`);
    expect(buildThemeRequestImagePath(SELLER, FILE, "image/gif")).toBeNull();
    expect(buildThemeRequestImagePath("../x", FILE, "image/png")).toBeNull();
    expect(isOwnThemeRequestImagePath(SELLER, path)).toBe(true);
    expect(isOwnThemeRequestImagePath(OTHER, path)).toBe(false);
    expect(isOwnThemeRequestImagePath(SELLER, `${SELLER}/../${OTHER}/${FILE}.jpg`)).toBe(false);
    expect(isOwnThemeRequestImagePath(SELLER, `${SELLER}/${FILE}.svg`)).toBe(false);
    expect(isOwnThemeRequestImagePath(SELLER, 42)).toBe(false);
  });
});

describe("open requests", () => {
  it("counts new and in progress only, up to 3", () => {
    expect(MAX_OPEN_THEME_REQUESTS).toBe(3);
    expect(isOpenThemeRequest("new")).toBe(true);
    expect(isOpenThemeRequest("in_progress")).toBe(true);
    expect(isOpenThemeRequest("ready")).toBe(false);
    expect(isOpenThemeRequest("declined")).toBe(false);
  });
});

describe("planThemeRequestUpdate", () => {
  it("notifies on a change to in progress, ready or declined", () => {
    expect(planThemeRequestUpdate({ status: "new", adminReply: null }, { status: "in_progress", reply: null })).toEqual({
      changed: true,
      statusChanged: true,
      notify: true,
      email: null,
    });
    expect(planThemeRequestUpdate({ status: "in_progress", adminReply: null }, { status: "ready", reply: "Done" })).toMatchObject({
      notify: true,
      email: "ready",
    });
    expect(planThemeRequestUpdate({ status: "new", adminReply: null }, { status: "declined", reply: null })).toMatchObject({
      notify: true,
      email: "declined",
    });
  });

  it("sends nothing when the status stays the same", () => {
    expect(planThemeRequestUpdate({ status: "ready", adminReply: "a" }, { status: "ready", reply: "b" })).toEqual({
      changed: true,
      statusChanged: false,
      notify: false,
      email: null,
    });
    expect(planThemeRequestUpdate({ status: "ready", adminReply: "a" }, { status: "ready", reply: "a" }).changed).toBe(false);
  });

  it("does not notify when moved back to new", () => {
    expect(planThemeRequestUpdate({ status: "in_progress", adminReply: null }, { status: "new", reply: null })).toMatchObject({
      changed: true,
      notify: false,
      email: null,
    });
  });
});

describe("themeRequestNotification", () => {
  it("builds a seller bell row keyed by request and status", () => {
    const row = themeRequestNotification({ id: REQ, sellerId: SELLER, storeId: STORE, status: "ready" });
    expect(row).toEqual({
      sellerId: SELLER,
      storeId: STORE,
      type: "theme_request_updated",
      data: { requestId: REQ, status: "ready", storeId: STORE },
      dedupeKey: `theme_request_updated:${REQ}:ready`,
    });
    expect(SELLER_NOTIFICATION_TYPES).toContain(row.type);
    const noStore = themeRequestNotification({ id: REQ, sellerId: SELLER, storeId: null, status: "declined" });
    expect(noStore.data).toEqual({ requestId: REQ, status: "declined" });
  });

  it("leads to the store's Templates page and gives the bell the status", () => {
    const row = themeRequestNotification({ id: REQ, sellerId: SELLER, storeId: STORE, status: "in_progress" });
    expect(sellerNotificationHref(row)).toBe(`/stores/${STORE}/website/templates#theme-requests`);
    expect(sellerNotificationHref({ type: row.type, data: { status: "ready" } })).toBe("/stores");
    expect(sellerNotificationValues(row.data, () => "").status).toBe("in_progress");
    expect(themeRequestsPath("../evil")).toBe("/stores");
  });

  it("the admin bell row leads to the request", () => {
    expect(ADMIN_NOTIFICATION_TYPES).toContain("theme_requested");
    expect(adminNotificationHref({ type: "theme_requested", sellerId: SELLER, storeId: null, data: { requestId: REQ } })).toBe(
      `/theme-requests/${REQ}`,
    );
    expect(adminNotificationHref({ type: "theme_requested", sellerId: SELLER, storeId: null })).toBe("/theme-requests");
  });
});

describe("themeRequestUpdateSchema", () => {
  it("accepts a known status and a capped reply", () => {
    expect(themeRequestUpdateSchema.safeParse({ requestId: REQ, status: "ready", reply: "Done" }).success).toBe(true);
    expect(themeRequestUpdateSchema.safeParse({ requestId: REQ, status: "shipped" }).success).toBe(false);
    expect(themeRequestUpdateSchema.safeParse({ requestId: REQ, status: "ready", reply: "a".repeat(2001) }).success).toBe(false);
    expect(themeRequestUpdateSchema.parse({ requestId: REQ, status: "new", reply: "  " }).reply).toBeNull();
  });
});
