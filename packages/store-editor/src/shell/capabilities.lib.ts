import type { EditorCapabilities } from "../adapter.types";
import type { AddTab, Rail } from "../state/editor.store";

/** The capability a rail tab needs; tabs not listed are always shown. */
const RAIL_CAPABILITY: Partial<Record<Rail, keyof EditorCapabilities>> = {
  media: "mediaLibrary",
  explore: "explore",
  forms: "forms",
  pages: "pages",
};

/** Whether the host supports a rail tab (EditorAdapter capabilities). */
export function railEnabled(rail: Rail, capabilities: EditorCapabilities): boolean {
  const key = RAIL_CAPABILITY[rail];
  return !key || capabilities[key] === true;
}

/** The Add panel's tabs: Templates only where the host has templates (not when editing a template or a section). */
export function addTabs(capabilities: EditorCapabilities): readonly AddTab[] {
  return capabilities.templates ? ["elements", "sections", "templates"] : ["elements", "sections"];
}
