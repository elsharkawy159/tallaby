export type CatalogProduct = {
  id: string;
  status: "draft" | "pending" | "active" | "rejected";
  title: { ar: string; en: string };
  image: string | null;
  price: number | null;
};

export type CatalogMode = "all" | "selected";

/** Error keys: `storeSettings.errors.*` for the shared ones, `storeSettings.catalog.*` for the rest. */
export type CatalogErrorKey = "invalidInput" | "readOnly" | "notFound" | "generic" | "emptySelection" | "invalidProduct";

export type CatalogSaveResult = { success: true } | { success: false; error: CatalogErrorKey };
