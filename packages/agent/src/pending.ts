import { randomBytes } from "node:crypto";
import type { AgentSource, ConfirmCard } from "./types";

/**
 * Pending actions: a proposed write waiting for the seller's Confirm. The id
 * is opaque (random, unguessable) and only valid for the seller and store it
 * was made for, for a short time. `claim` moves pending → running once, so a
 * double click runs the tool once.
 *
 * The in-memory store is for tests and a single process. Serverless needs the
 * DB-backed store (a server-only `agent_pending_actions` table: id, seller_id,
 * store_id, tool, input jsonb, card jsonb, status, result jsonb, expires_at),
 * planned with the agent log migration (a follow-up to
 * F-83a; no table exists yet).
 */

export type PendingStatus = "pending" | "running" | "done" | "failed";

export type PendingAction = {
  id: string;
  sellerId: string;
  storeId: string;
  source: AgentSource;
  tool: string;
  /** Already validated by the tool's schema. */
  input: unknown;
  card: ConfirmCard;
  credits: number;
  createdAt: number;
  expiresAt: number;
  status: PendingStatus;
  result?: unknown;
  errorCode?: string;
};

export interface PendingStore {
  put(action: PendingAction): Promise<void>;
  get(id: string): Promise<PendingAction | null>;
  /** pending → running, atomically. Null when it was not pending. */
  claim(id: string): Promise<PendingAction | null>;
  /** running → pending (e.g. no credits), so the seller can confirm again. */
  release(id: string): Promise<void>;
  finish(id: string, outcome: { status: "done"; result: unknown } | { status: "failed"; errorCode: string }): Promise<void>;
}

export const PENDING_TTL_MS = 10 * 60_000;

export function newActionId(): string {
  return `act_${randomBytes(18).toString("base64url")}`;
}

export const ACTION_ID_RE = /^act_[A-Za-z0-9_-]{24}$/;

export class InMemoryPendingStore implements PendingStore {
  private readonly rows = new Map<string, PendingAction>();

  async put(action: PendingAction) {
    this.rows.set(action.id, { ...action });
  }

  async get(id: string) {
    const row = this.rows.get(id);
    return row ? { ...row } : null;
  }

  async claim(id: string) {
    const row = this.rows.get(id);
    if (!row || row.status !== "pending") return null;
    row.status = "running";
    return { ...row };
  }

  async release(id: string) {
    const row = this.rows.get(id);
    if (row?.status === "running") row.status = "pending";
  }

  async finish(id: string, outcome: { status: "done"; result: unknown } | { status: "failed"; errorCode: string }) {
    const row = this.rows.get(id);
    if (!row) return;
    row.status = outcome.status;
    if (outcome.status === "done") row.result = outcome.result;
    else row.errorCode = outcome.errorCode;
  }

  /** Test helper. */
  size() {
    return this.rows.size;
  }
}
