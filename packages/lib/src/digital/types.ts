export type DigitalProductType =
  | "digital_download"
  | "ebook"
  | "template"
  | "design_asset"
  | "audio"
  | "video"
  | "course"
  | "ai_prompt"
  | "software"
  | "font"
  | "printable"
  | "game_asset"
  | "gift_card"
  | "license_key"
  | "external_access"
  | "bundle";

export type DigitalDeliveryMethod = "automatic" | "manual";

export type DigitalFulfillmentStatus =
  | "pending"
  | "delivered"
  | "downloaded"
  | "expired"
  | "revoked"
  | "failed";

export type DigitalAccessAction =
  | "grant"
  | "download"
  | "view"
  | "resend"
  | "revoke"
  | "reinstate";

export type LicenseKeyStatus = "available" | "reserved" | "assigned" | "revoked";

/** Whether this digital type is backed by uploaded files (vs. a key, URL, or bundle). */
export const FILE_BASED_DIGITAL_TYPES: DigitalProductType[] = [
  "digital_download",
  "ebook",
  "template",
  "design_asset",
  "audio",
  "video",
  "course",
  "ai_prompt",
  "software",
  "font",
  "printable",
  "game_asset",
];

export const KEY_BASED_DIGITAL_TYPES: DigitalProductType[] = ["gift_card", "license_key"];

export const DIGITAL_PRODUCT_TYPE_GROUPS: Array<{
  group: string;
  types: DigitalProductType[];
}> = [
  {
    group: "Files & Media",
    types: ["digital_download", "ebook", "template", "design_asset", "audio", "video", "font", "printable", "game_asset"],
  },
  { group: "Software & Prompts", types: ["software", "ai_prompt"] },
  { group: "Learning", types: ["course"] },
  { group: "Keys & Access", types: ["gift_card", "license_key", "external_access"] },
  { group: "Bundles", types: ["bundle"] },
];

export const DIGITAL_PRODUCT_TYPE_LABELS: Record<DigitalProductType, string> = {
  digital_download: "Digital File / Download",
  ebook: "Ebook / Guide",
  template: "Template",
  design_asset: "Design Asset",
  audio: "Audio",
  video: "Video",
  course: "Course",
  ai_prompt: "AI Prompt / Workflow",
  software: "Software / Code / Plugin / Theme",
  font: "Font",
  printable: "Printable",
  game_asset: "Game Asset",
  gift_card: "Gift Card / Digital Card",
  license_key: "License Key / Activation Code",
  external_access: "External Access / URL",
  bundle: "Digital Bundle",
};

export interface DigitalDeliveryFile {
  name: string;
  url: string;
  fileType?: string | null;
  fileSize?: number | null;
}

/** Content resolved for a single access/download request, ready to hand to the buyer. */
export interface DigitalDeliveryPayload {
  digitalType: DigitalProductType;
  files: DigitalDeliveryFile[];
  licenseKey?: string | null;
  externalUrl?: string | null;
  accessInstructions?: string | null;
  courseContent?: unknown;
}
