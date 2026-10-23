import { describe, expect, it } from "vitest";
import type { Point } from "./canvas-geometry.lib";
import { trackPointer } from "./pointer-tracker.lib";

const move = (type: string, fields: Record<string, unknown>) => Object.assign(new Event(type), fields);

describe("trackPointer", () => {
  it("reports the mouse and the first touch in viewport coordinates", () => {
    const target = new EventTarget();
    const seen: Point[] = [];
    const stop = trackPointer(target, (p) => seen.push(p));
    target.dispatchEvent(move("mousemove", { clientX: 10, clientY: 900 }));
    target.dispatchEvent(move("touchmove", { touches: [{ clientX: 5, clientY: 6 }] }));
    // A touch that ended carries no point.
    target.dispatchEvent(move("touchmove", { touches: [] }));
    expect(seen).toEqual([
      { x: 10, y: 900 },
      { x: 5, y: 6 },
    ]);
    stop();
    target.dispatchEvent(move("mousemove", { clientX: 1, clientY: 1 }));
    expect(seen).toHaveLength(2);
  });
});
