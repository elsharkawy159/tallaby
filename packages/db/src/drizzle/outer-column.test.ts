import { asc, eq, exists } from "drizzle-orm";
import { QueryBuilder } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm/sql";
import { describe, expect, it } from "vitest";
import { productTranslations, products } from "./schema";

/**
 * A select with NO joins strips the table name from columns that are top-level
 * chunks of a field's sql template. Inside a subquery the bare name then binds
 * to the subquery's own table when it has that column:
 *   (SELECT t.title FROM product_translations t WHERE t.product_id = "id")
 * reads t.id, so the field is silently NULL or wrong. Postgres only falls back to
 * the outer row when the subquery has no such column.
 *
 * Write such fields as sql`${sql`(SELECT ...)`}`. If a drizzle upgrade makes these
 * tests fail, re-check that form and the "BROKEN" shape below.
 */
const qb = new QueryBuilder();
const title = () => sql`(SELECT t.title FROM ${productTranslations} t WHERE t.product_id = ${products.id} LIMIT 1)`;

describe("outer columns in subquery select fields", () => {
  it("BROKEN: a bare field in a no-join select loses the table name", () => {
    const query = qb.select({ title: title() }).from(products).toSQL();
    expect(query.sql).toContain('t.product_id = "id"');
  });

  it("a nested sql field in a no-join select keeps the table name", () => {
    const query = qb.select({ title: sql`${title()}` }).from(products).toSQL();
    expect(query.sql).toContain('t.product_id = "products"."id"');
  });

  it("a bare field in a joined select keeps the table name", () => {
    const query = qb
      .select({ title: title() })
      .from(products)
      .leftJoin(productTranslations, eq(productTranslations.productId, products.id))
      .toSQL();
    expect(query.sql).toContain('t.product_id = "products"."id"');
  });

  it("where and orderBy keep the table name in a no-join select", () => {
    const query = qb
      .select({ id: products.id })
      .from(products)
      .where(exists(title()))
      .orderBy(asc(title()))
      .toSQL();
    expect(query.sql.match(/t\.product_id = "products"\."id"/g)).toHaveLength(2);
    expect(query.sql).not.toContain('t.product_id = "id"');
  });
});
