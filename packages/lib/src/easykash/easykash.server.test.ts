import { describe, expect, it } from "vitest";
import { EasykashApiError, createEasykashPayLink, inquireEasykashPayment } from "./easykash.server";
import { buildEasykashPayBody } from "./easykash.lib";

type Call = { url: string; init: RequestInit };

function fakeFetch(status: number, body: unknown, calls: Call[] = []) {
  return (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return new Response(typeof body === "string" ? body : JSON.stringify(body), { status });
  }) as unknown as typeof fetch;
}

const body = buildEasykashPayBody({
  amountPiastres: 1000,
  currency: "EGP",
  name: "A",
  email: null,
  mobile: "01012345678",
  redirectUrl: "https://shop.example.com/api/store-payments/return/x",
  customerReference: "ref",
});

describe("createEasykashPayLink", () => {
  it("posts the body with the API key and returns the hosted link", async () => {
    const calls: Call[] = [];
    const out = await createEasykashPayLink("seller-key", body, {
      fetch: fakeFetch(200, { redirectUrl: "https://www.easykash.net/DirectPayV1/ABC" }, calls),
    });
    expect(out).toEqual({ redirectUrl: "https://www.easykash.net/DirectPayV1/ABC" });
    expect(calls[0]!.url).toBe("https://back.easykash.net/api/directpayv1/pay");
    expect((calls[0]!.init.headers as Record<string, string>).authorization).toBe("seller-key");
    expect(JSON.parse(String(calls[0]!.init.body))).toEqual(body);
    expect(calls[0]!.init.signal).toBeInstanceOf(AbortSignal);
  });

  it("fails with the status only, never the body", async () => {
    const error = await createEasykashPayLink("k", body, { fetch: fakeFetch(401, { message: "secret details" }) }).catch((e) => e);
    expect(error).toBeInstanceOf(EasykashApiError);
    expect(error.status).toBe(401);
    expect(String(error.message)).not.toContain("secret");
  });

  it("fails when the link is missing or not https", async () => {
    await expect(createEasykashPayLink("k", body, { fetch: fakeFetch(200, {}) })).rejects.toMatchObject({ status: 0 });
    await expect(createEasykashPayLink("k", body, { fetch: fakeFetch(200, { redirectUrl: "javascript:x" }) })).rejects.toMatchObject({
      status: 0,
    });
  });
});

describe("inquireEasykashPayment", () => {
  it("looks the payment up by our reference", async () => {
    const calls: Call[] = [];
    const out = await inquireEasykashPayment("k", "ref-1", {
      fetch: fakeFetch(200, { status: "PAID", Amount: "10.00", easykashRef: "9" }, calls),
    });
    expect(out).toMatchObject({ status: "PAID", amountPiastres: 1000, easykashRef: "9" });
    expect(calls[0]!.url).toBe("https://back.easykash.net/api/cash-api/inquire");
    expect(JSON.parse(String(calls[0]!.init.body))).toEqual({ customerReference: "ref-1" });
  });

  it("returns null for an answer without a status and throws on non-2xx", async () => {
    expect(await inquireEasykashPayment("k", "r", { fetch: fakeFetch(200, "not json") })).toBeNull();
    await expect(inquireEasykashPayment("k", "r", { fetch: fakeFetch(403, {}) })).rejects.toMatchObject({ status: 403 });
  });
});
