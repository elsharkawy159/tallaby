import type { EditorCapabilities } from "../adapter.types";
import type { AddTab, MediaTab, Rail } from "../state/editor.store";

/** The capability a rail tab needs; tabs not listed are always shown. */
const RAIL_CAPABILITY: Partial<Record<Rail, keyof EditorCapabilities>> = {
  forms: "forms",
  pages: "pages",
  brand: "designSystem",
};

/** Whether the host supports a rail tab (EditorAdapter capabilities). */
export function railEnabled(rail: Rail, capabilities: EditorCapabilities): boolean {
  if (rail === "media") return mediaTabs(capabilities).length > 0;
  const key = RAIL_CAPABILITY[rail];
  return !key || capabilities[key] === true;
}

/** The Media panel's tabs: the store library and Explore (stock photos), each where the host has it. */
export function mediaTabs(capabilities: EditorCapabilities): readonly MediaTab[] {
  return [...(capabilities.mediaLibrary ? (["library"] as const) : []), ...(capabilities.explore ? (["explore"] as const) : [])];
}

/** The Add panel's tabs: Templates only where the host has templates (not when editing a template or a section). */
export function addTabs(capabilities: EditorCapabilities): readonly AddTab[] {
  return capabilities.templates ? ["elements", "sections", "templates"] : ["elements", "sections"];
}
