import type { Seller, SellerStatus } from "./sellers.types";

export const formatCurrency = (amount: string | number): string => {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numAmount);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getStatusColor = (status: SellerStatus): string => {
  switch (status) {
    case "approved":
      return "bg-green-100 text-green-800 hover:bg-green-100";
    case "pending":
      return "bg-amber-100 text-amber-800 hover:bg-amber-100";
    case "suspended":
      return "bg-red-100 text-red-800 hover:bg-red-100";
    case "restricted":
      return "bg-orange-100 text-orange-800 hover:bg-orange-100";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-100";
  }
};

export const getStatusIcon = (status: SellerStatus): string => {
  switch (status) {
    case "approved":
      return "CheckCircle";
    case "pending":
      return "Clock";
    case "suspended":
      return "Ban";
    case "restricted":
      return "AlertTriangle";
    default:
      return "Circle";
  }
};

export const getStatusLabel = (status: SellerStatus): string => {
  switch (status) {
    case "approved":
      return "Approved";
    case "pending":
      return "Pending";
    case "suspended":
      return "Suspended";
    case "restricted":
      return "Restricted";
    default:
      return "Unknown";
  }
};

export const calculateAverageRating = (seller: Seller): number => {
  if (!seller.storeRating || seller.totalRatings === 0) {
    return 0;
  }
  return seller.storeRating;
};

export const getRatingDisplay = (seller: Seller): string => {
  const rating = calculateAverageRating(seller);
  if (rating === 0) {
    return "N/A";
  }
  return rating.toFixed(1);
};

export const getBusinessTypeOptions = (): {
  value: string;
  label: string;
}[] => {
  return [
    { value: "Sole Proprietorship", label: "Sole Proprietorship" },
    { value: "Partnership", label: "Partnership" },
    { value: "LLC", label: "LLC" },
    { value: "Corporation", label: "Corporation" },
    { value: "Non-Profit", label: "Non-Profit" },
    { value: "Other", label: "Other" },
  ];
};

export const getStatusOptions = (): {
  value: SellerStatus;
  label: string;
}[] => {
  return [
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "suspended", label: "Suspended" },
    { value: "restricted", label: "Restricted" },
  ];
};

export const getSellerLevelOptions = (): { value: string; label: string }[] => {
  return [
    { value: "standard", label: "Standard" },
    { value: "premium", label: "Premium" },
    { value: "enterprise", label: "Enterprise" },
  ];
};

export const canApproveSeller = (seller: Seller): boolean => {
  return seller.status === "pending";
};

export const canSuspendSeller = (seller: Seller): boolean => {
  return seller.status === "approved";
};

export const canReactivateSeller = (seller: Seller): boolean => {
  return seller.status === "suspended";
};

export const getSellerActions = (
  seller: Seller
): Array<{
  action: string;
  label: string;
  variant: "default" | "destructive" | "outline";
  disabled: boolean;
}> => {
  const actions: Array<{
    action: string;
    label: string;
    variant: "default" | "destructive" | "outline";
    disabled: boolean;
  }> = [];

  if (canApproveSeller(seller)) {
    actions.push({
      action: "approve",
      label: "Approve",
      variant: "default",
      disabled: false,
    });
  }

  if (canSuspendSeller(seller)) {
    actions.push({
      action: "suspend",
      label: "Suspend",
      variant: "destructive",
      disabled: false,
    });
  }

  if (canReactivateSeller(seller)) {
    actions.push({
      action: "reactivate",
      label: "Reactivate",
      variant: "default",
      disabled: false,
    });
  }

  return actions;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + "...";
};

export const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .substring(0, 2);
};
