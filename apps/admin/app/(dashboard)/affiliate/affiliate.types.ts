export type {
  AffiliateFilters,
  AffiliateListRow,
  AffiliateStats,
} from "@/actions/affiliates";

export interface AffiliatesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}
