// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { destroyAnimations, initAnimations, replayAnimation } from "./animations.client";

/** A fake IntersectionObserver: tests call `enter(el)` to scroll an element into view. */
const observed = new Set<Element>();
let callback: IntersectionObserverCallback = () => {};
let current: FakeIO | null = null;
class FakeIO {
  constructor(cb: IntersectionObserverCallback) {
    callback = cb;
    current = this;
  }
  observe(el: Element) {
    observed.add(el);
  }
  unobserve(el: Element) {
    observed.delete(el);
  }
  disconnect() {
    observed.clear();
  }
}
function enter(...els: Element[]) {
  // The browser passes the observer itself as the second argument.
  callback(els.map((target) => ({ target, isIntersecting: true }) as IntersectionObserverEntry), current as unknown as IntersectionObserver);
}

/** jsdom has no layout: an element is "below the fold" when its test says so. */
function place(el: Element, top: number) {
  el.getBoundingClientRect = () => ({ top, bottom: top + 100 }) as DOMRect;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("IntersectionObserver", FakeIO);
  window.matchMedia = ((query: string) => ({ matches: false, media: query })) as typeof window.matchMedia;
  Object.defineProperty(window, "innerHeight", { value: 800, configurable: true });
  document.documentElement.className = "js-animations";
});
afterEach(() => {
  destroyAnimations(document);
  document.body.innerHTML = "";
  vi.useRealTimers();
});

describe("initAnimations", () => {
  it("leaves the first screen alone and hides only what is below the fold", () => {
    document.body.innerHTML = `<div id="top" data-animate="fade-up"></div><div id="low" data-animate="fade-up"></div>`;
    place(document.getElementById("top")!, 100);
    place(document.getElementById("low")!, 1200);
    initAnimations();
    expect(document.getElementById("top")!.className).toBe("");
    expect(document.getElementById("top")!.hasAttribute("data-animate-done")).toBe(true);
    expect(document.getElementById("low")!.classList.contains("anim-pending")).toBe(true);
  });

  it("plays once on enter, then drops its classes", () => {
    document.body.innerHTML = `<div id="low" data-animate="slide-start"></div>`;
    const el = document.getElementById("low")!;
    place(el, 1200);
    initAnimations();
    enter(el);
    expect(el.classList.contains("is-visible")).toBe(true);
    expect(el.classList.contains("anim-pending")).toBe(false);
    expect(observed.has(el)).toBe(false);
    vi.runAllTimers();
    expect(el.className).toBe("");
    expect(el.hasAttribute("data-animate-done")).toBe(true);
  });

  it("does nothing without js-animations or with reduced motion", () => {
    document.body.innerHTML = `<div id="low" data-animate="fade"></div>`;
    place(document.getElementById("low")!, 1200);
    document.documentElement.className = "";
    initAnimations();
    expect(document.getElementById("low")!.className).toBe("");
    document.documentElement.className = "js-animations";
    window.matchMedia = ((query: string) => ({ matches: query.includes("reduce"), media: query })) as typeof window.matchMedia;
    initAnimations();
    expect(document.getElementById("low")!.className).toBe("");
  });

  it("staggers a group's children in the order they come into view", () => {
    document.body.innerHTML = `<ul data-animate="stagger"><li></li><li></li><li></li></ul>`;
    const items = [...document.querySelectorAll("li")];
    items.forEach((li) => place(li, 1200));
    initAnimations();
    expect(items.every((li) => li.getAttribute("data-animate-item") === "")).toBe(true);
    expect(document.querySelector("ul")!.className).toBe("");
    enter(...items);
    expect(items.map((li) => li.style.getPropertyValue("--animation-order"))).toEqual(["0", "1", "2"]);
  });

  it("upgrades the pilot's data-stagger markup", () => {
    document.body.innerHTML = `<div data-stagger=""><a></a></div>`;
    initAnimations();
    expect(document.querySelector("div")!.getAttribute("data-animate")).toBe("stagger");
    expect(document.querySelector("a")!.hasAttribute("data-animate-item")).toBe(true);
  });

  it("skips elements inside an animated parent and data-animate=none", () => {
    document.body.innerHTML = `<div id="outer" data-animate="fade"><p id="inner" data-animate="fade-up"></p></div><p id="off" data-animate="none"></p>`;
    ["outer", "inner", "off"].forEach((id) => place(document.getElementById(id)!, 1200));
    initAnimations();
    expect(document.getElementById("inner")!.classList.contains("anim-pending")).toBe(false);
    expect(document.getElementById("off")!.classList.contains("anim-pending")).toBe(false);
  });

  it("puts a waiting count-up's number back on destroy", () => {
    document.body.innerHTML = `<span id="n" data-count-up="">1,080</span>`;
    const el = document.getElementById("n")!;
    place(el, 1200);
    initAnimations();
    expect(el.textContent).toBe("0");
    destroyAnimations(document);
    expect(el.textContent).toBe("1,080");
  });
});

describe("replayAnimation", () => {
  it("plays an element again even after it was done", () => {
    document.body.innerHTML = `<div id="a" data-animate="zoom-in"></div>`;
    const el = document.getElementById("a")!;
    place(el, 100);
    initAnimations();
    expect(el.hasAttribute("data-animate-done")).toBe(true);
    replayAnimation(el);
    expect(el.classList.contains("is-visible")).toBe(true);
    vi.runAllTimers();
    expect(el.className).toBe("");
  });
});
