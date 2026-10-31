import type { ComponentNode, SectionInstance } from "@workspace/store-sections";

/**
 * Website › Design "Store banner" (owner, 2026-10-31): the photos of the
 * home page's hero, edited as a list. Shown only when the draft home page has
 * a hero with photos. A carousel hero gives one banner per slide (add and
 * remove clone or drop slides); any other hero gives its fixed photos
 * (`role: "image"`). Writes go to the home page DRAFT, so they go live on
 * Publish like the rest of the design. No React, no design catalog here: the
 * caller says which design ids are not heroes.
 */

export type HeroBanners = {
  /** The hero section's instance id on the home page. */
  sectionId: string;
  /** `carousel`: one banner per slide, the list can grow and shrink. `fixed`: the hero's own photos. */
  kind: "carousel" | "fixed";
  /** Image node ids, in order (the slide's photo for a carousel). */
  imageIds: string[];
  srcs: string[];
};

/** Most slides a carousel hero takes from this list. */
export const MAX_HERO_BANNERS = 8;

/** Only the first sections can be the hero (an announcement bar may come first). */
const HERO_SEARCH_DEPTH = 2;

const walk = (nodes: readonly ComponentNode[], visit: (node: ComponentNode) => void) => {
  for (const node of nodes) {
    visit(node);
    walk(node.children ?? [], visit);
  }
};

const find = (nodes: readonly ComponentNode[], test: (node: ComponentNode) => boolean): ComponentNode | undefined => {
  let found: ComponentNode | undefined;
  walk(nodes, (node) => {
    if (!found && test(node)) found = node;
  });
  return found;
};

const isImage = (node: ComponentNode) => node.type === "image";
const srcOf = (node: ComponentNode) => (typeof node.props.src === "string" ? node.props.src : "");

/** The slide's main photo: its `role: "image"` photo, else its first photo. */
const slidePhoto = (slide: ComponentNode) => find([slide], (n) => isImage(n) && n.props.role === "image") ?? find([slide], isImage);

/** The design id a section started from (`hero-carousel@1` → `hero-carousel`). */
const designIdOf = (section: SectionInstance) => section.source?.split("@")[0];

/**
 * The home page's hero photos, or null when it has none (a video hero, a
 * text-only hero, or no hero). `isNotHero(designId)` is true for designs of
 * another category; such sections are skipped.
 */
export function findHeroBanners(sections: readonly SectionInstance[], isNotHero: (designId: string) => boolean): HeroBanners | null {
  for (const section of sections.slice(0, HERO_SEARCH_DEPTH)) {
    const tree = section.componentTree;
    const designId = designIdOf(section);
    if (!tree?.length || (designId && isNotHero(designId))) continue;

    const carousel = find(tree, (n) => n.type === "carousel");
    if (carousel) {
      const photos = carousel.children.map(slidePhoto).filter((n): n is ComponentNode => Boolean(n));
      if (photos.length) return { sectionId: section.id, kind: "carousel", imageIds: photos.map((n) => n.id), srcs: photos.map(srcOf) };
    }

    const photos: ComponentNode[] = [];
    walk(tree, (n) => {
      if (isImage(n) && n.props.role === "image") photos.push(n);
    });
    if (photos.length) return { sectionId: section.id, kind: "fixed", imageIds: photos.map((n) => n.id), srcs: photos.map(srcOf) };
  }
  return null;
}

const setSrc = (node: ComponentNode, ids: ReadonlyMap<string, string>): ComponentNode => {
  const src = ids.get(node.id);
  return {
    ...node,
    props: src === undefined ? node.props : { ...node.props, src },
    children: (node.children ?? []).map((child) => setSrc(child, ids)),
  };
};

/** A copy of `node` with fresh ids (`<id>-b<n>`, cut to the 64-character id limit). */
const cloneWithIds = (node: ComponentNode, suffix: string, imageId: string, src: string): ComponentNode => {
  const id = `${node.id.slice(0, 60 - suffix.length)}-${suffix}`;
  return {
    ...node,
    id,
    props: node.id === imageId ? { ...node.props, src } : node.props,
    children: (node.children ?? []).map((child) => cloneWithIds(child, suffix, imageId, src)),
  };
};

/** Every node id in the sections, so new slide ids never collide. */
const allIds = (sections: readonly SectionInstance[]) => {
  const ids = new Set<string>();
  for (const section of sections) walk(section.componentTree ?? [], (n) => ids.add(n.id));
  return ids;
};

/**
 * The home sections with the hero showing `srcs`. A fixed hero keeps its
 * photo count (`srcs` fills it in order). A carousel keeps one slide per
 * banner: existing photo slides are reused in order, extra ones are dropped,
 * and new banners clone the last photo slide (its text and style too).
 * Slides without a photo stay where they are.
 */
export function applyHeroBanners(sections: readonly SectionInstance[], hero: HeroBanners, srcs: readonly string[]): SectionInstance[] {
  return sections.map((section) => {
    if (section.id !== hero.sectionId || !section.componentTree) return section;
    if (hero.kind === "fixed") {
      const ids = new Map(hero.imageIds.map((id, i) => [id, srcs[i] ?? ""] as const));
      return { ...section, componentTree: section.componentTree.map((node) => setSrc(node, ids)) };
    }
    const taken = allIds(sections);
    const rebuild = (node: ComponentNode): ComponentNode => {
      if (node.type !== "carousel") return { ...node, children: (node.children ?? []).map(rebuild) };
      const wanted = srcs.slice(0, MAX_HERO_BANNERS);
      const children: ComponentNode[] = [];
      let used = 0;
      let last: { slide: ComponentNode; imageId: string } | undefined;
      for (const slide of node.children) {
        const photo = slidePhoto(slide);
        if (!photo) {
          children.push(slide);
          continue;
        }
        last = { slide, imageId: photo.id };
        if (used >= wanted.length) continue;
        children.push(setSrc(slide, new Map([[photo.id, wanted[used]!]])));
        used += 1;
      }
      for (let n = 1; used < wanted.length && last; n += 1) {
        const suffix = `b${n}`;
        if (taken.has(`${last.slide.id.slice(0, 60 - suffix.length)}-${suffix}`)) continue;
        children.push(cloneWithIds(last.slide, suffix, last.imageId, wanted[used]!));
        used += 1;
      }
      return { ...node, children };
    };
    return { ...section, componentTree: section.componentTree.map(rebuild) };
  });
}
