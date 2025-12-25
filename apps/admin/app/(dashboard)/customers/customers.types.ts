export interface Customer {
  id: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  email: string;
  phone: string | null;
  role: string;
  avatarUrl: string | null;
  isVerified: boolean;
  isSuspended: boolean;
  isGuest: boolean;
  lastLoginAt: string | null;
  timezone: string | null;
  preferredLanguage: string | null;
  referralCode: string | null;
  referredBy: string | null;
  defaultCurrency: string | null;
  receiveMarketingEmails: boolean;
  hasTwoFactorAuth: boolean;
  twoFactorMethod: string | null;
  createdAt: string;
  updatedAt: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string | null;
}

export interface CustomerWithDetails extends Customer {
  orders?: Array<{
    id: string;
    orderNumber: string;
    totalAmount: number;
    status: string;
    createdAt: string;
  }>;
  stats?: {
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
  };
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
  searchParams?: {
    role?: string;
    isVerified?: string;
    isSuspended?: string;
    search?: string;
    page?: string;
    limit?: string;
  };
}
