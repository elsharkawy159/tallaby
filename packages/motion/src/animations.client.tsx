"use client";

/**
 * The scroll runtime: one shared IntersectionObserver per document plays every
 * `[data-animate]` element once, the first time it scrolls into view (the
 * presets are CSS, `animations.css`). Native APIs only.
 *
 * - Elements on the first screen (or scrolled past) when they are found are
 *   left as they are: they were never hidden, so nothing flashes and LCP and
 *   CLS don't move. Only elements still below the fold get `anim-pending`.
 * - New markup (App Router navigations, streamed or suspended content) is
 *   picked up by a debounced MutationObserver on `<body>`.
 * - Once played, an element drops its state classes and gets
 *   `data-animate-done`, so its own hover transitions come back.
 * - Nothing runs without `html.js-animations` (the inline script in the root
 *   layout adds it before paint), with reduced motion, or without
 *   IntersectionObserver: content is simply visible.
 */
import { useEffect } from "react";
import { formatCount, MOTION, easeOutQuad, normalizePreset, parseCount, parseNumber } from "./presets";

const PENDING = "anim-pending";
const VISIBLE = "is-visible";
const DONE = "data-animate-done";
/** Set on an item whose `--animation-order` the runtime wrote (and removes after). */
const ORDERED = "data-animate-ordered";
const ANIMATED = '[data-animate]:not([data-animate="stagger"]):not([data-animate="none"]),[data-animate-item]';
const STAGGER = '[data-animate="stagger"]';
/** Class the inline head script sets on `<html>`: CSS hides pending elements only under it. */
export const JS_ANIMATIONS_CLASS = "js-animations";

/** `counts`: count-ups waiting to run, with how to put their rendered text back. */
type Runtime = { io: IntersectionObserver; timers: Map<Element, number>; counts: Map<Element, { run: () => void; restore: () => void }> };
const runtimes = new WeakMap<Document, Runtime>();

function enabled(doc: Document): boolean {
  const win = doc.defaultView;
  return (
    !!win &&
    "IntersectionObserver" in win &&
    doc.documentElement.classList.contains(JS_ANIMATIONS_CLASS) &&
    !win.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function runtimeOf(doc: Document): Runtime {
  let rt = runtimes.get(doc);
  if (!rt) {
    const win = doc.defaultView!;
    const io = new win.IntersectionObserver(onIntersect, { threshold: 0.1, rootMargin: "0px 0px -10% 0px" });
    rt = { io, timers: new Map(), counts: new Map() };
    runtimes.set(doc, rt);
  }
  return rt;
}

function onIntersect(entries: IntersectionObserverEntry[], io: IntersectionObserver) {
  // Items of one stagger group that come into view together play in turn.
  const batches = new Map<Element | null, HTMLElement[]>();
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    io.unobserve(entry.target);
    const el = entry.target as HTMLElement;
    if (el.hasAttribute("data-count-up") && !el.hasAttribute("data-animate")) {
      runCount(el);
      continue;
    }
    const group = el.hasAttribute("data-animate-item") ? el.closest(STAGGER) : null;
    const batch = batches.get(group) ?? [];
    batch.push(el);
    batches.set(group, batch);
  }
  for (const [group, els] of batches) els.forEach((el, i) => play(el, group ? i : null));
}

/** Old markup from the first pilot (`data-stagger`) becomes a stagger group; a group's items get marked. */
function prepare(root: ParentNode) {
  for (const legacy of root.querySelectorAll<HTMLElement>("[data-stagger]:not([data-animate])")) {
    legacy.setAttribute("data-animate", "stagger");
    if (legacy.dataset.staggerVariant) legacy.dataset.animateVariant = legacy.dataset.staggerVariant;
  }
  const groups = root instanceof Element && root.matches(STAGGER) ? [root, ...root.querySelectorAll(STAGGER)] : [...root.querySelectorAll(STAGGER)];
  for (const group of groups as HTMLElement[]) {
    const marked = [...group.querySelectorAll<HTMLElement>("[data-animate-item]")].filter((el) => el.closest(STAGGER) === group);
    if (marked.length > 0 || group.dataset.animateVariant === "none") continue;
    const variant = normalizePreset(group.dataset.animateVariant ?? "");
    for (const child of group.children) child.setAttribute("data-animate-item", variant && variant !== "fade-up" && variant !== "stagger" ? variant : "");
  }
}

function below(el: Element): boolean {
  return el.getBoundingClientRect().top >= (el.ownerDocument.defaultView?.innerHeight ?? 0);
}

function track(el: HTMLElement, rt: Runtime) {
  if (el.hasAttribute(DONE) || el.classList.contains(PENDING) || el.classList.contains(VISIBLE)) return;
  // Inside something that animates already: the outer one carries it in.
  if (el.parentElement?.closest(ANIMATED)) return void el.setAttribute(DONE, "");
  if (!below(el)) return void el.setAttribute(DONE, "");
  el.classList.add(PENDING);
  rt.io.observe(el);
}

function trackCount(el: HTMLElement, rt: Runtime) {
  if (el.hasAttribute(DONE) || rt.counts.has(el)) return;
  const node = [...el.childNodes].find((n): n is Text => n.nodeType === Node.TEXT_NODE && /\d|[٠-٩]/.test(n.nodeValue ?? ""));
  const original = node?.nodeValue ?? "";
  const parsed = parseCount(original);
  if (!node || !parsed || !below(el)) return void el.setAttribute(DONE, "");
  const from = parseNumber(el.dataset.countUp, 0);
  // Only the digits change, in place: React still owns the text node.
  const write = (v: number) => (node.nodeValue = original.replace(/[\d٠-٩][\d,٠-٩٬]*/, formatCount(v, parsed)));
  const restore = () => void (node.nodeValue = original);
  write(from);
  const run = () => {
    const win = el.ownerDocument.defaultView!;
    const start = win.performance.now();
    const frame = (now: number) => {
      const t = (now - start) / MOTION.countUp;
      if (t >= 1) return restore();
      write(from + (parsed.value - from) * easeOutQuad(t));
      win.requestAnimationFrame(frame);
    };
    win.requestAnimationFrame(frame);
  };
  rt.counts.set(el, { run, restore });
  if (!el.hasAttribute("data-animate")) rt.io.observe(el);
}

function runCount(el: HTMLElement) {
  const rt = runtimes.get(el.ownerDocument);
  const count = rt?.counts.get(el);
  rt?.counts.delete(el);
  el.setAttribute(DONE, "");
  count?.run();
}

/** The longest transition (duration + delay) an element runs, in ms. */
function longest(el: HTMLElement): number {
  const style = el.ownerDocument.defaultView!.getComputedStyle(el);
  const ms = (list: string) => list.split(",").map((s) => (s.trim().endsWith("ms") ? parseFloat(s) : parseFloat(s) * 1000) || 0);
  const durations = ms(style.transitionDuration);
  const delays = ms(style.transitionDelay);
  return Math.max(0, ...durations.map((d, i) => d + (delays[i] ?? delays[0] ?? 0)));
}

function play(el: HTMLElement, order: number | null) {
  const rt = runtimes.get(el.ownerDocument);
  if (!rt) return;
  if (order != null && el.style.getPropertyValue("--animation-order") === "") {
    el.style.setProperty("--animation-order", String(Math.min(order, MOTION.maxOrder)));
    el.setAttribute(ORDERED, "");
  }
  el.classList.add(VISIBLE);
  el.classList.remove(PENDING);
  if (el.hasAttribute("data-count-up")) runCount(el);
  const win = el.ownerDocument.defaultView!;
  win.clearTimeout(rt.timers.get(el));
  rt.timers.set(
    el,
    win.setTimeout(() => finish(el), longest(el) + 50),
  );
}

/** Back to the element's own state: no animation classes, no order the runtime wrote. */
function reset(el: HTMLElement) {
  runtimes.get(el.ownerDocument)?.timers.delete(el);
  el.classList.remove(VISIBLE, PENDING);
  if (el.hasAttribute(ORDERED)) {
    el.style.removeProperty("--animation-order");
    el.removeAttribute(ORDERED);
  }
}

function finish(el: HTMLElement) {
  reset(el);
  el.setAttribute(DONE, "");
}

function docOf(root: ParentNode): Document {
  return root instanceof Document ? root : (root as Node).ownerDocument!;
}

function within<T extends Element>(root: ParentNode, selector: string): T[] {
  const found = [...root.querySelectorAll<T>(selector)];
  return root instanceof Element && root.matches(selector) ? [root as unknown as T, ...found] : found;
}

/** Watches every animated element in `root` (default: the whole document) that isn't watched yet. */
export function initAnimations(root: ParentNode = document) {
  const doc = docOf(root);
  if (!enabled(doc)) return;
  const rt = runtimeOf(doc);
  prepare(root);
  for (const el of within<HTMLElement>(root, ANIMATED)) track(el, rt);
  for (const el of within<HTMLElement>(root, "[data-count-up]")) trackCount(el, rt);
}

/** Plays an element (or every item of a stagger group) again, now: for the builder after a setting changes. */
export function replayAnimation(el: HTMLElement) {
  const doc = el.ownerDocument;
  if (!enabled(doc)) return;
  const rt = runtimeOf(doc);
  prepare(el);
  const targets = el.matches(STAGGER) ? within<HTMLElement>(el, "[data-animate-item]").filter((item) => item.closest(STAGGER) === el) : [el];
  targets.forEach((target) => {
    rt.io.unobserve(target);
    target.removeAttribute(DONE);
    target.classList.remove(VISIBLE);
    target.classList.add(PENDING);
  });
  // One reflow so the hidden state is applied before the transition starts.
  void el.offsetWidth;
  targets.forEach((target, i) => play(target, targets.length > 1 ? i : null));
}

/**
 * Stops watching `root` (default: the document) and shows everything in it.
 * What hadn't played yet is watched again by the next `initAnimations` (a
 * remount, Strict Mode).
 */
export function destroyAnimations(root: ParentNode = document) {
  const rt = runtimes.get(docOf(root));
  if (!rt) return;
  const win = docOf(root).defaultView;
  for (const el of within<HTMLElement>(root, `.${PENDING},.${VISIBLE}`)) {
    rt.io.unobserve(el);
    win?.clearTimeout(rt.timers.get(el));
    reset(el);
  }
  for (const [el, count] of rt.counts) {
    if (!root.contains(el)) continue;
    rt.io.unobserve(el);
    count.restore();
    rt.counts.delete(el);
  }
  if (root instanceof Document) {
    rt.io.disconnect();
    runtimes.delete(root);
  }
}

/**
 * Mount once per page tree (the marketing layout). Renders nothing. Finds
 * the animated markup now and again whenever the DOM changes.
 */
export function AnimationObserver() {
  useEffect(() => {
    // A client-side navigation into these pages never ran the head script.
    document.documentElement.classList.add(JS_ANIMATIONS_CLASS);
    initAnimations(document);
    let timer = 0;
    const mutations = new MutationObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => initAnimations(document), 50);
    });
    mutations.observe(document.body, { childList: true, subtree: true });
    return () => {
      mutations.disconnect();
      window.clearTimeout(timer);
      destroyAnimations(document);
    };
  }, []);
  return null;
}
