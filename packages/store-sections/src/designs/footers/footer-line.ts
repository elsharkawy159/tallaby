/**
 * Single line (library Z-b): one quiet row on paper with the logo at the
 * start, a short link list in the middle and social icons at the end; a thin
 * second line carries the copyright. Mobile stacks the groups centred.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { logo, nav } from "../headers/_shared";
import { COPYRIGHT, HELP_LINKS, socialRow } from "./_shared";

export const footerLine = defineDesign({
  id: "footer-line",
  version: 1,
  category: "footers",
  subcategory: "minimal",
  name: L("فوتر بسطر واحد", "Single-line footer"),
  description: L("الشعار والروابط والتواصل الاجتماعي في سطر هادئ.", "Logo, links and social icons on one quiet line."),
  keywords: ["footer", "minimal", "simple", "فوتر", "بسيط"],
  tree: (t) =>
    t.section({ label: L("الفوتر", "Footer"), style: { paddingTop: 32, paddingBottom: 24, background: "background" } }, [
      t.container(
        [
          t.row([logo(t, { size: "lg" }), nav(t, HELP_LINKS, { style: { gap: 20, justifyContent: "center" } }), socialRow(t, "foreground", 36)], {
            label: L("السطر", "Row"),
            style: { justifyContent: "between", gap: 20 },
            mobile: { direction: "column", alignItems: "center" },
          }),
          t.divider({ style: { marginTop: 24, marginBottom: 16 } }),
          t.text(COPYRIGHT, { style: { color: "muted", textAlign: "center" } }),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
