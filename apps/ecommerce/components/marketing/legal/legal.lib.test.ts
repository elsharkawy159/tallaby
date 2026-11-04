import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { publishedClauses, type LegalClause } from "./legal.lib";

const clauses: LegalClause[] = [
  { title: "Plans", body: "Two plans." },
  { title: "The move", body: "On {date}, balances moved.", needsSwitchDate: true },
];

describe("publishedClauses", () => {
  it("leaves out a clause that needs the date until the date is set", () => {
    expect(publishedClauses(clauses, null).map((c) => c.title)).toEqual(["Plans"]);
  });

  it("fills in the date once it is set", () => {
    expect(publishedClauses(clauses, "1 December 2026")[1]?.body).toBe("On 1 December 2026, balances moved.");
  });
});

describe("legal messages", () => {
  type Legal = {
    terms?: { sections: { id: string; clauses?: LegalClause[] }[] };
    privacy?: { sections: { id: string }[] };
  };
  const read = (path: string) => (JSON.parse(readFileSync(resolve(__dirname, "../../../messages", path), "utf8")) as { legal: Legal }).legal;
  const load = (locale: string) => ({ ...read(`${locale}.json`), ...read(`marketing/legal.${locale}.json`) });

  it.each(["ar", "en"])("%s has the wallet clauses, no placeholder and the #cookies anchor", (locale) => {
    const legal = load(locale);
    expect(legal.privacy?.sections.map((s) => s.id)).toContain("cookies");
    const fees = legal.terms?.sections.find((s) => s.id === "fees");
    expect(fees?.clauses).toHaveLength(10);
    const published = publishedClauses(fees?.clauses ?? [], null)
      .map((c) => c.body)
      .join(" ");
    expect(published).not.toMatch(/[[{]/);
  });
});
