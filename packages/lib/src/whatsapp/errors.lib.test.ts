import { describe, expect, it } from "vitest";
import { classifyGraphError, nextAttemptDelayMs, sendErrorOutcome, WHATSAPP_MAX_ATTEMPTS } from "./errors.lib";

describe("classifyGraphError", () => {
  it("classifies the listed codes", () => {
    for (const code of [130429, 131048, 131056, 131057, 131000, 131016]) expect(classifyGraphError({ code, httpStatus: 400 })).toBe("retryable");
    for (const code of [131026, 131047, 131049, 131050, 131051, 132000, 132012, 132999, 133010]) expect(classifyGraphError({ code, httpStatus: 400 })).toBe("permanent");
    expect(classifyGraphError({ code: 190, httpStatus: 401 })).toBe("auth");
  });

  it("falls back on the HTTP status and network phase", () => {
    expect(classifyGraphError({ httpStatus: 503 })).toBe("retryable");
    expect(classifyGraphError({ code: 1, httpStatus: 500 })).toBe("retryable");
    expect(classifyGraphError({ code: 100, httpStatus: 400 })).toBe("permanent");
    expect(classifyGraphError({ httpStatus: 401 })).toBe("auth");
    expect(classifyGraphError({ network: "before_send" })).toBe("retryable");
    expect(classifyGraphError({})).toBe("permanent");
  });
});

describe("nextAttemptDelayMs", () => {
  it("backs off 1 min, 5 min, 30 min, 2 h, then stops at the cap", () => {
    expect(nextAttemptDelayMs(1)).toBe(60_000);
    expect(nextAttemptDelayMs(2)).toBe(300_000);
    expect(nextAttemptDelayMs(3)).toBe(1_800_000);
    expect(nextAttemptDelayMs(4)).toBe(7_200_000);
    expect(nextAttemptDelayMs(WHATSAPP_MAX_ATTEMPTS)).toBeNull();
    expect(nextAttemptDelayMs(9)).toBeNull();
    expect(nextAttemptDelayMs(0)).toBeNull();
    expect(nextAttemptDelayMs(1.5)).toBeNull();
  });

  it("waits at least 10 s after a pair rate limit", () => {
    expect(nextAttemptDelayMs(1, 131056)).toBeGreaterThanOrEqual(10_000);
  });
});

describe("sendErrorOutcome", () => {
  it("re-queues a retryable error while attempts remain", () => {
    expect(sendErrorOutcome({ code: 131000, httpStatus: 500 }, 1)).toEqual({ status: "queued", delayMs: 60_000 });
    expect(sendErrorOutcome({ code: 131000, httpStatus: 500 }, WHATSAPP_MAX_ATTEMPTS)).toEqual({ status: "failed", auth: false });
  });

  it("fails permanent and auth errors at once", () => {
    expect(sendErrorOutcome({ code: 131026, httpStatus: 400 }, 1)).toEqual({ status: "failed", auth: false });
    expect(sendErrorOutcome({ code: 190, httpStatus: 401 }, 1)).toEqual({ status: "failed", auth: true });
  });

  it("marks a timeout after the body was sent unknown", () => {
    expect(sendErrorOutcome({ network: "after_send" }, 1)).toEqual({ status: "unknown" });
    expect(sendErrorOutcome({ network: "before_send" }, 1)).toEqual({ status: "queued", delayMs: 60_000 });
  });
});
