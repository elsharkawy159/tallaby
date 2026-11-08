import { forbiddenReason } from "./forbidden";
import { designSkill } from "./skills/design";
import { productsSkill, type ProductsSkillDeps } from "./skills/products";
import { settingsSkill } from "./skills/settings";
import { shippingSkill } from "./skills/shipping";
import { AgentError, type AnyAgentTool, type Skill, type SkillId } from "./types";

/**
 * The agent's skills and tools. Registration refuses forbidden tools (money
 * kind or a denylisted name), writes without a confirm card, duplicate names
 * and rules over 40 lines, so a mistake fails at start-up, not in front of a
 * seller.
 */

export const MAX_RULE_LINES = 40;
/** Spec §14.2.3: only the active skill's tools, at most about 8. */
export const MAX_TOOLS_PER_SKILL = 8;

export type AgentRegistry = {
  skills: ReadonlyMap<SkillId, Skill>;
  skill(id: SkillId): Skill;
  tool(name: string): AnyAgentTool;
  /** The tool by name, only when it belongs to `skillId`. */
  skillTool(skillId: SkillId, name: string): AnyAgentTool;
};

export function validateTool(tool: AnyAgentTool): void {
  const reason = forbiddenReason(tool);
  if (reason) throw new AgentError("forbidden_tool", reason);
  if (!/^[a-z][a-z0-9_]{1,63}$/.test(tool.name)) throw new AgentError("invalid_input", `Bad tool name "${tool.name}".`);
  if (tool.kind === "write" && !tool.preview) throw new AgentError("invalid_input", `Write tool "${tool.name}" needs a confirm card.`);
  if (tool.kind === "read" && tool.credits !== 0) throw new AgentError("invalid_input", `Read tool "${tool.name}" must cost 0 credits.`);
  if (!Number.isInteger(tool.credits) || tool.credits < 0 || tool.credits > 5) throw new AgentError("invalid_input", `Bad credits on "${tool.name}".`);
}

export function createRegistry(skills: Skill[]): AgentRegistry {
  const bySkill = new Map<SkillId, Skill>();
  const byName = new Map<string, AnyAgentTool>();
  for (const skill of skills) {
    if (bySkill.has(skill.id)) throw new AgentError("invalid_input", `Skill "${skill.id}" registered twice.`);
    if (skill.rules.split("\n").length > MAX_RULE_LINES) throw new AgentError("invalid_input", `Skill "${skill.id}" rules are over ${MAX_RULE_LINES} lines.`);
    if (skill.tools.length > MAX_TOOLS_PER_SKILL) throw new AgentError("invalid_input", `Skill "${skill.id}" has too many tools.`);
    for (const tool of skill.tools) {
      validateTool(tool);
      if (tool.skill !== skill.id) throw new AgentError("invalid_input", `Tool "${tool.name}" is not of skill "${skill.id}".`);
      if (byName.has(tool.name)) throw new AgentError("invalid_input", `Tool "${tool.name}" registered twice.`);
      byName.set(tool.name, tool);
    }
    bySkill.set(skill.id, skill);
  }
  return {
    skills: bySkill,
    skill(id) {
      const skill = bySkill.get(id);
      if (!skill) throw new AgentError("unknown_tool", `Unknown skill "${id}".`);
      return skill;
    },
    tool(name) {
      const tool = byName.get(name);
      if (!tool) throw new AgentError("unknown_tool", `Unknown tool "${name}".`);
      return tool;
    },
    skillTool(skillId, name) {
      const tool = byName.get(name);
      if (!tool || tool.skill !== skillId) throw new AgentError("unknown_tool", `"${name}" is not a ${skillId} tool.`);
      return tool;
    },
  };
}

export type AgentRegistryDeps = ProductsSkillDeps;

/** The four first skills (spec §14.7 step 1). */
export function createAgentRegistry(deps: AgentRegistryDeps = {}): AgentRegistry {
  return createRegistry([productsSkill(deps), shippingSkill(), designSkill(), settingsSkill()]);
}
