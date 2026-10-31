import { describe, expect, it } from "vitest";
import { agentCanUseStore, bearerToken } from "./actor.lib";
import { isCimdClientId, parseCimdDocument, parseRegistrationRequest, registrationResponse } from "./clients.lib";
import { isPublicIp } from "./ip.lib";
import {
  authorizationServerMetadata,
  checkResource,
  DEFAULT_MCP_RESOURCE,
  normalizeIssuer,
  OAuthError,
  parseResourceList,
  readAuthorizeParams,
} from "./oauth.lib";
import { buildRedirect, isAllowedRedirectUri, redirectDisplayHost, redirectUriMatches } from "./redirect-uri.lib";
import { DEFAULT_SCOPES, initialConsentScopes, normalizeScopes, parseScopeParam } from "./scopes.lib";
import {
  generateToken,
  hashToken,
  isValidCodeChallenge,
  pkceChallengeS256,
  tokenKindOf,
  verifyPkceS256,
} from "./tokens.lib";

describe("scopes", () => {
  it("always keeps store.read, drops unknown scopes, keeps catalogue order", () => {
    expect(normalizeScopes(["website.write", "admin.all", "products.write"])).toEqual([
      "store.read",
      "products.write",
      "website.write",
    ]);
    expect(normalizeScopes([])).toEqual(["store.read"]);
  });

  it("parses the OAuth scope parameter", () => {
    expect(parseScopeParam("orders.write  store.read nope")).toEqual(["store.read", "orders.write"]);
    expect(parseScopeParam(null)).toEqual([]);
  });

  it("starts sensitive scopes off even when the client asks for them", () => {
    expect(initialConsentScopes([])).toEqual([...DEFAULT_SCOPES]);
    expect(initialConsentScopes(["website.publish", "customers.read", "orders.write"])).toEqual([
      "store.read",
      "orders.write",
    ]);
  });
});

describe("tokens and PKCE", () => {
  it("generates prefixed tokens that are recognised by kind", () => {
    const token = generateToken("access");
    expect(token.startsWith("tby_at_")).toBe(true);
    expect(tokenKindOf(token)).toBe("access");
    expect(tokenKindOf(generateToken("refresh"))).toBe("refresh");
    expect(tokenKindOf(generateToken("pat"))).toBe("pat");
    expect(tokenKindOf("tby_at_short")).toBeNull();
    expect(tokenKindOf("Bearer something")).toBeNull();
    expect(generateToken("access")).not.toBe(token);
  });

  it("hashes to 64 hex chars, with and without a pepper", () => {
    const token = generateToken("refresh");
    expect(hashToken(token)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashToken(token, "pepper")).toMatch(/^[0-9a-f]{64}$/);
    expect(hashToken(token, "pepper")).not.toBe(hashToken(token));
    expect(hashToken(token)).toBe(hashToken(token));
  });

  it("verifies S256 against the RFC 7636 example", () => {
    const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    const challenge = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM";
    expect(pkceChallengeS256(verifier)).toBe(challenge);
    expect(verifyPkceS256(verifier, challenge)).toBe(true);
    expect(verifyPkceS256(`${verifier}x`, challenge)).toBe(false);
    expect(verifyPkceS256("short", challenge)).toBe(false);
    expect(isValidCodeChallenge(challenge)).toBe(true);
    expect(isValidCodeChallenge("plain-text-challenge")).toBe(false);
  });
});

describe("redirect URIs", () => {
  it("allows https, loopback http and app schemes only", () => {
    expect(isAllowedRedirectUri("https://claude.ai/api/mcp/auth_callback")).toBe(true);
    expect(isAllowedRedirectUri("https://chatgpt.com/connector/oauth/abc123")).toBe(true);
    expect(isAllowedRedirectUri("http://localhost:6274/oauth/callback")).toBe(true);
    expect(isAllowedRedirectUri("http://127.0.0.1:33418/callback")).toBe(true);
    expect(isAllowedRedirectUri("cursor://anysphere.cursor-retrieval/oauth/callback")).toBe(true);
    expect(isAllowedRedirectUri("http://evil.example/callback")).toBe(false);
    expect(isAllowedRedirectUri("https://claude.ai/cb#frag")).toBe(false);
    expect(isAllowedRedirectUri("https://user:pw@claude.ai/cb")).toBe(false);
    expect(isAllowedRedirectUri("javascript:alert(1)")).toBe(false);
    expect(isAllowedRedirectUri("data:text/html,hi")).toBe(false);
    expect(isAllowedRedirectUri("file:///etc/passwd")).toBe(false);
    expect(isAllowedRedirectUri("")).toBe(false);
  });

  it("matches exactly, except loopback ports", () => {
    const registered = ["https://claude.ai/api/mcp/auth_callback", "http://127.0.0.1/callback"];
    expect(redirectUriMatches(registered, "https://claude.ai/api/mcp/auth_callback")).toBe(true);
    expect(redirectUriMatches(registered, "https://claude.ai/api/mcp/auth_callback/")).toBe(false);
    expect(redirectUriMatches(registered, "https://claude.ai/api/mcp/other")).toBe(false);
    expect(redirectUriMatches(registered, "http://127.0.0.1:51234/callback")).toBe(true);
    expect(redirectUriMatches(registered, "http://127.0.0.1:51234/other")).toBe(false);
    expect(redirectUriMatches(registered, "http://localhost:51234/callback")).toBe(false);
  });

  it("builds redirects and display hosts", () => {
    expect(buildRedirect("https://claude.ai/cb?x=1", { code: "abc", state: "s t", error: null })).toBe(
      "https://claude.ai/cb?x=1&code=abc&state=s+t",
    );
    expect(redirectDisplayHost("https://chatgpt.com/connector/oauth/1")).toBe("chatgpt.com");
    expect(redirectDisplayHost("cursor://anysphere.cursor-retrieval/oauth")).toBe("cursor");
  });
});

describe("client metadata", () => {
  it("accepts a DCR request and always answers as a public client", () => {
    const result = parseRegistrationRequest({
      client_name: "Claude",
      redirect_uris: ["https://claude.ai/api/mcp/auth_callback"],
      grant_types: ["authorization_code", "refresh_token"],
      token_endpoint_auth_method: "client_secret_post",
      logo_uri: "javascript:alert(1)",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.metadata.name).toBe("Claude");
    expect(result.metadata.logoUrl).toBeNull();
    const body = registrationResponse("tby_cl_x", result.metadata, new Date("2026-10-31T00:00:00Z"));
    expect(body.token_endpoint_auth_method).toBe("none");
    expect(body.client_id_issued_at).toBe(1793404800);
  });

  it("rejects bad DCR requests", () => {
    expect(parseRegistrationRequest({ redirect_uris: [] }).ok).toBe(false);
    expect(parseRegistrationRequest({ redirect_uris: ["http://evil.example/cb"] })).toMatchObject({
      ok: false,
      error: "invalid_redirect_uri",
    });
    expect(parseRegistrationRequest({ redirect_uris: ["https://a.example/cb"], grant_types: ["client_credentials"] }).ok).toBe(false);
    expect(parseRegistrationRequest("nope").ok).toBe(false);
  });

  it("names a nameless client after its redirect host", () => {
    const result = parseRegistrationRequest({ redirect_uris: ["https://app.example.com/cb"] });
    expect(result.ok && result.metadata.name).toBe("app.example.com");
  });

  it("recognises CIMD client ids", () => {
    expect(isCimdClientId("https://claude.ai/oauth/claude-code-client-metadata")).toBe(true);
    expect(isCimdClientId("https://example.com/")).toBe(false);
    expect(isCimdClientId("http://example.com/client")).toBe(false);
    expect(isCimdClientId("https://example.com/a/../b")).toBe(false);
    expect(isCimdClientId("tby_cl_abcdef")).toBe(false);
  });

  it("validates a CIMD document against its URL", () => {
    const id = "https://chatgpt.com/oauth/client.json";
    expect(parseCimdDocument(id, { client_id: id, client_name: "ChatGPT", redirect_uris: ["https://chatgpt.com/connector/oauth/x"] }).ok).toBe(true);
    expect(parseCimdDocument(id, { client_id: "https://other.example/c", redirect_uris: ["https://chatgpt.com/cb"] }).ok).toBe(false);
    expect(
      parseCimdDocument(id, { client_id: id, redirect_uris: ["https://chatgpt.com/cb"], token_endpoint_auth_method: "private_key_jwt" }).ok,
    ).toBe(false);
  });
});

describe("public IP check", () => {
  it.each([
    ["8.8.8.8", true],
    ["104.18.1.1", true],
    ["2606:4700:4700::1111", true],
    ["127.0.0.1", false],
    ["10.1.2.3", false],
    ["172.20.0.1", false],
    ["192.168.1.1", false],
    ["169.254.169.254", false],
    ["100.64.0.1", false],
    ["0.0.0.0", false],
    ["::1", false],
    ["::", false],
    ["fd00::1", false],
    ["fe80::1", false],
    ["::ffff:127.0.0.1", false],
    ["::ffff:8.8.8.8", true],
    ["64:ff9b::a9fe:a9fe", false],
    ["2001:db8::1", false],
    ["not-an-ip", false],
  ])("%s → %s", (ip, expected) => {
    expect(isPublicIp(ip)).toBe(expected);
  });
});

describe("authorization server", () => {
  it("advertises PKCE, public clients and CIMD", () => {
    const meta = authorizationServerMetadata(normalizeIssuer("https://dashboard.tallaby.com/"));
    expect(meta.issuer).toBe("https://dashboard.tallaby.com");
    expect(meta.token_endpoint).toBe("https://dashboard.tallaby.com/api/oauth/token");
    expect(meta.code_challenge_methods_supported).toEqual(["S256"]);
    expect(meta.token_endpoint_auth_methods_supported).toEqual(["none"]);
    expect(meta.client_id_metadata_document_supported).toBe(true);
  });

  it("checks resource indicators", () => {
    const allowed = parseResourceList("https://mcp.tallaby.com/mcp, https://MCP-staging.tallaby.com/mcp/");
    expect(allowed).toEqual(["https://mcp.tallaby.com/mcp", "https://mcp-staging.tallaby.com/mcp"]);
    expect(parseResourceList(undefined)).toEqual([DEFAULT_MCP_RESOURCE]);
    expect(checkResource(null, allowed)).toBeNull();
    expect(checkResource("https://mcp.tallaby.com/mcp/", allowed)).toBe("https://mcp.tallaby.com/mcp");
    expect(() => checkResource("https://evil.example/mcp", allowed)).toThrow(OAuthError);
  });

  it("reads authorize parameters and demands PKCE S256", () => {
    const base = {
      client_id: "tby_cl_x",
      redirect_uri: "https://claude.ai/cb",
      response_type: "code",
      code_challenge: "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
      code_challenge_method: "S256",
      state: "xyz",
    };
    const params = (o: Record<string, string>) => new URLSearchParams(o);
    expect(readAuthorizeParams(params(base))).toMatchObject({ clientId: "tby_cl_x", state: "xyz", scope: null });
    expect(() => readAuthorizeParams(params({ ...base, code_challenge_method: "plain" }))).toThrow(OAuthError);
    expect(() => readAuthorizeParams(params({ ...base, response_type: "token" }))).toThrow(OAuthError);
    const { code_challenge: _c, ...noChallenge } = base;
    expect(() => readAuthorizeParams(params(noChallenge))).toThrow(OAuthError);
  });
});

describe("actor helpers", () => {
  it("reads bearer tokens", () => {
    expect(bearerToken("Bearer tby_at_abc-_1")).toBe("tby_at_abc-_1");
    expect(bearerToken("bearer  tby_at_abc ")).toBe("tby_at_abc");
    expect(bearerToken("Basic abc")).toBeNull();
    expect(bearerToken(null)).toBeNull();
  });

  it("limits stores to the grant", () => {
    expect(agentCanUseStore({ storeIds: ["a"] }, "a")).toBe(true);
    expect(agentCanUseStore({ storeIds: ["a"] }, "b")).toBe(false);
  });
});
