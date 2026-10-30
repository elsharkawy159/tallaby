/**
 * Newsletter subscribers (ROADMAP.md F-16d). Pure, safe on the client.
 *
 * There is no subscribers table: sign-ups are rows of
 * `store_form_submissions` from the store's own sign-up forms (the builder's
 * newsletter sections, footers and pop-ups bind a store form, usually the
 * ready-made "Newsletter sign-up" one). Forms carry no "kind", so a sign-up
 * form is recognised by its fields: it asks for an email and has no long-text
 * (message) field. That matches the newsletter template and leaves out the
 * contact, quote, booking, wholesale and other message forms.
 *
 * One subscriber = one email (or phone, when the row has no email) per store;
 * their latest sign-up decides the status: `archived` = unsubscribed,
 * `new`/`read` = subscribed, `spam` is never listed.
 */
import type { FormField } from "./store-forms.lib";

/** A form that collects sign-ups: an email field and no long-text field. */
export function isSignUpForm(fields: readonly Pick<FormField, "type">[]): boolean {
  return fields.some((f) => f.type === "email") && !fields.some((f) => f.type === "textarea");
}

export const SUBSCRIBER_STATUSES = ["subscribed", "unsubscribed"] as const;
export type SubscriberStatus = (typeof SUBSCRIBER_STATUSES)[number];
export const SUBSCRIBER_FILTERS = ["subscribed", "unsubscribed", "all"] as const;
export type SubscriberFilter = (typeof SUBSCRIBER_FILTERS)[number];

export const parseSubscriberFilter = (value: unknown): SubscriberFilter =>
  SUBSCRIBER_FILTERS.includes(value as SubscriberFilter) ? (value as SubscriberFilter) : "subscribed";

/** Submission status → subscriber status (spam rows never get here). */
export const subscriberStatusOf = (submissionStatus: string): SubscriberStatus =>
  submissionStatus === "archived" ? "unsubscribed" : "subscribed";

export const SUBSCRIBERS_PAGE_SIZE = 50;
/** Most rows one export or audience reads. */
export const SUBSCRIBERS_EXPORT_MAX = 20_000;
/** Most subscribers one unsubscribe / delete touches. */
export const SUBSCRIBERS_ACTION_MAX = 200;

/** Page number from the URL: 1 or more, else 1. */
export function parseSubscriberPage(value: unknown): number {
  const n = typeof value === "string" ? Number.parseInt(value, 10) : typeof value === "number" ? value : NaN;
  return Number.isFinite(n) && n >= 1 ? Math.min(Math.floor(n), 10_000) : 1;
}

/** A search box value for a LIKE pattern: trimmed, capped, with `%`, `_` and `\` escaped. */
export function subscriberSearchPattern(query: string | null | undefined): string | null {
  const value = (query ?? "").trim().slice(0, 100);
  if (!value) return null;
  return `%${value.toLowerCase().replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

export type StoreSubscriber = {
  /** The subscriber's latest submission. */
  id: string;
  /** Lower-cased email, or the phone when the sign-up has no email. */
  identity: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  formName: string;
  status: SubscriberStatus;
  /** Sign-ups of this identity (a returning visitor can sign up twice). */
  signups: number;
  firstAt: string;
  lastAt: string;
};

/** Spreadsheet columns of the subscribers export, in order. */
export const SUBSCRIBER_EXPORT_COLUMNS = ["email", "name", "phone", "status", "form", "signedUp", "lastSignUp"] as const;
export type SubscriberExportColumn = (typeof SUBSCRIBER_EXPORT_COLUMNS)[number];

/** `2026-10-30 14:05` in Cairo time. */
export function cairoStamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Cairo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
}

/** One export row; `statusLabel` is the translated status. */
export function subscriberExportRow(
  subscriber: StoreSubscriber,
  statusLabel: string,
): Record<SubscriberExportColumn, string> {
  return {
    email: subscriber.email ?? "",
    name: subscriber.name ?? "",
    phone: subscriber.phone ?? "",
    status: statusLabel,
    form: subscriber.formName,
    signedUp: cairoStamp(subscriber.firstAt),
    lastSignUp: cairoStamp(subscriber.lastAt),
  };
}
