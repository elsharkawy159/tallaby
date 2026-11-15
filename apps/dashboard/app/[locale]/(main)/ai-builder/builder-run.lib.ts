import type { BuilderFeature } from "./builder.dto";
import { MAX_ITEM_ATTEMPTS, buildProgress, nextBuildItem, type BuildItem } from "./builder.lib";

/**
 * One build step, independent of the database and the model (ROADMAP.md F-54d),
 * so the rules that matter have tests: a done step never runs again, generated
 * copy is saved before it is applied so a retry doesn't pay twice, a step fails
 * after two tries and the build moves on, and when spending stops the free
 * steps still finish. `builder-run.server.ts` supplies the real steps.
 */

export type StepOutcome = {
  status?: "done" | "failed";
  /** Merged into the item's data: anything the review needs. */
  data?: Record<string, unknown>;
  productId?: string | null;
};

export type StepSpec = {
  /** The model call this step needs, or none. A step that may not spend is skipped, not failed. */
  feature: BuilderFeature | null;
  /** The model call. Its result is saved on the item before `apply` runs. */
  generate?: () => Promise<{ value: unknown; cached?: boolean }>;
  /** Writes through the existing store and product code. Must be safe to run twice. */
  apply: (generated: unknown) => Promise<StepOutcome>;
};

export type StepGate = { ok: true; creditReference: string | null } | { ok: false; reason: string };

export type BuildRunner = {
  keys: readonly string[];
  items: Map<string, BuildItem>;
  specFor: (key: string) => StepSpec;
  gate: (feature: BuilderFeature) => Promise<StepGate>;
  giveCreditBack: (reference: string | null) => Promise<void>;
  saveItem: (item: BuildItem) => Promise<void>;
  /** Spending stopped for this reason; the review says so. */
  onStop: (reason: string) => Promise<void>;
};

/** A step that can't go on, whatever the retries: the store limit, say. Ends the build at the review. */
export class FatalBuildError extends Error {
  constructor(readonly reason: string) {
    super(reason);
    this.name = "FatalBuildError";
  }
}

const errorCode = (error: unknown) => (error instanceof Error ? (error.name === "Error" ? error.message : error.name) : "unknown").slice(0, 80);

export type StepResult = { finished: boolean; progress: ReturnType<typeof buildProgress> };

/** Runs the next unfinished step, and only that. */
export async function runNextStep(runner: BuildRunner): Promise<StepResult> {
  const key = nextBuildItem(runner.keys, runner.items);
  const result = (): StepResult => ({ finished: nextBuildItem(runner.keys, runner.items) === null, progress: buildProgress(runner.keys, runner.items) });
  if (!key) return result();

  const item: BuildItem = runner.items.get(key) ?? { key, status: "pending", attempts: 0, data: {}, productId: null };
  const save = async (patch: Partial<BuildItem>) => {
    Object.assign(item, patch);
    runner.items.set(key, item);
    await runner.saveItem(item);
  };
  const failOrRetry = async (error: unknown) => {
    const attempts = item.attempts + 1;
    await save({ attempts, status: attempts >= MAX_ITEM_ATTEMPTS ? "failed" : "pending", data: { ...item.data, error: errorCode(error) } });
  };

  const spec = runner.specFor(key);
  if (spec.generate && spec.feature && item.data.generated === undefined) {
    const gate = await runner.gate(spec.feature);
    if (!gate.ok) {
      await runner.onStop(gate.reason);
      await save({ status: "skipped", data: { ...item.data, skipped: gate.reason } });
      return result();
    }
    try {
      const generated = await spec.generate();
      if (generated.cached) await runner.giveCreditBack(gate.creditReference);
      // Saved first: if applying fails, the retry doesn't pay for this again.
      await save({ data: { ...item.data, generated: generated.value } });
    } catch (error) {
      await runner.giveCreditBack(gate.creditReference);
      if (error instanceof FatalBuildError) throw error;
      await failOrRetry(error);
      return result();
    }
  }

  try {
    const outcome = await spec.apply(item.data.generated);
    const { generated: _generated, ...kept } = item.data;
    await save({
      status: outcome.status ?? "done",
      // The copy did its job; only what the review needs stays.
      data: { ...kept, ...outcome.data },
      productId: outcome.productId === undefined ? item.productId : outcome.productId,
    });
  } catch (error) {
    if (error instanceof FatalBuildError) throw error;
    await failOrRetry(error);
  }
  return result();
}
