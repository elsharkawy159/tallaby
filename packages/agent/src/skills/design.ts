import { z } from "zod";
import { db, eq, storeDesignSystems } from "@workspace/db";
import { saveStoreDesignSystem } from "@workspace/lib/store-sites/server";
import { STORE_FONTS } from "@workspace/store-sections/fonts";
import { derivePaletteFromPrimary, isValidHex, type DesignSystemColors } from "@workspace/store-sections/palette";
import { requireOwnedStore } from "../guards.server";
import { AgentError, type AgentContext, type AgentTool, type Skill } from "../types";

/**
 * Design skill, first tools (spec §14.4): read the theme, set colours from one
 * primary colour (the palette is derived in code, AA-checked), set fonts from
 * the fonts the storefront loads. Changes go to the DRAFT design system;
 * Publish stays the seller's (rule 12). Sections, templates and photos come
 * with the editor's Design agent (F-83 step 2). No styles or HTML from the
 * model (rules 9, 17): only a hex colour and font names from a fixed list.
 */

const FONT_NAMES = STORE_FONTS.map((font) => font.name) as [string, ...string[]];

const getInput = z.object({}).strict();
const colorsInput = z
  .object({ primary: z.string().trim().regex(/^#?[0-9a-fA-F]{6}$/, "hex colour like #1f6feb") })
  .strict();
const fontsInput = z
  .object({ headingFont: z.enum(FONT_NAMES), bodyFont: z.enum(FONT_NAMES) })
  .strict();

type ColorsInput = z.infer<typeof colorsInput>;
type FontsInput = z.infer<typeof fontsInput>;

type DesignRow = {
  colors: DesignSystemColors;
  typography: Record<string, unknown>;
  spacing: Record<string, unknown>;
  /** Theme motion settings (0162); null = defaults. Kept as is on every save. */
  motion: Record<string, unknown> | null;
  version: number;
};

async function loadDesign(ctx: AgentContext, forWrite: boolean): Promise<DesignRow> {
  await requireOwnedStore(ctx, { forWrite });
  const [row] = await db
    .select({
      colors: storeDesignSystems.colors,
      typography: storeDesignSystems.typography,
      spacing: storeDesignSystems.spacing,
      motion: storeDesignSystems.motion,
      version: storeDesignSystems.version,
    })
    .from(storeDesignSystems)
    .where(eq(storeDesignSystems.storeId, ctx.storeId))
    .limit(1);
  return {
    colors: (row?.colors ?? {}) as DesignSystemColors,
    typography: (row?.typography ?? {}) as Record<string, unknown>,
    spacing: (row?.spacing ?? {}) as Record<string, unknown>,
    motion: (row?.motion ?? null) as Record<string, unknown> | null,
    version: row?.version ?? 0,
  };
}

function palette(primary: string, base: DesignSystemColors) {
  const hex = primary.startsWith("#") ? primary : `#${primary}`;
  if (!isValidHex(hex)) throw new AgentError("invalid_input", "Not a colour.");
  return derivePaletteFromPrimary(hex, base);
}

/** Saves the whole design system with one part changed (saveStoreDesignSystem replaces every field). */
async function save(ctx: AgentContext, current: DesignRow, patch: Partial<Pick<DesignRow, "colors" | "typography">>) {
  const next = {
    colors: patch.colors ?? current.colors,
    typography: patch.typography ?? current.typography,
    spacing: current.spacing,
    ...(current.motion && { motion: current.motion }),
  };
  const result = await saveStoreDesignSystem(ctx.sellerId, ctx.storeId, next, current.version);
  if (!result.success) {
    if (result.error === "not_found") throw new AgentError("not_found");
    if (result.error === "store_read_only") throw new AgentError("store_read_only");
    throw new AgentError("tool_failed", `Design change refused: ${result.error}.`, { reason: result.error });
  }
  return result.data.version;
}

export function designSkill(): Skill {
  const getDesign: AgentTool<z.infer<typeof getInput>> = {
    name: "get_design_system",
    skill: "design",
    description: "The store's draft theme: colours, fonts, radius.",
    input: getInput,
    kind: "read",
    credits: 0,
    run: async (ctx) => {
      const d = await loadDesign(ctx, false);
      return { data: { colors: d.colors, typography: d.typography, borderRadius: d.spacing.borderRadius ?? null } };
    },
  };

  const setColors: AgentTool<ColorsInput> = {
    name: "set_brand_colors",
    skill: "design",
    description: "Set the store's main colour (hex). The other colours are made from it in code and checked for contrast.",
    input: colorsInput,
    kind: "write",
    credits: 1,
    preview: async (ctx, input) => {
      const current = await loadDesign(ctx, false);
      const derived = palette(input.primary, current.colors);
      return {
        title: "agent.card.design.colors.title",
        params: { primary: derived.colors.primary ?? input.primary },
        lines: [
          { key: "agent.card.design.colors.palette", params: { secondary: derived.colors.secondary ?? "", accent: derived.colors.accent ?? "" } },
          ...derived.notes.map((note) => ({ key: `agent.card.design.colors.note.${note}` })),
          { key: "agent.card.design.draftOnly" },
        ],
        risk: "low",
      };
    },
    run: async (ctx, input) => {
      const current = await loadDesign(ctx, true);
      const derived = palette(input.primary, current.colors);
      const version = await save(ctx, current, { colors: derived.colors });
      return { data: { colors: derived.colors, version }, resultRef: { primary: derived.colors.primary, previous: current.colors.primary ?? null } };
    },
  };

  const setFonts: AgentTool<FontsInput> = {
    name: "set_store_fonts",
    skill: "design",
    description: `Set heading and body fonts. Allowed: ${FONT_NAMES.join(", ")}.`,
    input: fontsInput,
    kind: "write",
    credits: 1,
    preview: async (_ctx, input) => ({
      title: "agent.card.design.fonts.title",
      params: { heading: input.headingFont, body: input.bodyFont },
      lines: [{ key: "agent.card.design.draftOnly" }],
      risk: "low",
    }),
    run: async (ctx, input) => {
      const current = await loadDesign(ctx, true);
      const version = await save(ctx, current, {
        typography: { ...current.typography, headingFont: input.headingFont, bodyFont: input.bodyFont },
      });
      return { data: { version }, resultRef: { headingFont: input.headingFont, bodyFont: input.bodyFont } };
    },
  };

  return {
    id: "design",
    pages: ["/stores/[storeId]/editor", "/stores/[storeId]/website/design", "/stores/[storeId]/templates"],
    rules: DESIGN_RULES,
    tools: [getDesign, setColors, setFonts],
  };
}

const DESIGN_RULES = `Skill: design. You change the look of one store's website.
- Colours: pass one main colour as a hex code; the code builds the rest of the palette.
- Fonts: only the allowed font names.
- Changes go to the draft; the seller publishes when ready.
- Writes are proposals: the seller sees a card and confirms.`;
