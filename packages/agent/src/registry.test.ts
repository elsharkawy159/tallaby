import { describe, expect, it } from "vitest";
import { z } from "zod";
import { forbiddenReason } from "./forbidden";
import { createAgentRegistry, createRegistry, MAX_RULE_LINES } from "./registry";
import type { AnyAgentTool, Skill } from "./types";

const fake = (overrides: Partial<AnyAgentTool>): AnyAgentTool => ({
  name: "list_things",
  skill: "products",
  description: "x",
  input: z.object({}).strict(),
  kind: "read",
  credits: 0,
  run: async () => ({ data: null }),
  ...overrides,
});

const skillWith = (tools: AnyAgentTool[], rules = "rules"): Skill => ({ id: "products", pages: [], rules, tools });

describe("forbidden actions", () => {
  it.each([
    "wallet_balance",
    "top_up_wallet",
    "request_payout",
    "refund_order",
    "buy_credits",
    "change_plan",
    "upgrade_to_pro",
    "delete_store",
    "archive_store",
    "account_delete",
    "save_api_key",
    "set_password",
    "rotate_secret",
    "update_payment_method",
    "add_bank_details",
  ])("refuses %s even as a read tool", (name) => {
    expect(forbiddenReason({ name, kind: "read" })).not.toBeNull();
    expect(() => createRegistry([skillWith([fake({ name })])])).toThrow(/never take|money/);
  });

  it("refuses any money-kind tool, whatever its name", () => {
    expect(() => createRegistry([skillWith([fake({ name: "install_app", kind: "money" })])])).toThrow(/money action/);
  });

  it("refuses a write without a confirm card, a paid read and duplicate names", () => {
    expect(() => createRegistry([skillWith([fake({ name: "save_thing", kind: "write", credits: 1 })])])).toThrow(/confirm card/);
    expect(() => createRegistry([skillWith([fake({ credits: 1 })])])).toThrow(/0 credits/);
    expect(() => createRegistry([skillWith([fake({}), fake({})])])).toThrow(/twice/);
  });

  it("refuses rules over 40 lines", () => {
    const rules = Array.from({ length: MAX_RULE_LINES + 1 }, (_, i) => `- rule ${i}`).join("\n");
    expect(() => createRegistry([skillWith([fake({})], rules)])).toThrow(/over 40 lines/);
  });
});

describe("the real registry", () => {
  const registry = createAgentRegistry();

  it("has the four first skills, each with reads and writes and at most 8 tools", () => {
    expect([...registry.skills.keys()].sort()).toEqual(["design", "products", "settings", "shipping"]);
    for (const skill of registry.skills.values()) {
      expect(skill.tools.length).toBeLessThanOrEqual(8);
      expect(skill.tools.some((t) => t.kind === "read")).toBe(true);
      expect(skill.tools.some((t) => t.kind === "write")).toBe(true);
      expect(skill.rules.split("\n").length).toBeLessThanOrEqual(MAX_RULE_LINES);
    }
  });

  it("has no forbidden tool, every write costs 1 credit and has a card", () => {
    for (const skill of registry.skills.values()) {
      for (const tool of skill.tools) {
        expect(forbiddenReason(tool)).toBeNull();
        if (tool.kind === "write") {
          expect(tool.credits).toBe(1);
          expect(tool.preview).toBeTypeOf("function");
        } else expect(tool.credits).toBe(0);
      }
    }
  });

  it("never lets the model pass a seller or store id", () => {
    for (const skill of registry.skills.values()) {
      for (const tool of skill.tools) {
        const withIds = tool.input.safeParse({ storeId: "00000000-0000-4000-8000-000000000000", sellerId: "x" });
        if (withIds.success) expect(withIds.data).not.toHaveProperty("storeId");
      }
    }
  });

  it("scopes tools to their skill", () => {
    expect(registry.skillTool("shipping", "save_shipping_zone").name).toBe("save_shipping_zone");
    expect(() => registry.skillTool("shipping", "create_product")).toThrow(/not a shipping tool/);
  });
});
