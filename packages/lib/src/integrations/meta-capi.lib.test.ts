import { afterEach, describe, expect, it, vi } from "vitest";
import {
  checkMetaCapiAccess,
  postMetaCapiEvents,
  redactSecrets,
  validateMetaCapiInput,
} from "./meta-capi.lib";

const TOKEN = `EAAB${"x".repeat(120)}`;
const creds = { pixelId: "123456789012345", accessToken: TOKEN, testEventCode: "TEST123" };

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

afterEach(() => vi.restoreAllMocks());

describe("validateMetaCapiInput", () => {
  it("accepts a token and normalises the test code", () => {
    expect(validateMetaCapiInput({ accessToken: ` ${TOKEN} `, testEventCode: " test42 " })).toEqual({
      success: true,
      data: { accessToken: TOKEN, testEventCode: "TEST42" },
    });
  });

  it("treats an empty token as keep-the-saved-one", () => {
    expect(validateMetaCapiInput({ accessToken: "", testEventCode: "" })).toEqual({
      success: true,
      data: { accessToken: null, testEventCode: null },
    });
  });

  it("rejects short or markup tokens, bad test codes and unknown keys", () => {
    expect(validateMetaCapiInput({ accessToken: "short" })).toEqual({ success: false, error: "invalid_token" });
    expect(validateMetaCapiInput({ accessToken: `${TOKEN}<script>` })).toEqual({ success: false, error: "invalid_token" });
    expect(validateMetaCapiInput({ testEventCode: "PROD1" })).toEqual({ success: false, error: "invalid_test_code" });
    expect(validateMetaCapiInput({ accessToken: TOKEN, pixelId: "1" })).toEqual({ success: false, error: "invalid_token" });
  });
});

describe("redactSecrets", () => {
  it("removes the given secret, token-shaped strings and access_token params", () => {
    const out = redactSecrets(`bad ${TOKEN} and EAAZZZZZZZZZZZZ ?access_token=abc&x=1`, [TOKEN]);
    expect(out).not.toContain(TOKEN);
    expect(out).not.toContain("EAAZZZZ");
    expect(out).toContain("access_token=[redacted]");
  });

  it("truncates long messages", () => {
    expect(redactSecrets("a".repeat(1000)).length).toBeLessThanOrEqual(300);
  });
});

describe("postMetaCapiEvents", () => {
  it("posts to the pixel with the token in the body, never in the URL", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(200, { events_received: 1 }));
    const result = await postMetaCapiEvents(creds, [{ event_name: "Purchase", event_id: "order-1" }], {
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(result.ok).toBe(true);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://graph.facebook.com/v21.0/123456789012345/events");
    expect(url).not.toContain(TOKEN);
    const body = JSON.parse(String(init.body));
    expect(body).toMatchObject({ access_token: TOKEN, test_event_code: "TEST123", data: [{ event_id: "order-1" }] });
  });

  it("returns a redacted error on HTTP failure", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse(400, { error: { message: `Invalid OAuth access token ${TOKEN}`, code: 190 } }),
    );
    const result = await postMetaCapiEvents(creds, [], { fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(result).toEqual({ ok: false, error: expect.stringContaining("Meta API HTTP 400 (code 190)") });
    expect(JSON.stringify(result)).not.toContain(TOKEN);
  });

  it("maps a timeout and a network failure without echoing the error", async () => {
    const timeout = vi.fn(async () => {
      throw Object.assign(new Error(`timeout ${TOKEN}`), { name: "TimeoutError" });
    });
    expect(await postMetaCapiEvents(creds, [], { fetchImpl: timeout as unknown as typeof fetch })).toEqual({
      ok: false,
      error: "Meta API timed out",
    });
    const down = vi.fn(async () => {
      throw new Error(`ECONNRESET ${TOKEN}`);
    });
    expect(await postMetaCapiEvents(creds, [], { fetchImpl: down as unknown as typeof fetch })).toEqual({
      ok: false,
      error: "Meta API request failed",
    });
  });

  it("passes an abort signal (timeout) to fetch", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(200, {}));
    await postMetaCapiEvents(creds, [], { fetchImpl: fetchImpl as unknown as typeof fetch, timeoutMs: 1000 });
    const [, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });
});

describe("checkMetaCapiAccess", () => {
  it("reads the pixel with a bearer header", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(200, { id: "123456789012345" }));
    expect((await checkMetaCapiAccess(creds, { fetchImpl: fetchImpl as unknown as typeof fetch })).ok).toBe(true);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).not.toContain(TOKEN);
    expect((init.headers as Record<string, string>).Authorization).toBe(`Bearer ${TOKEN}`);
  });

  it("fails when Meta returns another pixel", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(200, { id: "999" }));
    expect(await checkMetaCapiAccess(creds, { fetchImpl: fetchImpl as unknown as typeof fetch })).toEqual({
      ok: false,
      error: "Meta API returned a different Pixel",
    });
  });
});
