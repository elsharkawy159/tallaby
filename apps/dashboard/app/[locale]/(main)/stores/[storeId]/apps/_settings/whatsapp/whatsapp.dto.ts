import { z } from "zod";
import { WHATSAPP_EVENTS, WHATSAPP_MESSAGE_STATUSES } from "@workspace/lib/whatsapp/events";

/** Error keys live under `whatsappApp.errors`. */
export type WhatsAppAppErrorKey = "disabled" | "invalid" | "noEvents" | "notFound" | "readOnly" | "rateLimited" | "generic";

export type WhatsAppAppResult<T> = { success: true; data: T } | { success: false; error: WhatsAppAppErrorKey };

/** What the settings form sends. The store comes from the explicit `storeId`, checked again on the server. */
export const whatsAppSettingsInputSchema = z.strictObject({
  enabled: z.boolean(),
  events: z.array(z.enum(WHATSAPP_EVENTS)).max(WHATSAPP_EVENTS.length),
});
export type WhatsAppSettingsInput = z.infer<typeof whatsAppSettingsInputSchema>;

/** The message history's page and filters. Empty filter = all. */
export const whatsAppMessagesQuerySchema = z.strictObject({
  page: z.number().int().min(1).max(10_000),
  status: z.enum(WHATSAPP_MESSAGE_STATUSES).nullable(),
  event: z.enum(WHATSAPP_EVENTS).nullable(),
});
export type WhatsAppMessagesQuery = z.infer<typeof whatsAppMessagesQuerySchema>;
