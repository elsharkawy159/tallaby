import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { and, db, eq, inArray, isNull, products, sql, stores } from "@workspace/db";
import type { AgentActor } from "@workspace/lib/agents";
import { registerTool } from "../tool";

const READ = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } as const;

async function grantedStores(actor: AgentActor) {
  if (!actor.storeIds.length) return [];
  return db
    .select({
      id: stores.id,
      name: stores.name,
      subdomain: stores.subdomain,
      isPrimary: stores.isPrimary,
      status: stores.status,
      siteStatus: stores.siteStatus,
      catalogMode: stores.catalogMode,
      defaultLocale: stores.defaultLocale,
      // Nested sql keeps the table name on outer columns; a no-join select strips it from a bare field (outer-column.test.ts).
      products: sql<number>`${sql`(
        SELECT count(*)::int FROM ${products} p
        WHERE p.seller_id = ${stores.sellerId} AND p.deleted_at IS NULL AND p.purged_at IS NULL
          AND (${stores.catalogMode} = 'all' OR EXISTS (SELECT 1 FROM store_products sp WHERE sp.store_id = ${stores.id} AND sp.product_id = p.id))
      )`}`,
    })
    .from(stores)
    .where(and(eq(stores.sellerId, actor.sellerId), inArray(stores.id, actor.storeIds), isNull(stores.deletedAt)))
    .orderBy(sql`${stores.isPrimary} DESC`, stores.createdAt);
}

export function registerAccountTools(server: McpServer, actor: AgentActor) {
  registerTool(server, actor, {
    name: "whoami",
    title: "Who am I connected as",
    description: "The Tallaby account this assistant is connected to: what it is allowed to do (scopes) and how many stores it can use.",
    input: z.object({}).strict(),
    scope: "store.read",
    write: false,
    annotations: READ,
    run: async () => ({
      data: {
        assistant: actor.clientLabel,
        scopes: actor.scopes,
        allStores: actor.allStores,
        storeCount: actor.storeIds.length,
        canPublishProducts: actor.sellerStatus === "approved",
      },
    }),
  });

  registerTool(server, actor, {
    name: "list_stores",
    title: "List my stores",
    description:
      "The stores this assistant may manage, with their id (pass it as storeId to every other tool), name, web address and how many products each shows. Call this first.",
    input: z.object({}).strict(),
    scope: "store.read",
    write: false,
    annotations: READ,
    run: async () => {
      const rows = await grantedStores(actor);
      return {
        data: {
          stores: rows.map((s) => ({
            id: s.id,
            name: s.name,
            url: `https://${s.subdomain}.tallaby.com`,
            primary: s.isPrimary,
            status: s.status,
            website: s.siteStatus,
            catalog: s.catalogMode === "selected" ? "selected products only" : "all products",
            defaultLanguage: s.defaultLocale,
            products: s.products,
          })),
        },
      };
    },
  });
}
