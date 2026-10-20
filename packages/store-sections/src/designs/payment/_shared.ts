/**
 * Pieces the Payment & delivery designs (library U) share. Methods, zones,
 * fees and times here are text the seller types once; nothing reads the
 * catalogue except the installments design, which shows one product.
 */
import type { NodeTemplate } from "../../elements/tree";
import type { DesignText, TreeBuilder } from "../builder";
import { L } from "../_kit";

export const SHIPPING_LINK = "/shipping";

/** The installment providers, as shoppers write them in each language. */
export const INSTALLMENT_PROVIDERS = [L("فاليو", "valU"), L("سيمبل", "Sympl"), L("سهولة", "souhoola")];

/** A small pill with a provider or method name. */
export function namePill(t: TreeBuilder, text: DesignText, tone: "shelf" | "outline" = "shelf"): NodeTemplate {
  return t.text(text, {
    style: {
      fontSize: "sm",
      fontWeight: "semibold",
      radius: tone === "shelf" ? 8 : 999,
      paddingTop: 6,
      paddingBottom: 6,
      paddingStart: 14,
      paddingEnd: 14,
      ...(tone === "shelf" ? { background: "secondary" } : { borderWidth: 1, borderColor: "border" }),
    },
  });
}

/** The section title used by most payment designs. */
export function payTitle(t: TreeBuilder, text: DesignText, center = false): NodeTemplate {
  return t.heading(text, "h2", {
    role: "title",
    style: { fontSize: "display-sm", letterSpacing: "tight", ...(center && { textAlign: "center" }) },
  });
}

export const EGP = (ar: string, en: string) => L(`${ar} ج.م`, `EGP ${en}`);
