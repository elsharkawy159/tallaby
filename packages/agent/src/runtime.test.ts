import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { saveStoreShippingZone } from "@workspace/lib/stores/server";
import { createAgentRegistry, createRegistry } from "./registry";
import { InMemoryPendingStore } from "./pending";
import { createAgentRuntime } from "./runtime";
import { InMemoryReadCap, type CreditGateway, type ToolCallLogger } from "./services.server";
import { resetTables, tables } from "./test/fake-db";
import type { AgentContext, AnyAgentTool } from "./types";

const SELLER = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const OTHER = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const STORE = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const OTHER_STORE = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

const ctx: AgentContext = { sellerId: SELLER, storeId: STORE, locale: "ar", source: "in_app" };

function seed() {
  resetTables({
    stores: [
      { id: STORE, sellerId: SELLER, status: "active", deletedAt: null, subdomain: "shop", settings: {}, contact: {}, seo: {} },
      { id: OTHER_STORE, sellerId: OTHER, status: "active", deletedAt: null, subdomain: "other", settings: {}, contact: {}, seo: {} },
    ],
    sellers: [
      { id: SELLER, status: "approved", returnPolicy: null, subdomain: "shop" },
      { id: OTHER, status: "approved", returnPolicy: null, subdomain: "other" },
    ],
  });
}

function harness(run: AnyAgentTool["run"] = async (_ctx, input) => ({ data: { saved: input } })) {
  const runSpy = vi.fn(run);
  const write: AnyAgentTool = {
    name: "save_note",
    skill: "settings",
    description: "Save a note.",
    input: z.object({ note: z.string().min(1).max(20) }).strict(),
    kind: "write",
    credits: 1,
    preview: async (_c, input) => ({ title: "agent.card.note", params: { note: input.note }, lines: [], risk: "low" }),
    run: runSpy,
  };
  const read: AnyAgentTool = {
    name: "get_note",
    skill: "settings",
    description: "Read the note.",
    input: z.object({}).strict(),
    kind: "read",
    credits: 0,
    run: async () => ({ data: { note: "hi" } }),
  };
  let n = 0;
  const credits = {
    claim: vi.fn<CreditGateway["claim"]>(async () => ({ ok: true as const, reference: `ref-${++n}` })),
    refund: vi.fn<CreditGateway["refund"]>(async () => undefined),
  };
  const logs: Array<Parameters<ToolCallLogger["record"]>[1]> = [];
  const logger: ToolCallLogger = { record: async (_c, entry) => void logs.push(entry) };
  let clock = 1_000_000;
  const runtime = createAgentRuntime({
    registry: createRegistry([{ id: "settings", pages: [], rules: "r", tools: [write, read] }]),
    credits,
    logger,
    pending: new InMemoryPendingStore(),
    readCap: new InMemoryReadCap(),
    readsPerDay: 2,
    now: () => clock,
  });
  return { runtime, runSpy, credits, logs, advance: (ms: number) => (clock += ms) };
}

beforeEach(() => {
  seed();
  vi.clearAllMocks();
});

describe("plan, then confirm", () => {
  it("proposing builds a card and runs nothing", async () => {
    const h = harness();
    const proposal = await h.runtime.proposeAction(ctx, "save_note", { note: "hello" });
    expect(proposal.card).toMatchObject({ title: "agent.card.note", params: { note: "hello" } });
    expect(proposal.actionId).toMatch(/^act_/);
    expect(proposal.credits).toBe(1);
    expect(h.runSpy).not.toHaveBeenCalled();
    expect(h.credits.claim).not.toHaveBeenCalled();
  });

  it("confirm claims the credit once, runs once, and a second confirm replays", async () => {
    const h = harness();
    const { actionId } = await h.runtime.proposeAction(ctx, "save_note", { note: "hello" });
    const first = await h.runtime.confirmAction(ctx, actionId);
    expect(first).toMatchObject({ creditsCharged: 1, replayed: false, result: { saved: { note: "hello" } } });
    const again = await h.runtime.confirmAction(ctx, actionId);
    expect(again).toMatchObject({ replayed: true, creditsCharged: 0, result: { saved: { note: "hello" } } });
    expect(h.runSpy).toHaveBeenCalledTimes(1);
    expect(h.credits.claim).toHaveBeenCalledTimes(1);
    expect(h.credits.claim).toHaveBeenCalledWith(SELLER, "agent_save_note");
    expect(h.logs.filter((l) => l.status === "ok")).toHaveLength(1);
  });

  it("two confirms at once run the tool once", async () => {
    const h = harness();
    const { actionId } = await h.runtime.proposeAction(ctx, "save_note", { note: "x" });
    const results = await Promise.allSettled([h.runtime.confirmAction(ctx, actionId), h.runtime.confirmAction(ctx, actionId)]);
    expect(h.runSpy).toHaveBeenCalledTimes(1);
    expect(h.credits.claim).toHaveBeenCalledTimes(1);
    expect(results.filter((r) => r.status === "fulfilled").length).toBeGreaterThanOrEqual(1);
  });

  it("refunds the credit when the tool fails, and the action can't be re-run", async () => {
    const h = harness(async () => {
      throw new Error("db down");
    });
    const { actionId } = await h.runtime.proposeAction(ctx, "save_note", { note: "x" });
    await expect(h.runtime.confirmAction(ctx, actionId)).rejects.toMatchObject({ code: "tool_failed" });
    expect(h.credits.refund).toHaveBeenCalledWith(SELLER, "ref-1");
    await expect(h.runtime.confirmAction(ctx, actionId)).rejects.toMatchObject({ code: "tool_failed" });
    expect(h.runSpy).toHaveBeenCalledTimes(1);
    expect(h.logs.at(-1)).toMatchObject({ status: "error" });
  });

  it("with no credits nothing runs, and the action stays confirmable", async () => {
    const h = harness();
    h.credits.claim.mockResolvedValueOnce({ ok: false, error: "no_credits" });
    const { actionId } = await h.runtime.proposeAction(ctx, "save_note", { note: "x" });
    await expect(h.runtime.confirmAction(ctx, actionId)).rejects.toMatchObject({ code: "no_credits" });
    expect(h.runSpy).not.toHaveBeenCalled();
    const later = await h.runtime.confirmAction(ctx, actionId);
    expect(later.replayed).toBe(false);
    expect(h.runSpy).toHaveBeenCalledTimes(1);
  });

  it("the free build skips credits only for the builder", async () => {
    const h = harness();
    const builder: AgentContext = { ...ctx, source: "builder" };
    const a = await h.runtime.proposeAction(builder, "save_note", { note: "x" });
    expect((await h.runtime.confirmAction(builder, a.actionId, { creditPolicy: "free" })).creditsCharged).toBe(0);
    const b = await h.runtime.proposeAction(ctx, "save_note", { note: "y" });
    expect((await h.runtime.confirmAction(ctx, b.actionId, { creditPolicy: "free" })).creditsCharged).toBe(1);
    expect(h.credits.claim).toHaveBeenCalledTimes(1);
  });

  it("expires after the TTL", async () => {
    const h = harness();
    const { actionId } = await h.runtime.proposeAction(ctx, "save_note", { note: "x" });
    h.advance(11 * 60_000);
    await expect(h.runtime.confirmAction(ctx, actionId)).rejects.toMatchObject({ code: "expired" });
    expect(h.runSpy).not.toHaveBeenCalled();
  });

  it("rejects bad input and read tools at propose time", async () => {
    const h = harness();
    await expect(h.runtime.proposeAction(ctx, "save_note", { note: "" })).rejects.toMatchObject({ code: "invalid_input" });
    await expect(h.runtime.proposeAction(ctx, "save_note", { note: "x", storeId: OTHER_STORE })).rejects.toMatchObject({ code: "invalid_input" });
    await expect(h.runtime.proposeAction(ctx, "get_note", {})).rejects.toMatchObject({ code: "invalid_input" });
    await expect(h.runtime.proposeAction(ctx, "delete_store", {})).rejects.toMatchObject({ code: "unknown_tool" });
  });
});

describe("ownership", () => {
  it("can't propose for a store of another seller", async () => {
    const h = harness();
    await expect(h.runtime.proposeAction({ ...ctx, storeId: OTHER_STORE }, "save_note", { note: "x" })).rejects.toMatchObject({ code: "not_found" });
  });

  it("another seller or another store can't confirm the action", async () => {
    const h = harness();
    const { actionId } = await h.runtime.proposeAction(ctx, "save_note", { note: "x" });
    await expect(h.runtime.confirmAction({ ...ctx, sellerId: OTHER, storeId: OTHER_STORE }, actionId)).rejects.toMatchObject({ code: "not_found" });
    await expect(h.runtime.confirmAction({ ...ctx, storeId: OTHER_STORE }, actionId)).rejects.toMatchObject({ code: "not_found" });
    await expect(h.runtime.confirmAction(ctx, "act_forged")).rejects.toMatchObject({ code: "not_found" });
    expect(h.runSpy).not.toHaveBeenCalled();
  });

  it("re-checks the store at confirm: an archived store runs nothing and pays nothing", async () => {
    const h = harness();
    const { actionId } = await h.runtime.proposeAction(ctx, "save_note", { note: "x" });
    tables.stores![0]!.status = "archived";
    await expect(h.runtime.confirmAction(ctx, actionId)).rejects.toMatchObject({ code: "store_read_only" });
    expect(h.runSpy).not.toHaveBeenCalled();
    expect(h.credits.claim).not.toHaveBeenCalled();
  });

  it("a deleted store is not found", async () => {
    const h = harness();
    tables.stores![0]!.deletedAt = "2026-11-01";
    await expect(h.runtime.proposeAction(ctx, "save_note", { note: "x" })).rejects.toMatchObject({ code: "not_found" });
  });

  it("real tools write with the context's seller and store", async () => {
    const runtime = createAgentRuntime({
      registry: createAgentRegistry(),
      credits: { claim: async () => ({ ok: true, reference: "r" }), refund: async () => undefined },
      logger: { record: async () => undefined },
    pending: new InMemoryPendingStore(),
    readCap: new InMemoryReadCap(),
    });
    const { actionId, card } = await runtime.proposeAction(ctx, "save_shipping_zone", {
      nameAr: "القاهرة والجيزة",
      placeNames: ["القاهرة", "Giza", "Atlantis"],
      price: 50,
    });
    expect(card.lines.map((l) => l.key)).toContain("agent.card.shipping.unmatched");
    await runtime.confirmAction(ctx, actionId);
    expect(saveStoreShippingZone).toHaveBeenCalledWith(
      SELLER,
      SELLER,
      STORE,
      null,
      expect.objectContaining({ places: ["EG/CAIRO", "EG/GIZA"], price: 50 }),
    );
  });
});

describe("reads", () => {
  it("run directly, cost nothing and are capped per day", async () => {
    const h = harness();
    expect(await h.runtime.runRead(ctx, "get_note", {})).toEqual({ note: "hi" });
    await h.runtime.runRead(ctx, "get_note", {});
    await expect(h.runtime.runRead(ctx, "get_note", {})).rejects.toMatchObject({ code: "read_cap" });
    expect(h.credits.claim).not.toHaveBeenCalled();
    await expect(h.runtime.runRead(ctx, "save_note", { note: "x" })).rejects.toMatchObject({ code: "invalid_input" });
  });
});
