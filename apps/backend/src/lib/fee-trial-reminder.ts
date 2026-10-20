import { db, eq, sellers, users } from "@workspace/db";
import { logServerError } from "@workspace/db/log";
import { feeTrialReminderStage, type FeeTrialReminderStage } from "@workspace/lib/sellers";
import {
  FeeTrialReminderEmail,
  getEmailMessages,
  resolveEmailLocale,
} from "@workspace/emails";
import { sendEmail } from "./resend";
import {
  claimEmailDelivery,
  EMAIL_TYPES,
  markEmailSent,
  releaseFailedEmailDelivery,
} from "./email-delivery";

const DASHBOARD_URL = process.env.DASHBOARD_URL || "https://dashboard.tallaby.com/";

export type FeeTrialReminderResult =
  | { status: "sent"; emailId: string | null }
  | { status: "duplicate" }
  | { status: "skipped"; reason: "not_found" | "not_due" | "no_email" };

/**
 * Sends one fee trial reminder (PLAN.md §13.5, P6-07). The seller is re-read
 * so the email always matches the stored trial, the stage must actually be
 * due now, and the `email_deliveries` claim makes each stage go out once per
 * seller however often the cron calls this.
 */
export async function sendFeeTrialReminder(
  sellerId: string,
  stage: FeeTrialReminderStage,
): Promise<FeeTrialReminderResult> {
  const [row] = await db
    .select({
      displayName: sellers.displayName,
      supportEmail: sellers.supportEmail,
      endsAt: sellers.feeTrialEndsAt,
      email: users.email,
      fullName: users.fullName,
      preferredLanguage: users.preferredLanguage,
    })
    .from(sellers)
    .innerJoin(users, eq(users.id, sellers.id))
    .where(eq(sellers.id, sellerId));

  if (!row) return { status: "skipped", reason: "not_found" };
  if (feeTrialReminderStage(row.endsAt) !== stage) return { status: "skipped", reason: "not_due" };

  const recipient = row.email?.trim() || row.supportEmail?.trim();
  if (!recipient) return { status: "skipped", reason: "no_email" };

  const claim = await claimEmailDelivery({
    emailType: stage === "t1" ? EMAIL_TYPES.feeTrialReminderT1 : EMAIL_TYPES.feeTrialReminderT7,
    referenceId: sellerId,
    recipient,
    metadata: { endsAt: row.endsAt },
  });
  if (!claim.claimed) return { status: "duplicate" };

  try {
    const locale = resolveEmailLocale(row.preferredLanguage);
    const copy = getEmailMessages(locale).feeTrialReminder;
    const { id } = await sendEmail({
      to: recipient,
      subject: stage === "t1" ? copy.subjectT1 : copy.subjectT7,
      content: FeeTrialReminderEmail({
        sellerName: row.fullName?.trim() || row.displayName,
        stage,
        endsAt: new Date(row.endsAt!).toISOString(),
        dashboardUrl: DASHBOARD_URL,
        locale,
      }),
      idempotencyKey: `fee-trial-reminder:${stage}:${sellerId}`,
    });
    await markEmailSent(claim.delivery.id, id);
    return { status: "sent", emailId: id };
  } catch (error) {
    await releaseFailedEmailDelivery(
      claim.delivery.id,
      error instanceof Error ? error.message : String(error),
    ).catch((releaseError) => {
      logServerError("fee", "trial reminder claim release failed", { sellerId, stage }, releaseError);
    });
    throw error;
  }
}
