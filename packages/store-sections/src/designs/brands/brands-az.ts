/**
 * A–Z index (Modular set): a row of letter chips across the top, then brand
 * names in columns grouped under large letters with hairline rules. For stores
 * carrying dozens of brands. Letters without brands are faded.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { FLUSH, modHead } from "../_modular";

const GROUPS = [
  {
    letter: L("أ", "A"),
    names: [L("أوربت", "Orbit"), L("أطلس", "Atlas"), L("أمواج", "Amwaj")],
  },
  {
    letter: L("ب", "B"),
    names: [L("بيان", "Bayan"), L("بلو", "Blu"), L("برق", "Bark")],
  },
  { letter: L("ك", "K"), names: [L("كيان", "Kayan"), L("كوكب", "Kawkab")] },
  {
    letter: L("ن", "N"),
    names: [L("نورو", "Nuro"), L("نسيم", "Naseem"), L("نخلة", "Nakhla")],
  },
];

const LETTERS = [
  [L("أ", "A"), true],
  [L("ب", "B"), true],
  [L("ت", "C"), false],
  [L("ج", "D"), false],
  [L("ح", "E"), false],
  [L("د", "F"), false],
  [L("ر", "G"), false],
  [L("س", "H"), false],
  [L("ف", "J"), false],
  [L("ك", "K"), true],
  [L("ل", "L"), false],
  [L("م", "M"), false],
  [L("ن", "N"), true],
  [L("هـ", "S"), false],
  [L("و", "V"), false],
  [L("ي", "Z"), false],
] as const;

export const brandsAz = defineDesign({
  id: "brands-az",
  version: 1,
  category: "brands",
  subcategory: "logo-grid",
  name: L("فهرس أبجدي", "A–Z index"),
  description: L("كل الماركات مرتبة بالحروف، مع صف حروف للتنقل.", "Every brand sorted by letter, with a letter row on top."),
  keywords: ["brands", "a-z", "index", "directory", "ماركات", "فهرس", "حروف"],
  tree: (t) =>
    t.section({ label: L("الماركات", "Brands") }, [
      t.container(
        [
          modHead(t, { title: L("كل الماركات", "All brands") }),
          t.row(
            LETTERS.map(([letter, on]) =>
              t.text(letter, {
                style: {
                  fontWeight: "semibold",
                  textAlign: "center",
                  width: "40px",
                  paddingTop: 8,
                  paddingBottom: 8,
                  radius: 10,
                  ...(on ? { background: "secondary", color: "foreground" } : { color: "muted", opacity: 50 }),
                },
              }),
            ),
            {
              label: L("الحروف", "Letters"),
              style: { gap: 4, marginBottom: 32 },
              mobile: { marginBottom: 20 },
            },
          ),
          t.grid(
            GROUPS.map((g) =>
              t.stack(
                [
                  t.text(g.letter, {
                    style: {
                      fontSize: "4xl",
                      fontWeight: "bold",
                      color: "primary",
                    },
                  }),
                  t.divider({ style: { marginTop: 0, marginBottom: 4 } }),
                  ...g.names.map((name) =>
                    t.link("/products", [t.text(name, { style: { fontWeight: "medium" } })], {
                      label: L("ماركة", "Brand"),
                      style: {
                        ...FLUSH,
                        paddingTop: 6,
                        paddingBottom: 6,
                        hover: { color: "primary" },
                      },
                    }),
                  ),
                ],
                { label: L("حرف", "Letter group"), style: { gap: 4 } },
              ),
            ),
            {
              label: L("الماركات", "Brands"),
              role: "items",
              columns: { desktop: 4, mobile: 2 },
              style: { gap: 32 },
              mobile: { gap: 24 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
