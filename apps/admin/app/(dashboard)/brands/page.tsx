import { BrandsData } from "./brands.data";
import type { BrandsPageProps } from "./brands.types";

export const dynamic = 'force-dynamic';

export default function BrandsPage({ searchParams }: BrandsPageProps) {
  return <BrandsData searchParams={searchParams} />;
}
