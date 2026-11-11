/**
 * Regression guard for edition-ready looks (ROADMAP F-90, plan §4.3): a look
 * converted to `editionTemplate` must build, with its default content, the
 * SAME template as before the conversion, byte for byte. Each look's output
 * was captured into `__fixtures__/<key>.v<version>.json` BEFORE its file was
 * touched (`look-output.test-utils.ts` says what is in it).
 *
 * Every edition-ready look is guarded: one without a fixture fails here.
 * Converting a look (README.md): capture first, with the look still
 * unconverted:
 *   LOOK_FIXTURE=<key> npx vitest run src/templates/editions/look-guard.test.ts
 * Capture never overwrites. A deliberate redesign bumps the look's version,
 * which asks for a new capture (delete the old file in the same change).
 */
import { describe, expect, it } from "vitest";
import { getCodeTemplate } from "../catalog";
import { editionReadyLooks } from "./index";
import { builtOutput, captureFixture, firstDifference, fixturePath, readFixture } from "./look-output.test-utils";

/** Every look built with `editionTemplate`, and the one being captured. */
const GUARDED: readonly string[] = [...new Set([...editionReadyLooks(), ...(process.env.LOOK_FIXTURE ? [process.env.LOOK_FIXTURE] : [])])];

describe("edition-ready looks build exactly what they built before their conversion", () => {
  it.each(GUARDED)("%s", (key) => {
    const template = getCodeTemplate(key)!;
    expect(template, `${key} is not a code template`).toBeDefined();
    if (process.env.LOOK_FIXTURE === key) captureFixture(template);
    const expected = readFixture(template);
    expect(expected, `no fixture at ${fixturePath(template)}: capture it from the unconverted look (see the top of this file)`).not.toBeNull();
    const actual = builtOutput(template);
    if (actual !== expected) {
      // Name the first difference: two 130 KB strings side by side help nobody.
      expect.fail(`${key} no longer builds its captured output. First difference: ${firstDifference(JSON.parse(expected!), JSON.parse(actual))}`);
    }
    expect(actual).toBe(expected);
  });
});
