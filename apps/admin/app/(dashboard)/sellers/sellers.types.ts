export type SellerStatus = "pending" | "approved" | "suspended" | "restricted";

export interface Seller {
  id: string;
  businessName: string;
  displayName: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  taxId?: string | null;
  businessType: string;
  registrationNumber?: string | null;
  legalAddress: any;
  status: SellerStatus | null;
  verificationDetails?: Record<string, any> | null;
  returnPolicy?: string | null;
  shippingPolicy?: string | null;
  isVerified: boolean;
  approvedCategories?: string[] | null;
  supportEmail: string;
  supportPhone?: string | null;
  commissionRate: number;
  feeStructure?: Record<string, any> | null;
  taxInformation?: Record<string, any> | null;
  paymentDetails?: Record<string, any> | null;
  storeRating?: number | null;
  positiveRatingPercent?: number | null;
  totalRatings: number;
  productCount: number;
  fulfillmentOptions?: string[] | null;
  payoutSchedule: string;
  lastPayoutDate?: string | null;
  lastPayoutAmount?: string | null;
  walletBalance: string;
  stripeAccountId?: string | null;
  externalIds?: Record<string, any> | null;
  sellerLevel: string;
  joinDate: string;
  sellerMetrics?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface SellerFilters {
  status?: SellerStatus;
  businessType?: string;
  isVerified?: boolean;
  search?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export interface SellerStats {
  totalSellers: number;
  activeSellers: number;
  pendingSellers: number;
  suspendedSellers: number;
  totalProducts: number;
  totalRevenue: number;
}

export interface SellerActionData {
  sellerId: string;
  action: "approve" | "suspend" | "reactivate" | "reject";
  reason?: string;
}

export interface SellersPageProps {
  searchParams?: {
    status?: string;
    search?: string;
    page?: string;
    limit?: string;
  };
}
