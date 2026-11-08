import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { recordAgentToolCall } from "@workspace/lib/agents/server";
import { newActionId, type PendingAction } from "./pending";
import { dbPendingStore } from "./pending.server";
import { createRegistry } from "./registry";
import { createAgentRuntime } from "./runtime";
import { cairoDay, DbReadCap, dbToolCallLogger, type CreditGateway } from "./services.server";
import { resetTables, tables } from "./test/fake-db";
import type { AgentContext, AnyAgentTool } from "./types";

/** The DB-backed defaults (0158) against the fake db: pending actions, read cap, tool-call log. */

const SELLER = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const STORE = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const ctx: AgentContext = { sellerId: SELLER, storeId: STORE, locale: "ar", source: "in_app" };

beforeEach(() => {
  vi.clearAllMocks();
  resetTables({
    stores: [{ id: STORE, sellerId: SELLER, status: "active", deletedAt: null, subdomain: "shop", settings: {}, contact: {}, seo: {} }],
    sellers: [{ id: SELLER, status: "approved", returnPolicy: null, subdomain: "shop" }],
    agentPendingActions: [],
  });
});

const action = (overrides: Partial<PendingAction> = {}): PendingAction => ({
  id: newActionId(),
  sellerId: SELLER,
  storeId: STORE,
  userId: SELLER,
  source: "in_app",
  tool: "save_note",
  input: { note: "x" },
  card: { title: "agent.card.note", params: {}, lines: [], risk: "low" },
  credits: 1,
  createdAt: Date.parse("2026-11-09T10:00:00Z"),
  expiresAt: Date.parse("2026-11-09T10:10:00Z"),
  status: "pending",
  ...overrides,
});

describe("dbPendingStore", () => {
  it("stores and reads back an action", async () => {
    const a = action();
    await dbPendingStore.put(a);
    expect(tables.agentPendingActions).toHaveLength(1);
    expect(await dbPendingStore.get(a.id)).toMatchObject({ id: a.id, sellerId: SELLER, storeId: STORE, tool: "save_note", status: "pending", expiresAt: a.expiresAt });
    expect(await dbPendingStore.get("act_missing")).toBeNull();
  });

  it("claims only a pending row, once", async () => {
    const a = action();
    await dbPendingStore.put(a);
    expect(await dbPendingStore.claim(a.id)).toMatchObject({ status: "running" });
    expect(await dbPendingStore.claim(a.id)).toBeNull();
    await dbPendingStore.release(a.id);
    expect((await dbPendingStore.get(a.id))?.status).toBe("pending");
  });

  it("finishes an open row once and never overwrites it", async () => {
    const a = action();
    await dbPendingStore.put(a);
    await dbPendingStore.claim(a.id);
    await dbPendingStore.finish(a.id, { status: "done", result: { ok: 1 }, creditClaimId: "ref-1" });
    await dbPendingStore.finish(a.id, { status: "failed", errorCode: "late" });
    expect(await dbPendingStore.get(a.id)).toMatchObject({ status: "done", result: { ok: 1 } });
    expect(tables.agentPendingActions![0]).toMatchObject({ creditClaimId: "ref-1", errorCode: null });
  });
});

describe("runtime on the DB store", () => {
  function harness() {
    const run = vi.fn<AnyAgentTool["run"]>(async (_c, input) => ({ data: { saved: input } }));
    const write: AnyAgentTool = {
      name: "save_note",
      skill: "settings",
      description: "Save a note.",
      input: z.object({ note: z.string().min(1).max(20) }).strict(),
      kind: "write",
      credits: 1,
      preview: async () => ({ title: "agent.card.note", params: {}, lines: [], risk: "low" }),
      run,
    };
    const credits = {
      claim: vi.fn<CreditGateway["claim"]>(async () => ({ ok: true as const, reference: "ref-1" })),
      refund: vi.fn<CreditGateway["refund"]>(async () => undefined),
    };
    let clock = Date.parse("2026-11-09T10:00:00Z");
    const runtime = createAgentRuntime({
      registry: createRegistry([{ id: "settings", pages: [], rules: "r", tools: [write] }]),
      credits,
      logger: { record: async () => undefined },
      now: () => clock,
    });
    return { runtime, run, credits, advance: (ms: number) => (clock += ms) };
  }

  it("a double confirm runs the tool once and the second replays the stored result", async () => {
    const h = harness();
    const { actionId } = await h.runtime.proposeAction(ctx, "save_note", { note: "hi" });
    expect(tables.agentPendingActions![0]).toMatchObject({ id: actionId, userId: SELLER, source: "in_app", status: "pending" });
    const first = await h.runtime.confirmAction(ctx, actionId);
    const again = await h.runtime.confirmAction(ctx, actionId);
    expect(first).toMatchObject({ replayed: false, creditsCharged: 1 });
    expect(again).toMatchObject({ replayed: true, creditsCharged: 0, result: { saved: { note: "hi" } } });
    expect(h.run).toHaveBeenCalledTimes(1);
    expect(h.credits.claim).toHaveBeenCalledTimes(1);
    expect(tables.agentPendingActions![0]).toMatchObject({ status: "done", creditClaimId: "ref-1" });
  });

  it("cancel and expiry are stored, and neither runs", async () => {
    const h = harness();
    const a = await h.runtime.proposeAction(ctx, "save_note", { note: "a" });
    await h.runtime.cancelAction(ctx, a.actionId);
    await expect(h.runtime.confirmAction(ctx, a.actionId)).rejects.toMatchObject({ code: "tool_failed", details: { reason: "cancelled" } });
    const b = await h.runtime.proposeAction(ctx, "save_note", { note: "b" });
    h.advance(11 * 60_000);
    await expect(h.runtime.confirmAction(ctx, b.actionId)).rejects.toMatchObject({ code: "expired" });
    expect(tables.agentPendingActions!.map((row) => row.status)).toEqual(["cancelled", "expired"]);
    expect(h.run).not.toHaveBeenCalled();
  });
});

describe("DbReadCap", () => {
  it("counts per seller per Cairo day and stops over the limit", async () => {
    const counts = new Map<string, number>();
    const increment = vi.fn(async (sellerId: string, day: string) => {
      const next = (counts.get(`${sellerId}:${day}`) ?? 0) + 1;
      counts.set(`${sellerId}:${day}`, next);
      return next;
    });
    const cap = new DbReadCap(increment);
    const now = new Date("2026-11-09T21:30:00Z"); // 23:30 in Cairo
    expect(await cap.hit(SELLER, 2, now)).toBe(true);
    expect(await cap.hit(SELLER, 2, now)).toBe(true);
    expect(await cap.hit(SELLER, 2, now)).toBe(false);
    // Just after Cairo midnight: a new day.
    expect(await cap.hit(SELLER, 2, new Date("2026-11-09T22:30:00Z"))).toBe(true);
    expect(increment.mock.calls.map(([, day]) => day)).toEqual(["2026-11-09", "2026-11-09", "2026-11-09", "2026-11-10"]);
  });

  it("cairoDay follows Cairo, not UTC", () => {
    expect(cairoDay(new Date("2026-07-10T21:30:00Z"))).toBe("2026-07-11");
    expect(cairoDay(new Date("2026-12-10T21:30:00Z"))).toBe("2026-12-10");
  });
});

describe("dbToolCallLogger", () => {
  it("writes in-app runs with their source and no grant", async () => {
    await dbToolCallLogger.record({ ...ctx, refId: "build-1" }, { tool: "save_note", skill: "settings", kind: "write", status: "ok", credits: 1, durationMs: 5 });
    expect(recordAgentToolCall).toHaveBeenCalledWith(
      expect.objectContaining({
        grantId: null,
        source: "in_app",
        sellerId: SELLER,
        storeId: STORE,
        tool: "save_note",
        status: "ok",
        resultRef: expect.objectContaining({ skill: "settings", credits: 1, refId: "build-1" }),
      }),
    );
  });

  it("keeps the grant for MCP runs", async () => {
    const grantId = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
    await dbToolCallLogger.record({ ...ctx, source: "mcp", grantId }, { tool: "get_note", skill: "settings", kind: "read", status: "ok" });
    expect(recordAgentToolCall).toHaveBeenCalledWith(expect.objectContaining({ grantId, source: "mcp" }));
  });
});
