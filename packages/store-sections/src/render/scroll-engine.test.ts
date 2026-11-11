// @vitest-environment jsdom
/**
 * The scroll engine (docs/motion-v2-plan.md §5.4) in a DOM with hand-driven
 * observers and frames: it measures only when an effect enters or something
 * resizes, never while scrolling; it writes only changes; it is idle with
 * nothing near the screen; CSS scroll timelines take the value effects; and
 * count-ups count once from below the screen.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startScrollEngine as start } from "./scroll-engine.client";
import { replayScrollEffect } from "./motion-replay.client";

type Entry = { target: Element; isIntersecting: boolean };
class FakeIO {
  static all: FakeIO[] = [];
  targets = new Set<Element>();
  constructor(
    public callback: (entries: Entry[]) => void,
    public options: IntersectionObserverInit = {},
  ) {
    FakeIO.all.push(this);
  }
  observe(el: Element) {
    this.targets.add(el);
  }
  unobserve(el: Element) {
    this.targets.delete(el);
  }
  disconnect() {
    this.targets.clear();
  }
  fire(els: Element[], isIntersecting = true) {
    this.callback(els.map((target) => ({ target, isIntersecting })));
  }
}
class FakeRO {
  static all: FakeRO[] = [];
  constructor(public callback: () => void) {
    FakeRO.all.push(this);
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

let frames: Map<number, FrameRequestCallback>;
let nextFrame = 0;
let now = 0;
const tick = (ms = 16) => {
  now += ms;
  const due = [...frames.values()];
  frames.clear();
  for (const cb of due) cb(now);
};
let reduced = false;
let cssTimelines = false;
/** Page geometry: each element's page top and height (rects are read relative to `scrollY`). */
const geometry = new Map<Element, { top: number; height: number }>();
let rectReads = 0;
/** Engines started by a test, stopped after it (a running one keeps listening to scroll). */
const running: (() => void)[] = [];
const startScrollEngine = (doc: Document) => {
  const stop = start(doc);
  if (stop) running.push(stop);
  return stop;
};

const scrollTo = (y: number) => {
  Object.defineProperty(window, "scrollY", { value: y, configurable: true });
  window.dispatchEvent(new Event("scroll"));
};

beforeEach(() => {
  FakeIO.all = [];
  FakeRO.all = [];
  frames = new Map();
  now = 0;
  reduced = false;
  cssTimelines = false;
  geometry.clear();
  rectReads = 0;
  (window as unknown as Record<string, unknown>).IntersectionObserver = FakeIO;
  (window as unknown as Record<string, unknown>).ResizeObserver = FakeRO;
  window.requestAnimationFrame = (cb) => {
    frames.set(++nextFrame, cb);
    return nextFrame;
  };
  window.cancelAnimationFrame = (id) => void frames.delete(id);
  window.matchMedia = ((query: string) => ({ matches: reduced && query.includes("reduce"), media: query })) as unknown as typeof window.matchMedia;
  Object.defineProperty(window, "CSS", { value: { supports: (q: string) => cssTimelines && q.includes("animation-timeline") }, configurable: true });
  Object.defineProperty(window, "innerHeight", { value: 800, configurable: true });
  Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
    rectReads++;
    const g = geometry.get(this) ?? { top: 5000, height: 100 };
    const top = g.top - window.scrollY;
    return { top, bottom: top + g.height, left: 0, right: 400, width: 400, height: g.height, x: 0, y: top, toJSON: () => ({}) } as DOMRect;
  });
});
afterEach(() => {
  running.splice(0).forEach((stop) => stop());
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

const byId = (id: string) => document.getElementById(id)!;
const engineIO = () => FakeIO.all.find((io) => io.options.rootMargin === "50% 0px")!;
const countIO = () => FakeIO.all.find((io) => io.options.rootMargin === undefined)!;

const parallaxPage = () => {
  document.body.innerHTML = `<div class="sf-site"><section data-section-id="s1"><div id="frame" data-sf-frame><img id="photo" data-sf-scroll="parallax"></div></section></div>`;
  geometry.set(byId("frame"), { top: 2000, height: 400 });
};

describe("scroll engine", () => {
  it("measures on entry, then writes --sf-progress from cached geometry with no layout read while scrolling", () => {
    parallaxPage();
    const stop = startScrollEngine(document)!;
    // It follows the photo's frame.
    expect([...engineIO().targets]).toEqual([byId("frame")]);
    expect(byId("photo").hasAttribute("data-sf-live")).toBe(false);
    engineIO().fire([byId("frame")]);
    tick();
    // At scrollY 0 the frame's top (2000) is far below the screen: progress 0.
    expect(byId("photo").style.getPropertyValue("--sf-progress")).toBe("0");
    expect(byId("photo").hasAttribute("data-sf-live")).toBe(true);
    const reads = rectReads;
    scrollTo(1800);
    tick();
    expect(byId("photo").style.getPropertyValue("--sf-progress")).toBe("0.5");
    scrollTo(2400);
    tick();
    expect(byId("photo").style.getPropertyValue("--sf-progress")).toBe("1");
    expect(rectReads).toBe(reads);
    stop();
  });

  it("writes only when a value moved by 0.001 or more, and schedules one frame per burst", () => {
    parallaxPage();
    startScrollEngine(document);
    engineIO().fire([byId("frame")]);
    tick();
    const set = vi.spyOn(byId("photo").style, "setProperty");
    scrollTo(1800);
    scrollTo(1800.2);
    scrollTo(1800.4);
    expect(frames.size).toBe(1);
    tick();
    expect(set).toHaveBeenCalledTimes(1);
    // 0.4px is 0.0003 of the pass: not written again.
    scrollTo(1800.6);
    tick();
    expect(set).toHaveBeenCalledTimes(1);
  });

  it("is idle while nothing is near the screen", () => {
    parallaxPage();
    startScrollEngine(document);
    scrollTo(100);
    expect(frames.size).toBe(0);
    engineIO().fire([byId("frame")]);
    tick();
    engineIO().fire([byId("frame")], false);
    tick();
    scrollTo(300);
    expect(frames.size).toBe(0);
  });

  it("measures again on resize and from the ResizeObserver, not on scroll", () => {
    parallaxPage();
    startScrollEngine(document);
    engineIO().fire([byId("frame")]);
    tick();
    geometry.set(byId("frame"), { top: 1000, height: 400 });
    FakeRO.all[0]!.callback();
    tick();
    scrollTo(800);
    tick();
    // (800 + 800 - 1000) / (800 + 400)
    expect(byId("photo").style.getPropertyValue("--sf-progress")).toBe("0.5");
  });

  it("drives fade-exit from its section's exit, a progress bar from its section's pass", () => {
    document.body.innerHTML = `<div class="sf-site"><section id="hero" data-section-id="s1"><div id="copy" data-sf-scroll="fade-exit"></div></section><section id="s2" data-section-id="s2"><div id="bar" data-sf-scroll="progress"></div></section></div>`;
    geometry.set(byId("hero"), { top: 0, height: 900 });
    geometry.set(byId("s2"), { top: 900, height: 800 });
    startScrollEngine(document);
    expect([...engineIO().targets]).toEqual([byId("hero"), byId("s2")]);
    engineIO().fire([byId("hero"), byId("s2")]);
    tick();
    expect(byId("copy").style.getPropertyValue("--sf-exit")).toBe("0");
    expect(byId("copy").style.getPropertyValue("--sf-progress")).toBe("");
    scrollTo(450);
    tick();
    expect(byId("copy").style.getPropertyValue("--sf-exit")).toBe("0.5");
    // (450 + 800 - 900) / (800 + 800)
    expect(byId("bar").style.getPropertyValue("--sf-progress")).toBe("0.2188");
  });

  it("sets the active step only when it changes, by the middle of the screen", () => {
    document.body.innerHTML = `<div class="sf-site"><div id="steps" data-sf-steps="4"></div></div>`;
    geometry.set(byId("steps"), { top: 1000, height: 2000 });
    startScrollEngine(document);
    engineIO().fire([byId("steps")]);
    tick();
    expect(byId("steps").getAttribute("data-sf-step")).toBe("0");
    const set = vi.spyOn(byId("steps"), "setAttribute");
    // The middle (scrollY + 400) at 1000 + 2.05 × 500: still before the step-2 margin, step 2 when past it.
    scrollTo(600 + 1025);
    tick();
    expect(byId("steps").getAttribute("data-sf-step")).toBe("2");
    scrollTo(600 + 1030);
    tick();
    expect(set).toHaveBeenCalledTimes(1);
    // Back just over the boundary: held on step 2.
    scrollTo(600 + 980);
    tick();
    expect(byId("steps").getAttribute("data-sf-step")).toBe("2");
    scrollTo(600 + 900);
    tick();
    expect(byId("steps").getAttribute("data-sf-step")).toBe("1");
  });

  it("leaves value effects to CSS scroll timelines, but still runs steps", () => {
    cssTimelines = true;
    document.body.innerHTML = `<div class="sf-site"><div id="frame"><img data-sf-scroll="parallax"></div><div id="steps" data-sf-steps="3"></div></div>`;
    startScrollEngine(document);
    expect([...engineIO().targets]).toEqual([byId("steps")]);
  });

  it("does nothing with reduced motion, and skips a site with Animations off", () => {
    reduced = true;
    parallaxPage();
    expect(startScrollEngine(document)).toBeUndefined();
    expect(FakeIO.all).toHaveLength(0);
    reduced = false;
    document.body.innerHTML = `<div class="sf-site" data-sf-motion="off"><div id="frame"><img data-sf-scroll="zoom"></div><span data-sf-count><span data-sf-count-live>+40</span></span></div>`;
    startScrollEngine(document);
    expect(engineIO().targets.size).toBe(0);
    expect(countIO().targets.size).toBe(0);
    expect(document.querySelector("[data-sf-count-live]")!.textContent).toBe("+40");
  });

  it("picks up effects that mount later", () => {
    document.body.innerHTML = `<div class="sf-site" id="root"></div>`;
    return (async () => {
      startScrollEngine(document);
      byId("root").innerHTML = `<div id="frame"><img data-sf-scroll="zoom"></div>`;
      await Promise.resolve();
      tick();
      expect([...engineIO().targets]).toEqual([byId("frame")]);
    })();
  });
});

describe("count-up", () => {
  const stat = (id: string, text: string) => `<span id="${id}" data-sf-count><span class="sr-only">${text}</span><span aria-hidden="true"><span>${text}</span><span data-sf-count-live>${text}</span></span></span>`;
  const live = (id: string) => byId(id).querySelector("[data-sf-count-live]")!.textContent;

  it("counts once from 0 when it enters, keeping Arabic digits and the text around", () => {
    document.body.innerHTML = `<div class="sf-site">${stat("a", "+١٬٠٨٠ عميل")}${stat("b", "98%")}</div>`;
    geometry.set(byId("a"), { top: 2000, height: 40 });
    geometry.set(byId("b"), { top: 100, height: 40 });
    const stop = startScrollEngine(document)!;
    // Below the screen: set to 0 and watched. On screen already: left as drawn.
    expect(live("a")).toBe("+٠ عميل");
    expect(live("b")).toBe("98%");
    expect([...countIO().targets]).toEqual([byId("a")]);
    countIO().fire([byId("a")]);
    tick(0);
    tick(600);
    const mid = live("a")!;
    expect(mid).toMatch(/^\+[٠-٩٬]+ عميل$/);
    expect(mid).not.toBe("+١٬٠٨٠ عميل");
    tick(700);
    expect(live("a")).toBe("+١٬٠٨٠ عميل");
    expect(countIO().targets.size).toBe(0);
    stop();
  });

  it("puts the final number back on clean-up", () => {
    document.body.innerHTML = `<div class="sf-site">${stat("a", "250")}</div>`;
    geometry.set(byId("a"), { top: 3000, height: 40 });
    const stop = startScrollEngine(document)!;
    expect(live("a")).toBe("0");
    stop();
    expect(live("a")).toBe("250");
  });

  it("leaves text with no whole number as it is", () => {
    document.body.innerHTML = `<div class="sf-site">${stat("a", "4.9")}</div>`;
    geometry.set(byId("a"), { top: 3000, height: 40 });
    startScrollEngine(document);
    expect(live("a")).toBe("4.9");
  });
});

describe("editor scroll effect demo", () => {
  it("plays a one-shot, backwards-filled demo on the target, and nothing with reduced motion", () => {
    document.body.innerHTML = `<div class="sf-site" data-sf-intensity="expressive"><div id="sec" data-section-id="s1"><img id="bg"><div data-node-id="n:1" id="photo"></div></div></div>`;
    const animate = vi.fn(() => ({ id: "" }));
    for (const el of document.querySelectorAll<HTMLElement>("*")) {
      (el as unknown as { animate: unknown }).animate = animate;
      (el as unknown as { getAnimations: unknown }).getAnimations = () => [];
    }
    replayScrollEffect(byId("sec"), "parallax", "n:1");
    expect(animate).toHaveBeenCalledTimes(1);
    const [keyframes, options] = animate.mock.calls[0] as unknown as [Keyframe[], KeyframeAnimationOptions];
    expect(keyframes).toEqual([{ transform: "translate3d(0,11.2%,0) scale(1.224)" }, { transform: "none" }]);
    expect(options).toMatchObject({ duration: 900, fill: "backwards" });
    // Without a target, parallax plays on the background photo; fade-exit fades in from 0.2.
    replayScrollEffect(byId("sec"), "zoom");
    expect(animate.mock.instances.length).toBe(2);
    replayScrollEffect(byId("sec"), "fade-exit", "n:1");
    expect((animate.mock.calls[2] as unknown as [Keyframe[]])[0][0]).toMatchObject({ opacity: 0.2 });
    // Junk and reduced motion do nothing.
    replayScrollEffect(byId("sec"), "spin", "n:1");
    replayScrollEffect(byId("sec"), "zoom", 'x"]');
    reduced = true;
    replayScrollEffect(byId("sec"), "zoom", "n:1");
    expect(animate).toHaveBeenCalledTimes(3);
  });
});
