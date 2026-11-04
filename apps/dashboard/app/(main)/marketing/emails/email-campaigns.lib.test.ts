import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createPreviewRunner,
  previewRequest,
  queueBlocker,
  readSchedule,
  sendBlocker,
  toLocalInputValue,
  withInertLinks,
} from "./email-campaigns.lib";

const content = (over: Record<string, unknown> = {}) => ({
  subject: "Sale",
  body: "Everything is half price",
  ctaLabel: null,
  productIds: [],
  audience: "subscribers",
  ...over,
});

describe("previewRequest", () => {
  it("asks for the subject, then the message, without a server call", () => {
    expect(previewRequest(content({ subject: "  " }))).toEqual({ kind: "blocked", problem: "subjectRequired" });
    expect(previewRequest(content({ body: "\n" }))).toEqual({ kind: "blocked", problem: "bodyRequired" });
  });

  it("refuses links in every field", () => {
    expect(previewRequest(content({ subject: "see www.x.com" }))).toEqual({ kind: "blocked", problem: "subjectLink" });
    expect(previewRequest(content({ body: "https://x.com" }))).toEqual({ kind: "blocked", problem: "bodyLink" });
    expect(previewRequest(content({ ctaLabel: "x.com" }))).toEqual({ kind: "blocked", problem: "ctaLink" });
  });

  it("gives one key for content that renders the same", () => {
    const base = previewRequest(content());
    expect(base.kind).toBe("ready");
    expect(previewRequest(content({ body: "Everything is half price  \n" }))).toEqual(base);
    expect(previewRequest(content({ audience: "all" }))).toEqual(base);
    expect(previewRequest(content({ body: "Other" }))).not.toEqual(base);
  });
});

describe("createPreviewRunner", () => {
  type Result = { ok: boolean; key: string };
  let calls: { key: string; resolve: (r: Result) => void; reject: (e: Error) => void }[];
  let results: Result[];
  let busy: boolean[];

  const runner = () =>
    createPreviewRunner<Result>({
      delayMs: 800,
      run: (key) => new Promise((resolve, reject) => calls.push({ key, resolve, reject })),
      isSuccess: (r) => r.ok,
      onResult: (r) => results.push(r),
      onBusy: (b) => busy.push(b),
    });
  const finish = async (index: number, ok = true) => {
    calls[index]!.resolve({ ok, key: calls[index]!.key });
    await vi.advanceTimersByTimeAsync(0);
  };

  beforeEach(() => {
    vi.useFakeTimers();
    calls = [];
    results = [];
    busy = [];
  });
  afterEach(() => vi.useRealTimers());

  it("makes one call for a burst of typing", async () => {
    const r = runner();
    for (const key of ["a", "ab", "abc"]) {
      r.request(key);
      await vi.advanceTimersByTimeAsync(100);
    }
    expect(calls).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(800);
    expect(calls.map((c) => c.key)).toEqual(["abc"]);
    await finish(0);
    expect(results).toEqual([{ ok: true, key: "abc" }]);
    expect(busy).toEqual([true, false]);
  });

  it("runs one at a time, drops the stale result and sends only the newest waiting content", async () => {
    const r = runner();
    r.request("a", { immediate: true });
    await vi.advanceTimersByTimeAsync(0);
    r.request("ab");
    await vi.advanceTimersByTimeAsync(800);
    r.request("abc");
    await vi.advanceTimersByTimeAsync(800);
    expect(calls.map((c) => c.key)).toEqual(["a"]);

    await finish(0);
    expect(results).toEqual([]);
    expect(calls.map((c) => c.key)).toEqual(["a", "abc"]);
    await finish(1);
    expect(results).toEqual([{ ok: true, key: "abc" }]);
    expect(busy.at(-1)).toBe(false);
  });

  it("waits for the debounce if newer content is still settling when a call ends", async () => {
    const r = runner();
    r.request("a", { immediate: true });
    await vi.advanceTimersByTimeAsync(0);
    r.request("ab");
    await finish(0);
    expect(results).toEqual([]);
    expect(calls).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(800);
    expect(calls.map((c) => c.key)).toEqual(["a", "ab"]);
  });

  it("reuses the last success with no call, and tries a failure again", async () => {
    const r = runner();
    r.request("a", { immediate: true });
    await vi.advanceTimersByTimeAsync(0);
    await finish(0);
    r.request("a");
    await vi.advanceTimersByTimeAsync(800);
    expect(calls).toHaveLength(1);
    expect(results).toHaveLength(2);

    r.request("b", { immediate: true });
    await vi.advanceTimersByTimeAsync(0);
    await finish(1, false);
    expect(results.at(-1)).toEqual({ ok: false, key: "b" });
    r.request("b", { immediate: true });
    await vi.advanceTimersByTimeAsync(0);
    expect(calls).toHaveLength(3);
  });

  it("stays usable when a call throws", async () => {
    const r = runner();
    r.request("a", { immediate: true });
    await vi.advanceTimersByTimeAsync(0);
    calls[0]!.reject(new Error("network"));
    await vi.advanceTimersByTimeAsync(0);
    expect(results).toEqual([]);
    expect(busy).toEqual([true, false]);
    r.request("b", { immediate: true });
    await vi.advanceTimersByTimeAsync(0);
    expect(calls).toHaveLength(2);
  });

  it("shows nothing after cancel or dispose", async () => {
    const r = runner();
    r.request("a", { immediate: true });
    await vi.advanceTimersByTimeAsync(0);
    r.cancel();
    await finish(0);
    expect(results).toEqual([]);
    expect(busy.at(-1)).toBe(false);

    r.request("b");
    r.dispose();
    await vi.advanceTimersByTimeAsync(800);
    expect(calls).toHaveLength(1);
  });
});

describe("withInertLinks", () => {
  it("adds the base tag first in the head, once", () => {
    const html = withInertLinks('<html><head lang="ar"><title>x</title></head><body><head></head></body></html>');
    expect(html).toContain('<head lang="ar"><base target="_blank"><title>');
    expect(html.match(/<base /g)).toHaveLength(1);
  });
  it("copes with no head, and with $ in the text", () => {
    expect(withInertLinks("<p>x</p>")).toBe('<base target="_blank"><p>x</p>');
    expect(withInertLinks("<head></head><p>$& $1</p>")).toContain("<p>$& $1</p>");
  });
});

describe("queueBlocker", () => {
  const base = {
    storeLive: true,
    queuedToday: 0,
    campaignsPerDay: 1,
    allowance: { live: true, locked: false, pendingReview: false, remaining: 10 },
  };
  // The rule the page used before F-66.
  const canQueue = (i: typeof base) =>
    i.storeLive && i.queuedToday < i.campaignsPerDay && !i.allowance.locked && (!i.allowance.live || i.allowance.remaining > 0);

  it("names each reason", () => {
    expect(queueBlocker(base)).toBeNull();
    expect(queueBlocker({ ...base, storeLive: false })).toBe("storeOffline");
    expect(queueBlocker({ ...base, queuedToday: 1 })).toBe("dailyLimit");
    expect(queueBlocker({ ...base, allowance: { ...base.allowance, locked: true } })).toBe("activationRequired");
    expect(queueBlocker({ ...base, allowance: { ...base.allowance, locked: true, pendingReview: true } })).toBe("pendingReview");
    expect(queueBlocker({ ...base, allowance: { ...base.allowance, remaining: 0 } })).toBe("monthlyLimit");
  });

  it("blocks exactly when the old canQueue did", () => {
    for (const storeLive of [true, false])
      for (const queuedToday of [0, 1])
        for (const live of [true, false])
          for (const locked of [true, false])
            for (const pendingReview of [true, false])
              for (const remaining of [0, 5]) {
                const input = { storeLive, queuedToday, campaignsPerDay: 1, allowance: { live, locked, pendingReview, remaining } };
                expect(queueBlocker(input) === null).toBe(canQueue(input));
              }
  });
});

describe("readSchedule", () => {
  const now = new Date("2026-11-04T10:00:00Z");
  it("reads the picker's value", () => {
    expect(readSchedule("", now)).toBe("missing");
    expect(readSchedule("nonsense", now)).toBe("invalid");
    expect(readSchedule(toLocalInputValue(new Date(now.getTime() - 60_000)), now)).toBe("invalid");
    expect(readSchedule(toLocalInputValue(new Date(now.getTime() + 40 * 86_400_000)), now)).toBe("invalid");
    expect(readSchedule(toLocalInputValue(new Date(now.getTime() + 3_600_000)), now)).toEqual({ iso: "2026-11-04T11:00:00.000Z" });
  });
});

describe("sendBlocker", () => {
  const base = { queue: null, content: content(), schedule: null, recipients: 5 };
  it("is null when ready", () => {
    expect(sendBlocker(base)).toBeNull();
    expect(sendBlocker({ ...base, schedule: { iso: "x" } })).toBeNull();
  });
  it("names the first thing to fix, account limits first", () => {
    expect(sendBlocker({ ...base, queue: "dailyLimit", content: content({ subject: "" }) })).toBe("dailyLimit");
    expect(sendBlocker({ ...base, content: content({ subject: "" }), recipients: 0 })).toBe("subjectRequired");
    expect(sendBlocker({ ...base, schedule: "missing" })).toBe("scheduleMissing");
    expect(sendBlocker({ ...base, schedule: "invalid" })).toBe("scheduleInvalid");
    expect(sendBlocker({ ...base, recipients: null })).toBe("recipientsUnknown");
    expect(sendBlocker({ ...base, recipients: 0 })).toBe("noRecipients");
  });
});
