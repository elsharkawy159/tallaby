import { afterEach, describe, expect, it, vi } from "vitest";
import { createKashierSession } from "./kashier";

const config = {
  merchantId: "MID-1",
  secretKey: "secret",
  paymentApiKey: "api",
  mode: "test",
  webhookUrl: "https://api.tallaby.com/hook",
  allowedMethods: "card",
} as Parameters<typeof createKashierSession>[0];

const input = {
  orderReference: "ref",
  amount: "670.00",
  currency: "EGP",
  customerReference: "u1",
  merchantRedirect: "https://shop.tallaby.com/return",
};

function reply(body: unknown) {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(body), { status: 200 })));
}

afterEach(() => vi.unstubAllGlobals());

describe("createKashierSession", () => {
  it("reads the session id from `_id`, as Kashier v3 returns it", async () => {
    reply({ _id: "6aef20", status: "CREATED", sessionUrl: "https://payments.kashier.io/session/6aef20?mode=test" });
    await expect(createKashierSession(config, input)).resolves.toEqual({
      sessionId: "6aef20",
      sessionUrl: "https://payments.kashier.io/session/6aef20?mode=test",
    });
  });

  it("still accepts `sessionId` inside `data`", async () => {
    reply({ data: { sessionId: "s1", sessionUrl: "https://payments.kashier.io/session/s1" } });
    await expect(createKashierSession(config, input)).resolves.toEqual({ sessionId: "s1", sessionUrl: "https://payments.kashier.io/session/s1" });
  });

  it("fails when there is no session URL", async () => {
    reply({ _id: "x" });
    await expect(createKashierSession(config, input)).rejects.toThrow(/missing sessionUrl/);
  });
});
