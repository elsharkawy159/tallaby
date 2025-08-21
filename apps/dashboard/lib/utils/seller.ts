export type SellerStatus = "pending" | "approved" | "suspended" | "restricted";

/**
 * Get display message for seller status
 * @param status - The seller status
 * @returns Object with message type and text
 */
export const getSellerStatusMessage = (status: SellerStatus) => {
  switch (status) {
    case "pending":
      return {
        type: "warning" as const,
        title: "Account Under Review",
        message:
          "Your seller account is currently being reviewed. You'll receive an email once it's approved.",
      };
    case "approved":
      return {
        type: "success" as const,
        title: "Account Approved",
        message: "Your seller account is active and ready to use.",
      };
    case "suspended":
      return {
        type: "error" as const,
        title: "Account Suspended",
        message:
          "Your seller account has been suspended. Please contact support for assistance.",
      };
    case "restricted":
      return {
        type: "warning" as const,
        title: "Account Restricted",
        message:
          "Your seller account has limited access. Please contact support for more information.",
      };
    default:
      return {
        type: "info" as const,
        title: "Unknown Status",
        message: "Please contact support for account status information.",
      };
  }
};
