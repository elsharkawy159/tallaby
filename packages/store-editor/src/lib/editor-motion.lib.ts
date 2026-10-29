import type { DesignSystem, SectionInstance } from "@workspace/store-sections";

/**
 * What the canvas replays after an edit (docs/section-rules.md §6.8): the
 * sections whose Animation changed, or every section when Theme › Motion's
 * default or speed changed or the preview was just turned on. Pure, so the
 * canvas only has to call `replayReveal` on what this returns.
 */
export type MotionSnapshot = {
  on: boolean;
  /** Theme › Motion default and speed. */
  site: string;
  /** Section id → its Animation setting ("" = Inherit). */
  sections: Record<string, string>;
};

export function motionSnapshot(on: boolean, designSystem: DesignSystem, sections: readonly SectionInstance[]): MotionSnapshot {
  const motion = designSystem.motion;
  return {
    on: on && motion?.reveal !== false,
    site: `${motion?.default ?? ""}|${motion?.speed ?? ""}`,
    sections: Object.fromEntries(sections.map((s) => [s.id, sectionAnimation(s)])),
  };
}

const sectionAnimation = (instance: SectionInstance): string => {
  const shell = (instance.style as { shell?: { animation?: unknown } } | undefined)?.shell;
  return typeof shell?.animation === "string" ? shell.animation : "";
};

/** Section ids to replay, `"all"`, or nothing. A new section (added, duplicated) is not replayed: it shows at once. */
export function replayTargets(prev: MotionSnapshot | null, next: MotionSnapshot): string[] | "all" {
  if (!prev || !next.on) return [];
  if (!prev.on || prev.site !== next.site) return "all";
  return Object.keys(next.sections).filter((id) => id in prev.sections && prev.sections[id] !== next.sections[id]);
}
