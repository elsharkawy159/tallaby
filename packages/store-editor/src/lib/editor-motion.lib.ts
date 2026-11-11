import type { ComponentNode, DesignSystem, SectionInstance } from "@workspace/store-sections";
import { normalizeShell, scrollEffectTargets, type ScrollTargets } from "@workspace/store-sections/render";

/**
 * What the canvas replays after an edit (docs/section-rules.md §6.8,
 * docs/motion-v2-plan.md §5.8): the sections whose Animation changed, or every
 * section when Theme › Motion's default, speed or intensity changed or the
 * preview was just turned on; and a one-shot demo of each Scroll effect that
 * changed (a section's, or an image's own). Pure, so the canvas only has to
 * call `replayReveal` and `replayScrollEffect` on what this returns.
 */
export type MotionSnapshot = {
  on: boolean;
  /** Theme › Motion default, speed and intensity. */
  site: string;
  /** Section id → its Animation setting ("" = Inherit). */
  sections: Record<string, string>;
  /** Section id → its Scroll effects. */
  scroll: Record<string, SectionScroll>;
};

type SectionScroll = {
  /** The section's Scroll effect where it plays ("" = none, or nothing in the section it can move). */
  effect: string;
  /** The node it moves; null = the section's background photo. */
  target: string | null;
  /** Image node id → its own Scroll effect ("" = none). */
  images: Record<string, string>;
};

export type ScrollReplay = { sectionId: string; effect: string; targetId: string | null };

/** Where a section's Scroll effect can play (`isFirstSection`: the page's first section, the only one with fade-exit). */
export function sectionScrollTargets(instance: SectionInstance, isFirstSection: boolean): ScrollTargets {
  const shell = normalizeShell((instance.style as { shell?: unknown } | undefined)?.shell);
  return scrollEffectTargets(instance.componentTree ?? [], { isFirstSection, backgroundImage: Boolean(shell?.bgImage) });
}

export function motionSnapshot(on: boolean, designSystem: DesignSystem, sections: readonly SectionInstance[]): MotionSnapshot {
  const motion = designSystem.motion;
  return {
    on: on && motion?.reveal !== false,
    site: `${motion?.default ?? ""}|${motion?.speed ?? ""}|${motion?.intensity ?? ""}`,
    sections: Object.fromEntries(sections.map((s) => [s.id, sectionAnimation(s)])),
    scroll: Object.fromEntries(sections.map((s, index) => [s.id, sectionScroll(s, index === 0)])),
  };
}

const sectionAnimation = (instance: SectionInstance): string => {
  const shell = (instance.style as { shell?: { animation?: unknown } } | undefined)?.shell;
  return typeof shell?.animation === "string" ? shell.animation : "";
};

function sectionScroll(instance: SectionInstance, isFirstSection: boolean): SectionScroll {
  const shell = normalizeShell((instance.style as { shell?: unknown } | undefined)?.shell);
  const images: Record<string, string> = {};
  const visit = (nodes: readonly ComponentNode[]) => {
    for (const node of nodes) {
      if (node.type === "image") {
        const own = node.props?.scrollEffect;
        images[node.id] = own === "parallax" || own === "zoom" ? own : "";
      }
      visit(node.children ?? []);
    }
  };
  visit(instance.componentTree ?? []);
  const chosen = shell?.scrollEffect;
  if (!chosen) return { effect: "", target: null, images };
  // As the renderer: fade-exit fades the first section's title box; a background photo takes parallax and zoom, else the main photo does.
  const targets = sectionScrollTargets(instance, isFirstSection);
  if (chosen === "fade-exit") return targets.contentId ? { effect: chosen, target: targets.contentId, images } : { effect: "", target: null, images };
  if (shell?.bgImage) return { effect: chosen, target: null, images };
  return targets.imageId ? { effect: chosen, target: targets.imageId, images } : { effect: "", target: null, images };
}

/** Section ids to replay, `"all"`, or nothing. A new section (added, duplicated) is not replayed: it shows at once. */
export function replayTargets(prev: MotionSnapshot | null, next: MotionSnapshot): string[] | "all" {
  if (!prev || !next.on) return [];
  if (!prev.on || prev.site !== next.site) return "all";
  return Object.keys(next.sections).filter((id) => id in prev.sections && prev.sections[id] !== next.sections[id]);
}

/**
 * The Scroll effect demos to play: a section whose Scroll effect changed, and
 * an image whose own Scroll effect changed (switching to None plays nothing).
 * When the whole site replays (`replayTargets` → "all"), every effect plays.
 * New sections and new images are not replayed.
 */
export function scrollReplays(prev: MotionSnapshot | null, next: MotionSnapshot): ScrollReplay[] {
  if (!prev || !next.on) return [];
  const all = !prev.on || prev.site !== next.site;
  const out: ScrollReplay[] = [];
  for (const [sectionId, now] of Object.entries(next.scroll)) {
    const before = prev.scroll[sectionId];
    if (!before) continue;
    if (now.effect && (all || before.effect !== now.effect)) {
      out.push({ sectionId, effect: now.effect, targetId: now.target });
    }
    for (const [imageId, effect] of Object.entries(now.images)) {
      if (effect && imageId in before.images && (all || before.images[imageId] !== effect)) out.push({ sectionId, effect, targetId: imageId });
    }
  }
  return out;
}
