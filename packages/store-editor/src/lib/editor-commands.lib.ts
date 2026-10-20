/**
 * Editor commands (P4B-07/08/11): insert, duplicate, delete, move, select
 * parent, clipboard and style copy. One implementation shared by the canvas
 * toolbar, context menu, Layers panel and keyboard shortcuts. Each command
 * is one undo step. The clipboard is in memory per tab, and paste always
 * assigns new ids.
 */
import { MAX_SECTIONS_PER_PAGE, type ComponentNode, type PageContent, type SectionInstance } from "@workspace/store-sections";
import {
  canContain,
  cloneWithNewIds,
  createNode,
  duplicateNode,
  findNode,
  findParent,
  fromTemplate,
  getElementDefinition,
  insertNode,
  newTreeSection,
  moveNode,
  removeNode,
  storeSectionRegistry,
  updateNode,
  type AnySectionDefinition,
  type ElementType,
  type LayoutPreset,
  type SectionPreset,
} from "@workspace/store-sections/render";
import {
  acceptsCardPreset,
  applyCardPreset,
  applyPresetDesign,
  chromeFromPreset,
  formSectionInstance,
  payloadPreset,
  presetInstance,
} from "./editor-library.lib";
import { copyStyle, pasteStyle, readOwnStyle, setStyle, type StyleClip, type StyleTarget } from "./editor-style.lib";
import { getInstance, imageSpotOf, partField, refOf, setImageAt, setNodeProp, withTree, writePart } from "./editor-selection.lib";
import { createInstance, duplicateSection, insertSection, moveSection, newId, removeSection, updateSection } from "./editor.lib";
import type { EditorStore, SectionRef, Selection } from "../state/editor.store";
import { instantiateTemplatePage } from "./editor-templates.lib";
import { partAfterItemMove, placeItem, placePart, stepMovable } from "./editor-slots.lib";
import type { CanvasPayload, DropPlan, ImageCandidate } from "../dnd/dnd.types";
import { applyDropPlan, isImageTarget } from "../dnd/drop-plan.lib";

type Clip = { kind: "section"; instance: SectionInstance } | { kind: "nodes"; nodes: ComponentNode[] };

let clipboard: Clip | null = null;
let styleClipboard: StyleClip | null = null;

const makeNodeId = () => newId("n");

/** A section copy with new ids for the section and every element. */
function reId(instance: SectionInstance): SectionInstance {
  return {
    ...structuredClone(instance),
    id: newId(),
    ...(instance.componentTree && { componentTree: instance.componentTree.map((n) => cloneWithNewIds(n, makeNodeId)) }),
  };
}

export function styleTargetOf(selection: Selection): StyleTarget {
  if (selection?.nodeId) return { kind: "node", nodeId: selection.nodeId };
  if (selection?.part) return { kind: "part", part: selection.part };
  return { kind: "section" };
}

export function createEditorCommands(store: EditorStore) {
  const state = () => store.getState();
  const activePage = () => {
    const s = state();
    return s.pages.find((p) => p.id === s.activePageId) ?? s.pages[0]!;
  };
  const source = () => ({ content: activePage().content, header: state().header, footer: state().footer });
  const selected = () => {
    const sel = state().selection;
    return sel ? getInstance(source(), refOf(sel)) : null;
  };
  /** Index right after the selected page section (end of page otherwise). */
  const insertIndex = () => {
    const sel = state().selection;
    const sections = activePage().content.sections;
    if (sel?.target !== "page") return sections.length;
    const index = sections.findIndex((s) => s.id === sel.sectionId);
    return index < 0 ? sections.length : index + 1;
  };
  const canAddSection = () => activePage().content.sections.length < (state().maxSections ?? MAX_SECTIONS_PER_PAGE);

  function insertSectionInstance(instance: SectionInstance, index = insertIndex()) {
    if (!canAddSection()) return false;
    const page = activePage();
    state().editPage(page.id, (content) => insertSection(content, instance, index));
    state().select({ target: "page", sectionId: instance.id });
    return true;
  }

  /** Puts nodes in the selected container, after the selected element, or in a new custom section. */
  function placeNodes(nodes: ComponentNode[]): boolean {
    if (!nodes.length) return false;
    const sel = state().selection;
    const instance = selected();
    if (sel?.target === "page" && instance?.sectionId === "custom-section") {
      const tree = instance.componentTree ?? [];
      const target = sel.nodeId ? findNode(tree, sel.nodeId) : null;
      let parentId: string | null = null;
      let index: number | undefined;
      if (target && getElementDefinition(target.type)?.container && canContain(tree, target.id, nodes[0]!)) {
        parentId = target.id;
      } else if (target) {
        const place = findParent(tree, target.id);
        parentId = place?.parentId ?? null;
        index = (place?.index ?? tree.length - 1) + 1;
      }
      let next = tree;
      for (const [offset, node] of nodes.entries()) next = insertNode(next, parentId, node, index === undefined ? undefined : index + offset);
      if (!findNode(next, nodes[0]!.id)) return false;
      state().editSection(refOf(sel), (i) => ({ ...i, componentTree: next }));
      state().select({ target: "page", sectionId: instance.id, nodeId: nodes[0]!.id });
      return true;
    }
    // A one-section host (section editor) that is full: new elements go at the end of its section root.
    if (!canAddSection()) {
      const sections = activePage().content.sections;
      const only = sections.length === 1 && sections[0]!.sectionId === "custom-section" ? sections[0]! : null;
      const root = only?.componentTree?.length === 1 ? only.componentTree[0]! : null;
      if (!only || !root) return false;
      let next = only.componentTree!;
      for (const node of nodes) next = insertNode(next, root.id, node);
      if (!findNode(next, nodes[0]!.id)) return false;
      const ref = { target: "page" as const, sectionId: only.id };
      state().editSection(ref, (i) => ({ ...i, componentTree: next }));
      state().select({ ...ref, nodeId: nodes[0]!.id });
      return true;
    }
    const definition = storeSectionRegistry.get("custom-section")!;
    let loose: ComponentNode[] = [];
    for (const node of nodes) loose = insertNode(loose, null, node);
    // A new element section is a tree section: its elements sit inside a section root.
    const tree = loose.length ? newTreeSection(loose, makeNodeId) : [];
    if (!tree.length) return false;
    const section = { ...createInstance(definition), componentTree: tree };
    if (!insertSectionInstance(section)) return false;
    state().select({ target: "page", sectionId: section.id, nodeId: loose[0]!.id });
    return true;
  }

  /**
   * Puts a dropped image on an image part or Image element of `pageId` (or
   * the header/footer). `remove` = an Image element moved onto it, deleted in
   * the same undo step (page targets only).
   */
  function replaceImage(
    target: ImageCandidate,
    src: string,
    alt: string | undefined,
    pageId: string,
    remove?: { sectionInstanceId: string; nodeId: string },
  ): boolean {
    const s = state();
    const page = s.pages.find((p) => p.id === pageId);
    if (!page) return false;
    const source = { content: page.content, header: s.header, footer: s.footer };
    if (!isImageTarget(target, source)) return false;
    const editTarget = { locale: s.locale, defaultLocale: s.defaultLocale };
    const update = (instance: SectionInstance): SectionInstance => {
      if ("nodeId" in target) {
        return withTree(instance, (nodes) =>
          updateNode(nodes, target.nodeId, (node) => {
            // Only the image changes; alt text is filled in when the element has none.
            const withSrc = setNodeProp(node, "src", src, editTarget);
            return alt && !node.props.alt ? setNodeProp(withSrc, "alt", alt.slice(0, 160), editTarget) : withSrc;
          }),
        );
      }
      return writePart(instance, target.part, partField(storeSectionRegistry.get(instance.sectionId), target.part), src, editTarget);
    };
    const ref = target.ref;
    if (ref.target === "page") {
      s.editPage(pageId, (content) => {
        const replaced = updateSection(content, ref.sectionId, update);
        return remove ? updateSection(replaced, remove.sectionInstanceId, (i) => withTree(i, (nodes) => removeNode(nodes, remove.nodeId))) : replaced;
      });
    } else if (remove) {
      return false;
    } else {
      const current = s[ref.target];
      if (!current) return false;
      s.editChrome(ref.target, update(current));
    }
    if (pageId === state().activePageId) state().select("nodeId" in target ? { ...ref, nodeId: target.nodeId } : { ...ref, part: target.part });
    return true;
  }

  function editTree(ref: SectionRef, update: (nodes: ComponentNode[]) => ComponentNode[]) {
    state().editSection(ref, (instance) => withTree(instance, update));
  }

  function copy(): boolean {
    const sel = state().selection;
    const instance = selected();
    if (!sel || !instance) return false;
    if (sel.nodeId) {
      const node = findNode(instance.componentTree ?? [], sel.nodeId);
      if (!node) return false;
      clipboard = { kind: "nodes", nodes: [structuredClone(node)] };
      return true;
    }
    if (sel.target !== "page") return false;
    clipboard = { kind: "section", instance: structuredClone(instance) };
    return true;
  }

  function remove() {
    const sel = state().selection;
    if (!sel) return;
    if (sel.nodeId) {
      const instance = selected();
      const place = instance ? findParent(instance.componentTree ?? [], sel.nodeId) : null;
      editTree(refOf(sel), (nodes) => removeNode(nodes, sel.nodeId!));
      state().select(place?.parentId ? { ...sel, nodeId: place.parentId } : { ...refOf(sel) });
      return;
    }
    if (sel.part) {
      state().select(refOf(sel));
      return;
    }
    // Header and footer are removed from Layers only (they belong to every page).
    if (sel.target !== "page") return;
    state().editPage(activePage().id, (content) => removeSection(content, sel.sectionId));
    state().select(null);
  }

  return {
    addSection(definition: AnySectionDefinition) {
      return insertSectionInstance(createInstance(definition));
    },
    /** Forms tab: a form section (tree design) bound to one of the store's forms (P4-10). */
    addFormSection(formId: string, title: string) {
      const instance = formSectionInstance({ id: formId, name: title }, newId(), {
        defaultLocale: state().defaultLocale,
        industry: state().industry,
        makeId: makeNodeId,
      });
      return instance ? insertSectionInstance(instance) : false;
    },
    /** Quick "+" between sections. */
    addSectionAt(definition: AnySectionDefinition, index: number) {
      return insertSectionInstance(createInstance(definition), index);
    },
    addElement(type: ElementType) {
      return placeNodes([createNode(type, makeNodeId)]);
    },
    addPreset(preset: LayoutPreset) {
      return placeNodes(preset.nodes.map((template) => fromTemplate(template, makeNodeId)));
    },

    /**
     * Add › Sections (P4B-05): a library preset. Header/footer presets restyle
     * the shared chrome (keeping its content) and select it; a product-card
     * design restyles the selected product section, or adds a product grid
     * with that card; anything else is inserted after the selection. One
     * undo step. Returns what happened, or false when nothing changed.
     */
    addLibraryPreset(preset: SectionPreset): "inserted" | "restyled" | "chrome" | false {
      const definition = storeSectionRegistry.get(preset.sectionId);
      if (!definition) return false;
      if (definition.chrome) {
        const part = definition.chrome;
        const next = chromeFromPreset(state()[part], preset, part === "header" ? "hdr" : "ftr");
        if (!next) return false;
        state().editChrome(part, next);
        state().select({ target: part });
        return "chrome";
      }
      if (preset.kind === "card") {
        const sel = state().selection;
        const instance = selected();
        if (sel && instance && acceptsCardPreset(instance, preset)) {
          state().editSection(refOf(sel), (i) => applyCardPreset(i, preset));
          state().select(refOf(sel));
          return "restyled";
        }
      }
      const instance = presetInstance(preset, newId(), state().defaultLocale, state().industry);
      return instance && insertSectionInstance(instance) ? "inserted" : false;
    },

    /** Inspector layout picker: the selected section takes another preset's design; content and data stay. */
    applyPresetDesign(preset: SectionPreset) {
      const sel = state().selection;
      if (!sel) return;
      state().editSection(refOf(sel), (instance) => applyPresetDesign(instance, preset));
    },

    duplicate() {
      const sel = state().selection;
      if (!sel) return;
      if (sel.nodeId) {
        let created: string | null = null;
        state().editSection(refOf(sel), (instance) => {
          const result = duplicateNode(instance.componentTree ?? [], sel.nodeId!, makeNodeId);
          created = result.newId;
          return { ...instance, componentTree: result.nodes };
        });
        if (created) state().select({ ...sel, nodeId: created });
        return;
      }
      if (sel.target !== "page" || !canAddSection()) return;
      const page = activePage();
      const original = page.content.sections.find((s) => s.id === sel.sectionId);
      if (!original) return;
      const copy = reId(original);
      const index = page.content.sections.indexOf(original) + 1;
      state().editPage(page.id, (content) => insertSection(content, copy, index));
      state().select({ target: "page", sectionId: copy.id });
    },

    remove,

    /** Moves the selected section or element one place up (-1) or down (+1). */
    move(direction: -1 | 1) {
      const sel = state().selection;
      if (!sel) return;
      if (sel.nodeId) {
        const tree = selected()?.componentTree ?? [];
        const place = findParent(tree, sel.nodeId);
        if (!place) return;
        editTree(refOf(sel), (nodes) => moveNode(nodes, sel.nodeId!, place.parentId, place.index + direction));
        return;
      }
      if (sel.part) {
        // A part moves among its slots, an item field moves its whole item (P4B-16).
        const instance = selected();
        if (!instance) return;
        const step = stepMovable(instance, sel.part, direction);
        if (step.instance === instance) return;
        state().editSection(refOf(sel), () => step.instance);
        state().select({ ...sel, part: step.part });
        return;
      }
      if (sel.target !== "page") return;
      const sections = activePage().content.sections;
      const from = sections.findIndex((s) => s.id === sel.sectionId);
      if (from < 0) return;
      state().editPage(activePage().id, (content) => moveSection(content, from, from + direction));
    },

    moveSectionTo(sectionId: string, to: number) {
      const sections = activePage().content.sections;
      const from = sections.findIndex((s) => s.id === sectionId);
      if (from >= 0) state().editPage(activePage().id, (content) => moveSection(content, from, to));
    },

    moveNodeTo(ref: SectionRef, nodeId: string, parentId: string | null, index: number) {
      editTree(ref, (nodes) => moveNode(nodes, nodeId, parentId, index));
    },

    removeSectionById(sectionId: string) {
      state().editPage(activePage().id, (content) => removeSection(content, sectionId));
      const sel = state().selection;
      if (sel?.target === "page" && sel.sectionId === sectionId) state().select(null);
    },

    duplicateSectionById(sectionId: string) {
      if (!canAddSection()) return;
      state().editPage(activePage().id, (content) => duplicateSection(content, sectionId).content);
    },

    selectParent() {
      const sel = state().selection;
      if (!sel) return;
      if (sel.nodeId) {
        const place = findParent(selected()?.componentTree ?? [], sel.nodeId);
        state().select(place?.parentId ? { ...sel, nodeId: place.parentId } : refOf(sel));
      } else if (sel.part) {
        state().select(refOf(sel));
      }
    },

    /** Next/previous sibling section or element. */
    selectSibling(direction: -1 | 1) {
      const sel = state().selection;
      if (!sel) return;
      if (sel.nodeId) {
        const tree = selected()?.componentTree ?? [];
        const place = findParent(tree, sel.nodeId);
        if (!place) return;
        const siblings = place.parentId ? (findNode(tree, place.parentId)?.children ?? []) : tree;
        const next = siblings[place.index + direction];
        if (next) state().select({ ...sel, nodeId: next.id });
        return;
      }
      if (sel.target !== "page") return;
      const sections = activePage().content.sections;
      const next = sections[sections.findIndex((s) => s.id === sel.sectionId) + direction];
      if (next) state().select({ target: "page", sectionId: next.id });
    },

    selectFirstChild() {
      const sel = state().selection;
      const instance = selected();
      if (!sel || !instance) return;
      const tree = instance.componentTree ?? [];
      const children = sel.nodeId ? (findNode(tree, sel.nodeId)?.children ?? []) : tree;
      if (children[0]) state().select({ ...refOf(sel), nodeId: children[0].id });
    },

    copy,

    cut() {
      if (copy()) remove();
    },

    paste() {
      if (!clipboard) return false;
      if (clipboard.kind === "section") return insertSectionInstance(reId(clipboard.instance));
      return placeNodes(clipboard.nodes.map((node) => cloneWithNewIds(node, makeNodeId)));
    },

    hasClipboard: () => clipboard !== null,

    copyStyle() {
      const sel = state().selection;
      const instance = selected();
      if (!sel || !instance) return;
      styleClipboard = copyStyle(instance, styleTargetOf(sel));
    },

    pasteStyle() {
      const sel = state().selection;
      if (!sel || !styleClipboard) return;
      const clip = styleClipboard;
      state().editSection(refOf(sel), (instance) => pasteStyle(instance, styleTargetOf(sel), clip));
    },

    hasStyleClipboard: () => styleClipboard !== null,

    /** Writes text edited in place on the canvas (one undo step, current locale). */
    commitText(sel: NonNullable<Selection>, text: string) {
      const target = { locale: state().locale, defaultLocale: state().defaultLocale };
      const instance = getInstance(source(), refOf(sel));
      if (!instance) return;
      if (sel.nodeId) {
        const node = findNode(instance.componentTree ?? [], sel.nodeId);
        const definition = node && getElementDefinition(node.type);
        if (!node || !definition?.textProp) return;
        const field = definition.fields.find((f) => f.key === definition.textProp);
        const value = text.slice(0, field?.maxLength ?? 2000);
        state().editSection(refOf(sel), (i) =>
          withTree(i, (nodes) => updateNode(nodes, node.id, (n) => setNodeProp(n, definition.textProp!, value, { ...target, translatable: true }))),
        );
        return;
      }
      if (sel.part) {
        const field = partField(storeSectionRegistry.get(instance.sectionId), sel.part);
        if (!field || (field.type !== "text" && field.type !== "textarea")) return;
        state().editSection(refOf(sel), (i) => writePart(i, sel.part!, field, text.slice(0, field.maxLength ?? 5000), target));
      }
    },

    /**
     * Uses a picked image: replaces the selected image (part or element), or
     * the first image of a selected section; otherwise inserts an Image
     * element after the selection.
     */
    applyImage(src: string) {
      const sel = state().selection;
      const spot = imageSpotOf(selected(), sel);
      if (sel && spot) {
        const target = { locale: state().locale, defaultLocale: state().defaultLocale };
        state().editSection(refOf(sel), (i) => setImageAt(i, spot, src, target));
        return;
      }
      state().setImagePreview(null);
      const image = createNode("image", makeNodeId);
      placeNodes([{ ...image, props: { ...image.props, src } }]);
    },

    /** Shows a hovered picture on the image `applyImage` would replace (null clears); nothing when there is none. */
    previewImage(src: string | null) {
      state().setImagePreview(src && imageSpotOf(selected(), state().selection) ? src : null);
    },

    /**
     * Carries out a canvas drop (P4B-12) as one undo step. The plan is
     * re-checked against the page as it is now; false (and no change) when
     * it no longer fits. `pageId` pins the page (a photo drop finishes after
     * its import, possibly after the seller switched pages).
     */
    applyDrop(payload: CanvasPayload, plan: DropPlan, options: { src?: string; pageId?: string } = {}): boolean {
      const pageId = options.pageId ?? state().activePageId;
      if (plan.kind === "move-part" || plan.kind === "move-item") {
        // Parts and items move inside one section of the active page (or the header/footer).
        if (pageId !== state().activePageId) return false;
        const instance = getInstance(source(), plan.ref);
        if (!instance) return false;
        const next =
          plan.kind === "move-part" ? placePart(instance, plan.part, plan.slot, plan.index) : placeItem(instance, plan.collection, plan.from, plan.to);
        if (next === instance) return false;
        state().editSection(plan.ref, () => next);
        if (plan.kind === "move-part") state().select({ ...plan.ref, part: plan.part });
        else {
          const sel = state().selection;
          // The selected field follows its item to the new place.
          state().select(sel?.part ? { ...plan.ref, part: partAfterItemMove(sel.part, plan.collection, plan.from, plan.to) } : { ...plan.ref });
        }
        return true;
      }
      if (plan.kind === "replace-image") {
        if (plan.from) {
          // An Image element moved onto another image: its picture replaces that one, and it leaves its old place.
          const page = state().pages.find((p) => p.id === pageId);
          const section = page?.content.sections.find((s) => s.id === plan.from!.sectionInstanceId);
          const moved = section ? findNode(section.componentTree ?? [], plan.from.nodeId) : null;
          const movedSrc = typeof moved?.props.src === "string" ? moved.props.src : "";
          if (!moved || moved.type !== "image" || !movedSrc) return false;
          return replaceImage(plan.target, movedSrc, typeof moved.props.alt === "string" ? moved.props.alt : undefined, pageId, plan.from);
        }
        if (payload.kind === "media") return replaceImage(plan.target, payload.src, payload.alt, pageId);
        return payload.kind === "photo" && !!options.src && replaceImage(plan.target, options.src, payload.photo.alt, pageId);
      }
      if (payload.kind === "photo" && !options.src) return false;
      const page = state().pages.find((p) => p.id === pageId);
      if (!page) return false;
      const result = applyDropPlan(page.content, plan, payload, {
        makeNodeId,
        maxSections: state().maxSections,
        makeSection: (sectionId, presetId) => {
          const preset = payloadPreset(sectionId, presetId, state().presets);
          if (preset) return presetInstance(preset, newId(), state().defaultLocale, state().industry);
          const definition = storeSectionRegistry.get(sectionId);
          return definition ? createInstance(definition) : null;
        },
        src: options.src,
      });
      if (!result) return false;
      state().editPage(pageId, () => result.content);
      if (pageId === state().activePageId) state().select(result.select);
      return true;
    },

    /**
     * Puts a template page's design on one page (Add › Templates): its
     * sections, elements and page-level styles, copied with new ids. One
     * undo step; the design system, header, footer and other pages are
     * not touched, and neither is the template.
     */
    applyTemplatePage(pageId: string, content: PageContent): boolean {
      const page = state().pages.find((p) => p.id === pageId);
      if (!page) return false;
      const next = instantiateTemplatePage(content, () => newId(), makeNodeId);
      state().editPage(pageId, () => next);
      if (pageId === state().activePageId) state().select(null);
      return true;
    },

    /** Hides or shows the selection on the device being edited. */
    toggleHidden() {
      const sel = state().selection;
      const instance = selected();
      if (!sel || !instance) return;
      const device = state().device;
      const target = styleTargetOf(sel);
      const hidden = readOwnStyle(instance, target, device).hidden === true;
      state().editSection(refOf(sel), (i) => setStyle(i, target, device, { hidden: hidden ? undefined : true }));
    },
  };
}

export type EditorCommands = ReturnType<typeof createEditorCommands>;
