/**
 * Shared pieces of the Product finder designs (library E). The finder in the
 * Claude Design pack is interactive (pressed buttons, sliders, quiz steps);
 * the trees here are still versions: every choice is a link the seller points
 * at a category or collection, and every product comes from a product list.
 */
import type { StyleValues } from "../../elements/style";
import type { NodeTemplate } from "../../elements/tree";
import type { DesignText, TreeBuilder } from "../builder";
import { L } from "../_kit";

/** Where a choice goes until the seller points it at a category or collection. */
export const FINDER_LINK = "/products";
export const CHEAPEST_FIRST = "/products?sort=price-low";
export const DEAREST_FIRST = "/products?sort=price-high";

/** A large centred title (the quiz, head-to-head and this-or-that designs). */
export function centredTitle(
  t: TreeBuilder,
  text: DesignText,
  style: StyleValues = {},
): NodeTemplate {
  return t.heading(text, "h2", {
    role: "title",
    style: {
      fontSize: "display-md",
      letterSpacing: "tight",
      textAlign: "center",
      ...style,
    },
  });
}

/** The round ink disc between two choices ("vs", "or"). */
export function versusDisc(t: TreeBuilder, text: DesignText): NodeTemplate {
  return t.box(
    [
      t.text(text, {
        style: {
          fontWeight: "bold",
          fontSize: "lg",
          color: "background",
          textAlign: "center",
        },
        mobile: { fontSize: "sm" },
      }),
    ],
    {
      label: L("الفاصل", "Divider disc"),
      style: {
        background: "foreground",
        radius: 999,
        width: "64px",
        paddingTop: 18,
        paddingBottom: 18,
        paddingStart: 0,
        paddingEnd: 0,
      },
      mobile: { width: "44px", paddingTop: 12, paddingBottom: 12 },
    },
  );
}
