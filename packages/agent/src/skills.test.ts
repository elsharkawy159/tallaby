import { beforeEach, describe, expect, it, vi } from "vitest";
import { applyStoreShippingTemplate, updateStoreSettings, updateStoreSocialLinks } from "@workspace/lib/stores/server";
import { agentCreateProduct } from "@workspace/lib/products/agent/server";
import { saveStoreDesignSystem } from "@workspace/lib/store-sites/server";
import { matchPlaceNames } from "./places.lib";
import { createAgentRegistry } from "./registry";
import { createAgentRuntime } from "./runtime";
import { resetTables, tables } from "./test/fake-db";
import type { AgentContext } from "./types";

const SELLER = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const STORE = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const ctx: AgentContext = { sellerId: SELLER, storeId: STORE, locale: "en", source: "in_app" };

const runtime = () =>
  createAgentRuntime({
    registry: createAgentRegistry(),
    credits: { claim: async () => ({ ok: true, reference: "r" }), refund: async () => undefined },
    logger: { record: async () => undefined },
  });

const confirm = async (tool: string, input: unknown, c: AgentContext = ctx) => {
  const rt = runtime();
  const proposal = await rt.proposeAction(c, tool, input);
  return { proposal, result: await rt.confirmAction(c, proposal.actionId) };
};

beforeEach(() => {
  vi.clearAllMocks();
  resetTables({
    stores: [
      {
        id: STORE,
        sellerId: SELLER,
        status: "active",
        deletedAt: null,
        subdomain: "shop",
        settings: {},
        contact: { phone: "01000000000", email: "old@shop.com", social: [{ platform: "instagram", value: "https://www.instagram.com/old", enabled: true, order: 0 }] },
        seo: { titleTemplate: "%s | Shop", indexing: true },
      },
    ],
    sellers: [{ id: SELLER, status: "approved", returnPolicy: "Old policy", subdomain: "shop" }],
    storeDesignSystems: [{ storeId: STORE, colors: { background: "#ffffff", primary: "#000000" }, typography: { headingFont: "Cairo" }, spacing: { borderRadius: 8 }, version: 4 }],
  });
});

describe("places in code", () => {
  it("matches exact Arabic and English names and groupings, and reports the rest", () => {
    const m = matchPlaceNames(["القاهرة", "Giza", "الجيزة", "باقي المحافظات", "Narnia"]);
    expect(m.keys).toEqual(["EG/CAIRO", "EG/GIZA", "EG"]);
    expect(m.unmatched).toEqual(["Narnia"]);
  });
});

describe("design", () => {
  it("derives the palette in code and saves the whole draft design system with the current version", async () => {
    const { proposal } = await confirm("set_brand_colors", { primary: "#1f6feb" });
    expect(proposal.card.lines.map((l) => l.key)).toContain("agent.card.design.draftOnly");
    const [sellerId, storeId, saved, version] = vi.mocked(saveStoreDesignSystem).mock.calls[0]!;
    expect([sellerId, storeId, version]).toEqual([SELLER, STORE, 4]);
    expect(saved).toMatchObject({ colors: { background: "#ffffff" }, typography: { headingFont: "Cairo" }, spacing: { borderRadius: 8 } });
    expect((saved as { colors: { primary: string } }).colors.primary).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("only allows fonts the storefront loads", async () => {
    await expect(runtime().proposeAction(ctx, "set_store_fonts", { headingFont: "Comic Sans", bodyFont: "Cairo" })).rejects.toMatchObject({ code: "invalid_input" });
    await confirm("set_store_fonts", { headingFont: "Tajawal", bodyFont: "Cairo" });
    expect(vi.mocked(saveStoreDesignSystem).mock.calls[0]![2]).toMatchObject({ typography: { headingFont: "Tajawal", bodyFont: "Cairo" } });
  });
});

describe("settings", () => {
  it("contact: changes only the given field and keeps the others", async () => {
    await confirm("update_store_contact", { whatsapp: "01111111111" });
    expect(updateStoreSettings).toHaveBeenCalledWith(SELLER, STORE, { contact: { phone: "01000000000", whatsapp: "01111111111", email: "old@shop.com" } });
  });

  it("social: upserts one platform and keeps the rest", async () => {
    await confirm("set_social_link", { platform: "facebook", value: "myshop" });
    const links = vi.mocked(updateStoreSocialLinks).mock.calls[0]![2] as Array<{ platform: string }>;
    expect(links.map((l) => l.platform)).toEqual(["instagram", "facebook"]);
  });

  it("return policy: the card says it is account-wide, and it is saved on the seller row only", async () => {
    const { proposal } = await confirm("set_return_policy", { returnPolicy: "<b>14 days</b> to return" });
    expect(proposal.card.risk).toBe("high");
    expect(proposal.card.lines[0]!.key).toBe("agent.card.settings.returnPolicy.accountWide");
    expect(tables.sellers![0]!.returnPolicy).toBe("14 days to return");
  });
});

describe("shipping and products", () => {
  it("template: names are made in code; replacing zones is a high-risk card", async () => {
    const { getStoreShipping } = await import("@workspace/lib/stores/server");
    vi.mocked(getStoreShipping).mockResolvedValue({ settings: { freeShippingOver: null }, zones: [{ id: "z" }] } as never);
    const { proposal } = await confirm("apply_shipping_template", { template: "egypt_flat", price: 60, replace: true });
    expect(proposal.card.risk).toBe("high");
    expect(applyStoreShippingTemplate).toHaveBeenCalledWith(SELLER, SELLER, STORE, {
      template: "egypt_flat",
      names: [{ nameAr: "كل مصر", nameEn: "All Egypt" }],
      price: 60,
      replace: true,
    });
  });

  it("create product: the publish flag comes from the caller, never the model", async () => {
    const input = { title: { ar: "كوباية", en: "Mug" }, price: 120, images: ["a.jpg"] };
    await expect(runtime().proposeAction(ctx, "create_product", { ...input, publish: true })).rejects.toMatchObject({ code: "invalid_input" });
    await confirm("create_product", input);
    expect(vi.mocked(agentCreateProduct).mock.calls[0]![1]).toMatchObject({ storeId: STORE, publish: false, price: 120 });
    await confirm("create_product", input, { ...ctx, publishProducts: true });
    expect(vi.mocked(agentCreateProduct).mock.calls[1]![1]).toMatchObject({ publish: true });
  });
});
