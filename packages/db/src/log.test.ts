import { afterEach, describe, expect, it, vi } from "vitest";
import { logServerError, summarizeError } from "./log";

describe("summarizeError", () => {
  it("keeps name, code and message of a plain error", () => {
    const error = Object.assign(new Error("boom"), { code: "E1" });
    expect(summarizeError(error)).toEqual({ name: "Error", code: "E1", message: "boom" });
  });

  it("drops Drizzle query parameters and keeps the driver message and code", () => {
    const cause = Object.assign(new Error('duplicate key value violates unique constraint "x"'), { code: "23505" });
    const error = new Error("Failed query: insert into users (email) values ($1)\nparams: someone@example.com", { cause });
    const summary = summarizeError(error);
    expect(summary).toEqual({ name: "Error", code: "23505", message: 'duplicate key value violates unique constraint "x"' });
    expect(JSON.stringify(summary)).not.toContain("someone@example.com");
  });

  it("never echoes a Failed query message without a cause", () => {
    expect(summarizeError(new Error("Failed query: select $1\nparams: secret")).message).toBe("Failed query");
  });

  it("truncates long messages and handles non-errors", () => {
    expect(summarizeError(new Error("x".repeat(1000))).message).toHaveLength(300);
    expect(summarizeError("plain")).toEqual({ name: "string", message: "plain" });
    expect(summarizeError({ token: "abc" })).toEqual({ name: "object", message: "non-error thrown" });
  });
});

describe("logServerError", () => {
  afterEach(() => vi.restoreAllMocks());

  it("prints a [scope] prefix, the context ids and the error summary", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logServerError("fee", "delivery credit failed", { orderId: "o1" }, new Error("nope"));
    expect(spy).toHaveBeenCalledWith("[fee] delivery credit failed", {
      orderId: "o1",
      error: { name: "Error", message: "nope" },
    });
  });
});
