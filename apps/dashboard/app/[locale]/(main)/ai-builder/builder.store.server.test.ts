import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseBuilderState } from "./builder.dto";

const mocks = vi.hoisted(() => ({
  /** One value per sum query, in order: the build's spend, then the platform's. */
  sums: [] as (number | Error)[],
  sqlValues: [] as unknown[],
  logAiUsage: vi.fn(async () => {}),
  checkDailyCap: vi.fn(),
  getBillingState: vi.fn(),
  claimAiCredit: vi.fn(),
}));

vi.mock("@workspace/ai", () => ({ checkDailyCap: mocks.checkDailyCap, logAiUsage: mocks.logAiUsage, modelIdForTier: () => "fast-model" }));
vi.mock("@workspace/lib/billing/credits", () => ({ claimAiCredit: mocks.claimAiCredit, refundAiCredit: vi.fn() }));
vi.mock("@workspace/lib/billing/server", () => ({ getBillingState: mocks.getBillingState }));
vi.mock("@workspace/db", () => {
  const sql = (strings: TemplateStringsArray, ...values: unknown[]) => {
    mocks.sqlValues.push(...values);
    return { strings, values };
  };
  const where = async () => {
    const next = mocks.sums.shift() ?? 0;
    if (next instanceof Error) throw next;
    return [{ value: String(next) }];
  };
  return {
    sql,
    and: () => null,
    count: () => null,
    desc: () => null,
    eq: () => null,
    gte: () => null,
    inArray: () => null,
    ne: () => null,
    aiUsageLogs: { costMicroUsd: "cost", refId: "ref_id", feature: "feature", sellerId: "seller_id", createdAt: "created_at" },
    storeBuildClaims: {},
    storeBuildItems: {},
    storeBuilds: {},
    db: { select: () => ({ from: () => ({ where }) }) },
  };
});

const { buildSpendMicroUsd, checkModelCall } = await import("./builder.store.server");

const build = (paid = false) => ({
  id: "11111111-1111-4111-8111-111111111111",
  sellerId: "seller-1",
  createdAt: "2026-11-08T00:00:00.000Z",
  state: { ...parseBuilderState({}), paid },
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.sums = [];
  mocks.sqlValues = [];
  mocks.checkDailyCap.mockResolvedValue({ allowed: true });
  mocks.getBillingState.mockResolvedValue({ usdLive: true });
  mocks.claimAiCredit.mockResolvedValue({ ok: true, reference: "ref-1" });
  delete process.env.AI_STORE_BUILDER_DAILY_BUDGET_USD;
});

describe("a build's spend", () => {
  it("is summed by the build's own id", async () => {
    mocks.sums = [4321];
    await expect(buildSpendMicroUsd("seller-1", build())).resolves.toBe(4321);
    expect(mocks.sqlValues).toContain(build().id);
  });
});

describe("the gate before each model call", () => {
  it("checks the platform's daily budget on every call of a build not paid by credits", async () => {
    process.env.AI_STORE_BUILDER_DAILY_BUDGET_USD = "25";
    mocks.sums = [0, 25_000_000];
    await expect(checkModelCall(build(), "store_builder_site_copy")).resolves.toEqual({ ok: false, reason: "budget" });
    expect(mocks.logAiUsage).toHaveBeenCalledWith(expect.objectContaining({ status: "blocked", errorCode: "budget", refId: build().id }));

    mocks.sums = [0, 1_000];
    await expect(checkModelCall(build(), "store_builder_site_copy")).resolves.toEqual({ ok: true, creditReference: null });
  });

  it("fails closed when the platform budget can't be read", async () => {
    mocks.sums = [0, new Error("db down")];
    await expect(checkModelCall(build(), "store_builder_product")).resolves.toEqual({ ok: false, reason: "budget" });
  });

  it("doesn't hold a paid build to the platform's free budget", async () => {
    mocks.sums = [0];
    await expect(checkModelCall(build(true), "store_builder_product")).resolves.toEqual({ ok: true, creditReference: "ref-1" });
  });
});
