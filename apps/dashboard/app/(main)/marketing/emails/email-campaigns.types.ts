/** Error codes of Marketing › Email campaigns actions; each has a string under `emailCampaigns.errors`. */
export type CampaignActionError =
  | "notFound"
  | "readOnly"
  | "generic"
  | "notDraft"
  | "storeOffline"
  | "dailyLimit"
  | "noRecipients"
  | "subjectRequired"
  | "bodyRequired"
  | "subjectLink"
  | "bodyLink"
  | "ctaLink"
  | "scheduleInvalid"
  | "testLimit"
  | "noEmail"
  | "notConfigured"
  | "sendFailed";

export type CampaignActionResult<T = null> = { success: true; data: T } | { success: false; error: CampaignActionError };
