export interface CustomerAddress {
  id: string;
  userId: string;
  addressType: "shipping" | "billing" | "both" | null;
  fullName: string;
  phone: string;
  company: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean | null;
  isBusinessAddress: boolean | null;
  deliveryInstructions: string | null;
  accessCode: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface Customer {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  avatarUrl: string | null;
  isVerified: boolean | null;
  isSuspended: boolean | null;
  isGuest: boolean;
  lastLoginAt: string | null;
  timezone: string | null;
  preferredLanguage: string | null;
  referralCode: string | null;
  referredBy: string | null;
  defaultCurrency: string | null;
  receiveMarketingEmails: boolean | null;
  hasTwoFactorAuth: boolean | null;
  twoFactorMethod: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  isAvailable: boolean | null;
  totalOrders?: number;
  totalSpent?: number;
  lastOrderDate?: string | null;
  addresses?: CustomerAddress[];
}

export interface CustomerWithDetails extends Customer {
  orders?: Array<{
    id: string;
    orderNumber: string;
    totalAmount: string | number;
    status: string | null;
    createdAt: string | null;
    [key: string]: unknown;
  }>;
  stats?: {
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
  };
  addresses?: CustomerAddress[];
}

export interface CustomerStats {
  totalCustomers: number;
  verifiedCustomers: number;
  newCustomersThisMonth: number;
  totalRevenue: number;
  averageSpendPerCustomer: number;
  averageOrderValue: number;
}

export interface CustomersPageProps {
  /** Next.js 16 passes searchParams as a Promise; it must be awaited. */
  searchParams?: Promise<{
    role?: string;
    isVerified?: string;
    isSuspended?: string;
    search?: string;
    page?: string;
    limit?: string;
  }>;
}
