/**
 * The header's "Next step" button (owner, 2026-11-18). It replaced the guided
 * setup prompts (setup-prompts.*) in the layout: while the home setup isn't
 * finished it links to the next open home step (setup-checklist.lib.ts, same
 * order: product, design, shipping, payments); once it is, the same slot opens
 * the store in a new tab.
 */

import { buildHomeSteps, type HomeStepKey, type SetupFlags } from "./setup-checklist.lib";

/** What the server says about the selected store's setup. */
export type SetupNextStep = { done: false; key: HomeStepKey; href: string } | { done: true };

/** What the header shows in the slot. */
export type HeaderSetupAction =
  | { kind: "step"; key: HomeStepKey; href: string }
  | { kind: "visit"; href: string }
  | null;

const HOME_STEP_KEYS: readonly HomeStepKey[] = ["product", "design", "shipping", "payments"];

/** The first open home step, in the home checklist's order, or done. */
export function pickSetupNextStep(flags: SetupFlags, storeId: string | null): SetupNextStep {
  const next = buildHomeSteps(flags, storeId).find((step) => !step.done);
  return next ? { done: false, key: next.key, href: next.href } : { done: true };
}

/** Next step while setup is open; "Visit store" once it is done and the store has a link; else nothing. */
export function headerSetupAction(next: SetupNextStep | null, storeHref: string | null): HeaderSetupAction {
  if (!next) return null;
  if (!next.done) return { kind: "step", key: next.key, href: next.href };
  return storeHref ? { kind: "visit", href: storeHref } : null;
}

/**
 * The /api/setup-next-step body, checked before use: a known step key and a
 * dashboard path (one leading slash, never `//host`), else null.
 */
export function parseSetupNextStep(value: unknown): SetupNextStep | null {
  if (!value || typeof value !== "object") return null;
  const body = value as { done?: unknown; key?: unknown; href?: unknown };
  if (body.done === true) return { done: true };
  if (body.done !== false) return null;
  if (typeof body.key !== "string" || !(HOME_STEP_KEYS as readonly string[]).includes(body.key)) return null;
  if (typeof body.href !== "string" || !/^\/(?![/\\])/.test(body.href)) return null;
  return { done: false, key: body.key as HomeStepKey, href: body.href };
}
