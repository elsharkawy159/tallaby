import {
  campaignSendError,
  parseCampaignInput,
  parseScheduledAt,
  type CampaignSendError,
} from "@workspace/lib/email-campaigns";

/**
 * Pure rules of the campaign composer (ROADMAP.md F-66). They only decide what
 * the page shows and when it calls the server: every check here is made again
 * on the server, which stays the authority.
 */

/** Wait this long after the last change before rendering the preview. */
export const PREVIEW_DEBOUNCE_MS = 800;

export type PreviewRequest = { kind: "ready"; key: string } | { kind: "blocked"; problem: CampaignSendError };

/**
 * What the preview should do for this content. The key holds only what changes
 * the email, cleaned the way the server cleans it, so a trailing space or a new
 * audience makes no server call. Empty text or a link is known here without one.
 */
export function previewRequest(content: unknown): PreviewRequest {
  const parsed = parseCampaignInput(content);
  if (!parsed.ok) return { kind: "blocked", problem: parsed.error };
  const problem = campaignSendError(parsed.value);
  if (problem) return { kind: "blocked", problem };
  const { subject, body, ctaLabel, productIds } = parsed.value;
  return { kind: "ready", key: JSON.stringify({ subject, body, ctaLabel, productIds }) };
}

/**
 * Debounced, one call at a time, latest wins. Next.js runs a client's Server
 * Actions one after another, so previews must not pile up in front of Save or
 * Send: while one runs, only the newest waiting request is kept. A result that
 * is no longer the newest is dropped. The last success is reused if the content
 * comes back to it; a failure is not, so the same content can be tried again.
 */
export function createPreviewRunner<R>(options: {
  delayMs: number;
  run: (key: string) => Promise<R>;
  isSuccess: (result: R) => boolean;
  onResult: (result: R) => void;
  onBusy: (busy: boolean) => void;
}) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let latest: { key: string; id: number } | null = null;
  let lastId = 0;
  let inFlight = false;
  let disposed = false;
  let lastSuccess: { key: string; result: R } | null = null;

  const clearTimer = () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  };

  const start = async () => {
    timer = null;
    const job = latest;
    if (!job || inFlight || disposed) return;
    if (lastSuccess?.key === job.key) {
      latest = null;
      options.onResult(lastSuccess.result);
      return;
    }
    inFlight = true;
    options.onBusy(true);
    let result: R | undefined;
    let threw = false;
    try {
      result = await options.run(job.key);
    } catch {
      threw = true;
    }
    inFlight = false;
    if (disposed) return;
    if (latest?.id === job.id) {
      latest = null;
      options.onBusy(false);
      if (threw) return;
      if (options.isSuccess(result as R)) lastSuccess = { key: job.key, result: result as R };
      options.onResult(result as R);
      return;
    }
    // Newer content arrived while this ran. Its timer starts it, or it was waiting for this call to end.
    if (latest && timer === null) void start();
    else options.onBusy(false);
  };

  return {
    request(key: string, requestOptions?: { immediate?: boolean }) {
      latest = { key, id: ++lastId };
      clearTimer();
      timer = setTimeout(() => void start(), requestOptions?.immediate ? 0 : options.delayMs);
    },
    /** Drops what is waiting; a call already running ends without being shown. */
    cancel() {
      latest = null;
      clearTimer();
    },
    dispose() {
      disposed = true;
      latest = null;
      clearTimer();
    },
  };
}

/**
 * Links in a preview must not open anything: this makes them target a new tab,
 * which the frame's empty sandbox refuses. Without it a click would load the
 * store inside the preview. Only for display; the sent email is not touched.
 */
export function withInertLinks(html: string): string {
  const base = '<base target="_blank">';
  return /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (head) => `${head}${base}`) : `${base}${html}`;
}

export type QueueBlocker = "storeOffline" | "activationRequired" | "pendingReview" | "monthlyLimit" | "dailyLimit";

/** Why this store can't queue a campaign now; null means it can (`canQueue`). */
export function queueBlocker(input: {
  storeLive: boolean;
  queuedToday: number;
  campaignsPerDay: number;
  allowance: { live: boolean; locked: boolean; pendingReview: boolean; remaining: number };
}): QueueBlocker | null {
  const { allowance } = input;
  if (!input.storeLive) return "storeOffline";
  if (allowance.locked) return allowance.pendingReview ? "pendingReview" : "activationRequired";
  if (allowance.live && allowance.remaining <= 0) return "monthlyLimit";
  if (input.queuedToday >= input.campaignsPerDay) return "dailyLimit";
  return null;
}

export type ScheduleState = "missing" | "invalid" | { iso: string };

/** The date picker's local value as the ISO time the server checks again. */
export function readSchedule(local: string, now: Date): ScheduleState {
  if (!local) return "missing";
  const at = new Date(local);
  if (Number.isNaN(at.getTime())) return "invalid";
  const iso = at.toISOString();
  return parseScheduledAt(iso, now) === "invalid" ? "invalid" : { iso };
}

/** A Date as a `datetime-local` value in the browser's time zone. */
export function toLocalInputValue(date: Date): string {
  const two = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())}T${two(date.getHours())}:${two(date.getMinutes())}`;
}

export type SendBlocker = QueueBlocker | CampaignSendError | "scheduleMissing" | "scheduleInvalid" | "noRecipients" | "recipientsUnknown";

/** The first thing to fix before the send button works; null means ready. */
export function sendBlocker(input: {
  queue: QueueBlocker | null;
  content: unknown;
  schedule: ScheduleState | null;
  recipients: number | null;
}): SendBlocker | null {
  if (input.queue) return input.queue;
  const request = previewRequest(input.content);
  if (request.kind === "blocked") return request.problem;
  if (input.schedule === "missing") return "scheduleMissing";
  if (input.schedule === "invalid") return "scheduleInvalid";
  if (input.recipients === null) return "recipientsUnknown";
  if (input.recipients === 0) return "noRecipients";
  return null;
}
