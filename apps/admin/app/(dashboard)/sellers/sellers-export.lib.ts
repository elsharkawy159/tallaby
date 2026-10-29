/** Website scopes of the sellers export (sellers-export.server.ts). */
export const SELLER_EXPORT_SCOPES = [
  "all",
  "published",
  "unpublished",
  "draft",
  "not_published",
  "no_store",
] as const;

export type SellerExportScope = (typeof SELLER_EXPORT_SCOPES)[number];

export const SELLER_EXPORT_SCOPE_OPTIONS: Array<{
  value: SellerExportScope;
  label: string;
  description: string;
}> = [
  { value: "all", label: "All sellers", description: "Every store of every seller" },
  { value: "published", label: "Published stores", description: "Only stores whose website is live" },
  { value: "unpublished", label: "Switched-off stores", description: "Stores the seller unpublished" },
  { value: "draft", label: "Never-published stores", description: "Stores still in draft" },
  { value: "not_published", label: "Sellers with no live website", description: "No published store at all" },
  { value: "no_store", label: "Sellers with no store", description: "Signed up, never made a store" },
];
