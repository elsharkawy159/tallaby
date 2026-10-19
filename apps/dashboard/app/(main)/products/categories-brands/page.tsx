import { redirect } from "next/navigation";

/** The old combined page; categories and brands now have their own pages. */
export default function CategoriesBrandsPage() {
  redirect("/products/categories");
}
