import { describe, expect, it } from "vitest";
import { parseScannedOrderNumber } from "./scan-returns.lib";

describe("parseScannedOrderNumber", () => {
  it("reads a scanned order number as is", () => {
    expect(parseScannedOrderNumber("ORDX7K2M9QA")).toBe("ORDX7K2M9QA");
  });
  it("accepts what people type", () => {
    expect(parseScannedOrderNumber("  #ordx7k2 m9qa ")).toBe("ORDX7K2M9QA");
    expect(parseScannedOrderNumber("ORD١٢٣٤٥٦٧٨")).toBe("ORD12345678");
  });
  it("refuses anything else", () => {
    expect(parseScannedOrderNumber("")).toBeNull();
    expect(parseScannedOrderNumber("ab")).toBeNull();
    expect(parseScannedOrderNumber("https://evil.example/?x=1")).toBeNull();
    expect(parseScannedOrderNumber("ORD'; drop table")).toBeNull();
    expect(parseScannedOrderNumber("A".repeat(41))).toBeNull();
    expect(parseScannedOrderNumber(42)).toBeNull();
  });
});
