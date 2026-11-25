import { cache } from "react";
import { getTallabyPaySettings } from "@workspace/lib/tallaby-pay/server";

const READ_TIMEOUT_MS = 3000;

export type TallabyPayFacts = { live: boolean; feePercent: string };

/** 300 bps → "3", 250 → "2.5". */
export function feePercentText(feeBps: number): string {
  return String(Math.round(feeBps) / 100);
}

/**
 * What the home page may say about Tallaby Pay: whether it is open
 * (`tallaby_pay_live`) and its current fee, from the same settings checkout
 * snapshots. Read fresh (never in @workspace/cache, as settings.server.ts asks),
 * once per render; the page itself rebuilds at most once a minute. Null when
 * it can't be read in time, so the section hides rather than guess.
 */
export const getTallabyPayFacts = cache(async (): Promise<TallabyPayFacts | null> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const settings = await Promise.race([
      getTallabyPaySettings(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`no answer in ${READ_TIMEOUT_MS} ms`)), READ_TIMEOUT_MS);
      }),
    ]);
    return { live: settings.live, feePercent: feePercentText(settings.feeBps) };
  } catch (error) {
    console.error("[marketing] tallaby pay settings failed", error);
    return null;
  } finally {
    clearTimeout(timer);
  }
});
