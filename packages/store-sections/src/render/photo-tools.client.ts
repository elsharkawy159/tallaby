/**
 * Behaviour of the `beforeAfter` and `hotspot` elements (docs/systems/plan.md
 * §10.1), loaded by `PhotoToolsRuntime` only on a page that has one. The
 * server markup (`elements/before-after.tsx`, `elements/hotspot.tsx`) works
 * without it: the two photos show split at the start position, and a dot's
 * popover opens on hover and focus with plain CSS.
 *
 * Every listener is delegated on the document, so elements that mount later
 * (client navigation) need no set-up. Dragging reads the frame's box once, on
 * pointer down, then only writes one CSS variable per move; nothing animates.
 */
import { BEFORE_AFTER_VAR, positionFromKey, positionFromPointer } from "../elements/before-after.lib";
import { hotspotReduce, type HotspotEvent, type HotspotState } from "../elements/hotspot.lib";

const FRAME = "[data-sf-ba]";
const HANDLE = "[data-sf-ba-handle]";
const HOTSPOT = "[data-sf-hotspot]";
const DOT = "[data-sf-hotspot-dot]";

/** Starts both behaviours for `document`; returns the clean-up. */
export function startPhotoTools(document: Document): (() => void) | undefined {
  const view = document.defaultView;
  if (!view) return;
  const window = view;
  const elementOf = (target: EventTarget | null) => (target instanceof window.Element ? target : null);
  const isRtl = (el: Element) => window.getComputedStyle(el).direction === "rtl";

  // ---- Before and after ----------------------------------------------------

  const setPosition = (frame: HTMLElement, position: number) => {
    frame.style.setProperty(BEFORE_AFTER_VAR, `${position}%`);
    frame.querySelector(HANDLE)?.setAttribute("aria-valuenow", String(Math.round(position)));
  };

  let drag: { frame: HTMLElement; left: number; width: number; rtl: boolean } | null = null;
  const onPointerMove = (event: PointerEvent) => {
    if (drag) setPosition(drag.frame, positionFromPointer(event.clientX, drag.left, drag.width, drag.rtl));
  };
  const endDrag = () => {
    drag = null;
    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerup", endDrag);
    document.removeEventListener("pointercancel", endDrag);
  };
  const onPointerDown = (event: PointerEvent) => {
    const target = elementOf(event.target);
    const frame = target?.closest<HTMLElement>(FRAME);
    if (!target || !frame || event.button > 0) return;
    const onHandle = target.closest(HANDLE) !== null;
    // A finger drags the handle only (anywhere else it scrolls the page); a mouse may press anywhere on the photos.
    if (!onHandle && (event.pointerType !== "mouse" || target.closest("a,button,input,select,textarea"))) return;
    const box = frame.getBoundingClientRect();
    drag = { frame, left: box.left, width: box.width, rtl: isRtl(frame) };
    setPosition(frame, positionFromPointer(event.clientX, drag.left, drag.width, drag.rtl));
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", endDrag);
    document.addEventListener("pointercancel", endDrag);
    // No text selection or native image drag while the handle moves.
    event.preventDefault();
    if (onHandle) frame.querySelector<HTMLElement>(HANDLE)?.focus({ preventScroll: true });
  };

  // ---- Photo dots ----------------------------------------------------------

  /** Open state per photo (the box that holds the dots). */
  const states = new WeakMap<Element, HotspotState>();
  const openPhotos = new Set<Element>();
  const idOf = (hotspot: Element) => hotspot.querySelector("[data-sf-hotspot-pop]")?.id ?? "";

  const dispatch = (photo: Element, event: HotspotEvent) => {
    const before = states.get(photo) ?? null;
    const after = hotspotReduce(before, event);
    const hotspots = Array.from(photo.children).filter((child) => child.matches(HOTSPOT));
    // The script now decides: the CSS-only hover fallback steps aside.
    for (const hotspot of hotspots) hotspot.removeAttribute("data-hs-static");
    if (before?.id === after?.id && before?.pinned === after?.pinned) return;
    states.set(photo, after);
    if (after) openPhotos.add(photo);
    else openPhotos.delete(photo);
    for (const hotspot of hotspots) {
      const open = after !== null && idOf(hotspot) === after.id;
      hotspot.toggleAttribute("data-hs-open", open);
      hotspot.querySelector(DOT)?.setAttribute("aria-expanded", String(open));
    }
  };
  /** The dot and popover holding `target`, with their photo. */
  const hotspotOf = (target: Element | null) => {
    const hotspot = target?.closest(HOTSPOT);
    const photo = hotspot?.parentElement;
    return hotspot && photo ? { hotspot, photo, id: idOf(hotspot) } : null;
  };
  /** Whether the pointer or focus moved between two parts of the same dot. */
  const within = (hotspot: Element, related: EventTarget | null) => related instanceof window.Node && hotspot.contains(related);

  const onClick = (event: MouseEvent) => {
    const target = elementOf(event.target);
    const hit = hotspotOf(target);
    for (const photo of openPhotos) {
      if (!photo.isConnected) openPhotos.delete(photo);
      // A tap outside the open dot and its popover closes it (a tap on another dot of the photo is handled below).
      else if (hit?.photo !== photo) dispatch(photo, { type: "outside" });
    }
    if (!hit) return;
    if (target?.closest(DOT)) dispatch(hit.photo, { type: "toggle", id: hit.id });
    // A tap inside another dot's popover cannot happen (only one is open); inside the open one, nothing changes.
  };
  const onPointerOver = (event: PointerEvent) => {
    const hit = event.pointerType === "mouse" ? hotspotOf(elementOf(event.target)) : null;
    if (hit && !within(hit.hotspot, event.relatedTarget)) dispatch(hit.photo, { type: "enter", id: hit.id });
  };
  const onPointerOut = (event: PointerEvent) => {
    const hit = event.pointerType === "mouse" ? hotspotOf(elementOf(event.target)) : null;
    if (hit && !within(hit.hotspot, event.relatedTarget)) dispatch(hit.photo, { type: "leave", id: hit.id });
  };
  const onFocusIn = (event: FocusEvent) => {
    const hit = hotspotOf(elementOf(event.target));
    if (hit && !within(hit.hotspot, event.relatedTarget)) dispatch(hit.photo, { type: "focus", id: hit.id });
  };
  const onFocusOut = (event: FocusEvent) => {
    const hit = hotspotOf(elementOf(event.target));
    // Focus went to another element (not to nowhere, as after a click on plain text inside the popover).
    if (hit && event.relatedTarget && !within(hit.hotspot, event.relatedTarget)) dispatch(hit.photo, { type: "blur", id: hit.id });
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const target = elementOf(event.target);
    if (event.key === "Escape") {
      for (const photo of openPhotos) {
        const open = Array.from(photo.children).find((child) => child.hasAttribute("data-hs-open"));
        // Focus inside the popover goes back to its dot, so it is not lost with the popover.
        if (open && target && open.contains(target) && !target.matches(DOT)) open.querySelector<HTMLElement>(DOT)?.focus();
        dispatch(photo, { type: "escape" });
      }
      return;
    }
    const handle = target?.closest<HTMLElement>(HANDLE);
    const frame = handle?.closest<HTMLElement>(FRAME);
    if (!handle || !frame || event.altKey || event.ctrlKey || event.metaKey) return;
    const next = positionFromKey(Number(handle.getAttribute("aria-valuenow")), event.key, isRtl(frame));
    if (next === null) return;
    event.preventDefault();
    setPosition(frame, next);
  };

  document.addEventListener("pointerdown", onPointerDown);
  document.addEventListener("click", onClick);
  document.addEventListener("pointerover", onPointerOver);
  document.addEventListener("pointerout", onPointerOut);
  document.addEventListener("focusin", onFocusIn);
  document.addEventListener("focusout", onFocusOut);
  document.addEventListener("keydown", onKeyDown);
  return () => {
    endDrag();
    document.removeEventListener("pointerdown", onPointerDown);
    document.removeEventListener("click", onClick);
    document.removeEventListener("pointerover", onPointerOver);
    document.removeEventListener("pointerout", onPointerOut);
    document.removeEventListener("focusin", onFocusIn);
    document.removeEventListener("focusout", onFocusOut);
    document.removeEventListener("keydown", onKeyDown);
  };
}
