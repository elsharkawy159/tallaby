import type { ReactElement } from "react";
import { sendEmail } from "../resend";
import {
  claimEmailDelivery,
  markEmailSent,
  releaseFailedEmailDelivery,
  type EmailType,
} from "../email-delivery";

export type SendOnceResult =
  | { status: "sent"; emailId: string | null }
  | { status: "duplicate" }
  | { status: "skipped"; reason: string };

/**
 * Sends one lifecycle email at most once per (type, reference): the
 * `email_deliveries` claim stops retries and concurrent callers, and the
 * Resend idempotency key catches anything that slips past it. A failed send
 * releases the claim so a later call can try again.
 */
export async function sendOnce(params: {
  emailType: EmailType;
  referenceId: string;
  recipient: string;
  subject: string;
  content: ReactElement;
  from?: string;
  fromName?: string;
  replyTo?: string;
  metadata?: Record<string, unknown>;
}): Promise<SendOnceResult> {
  const claim = await claimEmailDelivery({
    emailType: params.emailType,
    referenceId: params.referenceId,
    recipient: params.recipient,
    ...(params.metadata ? { metadata: params.metadata } : {}),
  });
  if (!claim.claimed) return { status: "duplicate" };

  try {
    const { id } = await sendEmail({
      to: params.recipient,
      subject: params.subject,
      content: params.content,
      ...(params.from ? { from: params.from } : {}),
      ...(params.fromName ? { fromName: params.fromName } : {}),
      ...(params.replyTo ? { replyTo: params.replyTo } : {}),
      idempotencyKey: `${params.emailType}:${params.referenceId}`,
    });
    await markEmailSent(claim.delivery.id, id);
    return { status: "sent", emailId: id };
  } catch (error) {
    await releaseFailedEmailDelivery(
      claim.delivery.id,
      error instanceof Error ? error.message : String(error),
    ).catch((releaseError) => {
      console.error(`email ${params.emailType}: claim release failed`, releaseError);
    });
    throw error;
  }
}
