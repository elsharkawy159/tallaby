import { redirect } from "next/navigation";

/** The brands list is gone from the dashboard (products no longer have a brand field); old links land on Categories. */
export default function SellerBrandsPage() {
  redirect("/products/categories");
}
