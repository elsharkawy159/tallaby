import { describe, expect, it } from "vitest";
import { swipeAxis, swipeShouldClose } from "./swipe-to-close.lib";

describe("swipeShouldClose", () => {
  it("closes past 30% of the sheet's width", () => {
    expect(swipeShouldClose(120, 400, 0)).toBe(true);
    expect(swipeShouldClose(100, 400, 0)).toBe(false);
  });

  it("closes on a quick flick that has moved a little", () => {
    expect(swipeShouldClose(40, 400, 0.6)).toBe(true);
    expect(swipeShouldClose(10, 400, 2)).toBe(false);
  });

  it("never closes when pulled the other way or not at all", () => {
    expect(swipeShouldClose(0, 400, 1)).toBe(false);
    expect(swipeShouldClose(-200, 400, 1)).toBe(false);
  });
});

describe("swipeAxis", () => {
  it("waits for 8px, then picks the main direction", () => {
    expect(swipeAxis(4, 3)).toBeNull();
    expect(swipeAxis(30, 5)).toBe("x");
    expect(swipeAxis(10, 30)).toBe("y");
    // A diagonal stays the cart's scroll.
    expect(swipeAxis(20, 19)).toBe("y");
  });
});
