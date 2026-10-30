import webpush from "web-push";
import { logServerError } from "@workspace/db/log";
import { isGonePushStatus, PUSH_TTL_SECONDS, type PushPayload, type VapidConfig } from "./push.lib";

/** One push to one saved device. `id` is the subscription row id. */
export type WebPushJob = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  payload: PushPayload;
  urgent: boolean;
};

export type WebPushOutcome = {
  sent: number;
  failed: number;
  /** Subscription rows that worked (callers stamp last_success_at). */
  okIds: string[];
  /** Subscription rows the push service says are gone (callers delete them). */
  goneIds: string[];
};

type SendOutcome = "sent" | "gone" | "failed";

async function sendOne(config: VapidConfig, job: WebPushJob, label: string): Promise<SendOutcome> {
  try {
    await webpush.sendNotification(
      { endpoint: job.endpoint, keys: { p256dh: job.p256dh, auth: job.auth } },
      JSON.stringify(job.payload),
      {
        vapidDetails: { subject: config.subject, publicKey: config.publicKey, privateKey: config.privateKey },
        TTL: PUSH_TTL_SECONDS,
        urgency: job.urgent ? "high" : "normal",
        timeout: 10_000,
      },
    );
    return "sent";
  } catch (error) {
    const statusCode = (error as { statusCode?: unknown })?.statusCode;
    if (isGonePushStatus(statusCode)) return "gone";
    logServerError("integration", `${label} push failed`, { statusCode: typeof statusCode === "number" ? statusCode : null }, error);
    return "failed";
  }
}

/** Sends every job, 10 at a time. Never throws for a single failed device. */
export async function sendWebPushes(config: VapidConfig, jobs: WebPushJob[], label: string): Promise<WebPushOutcome> {
  const okIds = new Set<string>();
  const goneIds = new Set<string>();
  let sent = 0;
  let failed = 0;
  const CONCURRENCY = 10;
  for (let i = 0; i < jobs.length; i += CONCURRENCY) {
    const batch = jobs.slice(i, i + CONCURRENCY);
    const outcomes = await Promise.all(batch.map((job) => sendOne(config, job, label)));
    outcomes.forEach((outcome, index) => {
      const id = batch[index]!.id;
      if (outcome === "sent") {
        okIds.add(id);
        sent += 1;
      } else if (outcome === "gone") goneIds.add(id);
      else failed += 1;
    });
  }
  return { sent, failed, okIds: [...okIds], goneIds: [...goneIds] };
}
