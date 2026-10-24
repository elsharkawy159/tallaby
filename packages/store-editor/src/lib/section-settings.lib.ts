/**
 * Section options in the sidebar (owner, 2026-10-23): with a whole tree
 * section selected, Content lists the elements inside it that have settings
 * (a carousel's autoplay and photos, a video's playback, a product list's
 * source…), so the seller doesn't have to find and click them on the page.
 * Pure; the sidebar renders each entry with the element's own fields.
 */
import type { ComponentNode } from "@workspace/store-sections";
import { cloneWithNewIds, createNode, isDataList, type ElementType } from "@workspace/store-sections/render";

/** Elements whose fields are settings rather than text typed on the page. */
export const SETTINGS_TYPES: readonly ElementType[] = ["carousel", "video", "videoPlaylist", "productList", "categoryList", "postList", "storeForm"];

/** The elements with settings, in reading order. A data list's card template is not searched (its nodes repeat per record). */
export function settingsNodes(nodes: readonly ComponentNode[]): ComponentNode[] {
  const found: ComponentNode[] = [];
  const walk = (list: readonly ComponentNode[]) => {
    for (const node of list) {
      if (SETTINGS_TYPES.includes(node.type as ElementType)) found.push(node);
      if (!isDataList(node.type)) walk(node.children);
    }
  };
  walk(nodes);
  return found;
}

/** Whether the tree holds a carousel (its section is full width until the seller picks a width). */
export function hasCarousel(nodes: readonly ComponentNode[]): boolean {
  return nodes.some((node) => node.type === "carousel" || hasCarousel(node.children));
}

/** The images of a slide (usually one), in reading order. */
export function slideImages(slide: ComponentNode): ComponentNode[] {
  const found: ComponentNode[] = [];
  const walk = (list: readonly ComponentNode[]) => {
    for (const node of list) {
      if (node.type === "image") found.push(node);
      walk(node.children);
    }
  };
  walk(slide.children);
  return found;
}

/** The carousel with one more slide: a copy of the last one (same layout, new ids), or an empty slide. */
export function addSlide(carousel: ComponentNode, makeId: () => string): ComponentNode {
  const last = carousel.children.at(-1);
  const slide = last ? cloneWithNewIds(last, makeId) : createNode("slide", makeId);
  return { ...carousel, children: [...carousel.children, slide] };
}

/** The carousel without that slide. Same object when it is the last slide left or not a child. */
export function removeSlide(carousel: ComponentNode, slideId: string): ComponentNode {
  if (carousel.children.length <= 1 || !carousel.children.some((c) => c.id === slideId)) return carousel;
  return { ...carousel, children: carousel.children.filter((c) => c.id !== slideId) };
}
