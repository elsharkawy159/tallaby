export type {
  AffiliateFilters,
  AffiliateListRow,
  AffiliateStats,
} from "@/actions/affiliates";

export interface AffiliatesPageProps {
  searchParams?: Promise<{
    status?: string;
    performance?: string;
    earnings?: string;
    search?: string;
  }>;
}
