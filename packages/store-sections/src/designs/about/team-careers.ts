/**
 * Join the team (library Y-h): a large title and a line about the team on the
 * start side; on the end side a ruled list of open roles (team, place, type
 * and an arrow), closed by an email line. Roles open an email to the store
 * until the seller links each to its own page. Columns stack on mobile.
 */
import { aboutDesign } from "./_rules";
import { L } from "../_kit";
import { FLUSH } from "../_modular";

const EMAIL = "mailto:jobs@store.com";

const ROLES = [
  { title: L("مندوب توصيل", "Delivery rider"), meta: L("التوصيل · الجيزة", "Delivery · Giza"), type: L("دوام كامل", "Full time") },
  { title: L("خدمة عملاء", "Customer care agent"), meta: L("العملاء · من البيت", "Care · Remote"), type: L("دوام جزئي", "Part time") },
  { title: L("مصور منتجات", "Product photographer"), meta: L("التسويق · الدقي", "Marketing · Dokki"), type: L("فريلانس", "Freelance") },
];

export const teamCareers = aboutDesign({
  id: "team-careers",
  version: 2,
  category: "about",
  subcategory: "careers",
  name: L("اشتغل معانا", "Join the team"),
  description: L("الوظائف المتاحة في قائمة، وإيميل للتقديم.", "Open roles in a list, with an email to apply."),
  keywords: ["about", "careers", "jobs", "hiring", "من نحن", "وظائف", "اشتغل معانا"],
  tree: (t) =>
    t.section({ label: L("الوظائف", "Careers") }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  t.heading(L("اشتغل معانا", "Work with us"), "h2", {
                    role: "title",
                    style: { fontSize: "display-lg", letterSpacing: "tight", lineHeight: "tight" },
                  }),
                  t.paragraph(L("فريق صغير بيحب اللي بيعمله. لو شايف نفسك هنا، ابعتلنا.", "A small team that loves what it does. If you see yourself here, write to us."), {
                    role: "subtitle",
                    style: { fontSize: "lg", maxWidth: "32ch" },
                  }),
                ],
                { label: L("العنوان", "Heading"), role: "intro", style: { gap: 16, colSpan: 2 }, tablet: { colSpan: 1 } },
              ),
              t.stack(
                [
                  t.stack(
                    ROLES.map((r) =>
                      t.link(
                        EMAIL,
                        [
                          t.row(
                            [
                              t.stack(
                                [
                                  t.text(r.title, { role: "title", style: { fontFamily: "heading", fontSize: "xl", fontWeight: "semibold" }, mobile: { fontSize: "lg" } }),
                                  t.text(r.meta, { style: { color: "muted", fontSize: "sm" } }),
                                ],
                                { label: L("الوظيفة", "Role"), style: { gap: 2, width: "60%" }, mobile: { width: "62%" } },
                              ),
                              t.badge(r.type, { style: { background: "secondary", color: "foreground", fontWeight: "semibold" } }),
                              t.icon("arrow", { style: { fontSize: "lg", color: "foreground" } }),
                            ],
                            {
                              label: L("المحتوى", "Content"),
                              style: { gap: 20, alignItems: "center", justifyContent: "between", wrap: false },
                              mobile: { gap: 8 },
                            },
                          ),
                        ],
                        {
                          label: L("وظيفة", "Role"),
                          style: { ...FLUSH, background: "background", color: "foreground", paddingTop: 22, paddingBottom: 22, hover: { color: "primary" } },
                          mobile: { paddingTop: 14, paddingBottom: 14 },
                        },
                      ),
                    ),
                    { label: L("الوظائف", "Roles"), role: "items", style: { gap: 1, background: "border", paddingTop: 1, paddingBottom: 1 } },
                  ),
                  t.row(
                    [
                      t.icon("mail", { style: { fontSize: "md", color: "muted" } }),
                      t.text(L("مش لاقي دورك؟", "Don't see your role?"), { style: { color: "muted" } }),
                      t.textLink(L("ابعتلنا على jobs@store.com", "Write to jobs@store.com"), EMAIL, { style: { fontWeight: "semibold", underline: true, color: "foreground" } }),
                    ],
                    { label: L("الإيميل", "Email"), style: { gap: 8 } },
                  ),
                ],
                { label: L("القائمة", "List"), style: { gap: 20, colSpan: 3 }, tablet: { colSpan: 1 } },
              ),
            ],
            {
              label: L("التخطيط", "Layout"),
              columns: { desktop: 5, tablet: 1, mobile: 1 },
              style: { gap: 64, alignItems: "start" },
              tablet: { gap: 32 },
              mobile: { gap: 24 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
