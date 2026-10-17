/**
 * Placement for the element popover. The popover must sit AROUND the selected
 * element — never on top of it — so it tries, in order:
 *
 *   1. fully above, then fully below (horizontally centred on the element)
 *   2. fully to the right, then to the left (top-aligned with the element)
 *   3. the larger vertical gap, shrinking the scrollable body to fit
 *   4. only when the element fills the viewport: docked to a viewport corner
 *
 * Pure and DOM-free so it can be unit tested.
 */

export type AnchorRect = Pick<DOMRect, 'top' | 'left' | 'right' | 'bottom' | 'width' | 'height'>

export interface PopoverPlacementInput {
  anchor: AnchorRect
  viewport: { width: number; height: number }
  /** Desired panel width. Clamped to the viewport. */
  width: number
  /** Natural (unconstrained) panel height. */
  height: number
  /** Height of everything except the scrollable body (header, actions, padding). */
  chromeHeight: number
  /** Gap kept between the popover, the element and the viewport edges. */
  margin?: number
  /** Smallest scrollable body worth shrinking to before giving up on a side. */
  minBodyHeight?: number
}

export type PopoverSide = 'top' | 'bottom' | 'right' | 'left' | 'docked'

export interface PopoverPlacement {
  top: number
  left: number
  width: number
  /** Max height for the scrollable body, or null when the natural height fits. */
  bodyMaxHeight: number | null
  side: PopoverSide
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), Math.max(min, max))

export function computePopoverPlacement ({
  anchor,
  viewport,
  width: desiredWidth,
  height,
  chromeHeight,
  margin = 8,
  minBodyHeight = 120,
}: PopoverPlacementInput): PopoverPlacement {
  const vw = viewport.width
  const vh = viewport.height
  const width = Math.min(desiredWidth, Math.max(0, vw - margin * 2))

  const centeredLeft = clamp(
    anchor.left + anchor.width / 2 - width / 2,
    margin,
    vw - width - margin
  )

  // Room between the element and each viewport edge, minus a margin on both sides.
  const spaceAbove = anchor.top - margin * 2
  const spaceBelow = vh - anchor.bottom - margin * 2
  const spaceRight = vw - anchor.right - margin * 2
  const spaceLeft = anchor.left - margin * 2

  // 1. Fully above / below.
  if (height <= spaceAbove) {
    return { top: anchor.top - margin - height, left: centeredLeft, width, bodyMaxHeight: null, side: 'top' }
  }
  if (height <= spaceBelow) {
    return { top: anchor.bottom + margin, left: centeredLeft, width, bodyMaxHeight: null, side: 'bottom' }
  }

  // 2. Beside the element — the panel may be capped to the viewport height.
  const sideHeight = Math.min(height, vh - margin * 2)
  const sideBody = sideHeight < height ? Math.max(0, sideHeight - chromeHeight) : null
  const sideTop = clamp(anchor.top, margin, vh - sideHeight - margin)
  if (width <= spaceRight) {
    return { top: sideTop, left: anchor.right + margin, width, bodyMaxHeight: sideBody, side: 'right' }
  }
  if (width <= spaceLeft) {
    return { top: sideTop, left: anchor.left - margin - width, width, bodyMaxHeight: sideBody, side: 'left' }
  }

  // 3. Shrink into the larger vertical gap.
  const useAbove = spaceAbove >= spaceBelow
  const gap = Math.max(spaceAbove, spaceBelow)
  if (gap - chromeHeight >= minBodyHeight) {
    return {
      top: useAbove ? anchor.top - margin - gap : anchor.bottom + margin,
      left: centeredLeft,
      width,
      bodyMaxHeight: gap - chromeHeight,
      side: useAbove ? 'top' : 'bottom',
    }
  }

  // 4. The element covers (nearly) the whole viewport — nothing can avoid it.
  //    Dock compactly in the corner furthest from the element's centre.
  const dockedHeight = Math.min(height, Math.max(chromeHeight + minBodyHeight, Math.floor(vh * 0.45)))
  const anchorCenterX = anchor.left + anchor.width / 2
  const anchorCenterY = anchor.top + anchor.height / 2
  return {
    top: anchorCenterY > vh / 2 ? margin : vh - dockedHeight - margin,
    left: anchorCenterX > vw / 2 ? margin : vw - width - margin,
    width,
    bodyMaxHeight: dockedHeight < height ? Math.max(0, dockedHeight - chromeHeight) : null,
    side: 'docked',
  }
}

/** Keeps a user-dragged panel inside the viewport. */
export function clampToViewport (
  top: number,
  left: number,
  size: { width: number; height: number },
  viewport: { width: number; height: number },
  margin = 8
) {
  return {
    top: clamp(top, margin, viewport.height - size.height - margin),
    left: clamp(left, margin, viewport.width - size.width - margin),
  }
}
