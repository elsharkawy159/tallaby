/**
 * Resend provider client for transactional email.
 *
 * Named after the provider on purpose: marketing mail may go through a
 * different provider (e.g. Sender) later, and each provider gets its own
 * module rather than one generic "sender".
 */
import { render } from "@react-email/render";
import { Resend } from "resend";
import type { ReactElement } from "react";

const DEFAULT_FROM_NAME = "Tallaby";
const DEFAULT_FROM_ADDRESS = "info@tallaby.com";

/** Verified sender used for order/transactional mail on the orders stream. */
export const ORDERS_FROM_ADDRESS =
  process.env.EMAIL_FROM_ORDERS || "orders@tallaby.com";

function buildFrom(address?: string, name?: string): string {
  const fromAddress = address || process.env.EMAIL_FROM || DEFAULT_FROM_ADDRESS;
  const fromName =
    name || process.env.EMAIL_FROM_NAME || DEFAULT_FROM_NAME;
  return `${fromName} <${fromAddress}>`;
}

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY environment variable is not set. Please configure it in your environment."
    );
  }
  return new Resend(apiKey);
}

export interface SendEmailParams {
  to: string;
  subject: string;
  content: ReactElement;
  /** Overrides the default sender address (must be on a verified domain). */
  from?: string;
  fromName?: string;
  replyTo?: string;
  /**
   * Forwarded to Resend as `Idempotency-Key`. A retry with the same key
   * returns the original send instead of delivering a second copy.
   */
  idempotencyKey?: string;
}

export interface SendEmailResult {
  /** Resend's email id — correlates this send with its webhook events. */
  id: string | null;
}

export async function sendEmail({
  to,
  subject,
  content,
  from,
  fromName,
  replyTo,
  idempotencyKey,
}: SendEmailParams): Promise<SendEmailResult> {
  const resend = getResendClient();
  const html = await render(content);
  const text = await render(content, { plainText: true });

  const { data, error } = await resend.emails.send(
    {
      from: buildFrom(from, fromName),
      to,
      subject,
      html,
      text,
      ...(replyTo ? { replyTo } : {}),
    },
    idempotencyKey ? { idempotencyKey } : undefined
  );

  if (error) {
    throw new Error(`Resend send failed: ${error.name}: ${error.message}`);
  }

  return { id: data?.id ?? null };
}
