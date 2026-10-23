/**
 * Add › Sections in the store's template order (owner, 2026-10-23): in each
 * library category, the designs the store's template is built from come
 * first, in the order the template uses them, so "hero number 4" of a
 * template is the first hero the seller sees. Pure.
 */
import type { SiteConfig } from "../config/schema";
import { getDesign } from "../designs";
import type { SectionPreset } from "../library/types";
import { getTemplateDesign } from "./catalog";
import { sourceDesignId } from "./essentials";

/**
 * The library design keys a template uses (header, pages, footer), first use
 * first. A code template's section is its own copy of a library design
 * (`<template>-<library id>`, `libraryId`); a section an admin added from
 * the library in Admin carries the library key itself.
 */
export function templateLibraryKeys(config: SiteConfig, templateKey: string): string[] {
  const sections = [config.header, ...config.pages.flatMap((page) => page.content.sections), config.footer];
  const out = new Set<string>();
  for (const section of sections) {
    const id = section && sourceDesignId(section);
    if (!id) continue;
    const libraryId = getTemplateDesign(id)?.libraryId;
    const unprefixed = id.startsWith(`${templateKey}-`) ? id.slice(templateKey.length + 1) : null;
    out.add(libraryId ?? (unprefixed && getDesign(unprefixed) ? unprefixed : id));
  }
  return [...out];
}

/** The presets with the given design keys first (in that order), the rest as they were. */
export function preferTemplatePresets(presets: readonly SectionPreset[], keys: readonly string[]): SectionPreset[] {
  if (!keys.length) return [...presets];
  const rank = new Map(keys.map((key, index) => [key, index]));
  const rankOf = (preset: SectionPreset) => rank.get(preset.designKey ?? preset.designId ?? "") ?? keys.length;
  return presets
    .map((preset, index) => ({ preset, index, rank: rankOf(preset) }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map((entry) => entry.preset);
}
