/**
 * Per-device style edits (P4B-05/09). Desktop writes the base style;
 * tablet and mobile write overrides in `breakpointStyles`. Part styles live
 * in `style.parts[part]` (decision in docs/website-builder.md), element
 * styles on the node. Every write goes through the package whitelist.
 */
import type { ComponentNode, SectionInstance } from "@workspace/store-sections";
import { findNode, normalizeStyle, updateNode, type StyleKey, type StyleValues } from "@workspace/store-sections/render";
import type { Device } from "../state/editor.store";

export type StyleTarget = { kind: "section" } | { kind: "part"; part: string } | { kind: "node"; nodeId: string };

type Bag = Record<string, unknown>;

const isBag = (value: unknown): value is Bag => typeof value === "object" && value !== null && !Array.isArray(value);

/** The raw style object a device writes for a section or part (without `parts` for the section itself). */
function sectionSlot(instance: SectionInstance, device: Device): Bag {
  if (device === "desktop") return isBag(instance.style) ? instance.style : {};
  const value = instance.breakpointStyles?.[device];
  return isBag(value) ? value : {};
}

function withSectionSlot(instance: SectionInstance, device: Device, slot: Bag): SectionInstance {
  if (device === "desktop") return { ...instance, style: slot };
  return { ...instance, breakpointStyles: { ...(instance.breakpointStyles ?? {}), [device]: slot } };
}

function nodeSlot(node: ComponentNode, device: Device): Bag {
  if (device === "desktop") return isBag(node.style) ? node.style : {};
  const value = node.breakpointStyles?.[device];
  return isBag(value) ? value : {};
}

/** What this device itself sets (no inheritance). */
export function readOwnStyle(instance: SectionInstance, target: StyleTarget, device: Device): StyleValues {
  if (target.kind === "node") {
    const node = findNode(instance.componentTree ?? [], target.nodeId);
    return node ? normalizeStyle(nodeSlot(node, device)) : {};
  }
  const slot = sectionSlot(instance, device);
  if (target.kind === "part") return normalizeStyle(isBag(slot.parts) ? slot.parts[target.part] : undefined);
  return normalizeStyle(slot);
}

/** What applies on this device: desktop, then tablet, then mobile overrides (`hidden` is never inherited). */
export function readEffectiveStyle(instance: SectionInstance, target: StyleTarget, device: Device): StyleValues {
  const order: Device[] = device === "desktop" ? ["desktop"] : device === "tablet" ? ["desktop", "tablet"] : ["desktop", "tablet", "mobile"];
  const merged: StyleValues = {};
  for (const d of order) Object.assign(merged, readOwnStyle(instance, target, d));
  const own = readOwnStyle(instance, target, device);
  if (own.hidden === undefined) delete merged.hidden;
  return merged;
}

function patchBag(base: Bag, patch: Partial<Record<StyleKey, unknown>>): Bag {
  const next: Bag = { ...base, ...patch };
  for (const [key, value] of Object.entries(patch)) if (value === undefined) delete next[key];
  // Keep `parts` (section slot) and normalize the rest.
  const { parts, ...rest } = next;
  const clean: Bag = { ...normalizeStyle(rest) };
  if (parts !== undefined) clean.parts = parts;
  return clean;
}

/** Sets (or, with `undefined`, removes) style keys for one device. */
export function setStyle(
  instance: SectionInstance,
  target: StyleTarget,
  device: Device,
  patch: Partial<Record<StyleKey, unknown>>,
): SectionInstance {
  if (target.kind === "node") {
    return {
      ...instance,
      componentTree: updateNode(instance.componentTree ?? [], target.nodeId, (node) => {
        const slot = patchBag(nodeSlot(node, device), patch);
        return device === "desktop"
          ? { ...node, style: slot }
          : { ...node, breakpointStyles: { ...(node.breakpointStyles ?? {}), [device]: slot } };
      }),
    };
  }
  const slot = sectionSlot(instance, device);
  if (target.kind === "section") return withSectionSlot(instance, device, patchBag(slot, patch));
  const parts = isBag(slot.parts) ? slot.parts : {};
  const current = isBag(parts[target.part]) ? (parts[target.part] as Bag) : {};
  const nextPart = patchBag(current, patch);
  const nextParts = { ...parts, [target.part]: nextPart };
  if (Object.keys(nextPart).length === 0) delete nextParts[target.part];
  return withSectionSlot(instance, device, { ...slot, parts: nextParts });
}

/** Removes this device's overrides (all keys, or only `keys`). */
export function clearStyle(instance: SectionInstance, target: StyleTarget, device: Device, keys?: StyleKey[]): SectionInstance {
  const own = readOwnStyle(instance, target, device);
  const remove = keys ?? (Object.keys(own) as StyleKey[]);
  return setStyle(instance, target, device, Object.fromEntries(remove.map((key) => [key, undefined])));
}

export function hasOwnStyle(instance: SectionInstance, target: StyleTarget, device: Device): boolean {
  return Object.keys(readOwnStyle(instance, target, device)).length > 0;
}

/** Copy/paste style: the target's own styles on every device. */
export type StyleClip = Partial<Record<Device, StyleValues>>;

export function copyStyle(instance: SectionInstance, target: StyleTarget): StyleClip {
  return { desktop: readOwnStyle(instance, target, "desktop"), tablet: readOwnStyle(instance, target, "tablet"), mobile: readOwnStyle(instance, target, "mobile") };
}

export function pasteStyle(instance: SectionInstance, target: StyleTarget, clip: StyleClip): SectionInstance {
  let next = instance;
  for (const device of ["desktop", "tablet", "mobile"] as const) {
    next = clearStyle(next, target, device);
    const style = clip[device];
    if (style && Object.keys(style).length) next = setStyle(next, target, device, style);
  }
  return next;
}

/** Which style controls fit the selection (popover and Style tab). */
export type StyleKind = "section" | "text" | "button" | "image" | "container" | "icon" | "generic";

const TEXT_NODES = new Set(["heading", "paragraph", "text", "blockQuote", "badge", "listItem", "textLink", "list"]);
const CONTAINER_NODES = new Set(["container", "vFlex", "hFlex", "grid", "div", "linkBlock"]);

export function styleKindOf(target: StyleTarget, info: { nodeType?: string; fieldType?: string; partKey?: string }): StyleKind {
  if (target.kind === "section") return "section";
  if (target.kind === "node") {
    const type = info.nodeType ?? "";
    if (CONTAINER_NODES.has(type)) return "container";
    if (type === "image") return "image";
    if (type === "button") return "button";
    if (type === "icon") return "icon";
    return TEXT_NODES.has(type) ? "text" : "generic";
  }
  if (info.fieldType === "image") return "image";
  if (info.partKey === "ctaLabel") return "button";
  return "text";
}
