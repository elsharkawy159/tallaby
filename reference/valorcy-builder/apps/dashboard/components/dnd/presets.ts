/**
 * Shared dnd-kit configuration for every drag surface in the dashboard.
 *
 * Sensors, plugins and modifiers are module-level constants: dnd-kit treats
 * these arrays as construction input, so re-creating them inline would tear
 * down and rebuild sensor bindings on every render of a provider.
 */

import {
  KeyboardSensor,
  PointerActivationConstraints,
  PointerSensor,
  type Draggable,
} from '@dnd-kit/dom'
import { RestrictToWindow } from '@dnd-kit/dom/modifiers'

/** Marks the element that starts a drag, for sources that drag by a handle. */
export const DRAG_HANDLE_ATTR = 'data-drag-handle'
/** Opts a subtree out of starting drags (resize grips, inline toolbars, …). */
export const NO_DRAG_ATTR = 'data-no-drag'

/** Matches dnd-kit's own notion of an interactive element (`getInteractiveElement`). */
const INTERACTIVE_SELECTOR = [
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  'a[href]',
  '[contenteditable]:not([contenteditable="false"])',
].join(',')

function isOnHandle (target: Element, source: Draggable): boolean {
  const handle = source.handle
  return Boolean(handle && (handle === target || handle.contains(target)))
}

/**
 * Activation constraints per input:
 * - mouse on a drag handle: immediate — a handle has no other job
 * - touch: 250ms long-press with 5px tolerance, so swipes still scroll
 * - mouse/pen elsewhere: 6px of travel. No delay, so a slow click or a text
 *   selection gesture on a canvas never turns into a drag.
 */
function activationConstraints (event: PointerEvent, source: Draggable) {
  const target = event.target
  if (
    event.pointerType === 'mouse' &&
    target instanceof Element &&
    isOnHandle(target, source)
  ) {
    return undefined
  }
  if (event.pointerType === 'touch') {
    return [new PointerActivationConstraints.Delay({ value: 250, tolerance: 5 })]
  }
  return [new PointerActivationConstraints.Distance({ value: 6 })]
}

/**
 * dnd-kit's default refuses a drag that starts on any interactive element
 * (inputs, buttons, links, contenteditable) — kept as the base rule, so inline
 * editing never starts a drag. Two refinements on top:
 * - an interactive element that *wraps* the draggable (a node inside a link
 *   block) is a container, not a control, so it doesn't block its children
 * - `[data-no-drag]` opts builder chrome out entirely
 */
export function preventActivation (event: PointerEvent, source: Draggable): boolean {
  const target = event.target
  if (!(target instanceof Element)) return false
  if (isOnHandle(target, source)) return false
  if (target.closest(`[${NO_DRAG_ATTR}]`)) return true

  const refused = PointerSensor.defaults.preventActivation?.(event, source) ?? false
  if (!refused) return false
  const interactive = target.closest(INTERACTIVE_SELECTOR)
  const element = source.element
  return !(interactive && element && interactive !== element && interactive.contains(element))
}

/** Pointer + keyboard. Passing `sensors` replaces dnd-kit's list, so the keyboard sensor is always included. */
export const DND_SENSORS = [
  PointerSensor.configure({ activationConstraints, preventActivation }),
  KeyboardSensor,
]

/** Keeps a drag preview inside the viewport so it can never be lost off-screen. */
export const DND_MODIFIERS = [RestrictToWindow]

/** Sortable reflow timing, stated once so every list moves the same way. */
export const SORTABLE_TRANSITION = {
  duration: 250,
  easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
} as const
