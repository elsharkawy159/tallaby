import { agentPendingActions, and, db, eq, inArray, sql } from "@workspace/db";
import type { PendingAction, PendingOutcome, PendingStatus, PendingStore } from "./pending";
import type { AgentSource, ConfirmCard } from "./types";

/**
 * The DB-backed pending store (agent_pending_actions, 0158), shared by every
 * serverless instance. `claim` is one `UPDATE … WHERE status = 'pending'
 * RETURNING`, so of two confirms at once exactly one gets the row and runs
 * the tool; the other sees `running` or the stored result. A finished row is
 * never overwritten. Server-only; never cached (CLAUDE.md rule 8).
 */

type Row = typeof agentPendingActions.$inferSelect;

const toMs = (value: string) => new Date(value).getTime();

function fromRow(row: Row): PendingAction {
  return {
    id: row.id,
    sellerId: row.sellerId,
    storeId: row.storeId,
    userId: row.userId ?? undefined,
    source: row.source as AgentSource,
    tool: row.tool,
    input: row.input,
    card: row.card as ConfirmCard,
    credits: row.credits,
    createdAt: toMs(row.createdAt),
    expiresAt: toMs(row.expiresAt),
    status: row.status as PendingStatus,
    ...(row.result != null ? { result: row.result } : {}),
    ...(row.errorCode ? { errorCode: row.errorCode } : {}),
  };
}

const OPEN: PendingStatus[] = ["pending", "running"];

export const dbPendingStore: PendingStore = {
  async put(action) {
    await db.insert(agentPendingActions).values({
      id: action.id,
      sellerId: action.sellerId,
      storeId: action.storeId,
      userId: action.userId ?? null,
      source: action.source,
      tool: action.tool,
      input: (action.input ?? {}) as Record<string, unknown>,
      card: action.card,
      credits: action.credits,
      status: action.status,
      expiresAt: new Date(action.expiresAt).toISOString(),
      createdAt: new Date(action.createdAt).toISOString(),
    });
  },

  async get(id) {
    const [row] = await db.select().from(agentPendingActions).where(eq(agentPendingActions.id, id)).limit(1);
    return row ? fromRow(row) : null;
  },

  async claim(id) {
    const [row] = await db
      .update(agentPendingActions)
      .set({ status: "running", updatedAt: sql`now()` })
      .where(and(eq(agentPendingActions.id, id), eq(agentPendingActions.status, "pending")))
      .returning();
    return row ? fromRow(row) : null;
  },

  async release(id) {
    await db
      .update(agentPendingActions)
      .set({ status: "pending", updatedAt: sql`now()` })
      .where(and(eq(agentPendingActions.id, id), eq(agentPendingActions.status, "running")))
      .returning({ id: agentPendingActions.id });
  },

  async finish(id, outcome: PendingOutcome) {
    await db
      .update(agentPendingActions)
      .set({
        status: outcome.status,
        result: outcome.status === "done" ? ((outcome.result ?? null) as Record<string, unknown> | null) : null,
        errorCode: outcome.status === "failed" ? outcome.errorCode.slice(0, 100) : null,
        ...(outcome.creditClaimId ? { creditClaimId: outcome.creditClaimId.slice(0, 2000) } : {}),
        updatedAt: sql`now()`,
      })
      .where(and(eq(agentPendingActions.id, id), inArray(agentPendingActions.status, OPEN)))
      .returning({ id: agentPendingActions.id });
  },
};
