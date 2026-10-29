/** Labels and messages for the admin seller account, stores and wallet panels (P9-01, P9-02). */
import type { AdminAuditAction } from "@workspace/lib/admin";

export const AUDIT_ACTION_LABELS: Record<AdminAuditAction, string> = {
  set_plan: "Plan changed",
  set_store_limit: "Store limit exception",
  set_fee_plan: "Fee plan changed",
  extend_trial: "Trial extended",
  grant_trial: "Trial eligibility granted",
  revoke_trial: "Trial eligibility revoked",
  set_commission_exempt: "Fee exemption changed",
  set_negative_limit: "Wallet negative limit",
  unpublish_store: "Store site unpublished",
  suspend_store: "Store suspended",
  unsuspend_store: "Store unsuspended",
  wallet_adjustment: "Wallet adjustment",
  approve_top_up: "Top-up approved",
  reject_top_up: "Top-up rejected",
  deactivate_coupon: "Coupon deactivated",
  reactivate_coupon: "Coupon reactivated",
  disconnect_integration: "Integration disconnected",
  clear_integration_error: "Integration error cleared",
  remove_domain: "Custom domain removed",
  assign_domain: "Custom domain assigned",
  unpublish_cms_item: "Blog/CMS item unpublished",
  set_ad_status: "Ad request status changed",
  update_template: "Template updated",
  set_default_template: "Default template changed",
  create_blog_post: "Blog post created",
  update_blog_post: "Blog post edited",
  delete_blog_post: "Blog post deleted",
  create_feature_request: "Roadmap card added",
  update_feature_request: "Roadmap card edited",
  set_feature_request_status: "Roadmap card moved",
  hide_feature_request: "Roadmap card hidden",
  unhide_feature_request: "Roadmap card shown again",
  referral_payout_paid: "Affiliate withdrawal paid",
  referral_payout_rejected: "Affiliate withdrawal rejected",
  referral_commissions_reversed: "Affiliate commissions reversed",
  referral_relocked: "Affiliate withdrawals locked again",
  open_store_editor: "Website editor opened",
  publish_store_site: "Website published",
  unpublish_store_site: "Website unpublished",
  restore_store_revision: "Website revision restored to draft",
  discard_store_draft: "Website drafts discarded",
  change_store_page: "Website page changed",
  apply_store_template: "Website template applied or undone",
  update_store_details: "Store details edited",
  update_store_design: "Brand design edited (drafts)",
  update_store_social: "Social links edited",
  update_store_seo: "SEO settings edited",
  create_template: "Template created",
  publish_template_version: "Template version published",
  restore_template_version: "Template version restored",
  delete_template: "Template deleted",
  create_library_section: "Library section created",
  update_library_section: "Library section updated",
  publish_library_section: "Library section published",
  hide_library_section: "Library section hidden",
  delete_library_section: "Library section deleted",
};

export function auditActionLabel(action: string): string {
  return AUDIT_ACTION_LABELS[action as AdminAuditAction] ?? action.replaceAll("_", " ");
}

/** Server error codes → admin-facing messages. */
export const ADMIN_ERROR_MESSAGES: Record<string, string> = {
  not_admin: "Only verified admins can make this change.",
  invalid_input: "Check the values and the reason, then try again.",
  not_found: "Seller or store not found.",
  no_change: "Nothing to change: the value is already set.",
  trial_not_started: "The trial has not started yet. Grant eligibility instead.",
  trial_already_started: "Eligibility can only change before the trial starts.",
  end_not_later: "The new end date must be later than the current one.",
  store_read_only: "Only an active store can be unpublished. Unsuspend or restore it first.",
  not_published: "This store has no published site.",
  wallet_not_active: "The store wallet is not active.",
  generic: "Something went wrong. Try again.",
};

export const adminErrorMessage = (code: string) => ADMIN_ERROR_MESSAGES[code] ?? ADMIN_ERROR_MESSAGES.generic!;

export const STORE_STATUS_CLASSES: Record<string, string> = {
  active: "bg-green-100 text-green-800 hover:bg-green-100",
  archived: "bg-gray-100 text-gray-800 hover:bg-gray-100",
  suspended: "bg-red-100 text-red-800 hover:bg-red-100",
};

export const SITE_STATUS_LABELS: Record<string, string> = {
  draft: "Never published",
  published: "Published",
  unpublished: "Unpublished",
};

export const TRIAL_STATE_LABELS: Record<string, string> = {
  none: "Not eligible",
  not_started: "Eligible, not started",
  active: "Active",
  ended: "Ended",
};

export const WALLET_ENTRY_LABELS: Record<string, string> = {
  sale: "Sale",
  fee: "Platform fee",
  top_up: "Top-up",
  service_charge: "Service charge",
  withdrawal: "Payout",
  adjustment: "Adjustment",
  refund: "Refund",
  fee_reversal: "Fee reversal",
};

/** Compact "key: value" text for audit before/after JSON. */
export function describeChange(value: unknown): string {
  if (!value || typeof value !== "object") return "—";
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) return "—";
  return entries.map(([key, v]) => `${key}: ${v === null ? "none" : String(v)}`).join(", ");
}
