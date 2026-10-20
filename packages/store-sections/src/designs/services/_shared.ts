/**
 * Shared pieces of the Services designs (library W). Service names, prices,
 * areas and times are text the seller types; requests go to the store's
 * WhatsApp, its contact page or one of its forms. No booking engine exists,
 * so nothing here pretends to reserve a slot.
 */
import type { StyleValues } from "../../elements/style";
import type { NodeTemplate } from "../../elements/tree";
import type { DesignText, TreeBuilder } from "../builder";
import { L } from "../_kit";

export const WHATSAPP_LINK = "https://wa.me/201001234567";
export const PHONE_LINK = "tel:+201001234567";
export const CONTACT_LINK = "/contact";

/** A small round number (steps, reasons). */
export function numberDisc(
  t: TreeBuilder,
  n: number,
  style: StyleValues = {},
): NodeTemplate {
  return t.box(
    [
      t.text(L(String.fromCharCode(0x0660 + n), String(n)), {
        style: {
          fontWeight: "bold",
          textAlign: "center",
          color: style.color ?? "primaryInk",
        },
      }),
    ],
    {
      label: L("الرقم", "Number"),
      style: {
        background: "primary",
        radius: 999,
        width: "40px",
        paddingTop: 8,
        paddingBottom: 8,
        ...style,
      },
    },
  );
}

/** A tick and a line of text. */
export function tickLine(
  t: TreeBuilder,
  text: DesignText,
  o: { tick?: string; ink?: string } = {},
): NodeTemplate {
  return t.row(
    [
      t.icon("check", {
        style: { fontSize: "md", color: o.tick ?? "primary" },
      }),
      t.text(text, {
        style: { fontSize: "sm", ...(o.ink && { color: o.ink }) },
      }),
    ],
    {
      label: L("سطر", "Line"),
      style: { gap: 10, wrap: false, alignItems: "start" },
    },
  );
}
