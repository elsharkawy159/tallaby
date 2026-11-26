/**
 * What the editor agent's model returns (ROADMAP F-83c). Flat and nullable on
 * purpose: Gemini structured output has a complexity limit, and a union of
 * thirteen op shapes or free-form objects would hit it. Free-form values
 * (styles, setting values, blocks) come as JSON strings. `toSectionOpCandidates`
 * turns each row into a `SectionOp` candidate, which `applySectionOps` parses
 * strictly; a row that doesn't fit is refused there as `invalid_op`.
 *
 * The model never writes ids for new things (`newSectionId`, `newNodeId`):
 * the rows have no field for them, so the code makes every new id.
 */
import { z } from "zod";
import { AGENT_DEVICES, MAX_OPS_PER_TURN, SECTION_OP_NAMES, type SectionOpName } from "./section-ops";

export const MAX_AGENT_REPLY_LENGTH = 600;

const text = (describe: string) => z.string().nullable().describe(describe);

export const editorAgentModelOpSchema = z.object({
  op: z.enum(SECTION_OP_NAMES as [SectionOpName, ...SectionOpName[]]),
  sectionId: text("The id of an existing section this op changes. Null only for add_code_section."),
  nodeId: text("The id of an existing element of that section, for element ops. Else null."),
  after: text('add_code_section: insert after this section id, or "start" or "end". Else null.'),
  to: z.number().int().nullable().describe("move_section: the new 0-based position. Else null."),
  file: text("Code ops: the whole section file (HTML + Liquid, {% stylesheet %}, {% schema %}). Else null."),
  name: text("Code ops: a short section name. Else null."),
  prop: text("set_text: the text prop of the element (as listed). Else null."),
  ar: text("set_text: the Arabic text. Null to leave it."),
  en: text("set_text: the English text. Null to leave it."),
  breakpoint: z.enum(AGENT_DEVICES).nullable().describe("set_style: desktop (default, all sizes), tablet or mobile."),
  device: z.enum(AGENT_DEVICES).nullable().describe("hide_node: the device to hide on; null hides everywhere."),
  styleJson: text('set_style: a JSON object of style keys, e.g. {"fontSize":"4xl","color":"#d92d20"}. Else null.'),
  css: text("set_custom_css: the CSS. Else null."),
  href: text("set_link: the link. Else null."),
  settingsJson: text("Code ops: a JSON object of setting values by setting id. Else null."),
  blocksJson: text('Code ops: a JSON array of blocks, [{"type":"…","settings":{…}}]. Else null.'),
});
export type EditorAgentModelOp = z.infer<typeof editorAgentModelOpSchema>;

export const editorAgentModelOutputSchema = z.object({
  reply: z.string().describe(`What you did or what you need, in the seller's language, at most ${MAX_AGENT_REPLY_LENGTH} characters.`),
  ops: z.array(editorAgentModelOpSchema).describe(`The edits, in order. At most ${MAX_OPS_PER_TURN}. Empty when you only answer.`),
});
export type EditorAgentModelOutput = z.infer<typeof editorAgentModelOutputSchema>;

/** A row that can never be a valid op (its JSON doesn't parse): `applySectionOps` refuses it as `invalid_op`. */
const INVALID = Object.freeze({ op: "invalid" });

function parseJson(value: string | null | undefined): { ok: true; value: unknown } | { ok: false } {
  if (value == null || value.trim() === "") return { ok: true, value: undefined };
  try {
    return { ok: true, value: JSON.parse(value) };
  } catch {
    return { ok: false };
  }
}

/** One model row as a `SectionOp` candidate (fields the op doesn't use are left out). */
export function toSectionOpCandidate(row: EditorAgentModelOp): unknown {
  const style = parseJson(row.styleJson);
  const settings = parseJson(row.settingsJson);
  const blocks = parseJson(row.blocksJson);
  if (!style.ok || !settings.ok || !blocks.ok) return INVALID;
  const pick = <K extends string>(...keys: K[]) => {
    const out: Record<string, unknown> = { op: row.op };
    for (const key of keys) {
      const value = key === "style" ? style.value : key === "settings" ? settings.value : key === "blocks" ? blocks.value : (row as Record<string, unknown>)[key];
      if (value !== null && value !== undefined) out[key] = value;
    }
    return out;
  };
  switch (row.op) {
    case "add_code_section":
      return pick("after", "file", "settings", "blocks", "name");
    case "update_code_section":
      return pick("sectionId", "file", "settings", "blocks", "name");
    case "convert_to_code_section":
      return pick("sectionId", "file", "settings", "blocks", "name");
    case "set_text":
      return pick("sectionId", "nodeId", "prop", "ar", "en");
    case "set_style":
      return pick("sectionId", "nodeId", "breakpoint", "style");
    case "set_custom_css":
      return pick("sectionId", "nodeId", "css");
    case "set_link":
      return pick("sectionId", "nodeId", "href");
    case "remove_node":
    case "duplicate_node":
      return pick("sectionId", "nodeId");
    case "hide_node":
      return pick("sectionId", "nodeId", "device");
    case "move_section":
      return pick("sectionId", "to");
    case "remove_section":
    case "duplicate_section":
      return pick("sectionId");
  }
}

/** The reply, plain and capped. */
export function cleanAgentReply(reply: unknown): string {
  if (typeof reply !== "string") return "";
  // eslint-disable-next-line no-control-regex
  return reply.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim().slice(0, MAX_AGENT_REPLY_LENGTH);
}
