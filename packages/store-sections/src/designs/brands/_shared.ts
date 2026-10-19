/**
 * Placeholder brand wordmarks for the brand designs. Each is a text node the
 * seller renames, or deletes and replaces with a logo image.
 */
import type { NodeTemplate } from "../../elements/tree";
import type { TreeBuilder } from "../builder";
import { L } from "../_kit";

export const BRANDS = [
  L("فولتا", "VOLTA"),
  L("نورو", "nuro"),
  L("كيان", "KAYAN"),
  L("ساحل", "Sahel"),
  L("أوربت", "orbit"),
  L("ميزان", "MIZAN"),
  L("لومو", "Lumo"),
  L("زها", "ZAHA"),
];

/** A muted wordmark that darkens on hover. */
export function wordmark(t: TreeBuilder, i: number, size: "xl" | "2xl" | "4xl" = "2xl"): NodeTemplate {
  return t.text(BRANDS[i % BRANDS.length]!, {
    role: "logo",
    style: {
      fontSize: size,
      fontWeight: i % 2 ? "extrabold" : "bold",
      letterSpacing: i % 3 === 0 ? "wider" : "tight",
      textAlign: "center",
      color: "muted",
      ...(i % 4 === 1 && { italic: true }),
      hover: { color: "foreground" },
    },
  });
}
