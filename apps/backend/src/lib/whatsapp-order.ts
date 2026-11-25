import { dispatchWhatsAppMessages, enqueueOrderWhatsApp, type EnqueueResult } from "@workspace/lib/whatsapp/server";
import type { WhatsAppEvent } from "@workspace/lib/whatsapp";

/**
 * Queue an order's WhatsApp message in-process (ROADMAP.md F-109), then try
 * to send it right away without making the caller wait for Meta; the worker
 * and the dispatch cron pick it up otherwise. Never throws; a no-op while
 * WhatsApp is off or unconfigured.
 */
export async function queueOrderWhatsApp(
  orderId: string,
  event: WhatsAppEvent,
  opts: { byCustomerButton?: boolean } = {},
): Promise<EnqueueResult> {
  const result = await enqueueOrderWhatsApp(orderId, event, opts);
  if (result.queued) void dispatchWhatsAppMessages({ ids: [result.id] });
  return result;
}
