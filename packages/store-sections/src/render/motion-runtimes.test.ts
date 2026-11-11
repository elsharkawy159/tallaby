// @vitest-environment jsdom
/**
 * The reveal and carousel runtimes in a DOM with a hand-driven
 * IntersectionObserver and frame clock: v1 and v2 observers, eased batch
 * delays, rails revealed as one batch, and the carousel loop that runs only
 * while a playing carousel is on screen.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startCarousels } from "./carousel-runtime.client";
import { startReveals } from "./motion-runtime.client";

type Callback = (entries: Partial<IntersectionObserverEntry>[]) => void;

class FakeObserver {
  static all: FakeObserver[] = [];
  targets = new Set<Element>();
  constructor(
    public callback: Callback,
    public options: IntersectionObserverInit = {},
  ) {
    FakeObserver.all.push(this);
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
  /** Reports `els` as entering (or leaving) view together, in the given order. */
  fire(els: Element[], isIntersecting = true) {
    this.callback(els.map((target) => ({ target, isIntersecting })));
  }
}

let frames: Map<number, FrameRequestCallback>;
let nextFrame = 0;
let now = 0;
/** Runs the frames scheduled so far, `ms` apart. */
const tick = (ms = 16) => {
  now += ms;
  const due = [...frames.entries()];
  frames.clear();
  for (const [, cb] of due) cb(now);
};

let reduced = false;
beforeEach(() => {
  FakeObserver.all = [];
  frames = new Map();
  now = 0;
  reduced = false;
  vi.stubGlobal("IntersectionObserver", FakeObserver);
  (window as unknown as { IntersectionObserver: unknown }).IntersectionObserver = FakeObserver;
  window.requestAnimationFrame = (cb) => {
    frames.set(++nextFrame, cb);
    return nextFrame;
  };
  window.cancelAnimationFrame = (id) => void frames.delete(id);
  vi.spyOn(window.performance, "now").mockImplementation(() => now);
  window.matchMedia = ((query: string) => ({ matches: reduced && query.includes("reduce"), media: query })) as unknown as typeof window.matchMedia;
  Object.defineProperty(window, "innerHeight", { value: 800, configurable: true });
});
afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

/** Puts `html` below the fold (every element's top at 2000px) so nothing is shown at start. */
const page = (html: string) => {
  document.body.innerHTML = html;
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({ top: 2000, bottom: 2400, left: 0, right: 400, width: 400, height: 400, x: 0, y: 2000, toJSON: () => ({}) });
};
const byId = (id: string) => document.getElementById(id)!;
const [v1Observer, v2Observer] = [() => FakeObserver.all[0]!, () => FakeObserver.all[1]!];

describe("reveal runtime", () => {
  it("keeps v1 sections on the v1 observer, and puts marked sections on the earlier v2 one", () => {
    page(`<div class="sf-site"><section><p id="a" data-reveal="fade-up"></p></section><section data-sf-mv="2"><p id="b" data-reveal="fade-up"></p></section></div>`);
    const stop = startReveals(document)!;
    expect(v1Observer().options).toEqual({ threshold: 0.15 });
    expect(v2Observer().options).toEqual({ rootMargin: "0px 0px -12% 0px", threshold: 0 });
    expect([...v1Observer().targets]).toEqual([byId("a")]);
    expect([...v2Observer().targets]).toEqual([byId("b")]);
    expect(document.querySelector(".sf-site")!.classList.contains("sf-motion")).toBe(true);
    // v1: shown as before, with no batch delay.
    v1Observer().fire([byId("a")]);
    expect(byId("a").classList.contains("is-inview")).toBe(true);
    expect(byId("a").getAttribute("style")).toBeNull();
    stop();
  });

  it("staggers a v2 batch by page order from the eased table, times the site speed", () => {
    const items = Array.from({ length: 8 }, (_, i) => `<div id="i${i}" data-reveal="fade-up" data-reveal-step="${Math.min(i, 5)}"></div>`).join("");
    page(`<div class="sf-site" data-sf-speed="slow"><section data-sf-mv="2">${items}</section></div>`);
    startReveals(document);
    const els = Array.from({ length: 8 }, (_, i) => byId(`i${i}`));
    // Reported out of order: delays still follow the page order.
    v2Observer().fire([...els].reverse());
    expect(els.map((el) => el.style.getPropertyValue("--sf-delay"))).toEqual(["0ms", "96ms", "176ms", "240ms", "296ms", "344ms", "344ms", "344ms"]);
    expect(els.every((el) => el.classList.contains("is-inview"))).toBe(true);
  });

  it("starts each row from 0: a later batch has its own delays", () => {
    page(`<div class="sf-site"><section data-sf-mv="2"><i id="a" data-reveal="fade-up"></i><i id="b" data-reveal="fade-up"></i><i id="c" data-reveal="fade-up"></i></section></div>`);
    startReveals(document);
    v2Observer().fire([byId("a"), byId("b")]);
    v2Observer().fire([byId("c")]);
    expect(["a", "b", "c"].map((id) => byId(id).style.getPropertyValue("--sf-delay"))).toEqual(["0ms", "60ms", "0ms"]);
  });

  it("reveals a sideways row's cards as one batch when the row enters view (v1 and v2)", () => {
    const cards = (p: string) => Array.from({ length: 5 }, (_, i) => `<a id="${p}${i}" data-reveal="fade-up" data-reveal-step="${i}"></a>`).join("");
    page(
      `<div class="sf-site"><div id="r1" data-sf-rail="" style="overflow-x:auto">${cards("a")}</div><section data-sf-mv="2"><div id="r2" data-sf-rail="" style="overflow-x:auto">${cards("b")}</div></section><div id="grid" data-sf-rail="">${cards("c")}</div></div>`,
    );
    startReveals(document);
    // The rows are watched, never their cards one by one.
    expect(v1Observer().targets.has(byId("r1"))).toBe(true);
    expect(v1Observer().targets.has(byId("a3"))).toBe(false);
    expect(v2Observer().targets.has(byId("r2"))).toBe(true);
    expect(v2Observer().targets.has(byId("b4"))).toBe(false);
    // A phone-only row drawn as a grid (no sideways scroll) keeps per-card reveals.
    expect(v1Observer().targets.has(byId("c2"))).toBe(true);
    expect(v1Observer().targets.has(byId("grid"))).toBe(false);

    v1Observer().fire([byId("r1")]);
    for (let i = 0; i < 5; i++) {
      expect(byId(`a${i}`).classList.contains("is-inview")).toBe(true);
      // v1 keeps the server's steps.
      expect(byId(`a${i}`).dataset.revealStep).toBe(String(i));
    }
    v2Observer().fire([byId("r2")]);
    expect(Array.from({ length: 5 }, (_, i) => byId(`b${i}`).style.getPropertyValue("--sf-delay"))).toEqual(["0ms", "60ms", "110ms", "150ms", "185ms"]);
    // No card of a row is left hidden.
    expect(document.querySelectorAll('[data-sf-rail][style] [data-reveal]:not(.is-inview)')).toHaveLength(0);
  });

  it("shows a row already on screen at start without animating it", () => {
    document.body.innerHTML = `<div class="sf-site"><div id="r" data-sf-rail="" style="overflow-x:auto"><a id="a" data-reveal="fade-up"></a><a id="b" data-reveal="fade-up"></a></div></div>`;
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
      // The row is on screen; its second card is off to the side (and its own box below the fold).
      const top = this.id === "b" ? 2000 : 100;
      return { top, bottom: top + 100, left: 0, right: 100, width: 100, height: 100, x: 0, y: top, toJSON: () => ({}) };
    });
    startReveals(document);
    expect(byId("a").hasAttribute("data-reveal")).toBe(false);
    expect(byId("b").hasAttribute("data-reveal")).toBe(false);
  });

  it("does nothing with reduced motion or Animations off", () => {
    page(`<div class="sf-site"><p data-reveal="fade-up"></p></div>`);
    reduced = true;
    expect(startReveals(document)).toBeUndefined();
    expect(document.querySelector(".sf-motion")).toBeNull();
    reduced = false;
    document.body.innerHTML = `<div class="sf-site" data-sf-motion="off"><p data-reveal="fade-up"></p></div>`;
    startReveals(document);
    expect(document.querySelector(".sf-motion")).toBeNull();
    expect(v1Observer().targets.size + v2Observer().targets.size).toBe(0);
  });

  it("cleans the batch delay off once the reveal has played", () => {
    vi.useFakeTimers();
    page(`<div class="sf-site"><section data-sf-mv="2"><p id="a" data-reveal="fade-up"></p><p id="b" data-reveal="fade-up"></p></section></div>`);
    startReveals(document);
    v2Observer().fire([byId("a"), byId("b")]);
    expect(byId("b").style.getPropertyValue("--sf-delay")).toBe("60ms");
    vi.advanceTimersByTime(3600);
    expect(byId("b").hasAttribute("data-reveal")).toBe(false);
    expect(byId("b").style.getPropertyValue("--sf-delay")).toBe("");
    vi.useRealTimers();
  });
});

const carousel = (id: string, opts: { autoplay?: boolean; slides?: number } = {}) =>
  `<div id="${id}" data-carousel="" data-interval="1000"${opts.autoplay === false ? ' data-autoplay="0"' : ""}><div data-carousel-track="">${Array.from(
    { length: opts.slides ?? 3 },
    () => "<div></div>",
  ).join("")}</div><button data-carousel-dot="0"></button><button data-carousel-dot="1"></button><button data-carousel-dot="2"></button></div>`;

describe("carousel loop", () => {
  it("schedules no frame on a page without carousels", () => {
    document.body.innerHTML = "<main><p>No carousel</p></main>";
    const stop = startCarousels(document)!;
    expect(frames.size).toBe(0);
    stop();
  });

  it("runs only while a playing carousel is on screen, and stops when it leaves", () => {
    document.body.innerHTML = carousel("c1");
    startCarousels(document);
    const io = FakeObserver.all[0]!;
    // Marked ready at once, even before it is seen.
    expect(byId("c1").hasAttribute("data-carousel-ready")).toBe(true);
    expect(frames.size).toBe(0);
    io.fire([byId("c1")]);
    expect(frames.size).toBe(1);
    // Frames 50 ms apart (a frame counts at most 100 ms, as before).
    for (let i = 0; i < 5; i++) tick(50);
    const dot = byId("c1").querySelector<HTMLElement>('[data-carousel-dot="0"]')!;
    expect(Number(dot.style.getPropertyValue("--p"))).toBeCloseTo(0.25, 2);
    tick(100);
    expect(Number(dot.style.getPropertyValue("--p"))).toBeCloseTo(0.35, 2);
    tick(400);
    expect(Number(dot.style.getPropertyValue("--p"))).toBeCloseTo(0.45, 2);
    io.fire([byId("c1")], false);
    tick();
    // Off screen: the loop has stopped and nothing more is scheduled.
    expect(frames.size).toBe(0);
    io.fire([byId("c1")]);
    expect(frames.size).toBe(1);
  });

  it("never reads layout or queries the page inside the loop", () => {
    document.body.innerHTML = carousel("c1") + carousel("c2");
    startCarousels(document);
    FakeObserver.all[0]!.fire([byId("c1")]);
    const rect = vi.spyOn(Element.prototype, "getBoundingClientRect");
    const query = vi.spyOn(document, "querySelectorAll");
    for (let i = 0; i < 10; i++) tick(16);
    expect(rect).not.toHaveBeenCalled();
    expect(query).not.toHaveBeenCalled();
  });

  it("stays idle for carousels that don't autoplay, single slides, reduced motion and a hidden tab", () => {
    document.body.innerHTML = carousel("a", { autoplay: false }) + carousel("b", { slides: 1 });
    startCarousels(document);
    FakeObserver.all[0]!.fire([byId("a"), byId("b")]);
    expect(frames.size).toBe(0);

    document.body.innerHTML = carousel("c");
    reduced = true;
    startCarousels(document);
    FakeObserver.all[1]!.fire([byId("c")]);
    expect(frames.size).toBe(0);

    reduced = false;
    document.body.innerHTML = carousel("d");
    startCarousels(document);
    Object.defineProperty(document, "hidden", { value: true, configurable: true });
    FakeObserver.all[2]!.fire([byId("d")]);
    expect(frames.size).toBe(0);
    Object.defineProperty(document, "hidden", { value: false, configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(frames.size).toBe(1);
  });

  it("starts again after the visitor presses play", () => {
    document.body.innerHTML = carousel("c", { autoplay: false }).replace("</div></div>", '</div><button data-carousel-play=""></button></div>');
    startCarousels(document);
    FakeObserver.all[0]!.fire([byId("c")]);
    expect(frames.size).toBe(0);
    byId("c").querySelector<HTMLElement>("[data-carousel-play]")!.click();
    expect(frames.size).toBe(1);
  });

  it("stops scheduling after clean-up", () => {
    document.body.innerHTML = carousel("c");
    const stop = startCarousels(document)!;
    FakeObserver.all[0]!.fire([byId("c")]);
    stop();
    expect(frames.size).toBe(0);
    FakeObserver.all[0]!.fire([byId("c")]);
    expect(frames.size).toBe(0);
  });
});

describe("editor replay", () => {
  type Call = { el: Element; keyframes: Keyframe[]; options: KeyframeAnimationOptions };
  let calls: Call[];
  beforeEach(() => {
    calls = [];
    (Element.prototype as unknown as { animate: unknown }).animate = function (this: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions) {
      calls.push({ el: this, keyframes, options });
      return { id: "", cancel() {} } as unknown as Animation;
    };
    (Element.prototype as unknown as { getAnimations: unknown }).getAnimations = () => [];
  });

  it("replays v1 sections exactly as before", async () => {
    const { replayReveal } = await import("./motion-replay.client");
    document.body.innerHTML = `<div class="sf-site" dir="rtl"><section id="s"><p id="a" data-reveal="fade-up" data-reveal-step="2"></p><img id="b" data-reveal="zoom-in"></section></div>`;
    replayReveal(byId("s"));
    expect(calls.map((c) => [c.el.id, c.keyframes, c.options])).toEqual([
      ["a", [{ opacity: 0, transform: "translate3d(0,28px,0)" }, { opacity: 1, transform: "none" }], { duration: 1100, delay: 180, easing: "cubic-bezier(.16,1,.3,1)", fill: "backwards" }],
      [
        "b",
        [
          { opacity: 0, transform: "scale(1.1)", clipPath: "inset(6% 6% 6% 6%)" },
          { opacity: 1, transform: "none", clipPath: "inset(0)" },
        ],
        { duration: 1600, delay: 0, easing: "cubic-bezier(.16,1,.3,1)", fill: "backwards" },
      ],
    ]);
  });

  it("replays marked sections with the v2 tokens, words word by word and wipes from the start edge", async () => {
    const { replayReveal } = await import("./motion-replay.client");
    document.body.innerHTML = `<div class="sf-site" dir="rtl" data-sf-speed="fast"><section id="s" data-sf-mv="2"><p id="a" data-reveal="fade-up" data-reveal-step="2"></p><h2 id="h" data-reveal="words"><span aria-hidden="true"><span data-w="" style="--i:0">عطر</span> <span data-w="" style="--i:1">فاخر</span></span></h2><img id="w" data-reveal="wipe-start"></section></div>`;
    replayReveal(byId("s"));
    const [a, w1, w2, wipe] = calls;
    expect(a!.el.id).toBe("a");
    expect(a!.keyframes).toEqual([{ opacity: 0, transform: "translate3d(0,20px,0)" }, { opacity: 1, transform: "none" }]);
    expect(a!.options).toEqual({ duration: 420, delay: 66, easing: "cubic-bezier(.22,1,.36,1)", fill: "backwards" });
    // The heading itself doesn't move; its words do, 40 ms apart (× speed).
    expect([w1!.el.textContent, w2!.el.textContent]).toEqual(["عطر", "فاخر"]);
    expect(w2!.options.delay).toBeCloseTo(24, 5);
    expect(calls.some((c) => c.el.id === "h")).toBe(false);
    expect(wipe!.el.id).toBe("w");
    expect(wipe!.keyframes[0]).toEqual({ opacity: 1, transform: "scale(1.06)", clipPath: "inset(2.83% 2.83% 2.83% 100%)" });
    expect(wipe!.keyframes[1]).toEqual({ opacity: 1, transform: "none", clipPath: "inset(0)" });
    // Every replay fills backwards only: nothing is left hidden when it ends.
    expect(calls.every((c) => c.options.fill === "backwards")).toBe(true);
  });

  it("does nothing with reduced motion or Animations off", async () => {
    const { replayReveal } = await import("./motion-replay.client");
    document.body.innerHTML = `<div class="sf-site" data-sf-motion="off"><section id="s" data-sf-mv="2"><p data-reveal="fade-up"></p></section></div>`;
    replayReveal(byId("s"));
    reduced = true;
    document.body.innerHTML = `<div class="sf-site"><section id="s"><p data-reveal="fade-up"></p></section></div>`;
    replayReveal(byId("s"));
    expect(calls).toHaveLength(0);
  });
});
