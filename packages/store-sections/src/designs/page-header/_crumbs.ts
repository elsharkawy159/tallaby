/** A breadcrumb row: Home › … › the current page. */
import type { NodeTemplate } from "../../elements/tree";
import type { DesignText, TreeBuilder } from "../builder";
import { L } from "../_kit";

export function crumbs(t: TreeBuilder, trail: { text: DesignText; href?: string }[], current: DesignText, onTint = false): NodeTemplate {
  const sep = () => t.text(L("‹", "›"), { style: { color: "muted" } });
  const step = (text: DesignText, href: string) =>
    t.link(href, [t.text(text, { style: { color: onTint ? "foreground" : "muted" } })], {
      label: L("رابط", "Link"),
      style: { paddingTop: 0, paddingBottom: 0, paddingStart: 0, paddingEnd: 0, hover: { opacity: 70 } },
    });
  return t.row(
    [
      step(L("الرئيسية", "Home"), "/"),
      ...trail.flatMap((s) => [sep(), step(s.text, s.href ?? "/products")]),
      sep(),
      t.text(current, { style: { fontWeight: "semibold" } }),
    ],
    { label: L("مسار الصفحة", "Breadcrumb"), role: "breadcrumb", style: { gap: 8 } },
  );
}
