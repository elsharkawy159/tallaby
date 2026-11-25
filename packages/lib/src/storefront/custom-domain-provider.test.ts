import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CustomDomainProviderError,
  cloudflareDomainProvider,
  customDomainProvider,
  customDomainPublicHost,
  isWwwPrimary,
  newCustomDomainProviderId,
  vercelDomainProvider,
} from "./custom-domain-provider";

type Call = { method: string; url: string; body: unknown; auth: string | null };

/** A fetch mock answering by `METHOD path?query`, recording every call. */
function mockFetch(routes: Record<string, { status?: number; body?: unknown } | ((call: Call) => { status?: number; body?: unknown })>) {
  const calls: Call[] = [];
  const fetchMock = vi.fn(async (input: URL | string, init?: RequestInit) => {
    const url = new URL(String(input));
    const call: Call = {
      method: init?.method ?? "GET",
      url: url.toString(),
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
      auth: new Headers(init?.headers).get("authorization"),
    };
    calls.push(call);
    const key = `${call.method} ${url.pathname}${url.search}`;
    const route = routes[key];
    if (!route) throw new Error(`unexpected fetch ${key}`);
    const { status = 200, body = {} } = typeof route === "function" ? route(call) : route;
    return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
  });
  vi.stubGlobal("fetch", fetchMock);
  return calls;
}

const ENV_KEYS = [
  "STOREFRONT_VERCEL_TOKEN",
  "STOREFRONT_VERCEL_PROJECT_ID",
  "STOREFRONT_VERCEL_TEAM_ID",
  "CLOUDFLARE_SAAS_API_TOKEN",
  "CLOUDFLARE_ZONE_ID",
  "CUSTOM_DOMAIN_CNAME_TARGET",
] as const;
const savedEnv: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {};

beforeEach(() => {
  for (const key of ENV_KEYS) savedEnv[key] = process.env[key];
  process.env.STOREFRONT_VERCEL_TOKEN = "vercel-token";
  process.env.STOREFRONT_VERCEL_PROJECT_ID = "prj_1";
  process.env.STOREFRONT_VERCEL_TEAM_ID = "team_1";
  process.env.CLOUDFLARE_SAAS_API_TOKEN = "cf-secret-token";
  process.env.CLOUDFLARE_ZONE_ID = "zone1";
  delete process.env.CUSTOM_DOMAIN_CNAME_TARGET;
});

afterEach(() => {
  vi.unstubAllGlobals();
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
});

const V = "https://api.vercel.com";
const VP = "/v10/projects/prj_1/domains";
const VD = (name: string) => `/v9/projects/prj_1/domains/${name}`;

describe("vercel provider (unchanged API calls)", () => {
  it("attaches the domain, then www. as a 308 redirect to it", async () => {
    const calls = mockFetch({
      [`POST ${VP}?teamId=team_1`]: (call) => ({ body: { name: (call.body as { name: string }).name, verified: true } }),
    });
    await expect(vercelDomainProvider.attach("faster-eg.com")).resolves.toEqual({ meta: null });
    expect(calls).toEqual([
      { method: "POST", url: `${V}${VP}?teamId=team_1`, body: { name: "faster-eg.com" }, auth: "Bearer vercel-token" },
      {
        method: "POST",
        url: `${V}${VP}?teamId=team_1`,
        body: { name: "www.faster-eg.com", redirect: "faster-eg.com", redirectStatusCode: 308 },
        auth: "Bearer vercel-token",
      },
    ]);
  });

  it("detaches both when the www. attach fails, and rethrows", async () => {
    const calls = mockFetch({
      [`POST ${VP}?teamId=team_1`]: (call) =>
        (call.body as { name: string }).name.startsWith("www.")
          ? { status: 400, body: { error: { code: "invalid_domain", message: "bad" } } }
          : { body: { name: "faster-eg.com", verified: true } },
      [`DELETE ${VD("www.faster-eg.com")}?teamId=team_1`]: { body: {} },
      [`DELETE ${VD("faster-eg.com")}?teamId=team_1`]: { body: {} },
    });
    await expect(vercelDomainProvider.attach("faster-eg.com")).rejects.toMatchObject({ provider: "vercel", code: "invalid", vercelCode: "invalid_domain" });
    expect(calls.filter((c) => c.method === "DELETE").map((c) => c.url)).toEqual([
      `${V}${VD("www.faster-eg.com")}?teamId=team_1`,
      `${V}${VD("faster-eg.com")}?teamId=team_1`,
    ]);
  });

  it("detaches www. first, then the domain", async () => {
    const calls = mockFetch({
      [`DELETE ${VD("www.faster-eg.com")}?teamId=team_1`]: { body: {} },
      [`DELETE ${VD("faster-eg.com")}?teamId=team_1`]: { status: 404 },
    });
    await vercelDomainProvider.detach("faster-eg.com");
    expect(calls.map((c) => `${c.method} ${c.url}`)).toEqual([
      `DELETE ${V}${VD("www.faster-eg.com")}?teamId=team_1`,
      `DELETE ${V}${VD("faster-eg.com")}?teamId=team_1`,
    ]);
  });

  it("checks: unverified → verify → TXT records; then DNS config; then active", async () => {
    const txt = [{ type: "TXT", domain: "_vercel.faster-eg.com", value: "vc-domain-verify=x", reason: "pending_domain_verification" }];
    mockFetch({
      [`GET ${VD("faster-eg.com")}?teamId=team_1`]: { body: { name: "faster-eg.com", verified: false, verification: txt } },
      [`POST ${VD("faster-eg.com")}/verify?teamId=team_1`]: { status: 400, body: { error: { code: "missing_txt_record" } } },
    });
    await expect(vercelDomainProvider.check("faster-eg.com", "pending")).resolves.toEqual({ status: "pending", verification: txt, lastError: "unverified" });

    mockFetch({
      [`GET ${VD("faster-eg.com")}?teamId=team_1`]: { body: { name: "faster-eg.com", verified: true } },
      [`GET /v6/domains/faster-eg.com/config?teamId=team_1`]: { body: { misconfigured: true } },
    });
    await expect(vercelDomainProvider.check("faster-eg.com", "active")).resolves.toEqual({ status: "failed", verification: null, lastError: "dns" });

    mockFetch({
      [`GET ${VD("faster-eg.com")}?teamId=team_1`]: { body: { name: "faster-eg.com", verified: true } },
      [`GET /v6/domains/faster-eg.com/config?teamId=team_1`]: { body: { misconfigured: false } },
    });
    await expect(vercelDomainProvider.check("faster-eg.com", "pending")).resolves.toEqual({ status: "active", verification: null, lastError: null });

    mockFetch({ [`GET ${VD("faster-eg.com")}?teamId=team_1`]: { status: 404 } });
    await expect(vercelDomainProvider.check("faster-eg.com", "active")).resolves.toEqual({ status: "failed", verification: null, lastError: "not_attached" });
  });

  it("routes with A 76.76.21.21 and CNAME cname.vercel-dns.com, as before", () => {
    expect(vercelDomainProvider.routingRecords("faster-eg.com")).toEqual([
      { type: "A", name: "@", value: "76.76.21.21" },
      { type: "CNAME", name: "www", value: "cname.vercel-dns.com" },
    ]);
    expect(vercelDomainProvider.routingRecords("shop.faster-eg.com")).toEqual([
      { type: "CNAME", name: "shop", value: "cname.vercel-dns.com" },
      { type: "CNAME", name: "www.shop", value: "cname.vercel-dns.com" },
    ]);
  });
});

const CF = "/client/v4/zones/zone1/custom_hostnames";
const cfHost = (hostname: string, id: string, status = "pending", ssl: Record<string, unknown> = { status: "pending_validation" }, extra: Record<string, unknown> = {}) => ({
  id,
  hostname,
  status,
  ssl,
  ...extra,
});
const ok = (result: unknown) => ({ body: { success: true, errors: [], result } });

describe("cloudflare provider", () => {
  it("creates the domain and its www. with HTTP DV certificates and returns their ids", async () => {
    const calls = mockFetch({
      [`POST ${CF}`]: (call) => {
        const hostname = (call.body as { hostname: string }).hostname;
        return ok(cfHost(hostname, hostname.startsWith("www.") ? "id-www" : "id-apex"));
      },
    });
    await expect(cloudflareDomainProvider.attach("faster-eg.com")).resolves.toEqual({
      meta: { hostnames: { "faster-eg.com": "id-apex", "www.faster-eg.com": "id-www" } },
    });
    expect(calls.map((c) => c.body)).toEqual([
      { hostname: "faster-eg.com", ssl: { method: "http", type: "dv" } },
      { hostname: "www.faster-eg.com", ssl: { method: "http", type: "dv" } },
    ]);
    expect(calls.every((c) => c.auth === "Bearer cf-secret-token")).toBe(true);
  });

  it("treats a duplicate hostname in our zone as already attached", async () => {
    mockFetch({
      [`POST ${CF}`]: (call) =>
        (call.body as { hostname: string }).hostname === "faster-eg.com"
          ? { status: 409, body: { success: false, errors: [{ code: 1406, message: "Duplicate custom hostname found." }] } }
          : ok(cfHost("www.faster-eg.com", "id-www")),
      [`GET ${CF}?hostname=faster-eg.com`]: ok([cfHost("faster-eg.com", "id-apex")]),
    });
    await expect(cloudflareDomainProvider.attach("faster-eg.com")).resolves.toEqual({
      meta: { hostnames: { "faster-eg.com": "id-apex", "www.faster-eg.com": "id-www" } },
    });
  });

  it("maps a duplicate it cannot find to taken, rolls back, and never puts the token in the error", async () => {
    const calls = mockFetch({
      [`POST ${CF}`]: { status: 409, body: { success: false, errors: [{ code: 1406, message: "Duplicate custom hostname found." }] } },
      [`GET ${CF}?hostname=faster-eg.com`]: ok([]),
      [`GET ${CF}?hostname=www.faster-eg.com`]: ok([]),
    });
    const error = await cloudflareDomainProvider.attach("faster-eg.com").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(CustomDomainProviderError);
    expect(error).toMatchObject({ provider: "cloudflare", code: "taken", providerCode: "1406" });
    expect(String((error as Error).message)).not.toContain("cf-secret-token");
    expect(calls.some((c) => c.method === "DELETE")).toBe(false);
  });

  it("is a config error without the token or zone", async () => {
    delete process.env.CLOUDFLARE_ZONE_ID;
    mockFetch({});
    await expect(cloudflareDomainProvider.check("faster-eg.com", "pending")).rejects.toMatchObject({ provider: "cloudflare", code: "config" });
  });

  it("is active only when the hostname and its certificate are both active", async () => {
    mockFetch({
      [`GET ${CF}/id-apex`]: ok(cfHost("faster-eg.com", "id-apex", "active", { status: "active" })),
      [`GET ${CF}/id-www`]: ok(cfHost("www.faster-eg.com", "id-www", "pending")),
    });
    const meta = { hostnames: { "faster-eg.com": "id-apex", "www.faster-eg.com": "id-www" } };
    await expect(cloudflareDomainProvider.check("faster-eg.com", "pending", { meta })).resolves.toEqual({
      status: "active",
      verification: null,
      lastError: null,
      meta: { hostnames: meta.hostnames },
    });
  });

  it("is active on www. (primary www) when only www. is live: a DNS host with no ALIAS for the root", async () => {
    mockFetch({
      [`GET ${CF}/id-apex`]: ok(cfHost("faster-eg.com", "id-apex", "pending")),
      [`GET ${CF}/id-www`]: ok(cfHost("www.faster-eg.com", "id-www", "active", { status: "active" })),
    });
    const meta = { hostnames: { "faster-eg.com": "id-apex", "www.faster-eg.com": "id-www" } };
    for (const previous of ["pending", "active", "failed"] as const) {
      await expect(cloudflareDomainProvider.check("faster-eg.com", previous, { meta })).resolves.toEqual({
        status: "active",
        verification: null,
        lastError: null,
        meta: { hostnames: meta.hostnames, primary: "www" },
      });
    }
  });

  it("is not active on a www. whose certificate is still pending", async () => {
    mockFetch({
      [`GET ${CF}/id-apex`]: ok(cfHost("faster-eg.com", "id-apex", "pending")),
      [`GET ${CF}/id-www`]: ok(cfHost("www.faster-eg.com", "id-www", "active", { status: "pending_validation" })),
    });
    const meta = { hostnames: { "faster-eg.com": "id-apex", "www.faster-eg.com": "id-www" } };
    await expect(cloudflareDomainProvider.check("faster-eg.com", "pending", { meta })).resolves.toMatchObject({ status: "pending", lastError: "dns" });
    const failed = await cloudflareDomainProvider.check("faster-eg.com", "active", { meta: { ...meta, primary: "www" } });
    expect(failed).toMatchObject({ status: "failed", lastError: "dns" });
    // Not live: the stored meta (and its primary) is left as it is.
    expect(failed).not.toHaveProperty("meta");
  });

  it("goes back to the root once it is live, dropping primary and keeping the ids", async () => {
    mockFetch({
      [`GET ${CF}/id-apex`]: ok(cfHost("faster-eg.com", "id-apex", "active", { status: "active" })),
      [`GET ${CF}/id-www`]: ok(cfHost("www.faster-eg.com", "id-www", "active", { status: "active" })),
    });
    const hostnames = { "faster-eg.com": "id-apex", "www.faster-eg.com": "id-www" };
    await expect(cloudflareDomainProvider.check("faster-eg.com", "active", { meta: { hostnames, primary: "www" } })).resolves.toEqual({
      status: "active",
      verification: null,
      lastError: null,
      meta: { hostnames },
    });
  });

  it("shows ownership and certificate TXT records while pending, and fails a domain that was active", async () => {
    mockFetch({
      [`GET ${CF}?hostname=faster-eg.com`]: ok([
        cfHost("faster-eg.com", "id-apex", "active", {
          status: "pending_validation",
          validation_records: [{ txt_name: "_acme-challenge.faster-eg.com", txt_value: "cert-token" }, { http_url: "http://x", http_body: "y" }],
        }),
      ]),
      [`GET ${CF}?hostname=www.faster-eg.com`]: ok([
        cfHost("www.faster-eg.com", "id-www", "pending", { status: "pending_validation" }, {
          ownership_verification: { type: "txt", name: "_cf-custom-hostname.www.faster-eg.com", value: "own-token" },
        }),
      ]),
    });
    await expect(cloudflareDomainProvider.check("faster-eg.com", "active")).resolves.toEqual({
      status: "failed",
      lastError: "dns",
      verification: [
        { type: "TXT", domain: "_acme-challenge.faster-eg.com", value: "cert-token", reason: "certificate" },
        { type: "TXT", domain: "_cf-custom-hostname.www.faster-eg.com", value: "own-token", reason: "ownership" },
      ],
    });
  });

  it("is not_attached when the zone has no such hostname (stale id falls back to the name)", async () => {
    mockFetch({
      [`GET ${CF}/gone`]: { status: 404, body: { success: false, errors: [{ code: 1436, message: "not found" }] } },
      [`GET ${CF}?hostname=faster-eg.com`]: ok([]),
      [`GET ${CF}?hostname=www.faster-eg.com`]: ok([]),
    });
    await expect(cloudflareDomainProvider.check("faster-eg.com", "pending", { meta: { hostnames: { "faster-eg.com": "gone" } } })).resolves.toEqual({
      status: "failed",
      verification: null,
      lastError: "not_attached",
    });
  });

  it("deletes www. then the domain by id; a missing one is fine", async () => {
    const calls = mockFetch({
      [`GET ${CF}/id-www`]: ok(cfHost("www.faster-eg.com", "id-www")),
      [`DELETE ${CF}/id-www`]: ok({ id: "id-www" }),
      [`GET ${CF}?hostname=faster-eg.com`]: ok([]),
    });
    await cloudflareDomainProvider.detach("faster-eg.com", { meta: { hostnames: { "www.faster-eg.com": "id-www" } } });
    expect(calls.map((c) => `${c.method} ${new URL(c.url).pathname}${new URL(c.url).search}`)).toEqual([
      `GET ${CF}/id-www`,
      `DELETE ${CF}/id-www`,
      `GET ${CF}?hostname=faster-eg.com`,
    ]);
  });

  it("routes everything to the CNAME target, with an ALIAS at the root", () => {
    expect(cloudflareDomainProvider.routingRecords("faster-eg.com")).toEqual([
      { type: "ALIAS", name: "@", value: "shops.tallaby.com" },
      { type: "CNAME", name: "www", value: "shops.tallaby.com" },
    ]);
    process.env.CUSTOM_DOMAIN_CNAME_TARGET = "stores.example.net";
    expect(cloudflareDomainProvider.routingRecords("shop.faster.com.eg")).toEqual([
      { type: "CNAME", name: "shop", value: "stores.example.net" },
      { type: "CNAME", name: "www.shop", value: "stores.example.net" },
    ]);
  });
});

describe("customDomainPublicHost", () => {
  it("is www. only for a www-primary row; the root for Vercel (null meta) and every other row", () => {
    expect(customDomainPublicHost("faster-eg.com", { hostnames: {}, primary: "www" })).toBe("www.faster-eg.com");
    expect(customDomainPublicHost("shop.faster.com.eg", { primary: "www" })).toBe("www.shop.faster.com.eg");
    expect(customDomainPublicHost("faster-eg.com", { hostnames: { "faster-eg.com": "id" } })).toBe("faster-eg.com");
    expect(customDomainPublicHost("faster-eg.com", null)).toBe("faster-eg.com");
    expect(customDomainPublicHost("faster-eg.com", { primary: "root" })).toBe("faster-eg.com");
    expect(customDomainPublicHost("faster-eg.com", "www")).toBe("faster-eg.com");
    expect(isWwwPrimary({ primary: "www" })).toBe(true);
    expect(isWwwPrimary(undefined)).toBe(false);
  });
});

describe("provider selection", () => {
  it("defaults new domains to vercel and accepts cloudflare", () => {
    expect(newCustomDomainProviderId({})).toBe("vercel");
    expect(newCustomDomainProviderId({ CUSTOM_DOMAIN_PROVIDER: "" })).toBe("vercel");
    expect(newCustomDomainProviderId({ CUSTOM_DOMAIN_PROVIDER: " Cloudflare " })).toBe("cloudflare");
  });

  it("refuses an unknown provider instead of falling back", () => {
    expect(() => newCustomDomainProviderId({ CUSTOM_DOMAIN_PROVIDER: "netlify" })).toThrow(CustomDomainProviderError);
    expect(() => customDomainProvider("netlify")).toThrow(CustomDomainProviderError);
  });

  it("returns each row's own provider", () => {
    expect(customDomainProvider("vercel")).toBe(vercelDomainProvider);
    expect(customDomainProvider("cloudflare")).toBe(cloudflareDomainProvider);
  });
});
