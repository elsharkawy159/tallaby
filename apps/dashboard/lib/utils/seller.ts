export type SellerStatus = "pending" | "approved" | "suspended" | "restricted";

/**
 * Get the display tone and translation key for a seller status.
 * Callers resolve `sellerStatus.<key>.title` / `.message` via next-intl.
 */
export const getSellerStatusMessage = (status: SellerStatus) => {
  switch (status) {
    case "pending":
      return { type: "warning" as const, key: "pending" as const };
    case "approved":
      return { type: "success" as const, key: "approved" as const };
    case "suspended":
      return { type: "error" as const, key: "suspended" as const };
    case "restricted":
      return { type: "warning" as const, key: "restricted" as const };
    default:
      return { type: "info" as const, key: "unknown" as const };
  }
};
