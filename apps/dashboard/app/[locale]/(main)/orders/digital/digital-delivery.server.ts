"use server";

import { revalidateDashboardPath } from "@/lib/i18n/revalidate-dashboard-path.server";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { isAccessError, requireOrdersStore } from "@/lib/auth/require-seller.server";
import {
  buildDigitalWhatsAppLink,
  confirmDigitalOrderPayment,
  createMissingDigitalLinks,
  getDigitalDeliveryView,
  issueNewDigitalLink,
  readDigitalLink,
  type DigitalDeliveryError,
  type DigitalDeliveryView,
} from "./digital-delivery.query";

/**
 * The order screen's "Digital delivery" actions (ROADMAP.md F-108d). Every
 * action takes the order's store id explicitly and checks it against the
 * session seller (requireOrdersStore, which also applies the F-84 order
 * lock); the query module then checks the order is in that store and every
 * line is the seller's. Client ids are never trusted beyond that. Links are
 * returned only from the "send" and "copy" actions, never logged or cached.
 */

const orderInput = z.object({ storeId: z.uuid(), orderId: z.uuid() });
const linkInput = orderInput.extend({ digitalOrderId: z.uuid() });
const newLinkInput = linkInput.extend({ email: z.boolean().optional() });

export type DigitalViewResult = { success: true; view: DigitalDeliveryView; emailed?: boolean } | { success: false; error: string };
export type DigitalLinkResult = { success: true; url: string } | { success: false; error: string };

async function errorText(key: DigitalDeliveryError | "generic"): Promise<string> {
  const t = await getTranslations("orders.digital.errors");
  return t(key);
}

async function fail(error: unknown, where: string): Promise<{ success: false; error: string }> {
  if (isAccessError(error) || error instanceof z.ZodError) return { success: false, error: await errorText("not_found") };
  console.error(`[digital-delivery] ${where} failed`, (error as Error)?.message);
  return { success: false, error: await errorText("generic") };
}

/** The panel's state; null when the order has no digital part this seller can deliver. */
export async function loadDigitalDelivery(input: unknown): Promise<DigitalDeliveryView | null> {
  try {
    const { storeId, orderId } = orderInput.parse(input);
    const { seller } = await requireOrdersStore(storeId);
    return await getDigitalDeliveryView(seller.sellerId, storeId, orderId);
  } catch (error) {
    if (!isAccessError(error) && !(error instanceof z.ZodError)) {
      console.error("[digital-delivery] load failed", (error as Error)?.message);
    }
    return null;
  }
}

/** "Payment received": marks the transfer paid and makes the links (idempotent). */
export async function confirmDigitalPayment(input: unknown): Promise<DigitalViewResult> {
  try {
    const { storeId, orderId } = orderInput.parse(input);
    const { seller } = await requireOrdersStore(storeId);
    const result = await confirmDigitalOrderPayment(seller.sellerId, storeId, orderId, seller.userId);
    if (!result.ok) return { success: false, error: await errorText(result.error) };
    revalidateDashboardPath("/orders", "layout");
    return { success: true, view: result.view };
  } catch (error) {
    return fail(error, "confirm payment");
  }
}

/** "Create links": a paid order whose links were never made. */
export async function createDigitalLinks(input: unknown): Promise<DigitalViewResult> {
  try {
    const { storeId, orderId } = orderInput.parse(input);
    const { seller } = await requireOrdersStore(storeId);
    const result = await createMissingDigitalLinks(seller.sellerId, storeId, orderId, seller.userId);
    if (!result.ok) return { success: false, error: await errorText(result.error) };
    return { success: true, view: result.view };
  } catch (error) {
    return fail(error, "create links");
  }
}

/** "Send on WhatsApp": the wa.me link with every usable download link. */
export async function getDigitalWhatsAppLink(input: unknown): Promise<DigitalLinkResult> {
  try {
    const { storeId, orderId } = orderInput.parse(input);
    const { seller } = await requireOrdersStore(storeId);
    const result = await buildDigitalWhatsAppLink(seller.sellerId, storeId, orderId);
    return result.ok ? { success: true, url: result.url } : { success: false, error: await errorText(result.error) };
  } catch (error) {
    return fail(error, "whatsapp link");
  }
}

/** "Copy link": one usable download link. */
export async function getDigitalLink(input: unknown): Promise<DigitalLinkResult> {
  try {
    const { storeId, orderId, digitalOrderId } = linkInput.parse(input);
    const { seller } = await requireOrdersStore(storeId);
    const result = await readDigitalLink(seller.sellerId, storeId, orderId, digitalOrderId);
    return result.ok ? { success: true, url: result.url } : { success: false, error: await errorText(result.error) };
  } catch (error) {
    return fail(error, "copy link");
  }
}

/** "New link" / "Email a new link": the old link stops working. */
export async function makeNewDigitalLink(input: unknown): Promise<DigitalViewResult> {
  try {
    const { storeId, orderId, digitalOrderId, email } = newLinkInput.parse(input);
    const { seller } = await requireOrdersStore(storeId);
    const result = await issueNewDigitalLink(seller.sellerId, storeId, orderId, digitalOrderId, seller.userId, { email });
    if (!result.ok) return { success: false, error: await errorText(result.error) };
    return { success: true, view: result.view, emailed: result.emailed };
  } catch (error) {
    return fail(error, "new link");
  }
}
