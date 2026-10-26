import { describe, expect, it } from "vitest";

import { bostaStateEffect, bostaStatusPath, canCancelBostaState, isFinalBostaState } from "./bosta-states.lib";

describe("bostaStateEffect", () => {
  it.each([
    [10, "assigned"],
    [11, "assigned"],
    [20, "assigned"],
    [21, "out_for_delivery"],
    [24, "out_for_delivery"],
    [30, "out_for_delivery"],
    [41, "out_for_delivery"],
    [45, "delivered"],
    [46, "returned"],
    [60, "returned"],
    [48, "failed"],
    [100, "failed"],
    [101, "failed"],
    [49, "cancelled"],
  ] as const)("maps state %i to %s", (code, status) => {
    expect(bostaStateEffect(code).status).toBe(status);
  });

  it("flags exceptions and holds for the seller without moving the shipment", () => {
    for (const code of [47, 102, 103, 105]) {
      expect(bostaStateEffect(code)).toEqual({ status: null, attention: true });
    }
  });

  it("ignores archived and unknown codes", () => {
    expect(bostaStateEffect(104)).toEqual({ status: null, attention: false });
    expect(bostaStateEffect(999)).toEqual({ status: null, attention: false });
  });

  it("knows the final and cancellable states", () => {
    expect(isFinalBostaState(45)).toBe(true);
    expect(isFinalBostaState(41)).toBe(false);
    expect(canCancelBostaState(10)).toBe(true);
    expect(canCancelBostaState(21)).toBe(false);
  });
});

describe("bostaStatusPath", () => {
  it("walks legal steps up to delivered", () => {
    expect(bostaStatusPath("pending", "delivered")).toEqual(["out_for_delivery", "delivered"]);
    expect(bostaStatusPath("assigned", "delivered")).toEqual(["out_for_delivery", "delivered"]);
    expect(bostaStatusPath("out_for_delivery", "delivered")).toEqual(["delivered"]);
  });

  it("never moves backwards or repeats (out-of-order webhooks)", () => {
    expect(bostaStatusPath("out_for_delivery", "assigned")).toEqual([]);
    expect(bostaStatusPath("delivered", "out_for_delivery")).toEqual([]);
    expect(bostaStatusPath("assigned", "assigned")).toEqual([]);
    expect(bostaStatusPath("cancelled", "delivered")).toEqual([]);
  });

  it("reaches failed, returned and cancelled", () => {
    expect(bostaStatusPath("pending", "failed")).toEqual(["assigned", "failed"]);
    expect(bostaStatusPath("out_for_delivery", "returned")).toEqual(["returned"]);
    expect(bostaStatusPath("assigned", "returned")).toEqual(["out_for_delivery", "returned"]);
    expect(bostaStatusPath("assigned", "cancelled")).toEqual(["cancelled"]);
    expect(bostaStatusPath("out_for_delivery", "cancelled")).toEqual(["failed", "cancelled"]);
  });
});
