import { buildTelUrl, buildWhatsAppUrl } from "@workspace/ui/lib/contact";

/**
 * The contact buttons of an order card's "Quick actions" (phones). WhatsApp
 * opens the store's ask-to-confirm message when the order has one, otherwise
 * a plain chat with the order number; both need a phone.
 */
export function orderQuickContacts({
  phone,
  confirmMessage,
  chatText,
}: {
  phone: string | null | undefined;
  /** The order's ask-to-confirm message, when it still needs confirming. */
  confirmMessage: string | null | undefined;
  /** Text of the plain chat ("Hi, about your order #…"). */
  chatText: string;
}): { whatsapp: { url: string; ask: boolean } | null; tel: string | null } {
  const askUrl = confirmMessage ? buildWhatsAppUrl(phone, confirmMessage) : null;
  const chatUrl = askUrl ? null : buildWhatsAppUrl(phone, chatText);
  return {
    whatsapp: askUrl ? { url: askUrl, ask: true } : chatUrl ? { url: chatUrl, ask: false } : null,
    tel: buildTelUrl(phone),
  };
}
