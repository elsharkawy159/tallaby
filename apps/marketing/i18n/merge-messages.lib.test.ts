import { describe, expect, it } from "vitest";
import { deepMergeMessages } from "./merge-messages.lib";

describe("deepMergeMessages", () => {
  it("adds to a namespace and keeps its other keys", () => {
    expect(deepMergeMessages({ nav: { a: "1", b: "2" }, other: { c: "3" } }, { nav: { b: "x", d: "4" } })).toEqual({
      nav: { a: "1", b: "x", d: "4" },
      other: { c: "3" },
    });
  });

  it("merges nested keys and doesn't change its inputs", () => {
    const base = { a: { b: { c: "1" } } };
    expect(deepMergeMessages(base, { a: { b: { d: "2" } } })).toEqual({ a: { b: { c: "1", d: "2" } } });
    expect(base).toEqual({ a: { b: { c: "1" } } });
  });

  it("returns the base unchanged for an empty file", () => {
    expect(deepMergeMessages({ a: "1" }, {})).toEqual({ a: "1" });
  });
});
