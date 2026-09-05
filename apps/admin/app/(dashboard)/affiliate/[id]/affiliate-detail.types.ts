export type {
  AffiliateDetail,
  AffiliateLedgerRow,
  AffiliateOrderRow,
} from "@/actions/affiliates";

export interface AffiliateDetailPageProps {
  params: Promise<{ id: string }>;
}
