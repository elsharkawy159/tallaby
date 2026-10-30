/**
 * Store phone blocklist rules (ROADMAP.md F-02, 0118). Pure, safe on the client.
 *
 * Every spelling of an Egyptian mobile (`010…`, `+2010…`, `2010…`, `002010…`,
 * spaces, dashes, Arabic digits) becomes `01XXXXXXXXX`, the form stored in
 * `store_blocked_phones.phone`, so a blocked number matches however the
 * customer types it at checkout.
 */
import { z } from "zod";

const EG_MOBILE_RE = /^01[0125][0-9]{8}$/;

/** Arabic-Indic and Persian digits → ASCII. */
function asciiDigits(input: string): string {
  return input.replace(/[٠-٩۰-۹]/g, (d) => String((d.charCodeAt(0) & 0xf) % 10));
}

/** `+20 101 234 5678` → `01012345678`; null when it is not an Egyptian mobile. */
export function normalizeBlockedPhone(input: string): string | null {
  let digits = asciiDigits(input).replace(/\D/g, "");
  if (digits.startsWith("0020")) digits = digits.slice(4);
  else if (digits.startsWith("20") && digits.length === 12) digits = digits.slice(2);
  if (digits.length === 10 && digits.startsWith("1")) digits = `0${digits}`;
  return EG_MOBILE_RE.test(digits) ? digits : null;
}

export const BLOCKED_PHONE_REASON_MAX = 300;

export const blockPhoneSchema = z.object({
  phone: z
    .string()
    .max(40)
    .transform((value, ctx) => {
      const phone = normalizeBlockedPhone(value);
      if (!phone) {
        ctx.addIssue({ code: "custom", message: "phone_invalid" });
        return z.NEVER;
      }
      return phone;
    }),
  reason: z
    .string()
    .trim()
    .max(BLOCKED_PHONE_REASON_MAX)
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export type BlockPhoneInput = z.input<typeof blockPhoneSchema>;
