import {
  TEMPLATE_EXAMPLES,
  renderTemplatePreview,
  templateForEvent,
} from "@workspace/lib/whatsapp/templates";
import type { WhatsAppEvent, WhatsAppLocale } from "@workspace/lib/whatsapp/events";

/**
 * The seller's preview of one event's message (docs/whatsapp.md §5): the code
 * template, filled with the store's name and a sample order. `order_placed`
 * shows the version with the confirm and cancel buttons (a pending order).
 */
export function whatsAppEventPreview(event: WhatsAppEvent, locale: WhatsAppLocale, storeName: string): string {
  const template = templateForEvent(event, "pending");
  const sample = TEMPLATE_EXAMPLES[locale];
  return renderTemplatePreview(template, locale, { ...sample, store_name: storeName.trim() || sample.store_name });
}
