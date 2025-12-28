import { CategoriesData } from "./categories.data";
import type { CategoriesPageProps } from "./categories.types";

export const dynamic = 'force-dynamic';

export default function CategoriesPage({ searchParams }: CategoriesPageProps) {
  return <CategoriesData searchParams={searchParams} />;
}
