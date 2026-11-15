import { describe, expect, it, vi } from "vitest";
import type { BuildItem } from "./builder.lib";
import { FatalBuildError, runNextStep, type BuildRunner, type StepSpec } from "./builder-run.lib";

function runner(specs: Record<string, StepSpec>, gate: BuildRunner["gate"] = async () => ({ ok: true, creditReference: "ref" })) {
  const saved: BuildItem[] = [];
  const stops: string[] = [];
  const refunds: (string | null)[] = [];
  const r: BuildRunner = {
    keys: Object.keys(specs),
    items: new Map(),
    specFor: (key) => specs[key]!,
    gate,
    giveCreditBack: async (reference) => void refunds.push(reference),
    saveItem: async (item) => void saved.push({ ...item }),
    onStop: async (reason) => void stops.push(reason),
  };
  return { r, saved, stops, refunds };
}

describe("a build step", () => {
  it("runs one step per call and finishes when none are left", async () => {
    const a = vi.fn(async () => ({}));
    const b = vi.fn(async () => ({}));
    const { r } = runner({ a: { feature: null, apply: a }, b: { feature: null, apply: b } });

    expect(await runNextStep(r)).toMatchObject({ finished: false, progress: { done: 1, total: 2, current: "b" } });
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).not.toHaveBeenCalled();
    expect(await runNextStep(r)).toMatchObject({ finished: true });
    expect(await runNextStep(r)).toMatchObject({ finished: true });
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
  });

  it("never runs a step that is done (a retried request can't double a product)", async () => {
    const apply = vi.fn(async () => ({ productId: "p1" }));
    const { r } = runner({ "product:x": { feature: null, apply } });
    r.items.set("product:x", { key: "product:x", status: "done", attempts: 0, data: {}, productId: "p1" });
    await runNextStep(r);
    expect(apply).not.toHaveBeenCalled();
  });

  it("doesn't pay for the model again when applying fails", async () => {
    const generate = vi.fn(async () => ({ value: { copy: "yes" } }));
    const apply = vi.fn().mockRejectedValueOnce(new Error("db down")).mockResolvedValueOnce({ productId: "p1" });
    const { r } = runner({ a: { feature: "store_builder_product", generate, apply } });

    await runNextStep(r);
    expect(r.items.get("a")).toMatchObject({ status: "pending", attempts: 1, data: { generated: { copy: "yes" } } });
    await runNextStep(r);
    expect(generate).toHaveBeenCalledTimes(1);
    expect(apply).toHaveBeenLastCalledWith({ copy: "yes" });
    expect(r.items.get("a")).toMatchObject({ status: "done", productId: "p1" });
    // The saved copy is gone once it's applied.
    expect(r.items.get("a")!.data.generated).toBeUndefined();
  });

  it("fails after two tries and the build moves on", async () => {
    const apply = vi.fn(async () => {
      throw new Error("nope");
    });
    const next = vi.fn(async () => ({}));
    const { r } = runner({ a: { feature: null, apply }, b: { feature: null, apply: next } });
    await runNextStep(r);
    await runNextStep(r);
    expect(r.items.get("a")).toMatchObject({ status: "failed", attempts: 2, data: { error: "nope" } });
    await runNextStep(r);
    expect(next).toHaveBeenCalled();
  });

  it("gives the credit back when the call fails or came from the cache", async () => {
    const failed = runner({ a: { feature: "store_builder_brief", generate: async () => Promise.reject(new Error("busy")), apply: async () => ({}) } });
    await runNextStep(failed.r);
    expect(failed.refunds).toEqual(["ref"]);

    const cached = runner({ a: { feature: "store_builder_brief", generate: async () => ({ value: 1, cached: true }), apply: async () => ({}) } });
    await runNextStep(cached.r);
    expect(cached.refunds).toEqual(["ref"]);

    const billed = runner({ a: { feature: "store_builder_brief", generate: async () => ({ value: 1 }), apply: async () => ({}) } });
    await runNextStep(billed.r);
    expect(billed.refunds).toEqual([]);
  });

  it("at the hard stop skips model steps, keeps free ones, and never calls the model", async () => {
    const generate = vi.fn(async () => ({ value: 1 }));
    const free = vi.fn(async () => ({}));
    const { r, stops } = runner({ a: { feature: "store_builder_product", generate, apply: async () => ({}) }, b: { feature: null, apply: free } }, async () => ({ ok: false, reason: "budget" }));

    await runNextStep(r);
    expect(generate).not.toHaveBeenCalled();
    expect(r.items.get("a")).toMatchObject({ status: "skipped", data: { skipped: "budget" } });
    expect(stops).toEqual(["budget"]);
    expect(await runNextStep(r)).toMatchObject({ finished: true });
    expect(free).toHaveBeenCalled();
  });

  it("doesn't check the gate again for copy it already has", async () => {
    const gate = vi.fn(async () => ({ ok: true as const, creditReference: null }));
    const { r } = runner({ a: { feature: "store_builder_product", generate: async () => ({ value: 1 }), apply: async () => ({}) } }, gate);
    r.items.set("a", { key: "a", status: "pending", attempts: 1, data: { generated: 1 }, productId: null });
    await runNextStep(r);
    expect(gate).not.toHaveBeenCalled();
  });

  it("lets a fatal error end the build", async () => {
    const { r } = runner({
      a: {
        feature: null,
        apply: async () => {
          throw new FatalBuildError("store_limit");
        },
      },
    });
    await expect(runNextStep(r)).rejects.toThrow("store_limit");
  });
});
