import { describe, expect, it } from "vitest";
import ar from "../../messages/ar.json";
import en from "../../messages/en.json";

const keys = (obj: object, prefix = ""): string[] =>
  Object.entries(obj).flatMap(([key, value]) =>
    value && typeof value === "object"
      ? keys(value, `${prefix}${key}.`)
      : [`${prefix}${key}`]
  );

describe("messages", () => {
  it("ar.json and en.json have identical keys", () => {
    expect(keys(ar).sort()).toEqual(keys(en).sort());
  });
});
