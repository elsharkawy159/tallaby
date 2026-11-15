"use client";

import { cn } from "@workspace/ui/lib/utils";
import {
  SELLER_NOTIFICATION_TEMPLATES,
  type SellerMessageLanguage,
} from "./seller-notification-templates.lib";

const chip = (active: boolean) =>
  cn(
    "rounded-full border px-2.5 py-0.5 text-xs transition-colors hover:bg-muted",
    active && "border-primary bg-primary/10 text-primary",
  );

/**
 * Template and language chips for an admin → seller message. Choosing either
 * calls `onPick`, which fills the form; the admin can still edit the text.
 */
export function TemplatePicker({
  templateId,
  language,
  onPick,
  disabled,
}: {
  templateId: string | null;
  language: SellerMessageLanguage;
  onPick: (templateId: string | null, language: SellerMessageLanguage) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Template">
        <button type="button" disabled={disabled} onClick={() => onPick(null, language)} className={chip(templateId === null)}>
          Blank
        </button>
        {SELLER_NOTIFICATION_TEMPLATES.map((template) => (
          <button
            key={template.id}
            type="button"
            disabled={disabled}
            onClick={() => onPick(template.id, language)}
            className={chip(templateId === template.id)}
          >
            {template.topic}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground" role="group" aria-label="Language">
        Language:
        {(["ar", "en"] as const).map((value) => (
          <button
            key={value}
            type="button"
            disabled={disabled}
            onClick={() => onPick(templateId, value)}
            className={chip(language === value)}
          >
            {value === "ar" ? "Arabic" : "English"}
          </button>
        ))}
      </div>
    </div>
  );
}
