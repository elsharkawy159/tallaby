import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";

// Real drizzle helpers and schema, no database: each lookup's query is captured and rendered.
vi.mock("@workspace/db", async () => {
  const orm = await import("drizzle-orm");
  const schema = await import("@workspace/db/schema");
  return { ...schema, db: {}, and: orm.and, eq: orm.eq, isNull: orm.isNull, or: orm.or, sql: orm.sql };
});
vi.mock("./custom-domain-provider", () => ({ customDomainProvider: () => ({}) }));

import {
  customDomainPublicHostRawSql,
  findActiveCustomDomainForSubdomain,
  findStoreHostByCustomDomain,
  findStoreHostBySubdomain,
  findSubdomainForCustomDomain,
} from "./custom-domains.server";

const dialect = new PgDialect();

/** A Queryable that records the select fields and the where clause, and finds nothing. */
function recorder() {
  const seen: { fields?: Record<string, unknown>; where?: SQL } = {};
  const chain = {
    from: () => chain,
    innerJoin: () => chain,
    leftJoin: () => chain,
    where: (where: SQL) => {
      seen.where = where;
      return chain;
    },
    limit: async () => [],
  };
  const q = {
    select: (fields: Record<string, unknown>) => {
      seen.fields = fields;
      return chain;
    },
  };
  return { q: q as never, seen };
}

const render = (value: unknown) => dialect.sqlToQuery(value as SQL);

const PUBLIC_HOST =
  `CASE WHEN "seller_custom_domains"."provider_meta"->>'primary' = 'www' THEN 'www.' || "seller_custom_domains"."domain" ELSE "seller_custom_domains"."domain" END`;

describe("custom domain lookups by public host", () => {
  it("a root host matches only a row that is not www-primary", async () => {
    for (const lookup of [findStoreHostByCustomDomain, findSubdomainForCustomDomain]) {
      const { q, seen } = recorder();
      await lookup("faster-eg.com", q);
      const { sql, params } = render(seen.where);
      expect(params).toContain("faster-eg.com");
      expect(params).not.toContain("www.faster-eg.com");
      expect(sql).toContain(`("seller_custom_domains"."provider_meta"->>'primary') IS DISTINCT FROM 'www'`);
      expect(sql).not.toContain(" or ");
    }
  });

  it("a www. host matches its own row, or the www-primary row of its root", async () => {
    for (const lookup of [findStoreHostByCustomDomain, findSubdomainForCustomDomain]) {
      const { q, seen } = recorder();
      await lookup("www.faster-eg.com", q);
      const { sql, params } = render(seen.where);
      expect(params).toEqual(expect.arrayContaining(["www.faster-eg.com", "faster-eg.com"]));
      expect(sql).toContain(" or ");
      expect(sql).toContain(`"seller_custom_domains"."provider_meta"->>'primary' = 'www'`);
    }
  });

  it("returns the public host for the subdomain lookups", async () => {
    const a = recorder();
    await findActiveCustomDomainForSubdomain("faster", a.q);
    expect(render(a.seen.fields?.domain).sql).toBe(PUBLIC_HOST);

    const b = recorder();
    await findStoreHostBySubdomain("faster", b.q);
    expect(render(b.seen.fields?.customDomain).sql).toBe(PUBLIC_HOST);
  });

  it("raw SQL uses the same rule and refuses an alias that isn't a plain name", () => {
    expect(render(customDomainPublicHostRawSql("d")).sql).toBe(
      `CASE WHEN d.provider_meta->>'primary' = 'www' THEN 'www.' || d.domain ELSE d.domain END`,
    );
    expect(() => customDomainPublicHostRawSql("d; drop table x")).toThrow();
  });
});
