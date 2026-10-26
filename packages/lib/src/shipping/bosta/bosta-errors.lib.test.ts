import { describe, expect, it } from "vitest";

import { bostaErrorReason, isBostaAddressError, looksLikeDuplicateReference } from "./bosta-errors.lib";

describe("bostaErrorReason", () => {
  it("maps documented Bosta error codes", () => {
    expect(bostaErrorReason(1028, 400)).toBe("invalid_key");
    expect(bostaErrorReason(1073, 400)).toBe("no_pickup_location");
    expect(bostaErrorReason(3001, 400)).toBe("city_not_found");
    expect(bostaErrorReason(3003, 400)).toBe("district_not_found");
    expect(bostaErrorReason(3009, 400)).toBe("address_required");
    expect(bostaErrorReason(3007, 400)).toBe("cod_too_high");
    expect(bostaErrorReason(2150, 400)).toBe("images_required");
  });

  it("falls back to the HTTP status", () => {
    expect(bostaErrorReason(null, 401)).toBe("invalid_key");
    expect(bostaErrorReason(null, 403)).toBe("forbidden");
    expect(bostaErrorReason(null, 502)).toBe("server");
    expect(bostaErrorReason(4242, 400)).toBe("unknown");
  });

  it("groups address errors and spots duplicates", () => {
    expect(isBostaAddressError("district_not_found")).toBe(true);
    expect(isBostaAddressError("invalid_key")).toBe(false);
    expect(looksLikeDuplicateReference("uniqueBusinessReference already used")).toBe(true);
    expect(looksLikeDuplicateReference("City not found")).toBe(false);
  });
});
