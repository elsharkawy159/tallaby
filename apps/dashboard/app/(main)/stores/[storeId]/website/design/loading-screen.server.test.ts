import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * F-96 save action: the store comes from requireStore (stubbed; the guard has
 * its own tests), the input from the shared schema, the image's real size and
 * type from storage.objects. The database is a fake that records calls.
 */

const SELLER_ID = "11111111-1111-4111-8111-111111111111";
const STORE = "22222222-2222-4222-8222-222222222222";
const OTHER = "33333333-3333-4333-8333-333333333333";
const OBJECT = "44444444-4444-4444-8444-444444444444";
const GIF = `${SELLER_ID}/${STORE}/${OBJECT}.gif`;

const mocks = vi.hoisted(() => {
  class AccessError extends Error {
    constructor(public code: string) {
      super(code);
    }
  }
  return {
    AccessError,
    requireStore: vi.fn(),
    execute: vi.fn(),
    update: vi.fn(),
    where: vi.fn(),
    invalidate: vi.fn(async () => undefined),
  };
});

vi.mock("@/lib/auth/require-seller.server", () => ({
  requireStore: mocks.requireStore,
  isAccessError: (error: unknown) => error instanceof mocks.AccessError,
}));
vi.mock("@/lib/rate-limit.lib", () => ({ createRateLimiter: () => ({ check: () => true }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@workspace/cache", () => ({
  applyInvalidation: mocks.invalidate,
  invalidateStorefront: (subdomains: string[]) => ({ tags: subdomains, paths: [] }),
}));
vi.mock("@workspace/db", async () => {
  const drizzle = await import("drizzle-orm");
  const schema = await import("@workspace/db/schema");
  return {
    ...drizzle,
    stores: schema.stores,
    db: {
      execute: mocks.execute,
      update: (...args: unknown[]) => {
        mocks.update(...args);
        return { set: () => ({ where: (w: unknown) => (mocks.where(w), Promise.resolve([])) }) };
      },
    },
  };
});

const { saveLoadingScreen } = await import("./loading-screen.server");

const input = (patch: Record<string, unknown> = {}) => ({
  enabled: true,
  mediaPath: GIF,
  size: { mode: "px", px: 160 },
  background: { color: "#ffffff", opacity: 90, blur: 4 },
  ...patch,
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireStore.mockResolvedValue({ seller: { sellerId: SELLER_ID, userId: "u1" }, store: { id: STORE, subdomain: "shop" } });
  mocks.execute.mockResolvedValue([{ size: "1000", mimetype: "image/gif" }]);
});

describe("saveLoadingScreen", () => {
  it("refuses a store the session doesn't own, without touching the database", async () => {
    mocks.requireStore.mockRejectedValue(new mocks.AccessError("not_found"));
    expect(await saveLoadingScreen(OTHER, input())).toEqual({ success: false, error: "notFound" });
    mocks.requireStore.mockRejectedValue(new mocks.AccessError("store_read_only"));
    expect(await saveLoadingScreen(STORE, input())).toEqual({ success: false, error: "readOnly" });
    expect(mocks.execute).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.requireStore).toHaveBeenCalledWith(STORE, { forWrite: true });
  });

  it("saves a valid screen and invalidates the storefront", async () => {
    const result = await saveLoadingScreen(STORE, input());
    expect(result.success).toBe(true);
    expect(mocks.update).toHaveBeenCalledTimes(1);
    expect(mocks.invalidate).toHaveBeenCalledWith({ tags: ["shop"], paths: [] }, { from: "dashboard", mode: "action" });
  });

  it("refuses media in another seller's or another store's folder", async () => {
    expect(await saveLoadingScreen(STORE, input({ mediaPath: `${OTHER}/${STORE}/${OBJECT}.gif` }))).toEqual({ success: false, error: "invalidMedia" });
    expect(await saveLoadingScreen(STORE, input({ mediaPath: `${SELLER_ID}/${OTHER}/${OBJECT}.gif` }))).toEqual({ success: false, error: "invalidMedia" });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("checks the stored object's real size and type", async () => {
    mocks.execute.mockResolvedValueOnce([]);
    expect(await saveLoadingScreen(STORE, input())).toEqual({ success: false, error: "invalidMedia" });
    mocks.execute.mockResolvedValueOnce([{ size: String(2 * 1024 * 1024 + 1), mimetype: "image/gif" }]);
    expect(await saveLoadingScreen(STORE, input())).toEqual({ success: false, error: "tooLarge" });
    mocks.execute.mockResolvedValueOnce([{ size: "1000", mimetype: "image/png" }]);
    expect(await saveLoadingScreen(STORE, input())).toEqual({ success: false, error: "invalidType" });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("refuses an empty screen and bad input", async () => {
    expect(await saveLoadingScreen(STORE, input({ mediaPath: null, background: { color: "#fff", opacity: 0, blur: 0 } }))).toEqual({ success: false, error: "empty" });
    expect(await saveLoadingScreen(STORE, input({ size: { mode: "px", px: 1000 } }))).toEqual({ success: false, error: "invalidInput" });
    expect(await saveLoadingScreen(STORE, "x")).toEqual({ success: false, error: "invalidInput" });
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
