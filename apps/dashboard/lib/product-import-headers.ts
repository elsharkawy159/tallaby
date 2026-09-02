/**
 * Header contract for the vendor product spreadsheet.
 *
 * `bulkUploadProductsAction` reads sheets through this map, and
 * `PRODUCT_EXCEL_COLUMNS` (lib/product-excel.ts) writes them — keeping both on
 * one map is what makes Export → edit → Import round-trip. `product-excel.test.ts`
 * asserts every exported header normalizes to a key that exists here.
 */
export const normalizeHeaderKey = (key: string) =>
  String(key || "")
    .toLowerCase()
    .replace(/\s+/g, "");

/** Human header (normalized) → internal key. `price.*` keys nest under `price`. */
export const PRODUCT_IMPORT_HEADER_MAP: Record<string, string> = {
  title: "title",
  name: "title",
  sku: "sku",
  description: "description",
  category: "category",
  categoryname: "category",
  brand: "brand",
  brandname: "brand",
  quantity: "quantity",
  stock: "quantity",
  base: "price.base",
  baseprice: "price.base",
  price: "price.base",
  list: "price.list",
  listprice: "price.list",
  final: "price.final",
  finalprice: "price.final",
  discounttype: "price.discountType",
  discountvalue: "price.discountValue",
  images: "images",
  imageurls: "images",
  isactive: "isActive",
  isfeatured: "isFeatured",
  condition: "condition",
  conditiondescription: "conditionDescription",
  fulfillmenttype: "fulfillmentType",
  handlingtime: "handlingTime",
  maxorderquantity: "maxOrderQuantity",
  isplatformchoice: "isPlatformChoice",
  ismostselling: "isMostSelling",
  freedelivery: "freeDelivery",
  taxclass: "taxClass",
};
