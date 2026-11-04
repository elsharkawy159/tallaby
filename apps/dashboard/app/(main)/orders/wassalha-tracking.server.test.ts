import { beforeEach, describe, expect, it, vi } from "vitest";

/** The action's rules: the top-up lock (F-68) and foreign stores stop it, and the browser's rows are cleaned again. */
const state = vi.hoisted(() => ({
  error: null as { code: string } | null,
  applied: [] as { sellerId: string; storeId: string; entries: unknown[]; options: unknown }[],
}));

vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("@/lib/rate-limit.lib", () => ({ createRateLimiter: () => ({ check: () => true }) }));
vi.mock("@/lib/auth/require-seller.server", () => ({
  isAccessError: (error: unknown) => Boolean(error && typeof error === "object" && "code" in error),
  requireOrdersStore: async (storeId: string) => {
    if (state.error) throw state.error;
    return { seller: { sellerId: "seller-from-session" }, store: { id: storeId } };
  },
}));
vi.mock("@workspace/lib/shipping/wassalha-tracking/server", () => ({
  applyWassalhaTracking: async (sellerId: string, storeId: string, entries: unknown[], options: unknown) => {
    state.applied.push({ sellerId, storeId, entries, options });
    return { saved: entries.length, unchanged: 0, problems: [] };
  },
}));

describe("Wassalha tracking actions", () => {
  beforeEach(() => {
    state.error = null;
    state.applied = [];
  });

  it("stops at the top-up lock and writes nothing", async () => {
    state.error = { code: "orders_locked" };
    const { uploadWassalhaTracking, saveWassalhaTrackingNumber } = await import("./wassalha-tracking.server");
    expect(await uploadWassalhaTracking("s1", [{ row: 2, orderNumber: "ORD11111", trackingNumber: "EG12345" }])).toEqual({ success: false, error: "locked" });
    expect(await saveWassalhaTrackingNumber("s1", "ORD11111", "EG12345")).toEqual({ success: false, error: "locked" });
    expect(state.applied).toEqual([]);
  });

  it("reports another seller's store as not found", async () => {
    state.error = { code: "not_found" };
    const { uploadWassalhaTracking } = await import("./wassalha-tracking.server");
    expect(await uploadWassalhaTracking("s1", [])).toEqual({ success: false, error: "notFound" });
  });

  it("cleans the browser's rows, uses the session's seller, and never replaces from a file", async () => {
    const { uploadWassalhaTracking } = await import("./wassalha-tracking.server");
    const result = await uploadWassalhaTracking("s1", [
      { row: 2, orderNumber: "#ord11111", trackingNumber: " EG12345 " },
      { row: 3, orderNumber: "ORD22222", trackingNumber: "<script>" },
    ]);
    expect(state.applied[0]).toMatchObject({
      sellerId: "seller-from-session",
      storeId: "s1",
      entries: [{ row: 2, orderNumber: "ORD11111", trackingNumber: "EG12345" }],
      options: { replace: false },
    });
    expect(result).toMatchObject({ success: true, data: { saved: 1, problems: [{ row: 3, reason: "bad_tracking" }] } });
  });

  it("lets one typed number replace the saved one", async () => {
    const { saveWassalhaTrackingNumber } = await import("./wassalha-tracking.server");
    await saveWassalhaTrackingNumber("s1", "ORD11111", "EG12345");
    expect(state.applied[0]?.options).toEqual({ replace: true });
  });
});
