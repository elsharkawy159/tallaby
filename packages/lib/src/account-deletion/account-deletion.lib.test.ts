import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  ACCOUNT_DELETION_DAYS,
  ACCOUNT_DELETION_NOTE_MAX,
  ACCOUNT_DELETION_REASON_MAX,
  ACCOUNT_DELETION_STATUSES,
  accountDeletionDueDate,
  accountDeletionRequestSchema,
  accountDeletionUpdateSchema,
  canAdminSetAccountDeletionStatus,
  clipText,
  isAccountDeletionStatus,
} from "./account-deletion.lib";
import { ADMIN_NOTIFICATION_TYPES, adminNotificationHref } from "../notifications/notifications.lib";
import { ADMIN_AUDIT_ACTIONS } from "../admin/admin.lib";

const REQ = "11111111-2222-4333-8444-555555555555";
const migration = readFileSync(new URL("../../../db/migrations/0157_account_deletion_requests.sql", import.meta.url), "utf8");

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

describe("accountDeletionUpdateSchema", () => {
  it("accepts completed without a note and requires a note to decline", () => {
    expect(accountDeletionUpdateSchema.safeParse({ requestId: REQ, status: "completed" }).success).toBe(true);
    expect(accountDeletionUpdateSchema.safeParse({ requestId: REQ, status: "declined" }).success).toBe(false);
    expect(accountDeletionUpdateSchema.safeParse({ requestId: REQ, status: "declined", note: "Open orders" }).success).toBe(true);
  });

  it("rejects cancelled (the seller's action), bad ids and long notes", () => {
    expect(accountDeletionUpdateSchema.safeParse({ requestId: REQ, status: "cancelled" }).success).toBe(false);
    expect(accountDeletionUpdateSchema.safeParse({ requestId: "nope", status: "completed" }).success).toBe(false);
    expect(
      accountDeletionUpdateSchema.safeParse({ requestId: REQ, status: "completed", note: "a".repeat(ACCOUNT_DELETION_NOTE_MAX + 1) }).success,
    ).toBe(false);
  });
});

describe("canAdminSetAccountDeletionStatus", () => {
  it("never reopens a cancelled or completed request", () => {
    expect(canAdminSetAccountDeletionStatus("cancelled", "pending")).toBe(false);
    expect(canAdminSetAccountDeletionStatus("completed", "pending")).toBe(false);
    expect(canAdminSetAccountDeletionStatus("completed", "declined")).toBe(false);
  });
  it("moves pending and declined requests", () => {
    expect(canAdminSetAccountDeletionStatus("pending", "completed")).toBe(true);
    expect(canAdminSetAccountDeletionStatus("pending", "declined")).toBe(true);
    expect(canAdminSetAccountDeletionStatus("declined", "pending")).toBe(true);
    expect(canAdminSetAccountDeletionStatus("pending", "cancelled")).toBe(false);
  });
});

describe("helpers", () => {
  it("clipText trims, drops blanks and cuts", () => {
    expect(clipText("  a  ", 10)).toBe("a");
    expect(clipText("   ", 10)).toBeNull();
    expect(clipText(null, 10)).toBeNull();
    expect(clipText("abcdef", 3)).toBe("abc");
  });
  it("due date is ACCOUNT_DELETION_DAYS later", () => {
    const due = accountDeletionDueDate("2026-11-01T00:00:00.000Z");
    expect(due.toISOString()).toBe(new Date(Date.UTC(2026, 10, 1 + ACCOUNT_DELETION_DAYS)).toISOString());
  });
  it("isAccountDeletionStatus", () => {
    expect(isAccountDeletionStatus("pending")).toBe(true);
    expect(isAccountDeletionStatus("deleted")).toBe(false);
  });
});

describe("admin wiring", () => {
  it("has the bell type, its link and the audit action", () => {
    expect(ADMIN_NOTIFICATION_TYPES).toContain("account_deletion_requested");
    expect(adminNotificationHref({ type: "account_deletion_requested", sellerId: null, storeId: null, data: { requestId: REQ } })).toBe(
      `/account-deletions/${REQ}`,
    );
    expect(adminNotificationHref({ type: "account_deletion_requested", sellerId: null, storeId: null })).toBe("/account-deletions");
    expect(ADMIN_AUDIT_ACTIONS).toContain("update_account_deletion_request");
    expect("account_deletion_request").toMatch(/^[a-z][a-z_]{2,31}$/);
  });
});

describe("0157 migration matches the code", () => {
  it("lists every status, the caps and the bell type", () => {
    for (const status of ACCOUNT_DELETION_STATUSES) expect(migration).toContain(`'${status}'`);
    expect(migration).toContain(`char_length(reason) <= ${ACCOUNT_DELETION_REASON_MAX}`);
    expect(migration).toContain(`char_length(admin_note) <= ${ACCOUNT_DELETION_NOTE_MAX}`);
    expect(migration).toContain("'account_deletion_requested'");
    expect(migration).toMatch(/ENABLE ROW LEVEL SECURITY/);
    expect(migration).toMatch(/WHERE status = 'pending'/);
  });
});
