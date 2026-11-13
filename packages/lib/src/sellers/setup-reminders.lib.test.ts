import { describe, expect, it, vi } from "vitest";
import type { StoreSetupFlags } from "./store-setup.lib";
import {
  SETUP_REMINDER_DAILY_CAP,
  SETUP_REMINDER_MAX_ATTEMPTS,
  SETUP_REMINDER_RUN_CAP,
  deliverSetupReminder,
  dueSetupReminder,
  planSetupReminderRun,
  reminderStore,
  runSetupReminders,
  type DeliverSetupReminderDeps,
  type SetupReminderRow,
  type SetupReminderSeller,
} from "./setup-reminders.lib";

const NOW = new Date("2026-11-13T12:00:00Z");
const HOUR = 3_600_000;
const ago = (hours: number) => new Date(NOW.getTime() - hours * HOUR).toISOString();

const none: StoreSetupFlags = { template: false, brand: false, product: false, publish: false, shipping: false, payments: false };
const all: StoreSetupFlags = { template: true, brand: true, product: true, publish: true, shipping: true, payments: true };

function seller(over: Partial<SetupReminderSeller> & { ageHours: number }): SetupReminderSeller {
  const { ageHours, ...rest } = over;
  return {
    sellerId: rest.sellerId ?? "s1",
    createdAt: ago(ageHours),
    hasRealOrders: false,
    stores: [{ id: "st1", name: "متجر", isPrimary: true, createdAt: ago(ageHours), flags: none }],
    reminders: [],
    ...rest,
  };
}

const row = (kind: SetupReminderRow["kind"], over: Partial<SetupReminderRow> = {}): SetupReminderRow => ({
  kind,
  status: "sent",
  attempts: 1,
  claimedAt: ago(30),
  sentAt: ago(30),
  ...over,
});

describe("dueSetupReminder", () => {
  it("sends nothing before 24 hours", () => {
    expect(dueSetupReminder(seller({ ageHours: 23 }), NOW)).toBeNull();
  });

  it("sends day1 from 24 hours", () => {
    expect(dueSetupReminder(seller({ ageHours: 24 }), NOW)?.kind).toBe("day1");
    expect(dueSetupReminder(seller({ ageHours: 6 * 24 }), NOW)?.kind).toBe("day1");
  });

  it("sends day1 only once", () => {
    expect(dueSetupReminder(seller({ ageHours: 48, reminders: [row("day1")] }), NOW)).toBeNull();
  });

  it("sends day7 from 7 days when day1 went out at least 48 hours before", () => {
    const s = seller({ ageHours: 7 * 24, reminders: [row("day1", { sentAt: ago(6 * 24) })] });
    expect(dueSetupReminder(s, NOW)?.kind).toBe("day7");
  });

  it("waits 48 hours after day1 before day7", () => {
    const s = seller({ ageHours: 8 * 24, reminders: [row("day1", { sentAt: ago(10), claimedAt: ago(10) })] });
    expect(dueSetupReminder(s, NOW)).toBeNull();
  });

  it("sends only day7 to a seller already past 7 days without day1", () => {
    expect(dueSetupReminder(seller({ ageHours: 10 * 24 }), NOW)?.kind).toBe("day7");
  });

  it("sends day7 only once", () => {
    expect(dueSetupReminder(seller({ ageHours: 9 * 24, reminders: [row("day1", { sentAt: ago(8 * 24) }), row("day7")] }), NOW)).toBeNull();
  });

  it("sends nothing to sellers older than the 30-day window", () => {
    expect(dueSetupReminder(seller({ ageHours: 30 * 24 + 1 }), NOW)).toBeNull();
    expect(dueSetupReminder(seller({ ageHours: 30 * 24 - 1 }), NOW)?.kind).toBe("day7");
  });

  it("stops once any store is set up", () => {
    const stores = [
      { id: "a", name: "A", isPrimary: true, createdAt: ago(48), flags: none },
      { id: "b", name: "B", isPrimary: false, createdAt: ago(40), flags: all },
    ];
    expect(dueSetupReminder(seller({ ageHours: 48, stores }), NOW)).toBeNull();
  });

  it("still reminds a seller with no store", () => {
    expect(dueSetupReminder(seller({ ageHours: 48, stores: [] }), NOW)?.kind).toBe("day1");
  });

  it("stops for a seller with a real order", () => {
    expect(dueSetupReminder(seller({ ageHours: 48, hasRealOrders: true }), NOW)).toBeNull();
  });

  it("stops after the seller opted out", () => {
    expect(dueSetupReminder(seller({ ageHours: 48, reminders: [row("opt_out", { status: "opted_out" })] }), NOW)).toBeNull();
  });

  it("retries a failed send until the attempt limit", () => {
    const failed = (attempts: number) =>
      seller({ ageHours: 48, reminders: [row("day1", { status: "failed", attempts, sentAt: null })] });
    expect(dueSetupReminder(failed(1), NOW)?.kind).toBe("day1");
    expect(dueSetupReminder(failed(SETUP_REMINDER_MAX_ATTEMPTS), NOW)).toBeNull();
  });

  it("never resends a claim still marked sending", () => {
    const s = seller({ ageHours: 48, reminders: [row("day1", { status: "sending", sentAt: null })] });
    expect(dueSetupReminder(s, NOW)).toBeNull();
  });
});

describe("planSetupReminderRun", () => {
  const many = (n: number) => Array.from({ length: n }, (_, i) => seller({ sellerId: `s${i}`, ageHours: 25 + i }));

  it("plans one email per seller, oldest due first", () => {
    const plan = planSetupReminderRun([seller({ sellerId: "new", ageHours: 25 }), seller({ sellerId: "old", ageHours: 29 * 24 })], {
      now: NOW,
      sentToday: 0,
    });
    expect(plan.map((p) => p.sellerId)).toEqual(["new", "old"].reverse());
    expect(new Set(plan.map((p) => p.sellerId)).size).toBe(plan.length);
  });

  it("caps a run", () => {
    expect(planSetupReminderRun(many(50), { now: NOW, sentToday: 0 })).toHaveLength(SETUP_REMINDER_RUN_CAP);
  });

  it("caps the Cairo day", () => {
    expect(planSetupReminderRun(many(50), { now: NOW, sentToday: SETUP_REMINDER_DAILY_CAP - 3 })).toHaveLength(3);
    expect(planSetupReminderRun(many(50), { now: NOW, sentToday: SETUP_REMINDER_DAILY_CAP + 5 })).toHaveLength(0);
  });
});

describe("reminderStore", () => {
  it("prefers the primary store, else the oldest", () => {
    expect(
      reminderStore([
        { id: "a", name: "A", isPrimary: false, createdAt: ago(10), flags: none },
        { id: "b", name: "B", isPrimary: true, createdAt: ago(5), flags: none },
      ])?.id,
    ).toBe("b");
    expect(
      reminderStore([
        { id: "a", name: "A", isPrimary: false, createdAt: ago(5), flags: none },
        { id: "c", name: "C", isPrimary: false, createdAt: ago(9), flags: none },
      ])?.id,
    ).toBe("c");
    expect(reminderStore([])).toBeNull();
  });
});

function deps(over: Partial<DeliverSetupReminderDeps> = {}) {
  const calls: string[] = [];
  const d: DeliverSetupReminderDeps = {
    now: () => NOW,
    load: vi.fn(async () => {
      calls.push("load");
      return seller({ ageHours: 48 });
    }),
    claim: vi.fn(async () => {
      calls.push("claim");
      return { token: "ab".repeat(16), attempts: 1 };
    }),
    send: vi.fn(async () => {
      calls.push("send");
      return { id: "re_1" };
    }),
    markSent: vi.fn(async () => {
      calls.push("markSent");
    }),
    markFailed: vi.fn(async () => {
      calls.push("markFailed");
    }),
    ...over,
  };
  return { d, calls };
}

describe("deliverSetupReminder", () => {
  it("claims before sending, then marks the row sent", async () => {
    const { d, calls } = deps();
    expect(await deliverSetupReminder(d, "s1", "day1")).toEqual({ status: "sent", emailId: "re_1" });
    expect(calls).toEqual(["load", "claim", "send", "markSent"]);
  });

  it("sends nothing when another run holds the claim", async () => {
    const { d } = deps({ claim: vi.fn(async () => null) });
    expect(await deliverSetupReminder(d, "s1", "day1")).toEqual({ status: "duplicate" });
    expect(d.send).not.toHaveBeenCalled();
  });

  it("sends nothing when the reminder is no longer due", async () => {
    const { d } = deps({ load: vi.fn(async () => seller({ ageHours: 48, hasRealOrders: true })) });
    expect(await deliverSetupReminder(d, "s1", "day1")).toEqual({ status: "skipped", reason: "not_due" });
    expect(d.claim).not.toHaveBeenCalled();
  });

  it("sends nothing when the kind asked is not the one due", async () => {
    const { d } = deps();
    expect(await deliverSetupReminder(d, "s1", "day7")).toEqual({ status: "skipped", reason: "not_due" });
    expect(d.claim).not.toHaveBeenCalled();
  });

  it("skips a seller the account rules filtered out", async () => {
    const { d } = deps({ load: vi.fn(async () => null) });
    expect(await deliverSetupReminder(d, "s1", "day1")).toEqual({ status: "skipped", reason: "not_eligible" });
  });

  it("marks a failed send for a later retry", async () => {
    const { d } = deps({
      send: vi.fn(async () => {
        throw new Error("Resend send failed: rate_limit");
      }),
    });
    expect(await deliverSetupReminder(d, "s1", "day1")).toEqual({ status: "failed" });
    expect(d.markFailed).toHaveBeenCalledWith("s1", "day1", "Resend send failed: rate_limit");
    expect(d.markSent).not.toHaveBeenCalled();
  });
});

describe("runSetupReminders", () => {
  it("delivers the plan one by one and counts results without personal data", async () => {
    const deliver = vi
      .fn()
      .mockResolvedValueOnce({ status: "sent", emailId: "x" })
      .mockResolvedValueOnce({ status: "failed" })
      .mockRejectedValueOnce(new Error("backend 500"));
    const summary = await runSetupReminders({
      now: () => NOW,
      countSentToday: async () => 0,
      loadSellers: async () => [
        seller({ sellerId: "a", ageHours: 30 }),
        seller({ sellerId: "b", ageHours: 40 }),
        seller({ sellerId: "c", ageHours: 50 }),
        seller({ sellerId: "d", ageHours: 2 }),
      ],
      deliver,
    });
    expect(deliver).toHaveBeenCalledTimes(3);
    expect(summary).toEqual({ candidates: 4, planned: 3, sent: 1, skipped: 0, failed: 1, errors: 1, day1: 1, day7: 0, capLeft: SETUP_REMINDER_DAILY_CAP - 1 });
  });

  it("does nothing once the day's cap is used", async () => {
    const deliver = vi.fn();
    const summary = await runSetupReminders({
      now: () => NOW,
      countSentToday: async () => SETUP_REMINDER_DAILY_CAP,
      loadSellers: async () => [seller({ ageHours: 30 })],
      deliver,
    });
    expect(deliver).not.toHaveBeenCalled();
    expect(summary.planned).toBe(0);
  });
});

describe("toIso", () => {
  it("reads Dates and Postgres timestamptz text", async () => {
    const { toIso } = await import("./setup-reminders.lib");
    expect(toIso(new Date("2026-11-13T10:00:00Z"))).toBe("2026-11-13T10:00:00.000Z");
    expect(toIso("2026-11-13 10:00:00.5+00")).toBe("2026-11-13T10:00:00.500Z");
    expect(toIso("2026-11-13 12:00:00+02")).toBe("2026-11-13T10:00:00.000Z");
    expect(toIso(null)).toBe("");
  });
});
