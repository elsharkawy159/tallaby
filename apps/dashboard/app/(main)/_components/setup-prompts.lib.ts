import { buildSetupTasks, type SetupFlags, type SetupKey, type SetupTask } from "./setup-checklist.lib";

/**
 * Guided setup prompts (ROADMAP.md F-44), on top of the setup checklist. Whether
 * a step is done always comes from real data; this only remembers, per seller,
 * what was already prompted, dismissed or completed
 * (sellers.seller_metrics.setupPrompts).
 */

/** How long a prompt waits before it appears. */
export const SETUP_PROMPT_DELAY_MS = 5000;

const SETUP_KEYS: readonly SetupKey[] = ["template", "brand", "product", "publish", "shipping"];

export type SetupPromptState = {
  /** The step the one-time first-visit toast pointed to; null until it has shown. */
  toastStep: SetupKey | null;
  /** Steps whose banner the seller closed. */
  dismissed: SetupKey[];
  /** Steps seen done at least once. They never come back, even if unpublished or on another store. */
  completed: SetupKey[];
  /** The home setup guide was hidden, on any device. */
  guideDismissed: boolean;
};

export type SetupPromptEvent = { type: "toast_shown" | "dismissed"; step: SetupKey };

export type SetupPrompt = { kind: "toast" | "banner"; key: SetupKey; href: string };

export type SetupPromptSync = {
  prompt: SetupPrompt | null;
  /** Nothing can ever be prompted again, so the dashboard can stop asking. */
  finished: boolean;
};

const isSetupKey = (value: unknown): value is SetupKey => SETUP_KEYS.includes(value as SetupKey);

const keysOf = (value: unknown): SetupKey[] => (Array.isArray(value) ? value.filter(isSetupKey) : []);

/** Reads the saved JSON; anything missing or unknown counts as not done yet. */
export function parseSetupPromptState(raw: unknown): SetupPromptState {
  const value = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    toastStep: isSetupKey(value.toastStep) ? value.toastStep : null,
    dismissed: keysOf(value.dismissed),
    completed: keysOf(value.completed),
    guideDismissed: value.guideDismissed === true,
  };
}

/** Validates an event sent by the browser. */
export function parseSetupPromptEvent(raw: unknown): SetupPromptEvent | null {
  const value = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  if ((value.type !== "toast_shown" && value.type !== "dismissed") || !isSetupKey(value.step)) return null;
  return { type: value.type, step: value.step };
}

export function applySetupPromptEvent(state: SetupPromptState, event: SetupPromptEvent): SetupPromptState {
  if (event.type === "toast_shown") return { ...state, toastStep: state.toastStep ?? event.step };
  if (state.dismissed.includes(event.step)) return state;
  return { ...state, dismissed: [...state.dismissed, event.step] };
}

/** Adds the steps that are done right now to the steps that never come back. */
export function recordCompletedSteps(
  state: SetupPromptState,
  flags: SetupFlags,
  storeId: string | null,
): SetupPromptState {
  const fresh = buildSetupTasks(flags, storeId)
    .filter((task) => task.done && !state.completed.includes(task.key))
    .map((task) => task.key);
  return fresh.length ? { ...state, completed: [...state.completed, ...fresh] } : state;
}

/** The first step in the checklist's order that is open and was never completed. */
export function nextPromptStep(
  flags: SetupFlags,
  storeId: string | null,
  state: SetupPromptState,
): SetupTask | null {
  return buildSetupTasks(flags, storeId).find((task) => !task.done && !state.completed.includes(task.key)) ?? null;
}

/** What to show: the toast once, then a banner for each step reached after it. */
export function decideSetupPrompt(
  flags: SetupFlags,
  storeId: string | null,
  state: SetupPromptState,
): SetupPromptSync {
  const next = nextPromptStep(flags, storeId, state);
  if (state.guideDismissed || !next) return { prompt: null, finished: true };
  if (state.dismissed.includes(next.key)) return { prompt: null, finished: false };
  if (!state.toastStep) return { prompt: { kind: "toast", key: next.key, href: next.href }, finished: false };
  if (state.toastStep === next.key) return { prompt: null, finished: false };
  return { prompt: { kind: "banner", key: next.key, href: next.href }, finished: false };
}

const BUILDER_ROUTE = /^\/stores\/[^/]+\/editor(\/|$)/;
const PRODUCT_FORM_ROUTE = /^\/products\/(add|[^/]+\/edit)(\/|$)/;

/** Prompts stay out of the builder and off the page where the seller is doing that very step. */
export function isPromptBlockedRoute(pathname: string, step: { key: SetupKey; href: string }): boolean {
  if (BUILDER_ROUTE.test(pathname)) return true;
  if (step.key === "product" && PRODUCT_FORM_ROUTE.test(pathname)) return true;
  if (pathname === step.href) return true;
  // The publish step's page is the website overview; its sub-pages are other work.
  return step.key !== "publish" && pathname.startsWith(`${step.href}/`);
}

export const SETUP_PROMPT_CHECK_EVENT = "tallaby:setup-prompt-check";

/** Asks the prompts to look again now, for a change that doesn't move to another page. */
export function requestSetupPromptCheck(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(SETUP_PROMPT_CHECK_EVENT));
}
