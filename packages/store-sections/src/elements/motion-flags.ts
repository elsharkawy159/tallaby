/**
 * Motion constants the client runtimes need, with no imports, so the reveal
 * runtime stays tiny (`elements/motion.ts` pulls in the settings schemas).
 * `motion.ts` re-exports all of them.
 */

/**
 * The motion v2 marker (docs/motion-v2-plan.md, owner decision 1): `defineDesign`
 * writes `props.motion: 2` on every design's root `section` node, and the
 * renderer draws it as `data-sf-mv="2"`. Only sections inserted from the
 * library or a template from now on carry it; trees saved before have no
 * marker and keep today's motion exactly (v1).
 */
export const MOTION_V2_PROP = "motion";
export const MOTION_V2_MARK = 2;
export const MOTION_V2_ATTR = "data-sf-mv";

/** True when a section root node asks for motion v2. */
export function isMotionV2(props: Record<string, unknown> | null | undefined): boolean {
  return props?.[MOTION_V2_PROP] === MOTION_V2_MARK;
}

/** How much longer (or shorter) every reveal runs at each Theme › Animations speed (`--sf-speed`). */
export const REVEAL_SPEED_FACTOR = { slow: 1.6, normal: 1, fast: 0.6 } as const;
