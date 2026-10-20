/** Color tokens the design pages edit (shared by Website › Design and the editor's brand panel). Pure data. */
import type { DesignSystem } from "@workspace/store-sections";

export type ColorKey = keyof DesignSystem["colors"];

/** Every color token the page edits, with the Tallaby Classic value shown when unset. */
export const COLOR_FIELDS: readonly { key: ColorKey; classic: string }[] = [
  { key: "primary", classic: "#145163" },
  { key: "accent", classic: "#fdad28" },
  { key: "secondary", classic: "#f2f5f4" },
  { key: "background", classic: "#ffffff" },
  { key: "foreground", classic: "#10242b" },
  { key: "muted", classic: "#5c6d72" },
  { key: "border", classic: "#e2e8e7" },
];
