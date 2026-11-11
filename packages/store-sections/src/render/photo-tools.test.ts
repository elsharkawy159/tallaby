// @vitest-environment jsdom
/**
 * The before/after and photo-dot behaviour in a DOM (look-first pilot L5):
 * dragging and keys move the handle in both directions, and a photo's dots
 * open one at a time on hover, focus and tap and close on Escape or a tap
 * outside. The markup here is what `elements/before-after.tsx` and
 * `elements/hotspot.tsx` draw.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startPhotoTools } from "./photo-tools.client";

let stop: (() => void) | undefined;
let direction = "ltr";

beforeEach(() => {
  direction = "ltr";
  vi.spyOn(window, "getComputedStyle").mockImplementation(() => ({ direction }) as CSSStyleDeclaration);
  // A frame from x=100 to x=500.
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({ left: 100, right: 500, top: 0, bottom: 300, width: 400, height: 300, x: 100, y: 0, toJSON: () => ({}) });
});
afterEach(() => {
  stop?.();
  stop = undefined;
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

const byId = (id: string) => document.getElementById(id)!;
const pointer = (type: string, target: EventTarget, init: PointerEventInit = {}) => {
  const event = new window.PointerEvent(type, { bubbles: true, cancelable: true, pointerType: "mouse", button: 0, ...init });
  target.dispatchEvent(event);
  return event;
};
const key = (target: Element, name: string, init: KeyboardEventInit = {}) => {
  const event = new window.KeyboardEvent("keydown", { key: name, bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
};

const SLIDER = `<div id="frame" data-sf-ba="" style="--sf-ba:50%"><div id="after"><a id="link" href="/x">x</a></div><div id="before"></div><div data-sf-ba-rail=""><div id="handle" data-sf-ba-handle="" role="slider" tabindex="0" aria-valuenow="50"></div></div></div>`;
const position = () => byId("frame").style.getPropertyValue("--sf-ba");
const now = () => byId("handle").getAttribute("aria-valuenow");

describe("before/after drag", () => {
  beforeEach(() => {
    document.body.innerHTML = SLIDER;
    stop = startPhotoTools(document);
  });

  it("follows the pointer from press to release, and stops after it", () => {
    const down = pointer("pointerdown", byId("handle"), { clientX: 300 });
    expect(down.defaultPrevented).toBe(true);
    expect(position()).toBe("50%");
    pointer("pointermove", document, { clientX: 200 });
    expect(position()).toBe("25%");
    expect(now()).toBe("25");
    pointer("pointermove", document, { clientX: 9000 });
    expect(position()).toBe("100%");
    pointer("pointerup", document, { clientX: 400 });
    pointer("pointermove", document, { clientX: 150 });
    expect(position()).toBe("100%");
  });

  it("reads the frame's box once per drag, not per move", () => {
    const rect = vi.mocked(Element.prototype.getBoundingClientRect);
    rect.mockClear();
    pointer("pointerdown", byId("handle"), { clientX: 300 });
    for (let x = 110; x < 500; x += 30) pointer("pointermove", document, { clientX: x });
    expect(rect).toHaveBeenCalledTimes(1);
  });

  it("counts from the right edge in Arabic", () => {
    direction = "rtl";
    pointer("pointerdown", byId("handle"), { clientX: 200 });
    expect(position()).toBe("75%");
    pointer("pointermove", document, { clientX: 480 });
    expect(position()).toBe("5%");
  });

  it("lets a mouse press anywhere on the photos, but a finger only on the handle", () => {
    pointer("pointerdown", byId("after"), { clientX: 180 });
    expect(position()).toBe("20%");
    pointer("pointerup", document);
    // A finger on the photo scrolls the page: nothing moves, nothing is prevented.
    const touch = pointer("pointerdown", byId("after"), { clientX: 420, pointerType: "touch" });
    expect(touch.defaultPrevented).toBe(false);
    expect(position()).toBe("20%");
    pointer("pointerdown", byId("handle"), { clientX: 420, pointerType: "touch" });
    expect(position()).toBe("80%");
  });

  it("leaves links inside a layer and other mouse buttons alone", () => {
    expect(pointer("pointerdown", byId("link"), { clientX: 180 }).defaultPrevented).toBe(false);
    expect(pointer("pointerdown", byId("handle"), { clientX: 180, button: 2 }).defaultPrevented).toBe(false);
    expect(position()).toBe("50%");
  });

  it("ends the drag when the browser cancels it (a scroll took over)", () => {
    pointer("pointerdown", byId("handle"), { clientX: 300 });
    pointer("pointercancel", document);
    pointer("pointermove", document, { clientX: 150 });
    expect(position()).toBe("50%");
  });
});

describe("before/after keys", () => {
  beforeEach(() => {
    document.body.innerHTML = SLIDER;
    stop = startPhotoTools(document);
  });

  it("moves with the arrows, pages and ends, and keeps aria-valuenow in step", () => {
    const right = key(byId("handle"), "ArrowRight");
    expect(right.defaultPrevented).toBe(true);
    expect([position(), now()]).toEqual(["55%", "55"]);
    key(byId("handle"), "ArrowLeft");
    key(byId("handle"), "ArrowLeft");
    expect([position(), now()]).toEqual(["45%", "45"]);
    key(byId("handle"), "PageUp");
    expect(now()).toBe("65");
    key(byId("handle"), "Home");
    expect([position(), now()]).toEqual(["0%", "0"]);
    key(byId("handle"), "ArrowLeft");
    expect(now()).toBe("0");
    key(byId("handle"), "End");
    expect([position(), now()]).toEqual(["100%", "100"]);
  });

  it("mirrors the left and right arrows in Arabic", () => {
    direction = "rtl";
    key(byId("handle"), "ArrowLeft");
    expect(now()).toBe("55");
    key(byId("handle"), "ArrowRight");
    key(byId("handle"), "ArrowRight");
    expect(now()).toBe("45");
  });

  it("ignores other keys, shortcuts, and keys pressed elsewhere", () => {
    expect(key(byId("handle"), "Tab").defaultPrevented).toBe(false);
    expect(key(byId("handle"), "ArrowRight", { ctrlKey: true }).defaultPrevented).toBe(false);
    expect(key(byId("after"), "ArrowRight").defaultPrevented).toBe(false);
    expect(now()).toBe("50");
  });

  it("does nothing after clean-up", () => {
    stop!();
    stop = undefined;
    key(byId("handle"), "ArrowRight");
    pointer("pointerdown", byId("handle"), { clientX: 200 });
    expect([position(), now()]).toEqual(["50%", "50"]);
  });
});

const dot = (id: string) =>
  `<div id="${id}" data-sf-hotspot="text" data-hs-static=""><button id="${id}-dot" data-sf-hotspot-dot="" aria-expanded="false" aria-controls="${id}-pop"></button><div id="${id}-pop" data-sf-hotspot-pop=""><p id="${id}-text">note</p><a id="${id}-link" href="/p">p</a></div></div>`;
const PHOTOS = `<main id="page"><div id="photo1"><img id="img1">${dot("a")}${dot("b")}</div><div id="photo2">${dot("c")}</div><button id="elsewhere"></button></main>`;
const open = (id: string) => byId(id).hasAttribute("data-hs-open");
const expanded = (id: string) => byId(`${id}-dot`).getAttribute("aria-expanded");
const click = (id: string) => byId(id).dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));

describe("photo dots", () => {
  beforeEach(() => {
    document.body.innerHTML = PHOTOS;
    stop = startPhotoTools(document);
  });

  it("leaves the CSS fallback in place until a dot is used, then takes over for that photo", () => {
    expect(byId("a").hasAttribute("data-hs-static")).toBe(true);
    click("a-dot");
    expect(byId("a").hasAttribute("data-hs-static")).toBe(false);
    expect(byId("b").hasAttribute("data-hs-static")).toBe(false);
    expect(byId("c").hasAttribute("data-hs-static")).toBe(true);
  });

  it("a tap opens a dot and a second tap closes it", () => {
    click("a-dot");
    expect([open("a"), expanded("a")]).toEqual([true, "true"]);
    click("a-dot");
    expect([open("a"), expanded("a")]).toEqual([false, "false"]);
  });

  it("keeps one popover open per photo", () => {
    click("a-dot");
    click("b-dot");
    expect([open("a"), open("b")]).toEqual([false, true]);
    expect([expanded("a"), expanded("b")]).toEqual(["false", "true"]);
    // Another photo's dot closes this photo's (the tap is outside it) and opens its own.
    click("c-dot");
    expect([open("a"), open("b"), open("c")]).toEqual([false, false, true]);
  });

  it("closes on a tap outside, but not on a tap inside the open popover", () => {
    click("a-dot");
    click("a-text");
    expect(open("a")).toBe(true);
    click("img1");
    expect(open("a")).toBe(false);
    click("a-dot");
    click("elsewhere");
    expect(open("a")).toBe(false);
  });

  it("opens on mouse hover and closes when the mouse leaves the dot and its popover", () => {
    pointer("pointerover", byId("a-dot"), { relatedTarget: byId("img1") });
    expect(open("a")).toBe(true);
    // From the dot into its own popover: still open.
    pointer("pointerout", byId("a-dot"), { relatedTarget: byId("a-text") });
    pointer("pointerover", byId("a-text"), { relatedTarget: byId("a-dot") });
    expect(open("a")).toBe(true);
    pointer("pointerout", byId("a-text"), { relatedTarget: byId("img1") });
    expect(open("a")).toBe(false);
  });

  it("ignores hover from a finger: a tap decides", () => {
    pointer("pointerover", byId("a-dot"), { pointerType: "touch", relatedTarget: byId("img1") });
    expect(open("a")).toBe(false);
  });

  it("a click pins a hovered dot open after the mouse leaves", () => {
    pointer("pointerover", byId("a-dot"), { relatedTarget: byId("img1") });
    click("a-dot");
    pointer("pointerout", byId("a-dot"), { relatedTarget: byId("img1") });
    expect(open("a")).toBe(true);
    // Hovering another dot does not steal a pinned one.
    pointer("pointerover", byId("b-dot"), { relatedTarget: byId("img1") });
    expect([open("a"), open("b")]).toEqual([true, false]);
  });

  it("opens on keyboard focus, stays open while focus is inside, closes when focus moves on", () => {
    byId("a-dot").focus();
    expect(open("a")).toBe(true);
    byId("a-link").focus();
    expect(open("a")).toBe(true);
    byId("b-dot").focus();
    expect([open("a"), open("b")]).toEqual([false, true]);
    byId("elsewhere").focus();
    expect(open("b")).toBe(false);
  });

  it("Escape closes the popover and gives focus back to its dot", () => {
    byId("a-dot").focus();
    byId("a-link").focus();
    key(byId("a-link"), "Escape");
    expect([open("a"), expanded("a")]).toEqual([false, "false"]);
    expect(document.activeElement).toBe(byId("a-dot"));
    // And on the dot itself.
    click("b-dot");
    key(byId("b-dot"), "Escape");
    expect(open("b")).toBe(false);
  });

  it("picks up dots that mount later, and stops after clean-up", () => {
    byId("page").insertAdjacentHTML("beforeend", `<div id="photo3">${dot("d")}</div>`);
    click("d-dot");
    expect(open("d")).toBe(true);
    stop!();
    stop = undefined;
    click("d-dot");
    expect(open("d")).toBe(true);
    click("c-dot");
    expect(open("c")).toBe(false);
  });
});
