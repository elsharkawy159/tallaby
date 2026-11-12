/**
 * Niche editions on the server (ROADMAP F-90, plan §4.5): which edition a
 * preview or an install gets, and the fallbacks. No database: the registry is
 * mocked with the fixture pack (t-shirts on `fashion-luxe`), since the shipped
 * registry may be empty, and `applyStoreTemplate` is given a `q` that records
 * whether the install was reached. The writes themselves are covered by
 * `templates.integration.test.ts`.
 */
import { describe, expect, it, vi } from "vitest";
import { TSHIRTS } from "../../../store-sections/src/templates/editions/tshirts.fixture";

vi.mock("@workspace/store-sections/templates", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@workspace/store-sections/templates")>();
  const { TSHIRTS: pack } = await import("../../../store-sections/src/templates/editions/tshirts.fixture");
  return {
    ...actual,
    editionOnLook: (key: string, niche: unknown) => actual.editionOnLook(key, niche, [pack]),
    templateWithEdition: (key: string, niche: unknown) => actual.templateWithEdition(key, niche, [pack]),
    editionOptions: (key: string) => actual.editionOptions(key, [pack]),
  };
});

import { codeTemplateConfig, getPublicTemplate, getTemplateMeta, templateEditionId } from "./template-rows.server";
import { applyStoreTemplate, getStoreTemplateConfig, listTemplateCards, loadOfferedTemplateConfig } from "./templates.server";

const SELLER = "11111111-1111-4111-8111-111111111111";
const STORE = "22222222-2222-4222-8222-222222222222";
const HERO = "Tees that last for years";

/** A `q` that only says whether a transaction was opened (the install was reached). */
function recordingDb() {
  const calls = { transactions: 0 };
  const q = {
    transaction: async () => {
      calls.transactions += 1;
      throw new Error("reached the install");
    },
  };
  return { calls, q: q as never };
}

describe("templateEditionId: the only way a client's edition gets in", () => {
  it("keeps a real niche whose pack is approved on an edition-ready template", () => {
    expect(templateEditionId("fashion-luxe", "tshirts")).toBe("tshirts");
  });

  it("is null for an unknown niche, a pack not approved on the template, a template that takes no editions, and junk", () => {
    expect(templateEditionId("fashion-luxe", "no-such-niche")).toBeNull();
    expect(templateEditionId("fashion-luxe", "dresses")).toBeNull();
    expect(templateEditionId("kabl", "tshirts")).toBeNull();
    expect(templateEditionId("tallaby-classic", "tshirts")).toBeNull();
    expect(templateEditionId("no-such-template", "tshirts")).toBeNull();
    for (const value of [undefined, null, "", 1, {}, ["tshirts"], "tshirts'; drop table stores;--"]) expect(templateEditionId("fashion-luxe", value)).toBeNull();
  });
});

describe("a template's config and preview with an edition", () => {
  it("builds the look with the edition's copy, and keeps the template's own config apart", () => {
    const own = JSON.stringify(codeTemplateConfig("fashion-luxe"));
    const withEdition = JSON.stringify(codeTemplateConfig("fashion-luxe", "tshirts"));
    expect(withEdition).toContain(HERO);
    expect(own).not.toContain(HERO);
    // Asking again gives the same thing, as a fresh copy.
    expect(JSON.stringify(codeTemplateConfig("fashion-luxe", "tshirts"))).toBe(withEdition);
    expect(JSON.stringify(codeTemplateConfig("fashion-luxe"))).toBe(own);
    expect(codeTemplateConfig("fashion-luxe", "tshirts")).not.toBe(codeTemplateConfig("fashion-luxe", "tshirts"));
  });

  it("carries the edition's product stage in the design system", () => {
    expect(codeTemplateConfig("fashion-luxe", "tshirts")!.designSystem.spacing.productStage).toEqual(TSHIRTS.productStage);
  });

  it("gives no config for an edition the template does not offer (the caller decides the fallback)", async () => {
    expect(codeTemplateConfig("fashion-luxe", "dresses")).toBeNull();
    expect(codeTemplateConfig("kabl", "tshirts")).toBeNull();
    expect(await loadOfferedTemplateConfig("fashion-luxe", undefined, "no-such-niche")).toBeNull();
  });

  it("previews with the edition: its config, its demo store, and says which edition it drew", async () => {
    const preview = (await getPublicTemplate("fashion-luxe", undefined, "tshirts"))!;
    expect(preview.edition).toBe("tshirts");
    expect(JSON.stringify(preview.config)).toContain(HERO);
    expect(preview.meta.demo.store.name.en).toBe("Qotna");
    expect(preview.meta.demo.products.map((p) => p.id)).toContain("demo-white-heavy-tee");
  });

  it("falls back to the template itself, silently, for an unknown niche, a pack not approved on it, and a template that is not edition-ready", async () => {
    const own = (await getPublicTemplate("fashion-luxe"))!;
    expect(own.edition).toBeNull();
    for (const bad of ["no-such-niche", "dresses", "", null, undefined]) {
      const preview = (await getPublicTemplate("fashion-luxe", undefined, bad))!;
      expect(preview.edition, String(bad)).toBeNull();
      expect(JSON.stringify(preview.config)).toBe(JSON.stringify(own.config));
      expect(preview.meta.demo.store).toEqual(own.meta.demo.store);
    }
    for (const key of ["kabl", "tallaby-classic"]) {
      const preview = (await getPublicTemplate(key, undefined, "tshirts"))!;
      expect(preview.edition, key).toBeNull();
      expect(JSON.stringify(preview.config)).toBe(JSON.stringify((await getPublicTemplate(key))!.config));
    }
    expect(await getPublicTemplate("no-such-template", undefined, "tshirts")).toBeNull();
  });

  it("gives the edition's demo catalog only with an edition the template offers", async () => {
    expect((await getTemplateMeta("fashion-luxe", undefined, "tshirts"))!.demo.store.name.en).toBe("Qotna");
    const own = (await getTemplateMeta("fashion-luxe"))!.demo.store;
    expect((await getTemplateMeta("fashion-luxe", undefined, "dresses"))!.demo.store).toEqual(own);
    expect((await getTemplateMeta("fashion-luxe", undefined, null))!.demo.store).toEqual(own);
  });

  // Builds every template's config once, so it gets more time than the default.
  it("lists a card's editions, and none for a template without them", { timeout: 60_000 }, async () => {
    const cards = await listTemplateCards();
    expect(cards.find((card) => card.key === "fashion-luxe")?.editions).toEqual([{ id: "tshirts", name: { ar: "تيشيرتات", en: "T-shirts" } }]);
    expect(cards.find((card) => card.key === "kabl")?.editions).toEqual([]);
    expect(cards.find((card) => card.key === "tallaby-classic")?.editions).toEqual([]);
  });
});

describe("getStoreTemplateConfig with an edition", () => {
  it("checks the store first: a store that is not a store gets nothing, edition or not", async () => {
    const { q, calls } = recordingDb();
    expect(await getStoreTemplateConfig(SELLER, "not-a-uuid", "fashion-luxe", q, undefined, "tshirts")).toBeNull();
    expect(calls.transactions).toBe(0);
  });
});

describe("applyStoreTemplate with an editionId", () => {
  it("refuses an edition the template does not offer, before anything is read or written", async () => {
    for (const editionId of ["no-such-niche", "dresses", "tshirts'; --"]) {
      const { q, calls } = recordingDb();
      expect(await applyStoreTemplate(SELLER, STORE, "fashion-luxe", SELLER, { editionId }, q)).toEqual({ success: false, error: "edition_not_found" });
      expect(calls.transactions, editionId).toBe(0);
    }
    // A pack approved elsewhere is not approved here; a template with no editions takes none.
    for (const key of ["kabl", "tallaby-classic"]) {
      const { q, calls } = recordingDb();
      expect(await applyStoreTemplate(SELLER, STORE, key, SELLER, { editionId: "tshirts" }, q)).toEqual({ success: false, error: "edition_not_found" });
      expect(calls.transactions, key).toBe(0);
    }
  });

  it("says the template is missing, not the edition, for an unknown template", async () => {
    const { q, calls } = recordingDb();
    expect(await applyStoreTemplate(SELLER, STORE, "no-such-template", SELLER, { editionId: "tshirts" }, q)).toEqual({ success: false, error: "template_not_found" });
    expect(calls.transactions).toBe(0);
  });

  it("goes on to the install with a valid edition, and with none", async () => {
    for (const options of [{ editionId: "tshirts" }, { editionId: null }, { editionId: "" }, {}]) {
      const { q, calls } = recordingDb();
      await expect(applyStoreTemplate(SELLER, STORE, "fashion-luxe", SELLER, options, q)).rejects.toThrow("reached the install");
      expect(calls.transactions).toBe(1);
    }
  });
});

// One template per niche (2026-11-12): 32 templates were deleted from code. A store keeps its own copy; anything that
// still looks one up by key gets "not found" (galleries skip it, an install refuses it), never a crash.
describe("templates deleted on 2026-11-12", () => {
  const DELETED = ["kettan", "nour", "mobilia", "kohl", "pace", "drive", "gifts-bold", "electronics-warm"];

  it("have no config, meta or public preview, and are not offered", async () => {
    const cards = await listTemplateCards();
    for (const key of DELETED) {
      expect(codeTemplateConfig(key), key).toBeNull();
      expect(await getTemplateMeta(key), key).toBeNull();
      expect(await getPublicTemplate(key), key).toBeNull();
      expect(await loadOfferedTemplateConfig(key), key).toBeNull();
      expect(cards.some((card) => card.key === key), key).toBe(false);
    }
    expect(cards).toHaveLength(84);
  });
});
