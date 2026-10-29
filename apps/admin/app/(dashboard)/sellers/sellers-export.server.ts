"use server";

import { db, products, sellers, storeProducts, stores, users } from "@workspace/db";
import { HEARD_ABOUT_US_LABELS, isHeardAboutUsSource } from "@workspace/lib/sellers";
import { storeUrl } from "@workspace/lib/storefront";
import { buildWhatsAppUrl, toWhatsAppNumber } from "@workspace/ui/lib/contact";
import { and, asc, desc, eq, inArray, sql, type SQL } from "drizzle-orm";
import { headers } from "next/headers";
import * as XLSX from "xlsx";
import { getCurrentAdminUser } from "@/lib/auth/admin-auth";
import type { RawSearchParams } from "../_components/data-table/search-params";
import { buildSellerWelcomeMessage, getStatusLabel } from "./sellers.lib";
import { parseSellersParams } from "./sellers.params";
import { buildSellersWhere } from "./sellers.query";
import { SELLER_EXPORT_SCOPES, type SellerExportScope } from "./sellers-export.lib";
import type { SellerStatus } from "./sellers.types";

/** More than every seller today; keeps one export bounded. */
const MAX_EXPORT_SELLERS = 20_000;

const SITE_STATUS_LABELS: Record<string, string> = {
  published: "Published",
  unpublished: "Switched off",
  draft: "Never published",
};

/** Which store rows a scope keeps; null = every store of a matching seller. */
const STORE_ROW_STATUS: Record<SellerExportScope, string | null> = {
  all: null,
  published: "published",
  unpublished: "unpublished",
  draft: "draft",
  not_published: null,
  no_store: null,
};

const liveStore = (status?: string) => sql`EXISTS (
  SELECT 1 FROM ${stores} st
  WHERE st.seller_id = ${sellers.id} AND st.deleted_at IS NULL
  ${status ? sql`AND st.site_status = ${status}` : sql``}
)`;

function scopeCondition(scope: SellerExportScope): SQL | undefined {
  switch (scope) {
    case "published":
    case "unpublished":
    case "draft":
      return liveStore(scope);
    case "not_published":
      return sql`NOT ${liveStore("published")}`;
    case "no_store":
      return sql`NOT ${liveStore()}`;
    default:
      return undefined;
  }
}

/** YYYY-MM-DD in Cairo, as a date cell (midnight UTC so it never shifts a day). */
function cairoDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo" }).format(date);
  return new Date(`${day}T00:00:00Z`);
}

type Cell = string | number | Date | null | { text: string; url: string };

const COLUMNS: Array<{ header: string; width: number }> = [
  { header: "Seller", width: 24 },
  { header: "Phone", width: 16 },
  { header: "WhatsApp", width: 20 },
  { header: "Email", width: 28 },
  { header: "Store", width: 24 },
  { header: "Store link", width: 30 },
  { header: "Industry", width: 18 },
  { header: "Website", width: 16 },
  { header: "Store products", width: 10 },
  { header: "Seller products", width: 10 },
  { header: "Stores", width: 8 },
  { header: "Wallet (EGP)", width: 12 },
  { header: "Joined", width: 12 },
  { header: "Last order", width: 12 },
  { header: "Account status", width: 14 },
  { header: "Plan", width: 8 },
  { header: "Heard about us", width: 16 },
  { header: "Admin page", width: 14 },
];

function buildWorkbook(rows: Cell[][]): string {
  const sheet: XLSX.WorkSheet = {};
  const all = [COLUMNS.map((column) => column.header), ...rows];
  all.forEach((row, r) => {
    row.forEach((value, c) => {
      if (value === null || value === "") return;
      const address = XLSX.utils.encode_cell({ r, c });
      if (value instanceof Date) {
        sheet[address] = { t: "d", v: value, z: "yyyy-mm-dd" };
      } else if (typeof value === "number") {
        sheet[address] = { t: "n", v: value };
      } else if (typeof value === "object") {
        sheet[address] = { t: "s", v: value.text, l: { Target: value.url } };
      } else {
        // Always text, so phones keep their leading zero and nothing runs as a formula.
        sheet[address] = { t: "s", v: value };
      }
    });
  });
  const range = { s: { r: 0, c: 0 }, e: { r: all.length - 1, c: COLUMNS.length - 1 } };
  sheet["!ref"] = XLSX.utils.encode_range(range);
  sheet["!autofilter"] = { ref: sheet["!ref"] };
  sheet["!cols"] = COLUMNS.map((column) => ({ wch: column.width }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Sellers");
  return XLSX.write(workbook, { type: "base64", bookType: "xlsx", cellDates: true });
}

/**
 * Sellers as an .xlsx workbook (opens in Google Sheets): one row per store,
 * sellers with no store get one row. Applies the table's filters and search,
 * plus a website scope.
 */
export async function exportSellers(params: RawSearchParams, scopeInput: string) {
  try {
    await getCurrentAdminUser();

    const scope = (SELLER_EXPORT_SCOPES as readonly string[]).includes(scopeInput)
      ? (scopeInput as SellerExportScope)
      : "all";
    const query = parseSellersParams(params);
    const where = and(buildSellersWhere(query), scopeCondition(scope));

    const sellerRows = await db
      .select({
        id: sellers.id,
        businessName: sellers.businessName,
        displayName: sellers.displayName,
        supportEmail: sellers.supportEmail,
        supportPhone: sellers.supportPhone,
        status: sellers.status,
        plan: sellers.plan,
        walletBalance: sellers.walletBalance,
        joinDate: sellers.joinDate,
        heardAboutUs: sellers.heardAboutUs,
        heardAboutUsOther: sellers.heardAboutUsOther,
        ownerName: users.fullName,
        ownerEmail: users.email,
        ownerPhone: users.phone,
        productCount: sql<number>`(SELECT count(*)::int FROM ${products} p WHERE p.seller_id = ${sellers.id})`,
        lastOrderAt: sql<string | null>`(SELECT max(oi.created_at)::text FROM order_items oi WHERE oi.seller_id = ${sellers.id})`,
      })
      .from(sellers)
      .leftJoin(users, eq(users.id, sellers.id))
      .where(where)
      .orderBy(desc(sellers.joinDate), asc(sellers.id))
      .limit(MAX_EXPORT_SELLERS);

    const sellerIds = sellerRows.map((seller) => seller.id);
    const storeRows = sellerIds.length
      ? await db
          .select({
            sellerId: stores.sellerId,
            name: stores.name,
            subdomain: stores.subdomain,
            siteStatus: stores.siteStatus,
            catalogMode: stores.catalogMode,
            storeCategory: stores.storeCategory,
            storeCategoryAr: stores.storeCategoryAr,
            selectedProducts: sql<number>`(SELECT count(*)::int FROM ${storeProducts} sp WHERE sp.store_id = ${stores.id})`,
            domain: sql<string | null>`(
              SELECT cd.domain FROM seller_custom_domains cd
              WHERE cd.store_id = ${stores.id} AND cd.status = 'active'
              ORDER BY cd.created_at LIMIT 1
            )`,
          })
          .from(stores)
          .where(and(inArray(stores.sellerId, sellerIds), sql`${stores.deletedAt} IS NULL`))
          .orderBy(desc(stores.isPrimary), asc(stores.createdAt))
      : [];

    const storesBySeller = new Map<string, typeof storeRows>();
    for (const store of storeRows) {
      const list = storesBySeller.get(store.sellerId) ?? [];
      list.push(store);
      storesBySeller.set(store.sellerId, list);
    }

    const requestHeaders = await headers();
    const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
    const proto = requestHeaders.get("x-forwarded-proto") ?? "https";
    const adminOrigin = host ? `${proto}://${host}` : "";

    const keepStatus = STORE_ROW_STATUS[scope];
    const rows: Cell[][] = [];
    for (const seller of sellerRows) {
      const name = seller.ownerName?.trim() || seller.displayName || seller.businessName;
      const phone = [seller.ownerPhone, seller.supportPhone].find(
        (value) => toWhatsAppNumber(value) !== null
      ) ?? seller.ownerPhone ?? seller.supportPhone ?? null;
      const whatsAppNumber = toWhatsAppNumber(phone);
      const whatsAppUrl = buildWhatsAppUrl(phone, buildSellerWelcomeMessage(seller, seller.ownerName));
      const heard = seller.heardAboutUs
        ? isHeardAboutUsSource(seller.heardAboutUs)
          ? HEARD_ABOUT_US_LABELS[seller.heardAboutUs] +
            (seller.heardAboutUsOther?.trim() ? `: ${seller.heardAboutUsOther.trim()}` : "")
          : seller.heardAboutUs
        : null;
      const sellerProducts = Number(seller.productCount ?? 0);
      const sellerStores = storesBySeller.get(seller.id) ?? [];

      const sellerCells = {
        name,
        phone,
        whatsApp: whatsAppUrl && whatsAppNumber ? { text: `+${whatsAppNumber}`, url: whatsAppUrl } : null,
        email: seller.ownerEmail || seller.supportEmail || null,
      };
      const accountCells: Cell[] = [
        sellerProducts,
        sellerStores.length,
        Number(seller.walletBalance ?? 0),
        cairoDate(seller.joinDate),
        cairoDate(seller.lastOrderAt),
        seller.status ? getStatusLabel(seller.status as SellerStatus) : null,
        seller.plan ?? null,
        heard,
        adminOrigin ? { text: "Open", url: `${adminOrigin}/sellers/${seller.id}` } : null,
      ];

      const shown = keepStatus
        ? sellerStores.filter((store) => store.siteStatus === keepStatus)
        : sellerStores;
      if (shown.length === 0) {
        rows.push([
          sellerCells.name, sellerCells.phone, sellerCells.whatsApp, sellerCells.email,
          null, null, null, "No store", null,
          ...accountCells,
        ]);
        continue;
      }
      for (const store of shown) {
        const url = storeUrl(store.subdomain, store.domain);
        rows.push([
          sellerCells.name, sellerCells.phone, sellerCells.whatsApp, sellerCells.email,
          store.name,
          { text: url.replace(/^https?:\/\//, ""), url },
          store.storeCategory?.trim() || store.storeCategoryAr?.trim() || null,
          SITE_STATUS_LABELS[store.siteStatus] ?? store.siteStatus,
          store.catalogMode === "selected" ? Number(store.selectedProducts ?? 0) : sellerProducts,
          ...accountCells,
        ]);
      }
    }

    const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo" }).format(new Date());
    return {
      success: true as const,
      fileName: `tallaby-sellers-${scope.replace("_", "-")}-${day}.xlsx`,
      base64: buildWorkbook(rows),
      sellerCount: sellerRows.length,
      rowCount: rows.length,
    };
  } catch (error) {
    console.error("Error exporting sellers:", error);
    return { success: false as const, error: "Failed to export sellers" };
  }
}
