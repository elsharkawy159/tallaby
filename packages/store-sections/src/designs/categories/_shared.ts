/** Default category names for the category designs; the seller renames them and picks the photos. */
import { L } from "../_kit";

export const CATEGORY_NAMES = [
  L("وصل حديثًا", "New in"),
  L("الأكثر مبيعًا", "Best sellers"),
  L("العروض", "Offers"),
  L("هدايا", "Gifts"),
  L("إكسسوارات", "Accessories"),
  L("أساسيات", "Essentials"),
  L("مجموعات", "Bundles"),
  L("الموسم الجديد", "New season"),
] as const;

export const CATEGORY_LINK = "/products";
