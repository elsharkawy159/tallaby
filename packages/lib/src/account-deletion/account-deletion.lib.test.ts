import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  ACCOUNT_DELETION_DAYS,
  ACCOUNT_DELETION_NOTE_MAX,
  ACCOUNT_DELETION_REASON_MAX,
  ACCOUNT_DELETION_STATUSES,
  ACCOUNT_DELETION_SUPPORT_EMAIL,
  accountDeletionDueDate,
  accountDeletionRequestSchema,
  accountRestoreSchema,
  canRestoreAccountDeletion,
  clipText,
  isAccountDeletionStatus,
  isAuthUserMissingError,
  restoredSellerStatus,
} from "./account-deletion.lib";
import { ADMIN_NOTIFICATION_TYPES, adminNotificationHref } from "../notifications/notifications.lib";
import { ADMIN_AUDIT_ACTIONS } from "../admin/admin.lib";

const REQ = "11111111-2222-4333-8444-555555555555";
const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), "utf8");
const migration = read("../../../db/migrations/0157_account_deletion_requests.sql");

describe("accountDeletionRequestSchema", () => {
  it("needs the confirmation checkbox", () => {
    expect(accountDeletionRequestSchema.safeParse({ reason: "x" }).success).toBe(false);
    expect(accountDeletionRequestSchema.safeParse({ confirmed: false }).success).toBe(false);
    expect(accountDeletionRequestSchema.safeParse({ confirmed: true }).success).toBe(true);
  });

  it("trims the reason and turns blank into null", () => {
    expect(accountDeletionRequestSchema.parse({ confirmed: true, reason: "  bye  " }).reason).toBe("bye");
    expect(accountDeletionRequestSchema.parse({ confirmed: true, reason: "   " }).reason).toBeNull();
    expect(accountDeletionRequestSchema.parse({ confirmed: true }).reason).toBeNull();
  });

  it("caps the reason at the DB limit", () => {
    expect(accountDeletionRequestSchema.safeParse({ confirmed: true, reason: "a".repeat(ACCOUNT_DELETION_REASON_MAX) }).success).toBe(true);
    expect(accountDeletionRequestSchema.safeParse({ confirmed: true, reason: "a".repeat(ACCOUNT_DELETION_REASON_MAX + 1) }).success).toBe(false);
  });
});

describe("restore", () => {
  it("accepts a request id with an optional note", () => {
    expect(accountRestoreSchema.safeParse({ requestId: REQ }).success).toBe(true);
    expect(accountRestoreSchema.parse({ requestId: REQ, note: "  asked by email  " }).note).toBe("asked by email");
    expect(accountRestoreSchema.safeParse({ requestId: "nope" }).success).toBe(false);
    expect(accountRestoreSchema.safeParse({ requestId: REQ, note: "a".repeat(ACCOUNT_DELETION_NOTE_MAX + 1) }).success).toBe(false);
  });

  it("only while the data still exists", () => {
    expect(canRestoreAccountDeletion("scheduled")).toBe(true);
    expect(canRestoreAccountDeletion("completed")).toBe(false);
    expect(canRestoreAccountDeletion("restored")).toBe(false);
  });

  it("puts back the seller status the account had, approved when unknown", () => {
    expect(restoredSellerStatus("restricted")).toBe("restricted");
    expect(restoredSellerStatus("pending")).toBe("pending");
    expect(restoredSellerStatus("suspended")).toBe("suspended");
    expect(restoredSellerStatus(null)).toBe("approved");
    expect(restoredSellerStatus("weird")).toBe("approved");
  });
});

describe("helpers", () => {
  it("clipText trims, drops blanks and cuts", () => {
    expect(clipText("  a  ", 10)).toBe("a");
    expect(clipText("   ", 10)).toBeNull();
    expect(clipText(null, 10)).toBeNull();
    expect(clipText("abcdef", 3)).toBe("abc");
  });
  it("the purge date is ACCOUNT_DELETION_DAYS later", () => {
    expect(ACCOUNT_DELETION_DAYS).toBe(30);
    expect(accountDeletionDueDate("2026-11-01T00:00:00.000Z").toISOString()).toBe("2026-12-01T00:00:00.000Z");
  });
  it("statuses", () => {
    expect(isAccountDeletionStatus("scheduled")).toBe(true);
    expect(isAccountDeletionStatus("pending")).toBe(false);
  });
  it("treats a missing auth user as already purged", () => {
    expect(isAuthUserMissingError({ status: 404 })).toBe(true);
    expect(isAuthUserMissingError({ code: "user_not_found" })).toBe(true);
    expect(isAuthUserMissingError({ message: "User not found" })).toBe(true);
    expect(isAuthUserMissingError({ message: "Database error deleting user", status: 500 })).toBe(false);
    expect(isAuthUserMissingError(null)).toBe(false);
  });
  it("support email (owner, 2026-11-06)", () => {
    expect(ACCOUNT_DELETION_SUPPORT_EMAIL).toBe("omar@tallaby.com");
  });
});

describe("admin wiring", () => {
  it("has the bell type, its link and the audit action", () => {
    expect(ADMIN_NOTIFICATION_TYPES).toContain("account_deletion_requested");
    expect(adminNotificationHref({ type: "account_deletion_requested", sellerId: null, storeId: null, data: { requestId: REQ } })).toBe(
      `/account-deletions/${REQ}`,
    );
    expect(adminNotificationHref({ type: "account_deletion_requested", sellerId: null, storeId: null })).toBe("/account-deletions");
    expect(ADMIN_AUDIT_ACTIONS).toContain("restore_closed_account");
    expect("account_deletion_request").toMatch(/^[a-z][a-z_]{2,31}$/);
  });
});

describe("0157 migration and the jobs that read it", () => {
  it("lists every status, the caps, the 30 days and the bell type", () => {
    for (const status of ACCOUNT_DELETION_STATUSES) expect(migration).toContain(`'${status}'`);
    expect(migration).toContain(`char_length(reason) <= ${ACCOUNT_DELETION_REASON_MAX}`);
    expect(migration).toContain(`char_length(admin_note) <= ${ACCOUNT_DELETION_NOTE_MAX}`);
    expect(migration).toContain(`interval '${ACCOUNT_DELETION_DAYS} days'`);
    expect(migration).toContain("'account_deletion_requested'");
    expect(migration).toMatch(/ENABLE ROW LEVEL SECURITY/);
    expect(migration).toMatch(/WHERE status = 'scheduled'/);
  });

  it("renewals never charge a closed account", () => {
    for (const file of ["../billing/plan-billing.server.ts", "../billing/app-billing.server.ts"]) {
      expect(read(file)).toMatch(/NOT EXISTS \(SELECT 1 FROM account_deletion_requests a WHERE a\.user_id = .* AND a\.status = 'scheduled'\)/);
    }
  });
});
