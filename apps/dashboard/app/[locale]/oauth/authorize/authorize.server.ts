"use server";

import { and, asc, db, desc, eq, isNull, sellers, stores } from "@workspace/db";
import { logServerError } from "@workspace/db/log";
import {
  buildRedirect,
  checkResource,
  OAuthError,
  readAuthorizeClient,
  readAuthorizeParams,
  redirectUriMatches,
} from "@workspace/lib/agents";
import {
  allowedMcpResources,
  createAuthorization,
  type OAuthClientRecord,
  resolveClient,
} from "@workspace/lib/agents/server";
import { isAccessError, requireSeller } from "@/lib/auth/require-seller.server";

/**
 * MCP consent (ROADMAP.md F-29b, design note §10). Everything the client sent
 * is re-read from the original query string on the server for every step; the
 * browser only contributes the seller's choices (stores and scopes), and the
 * seller comes from the session.
 */

export type ConsentProblem = "badRequest" | "unknownClient" | "badRedirect" | "noSeller" | "blocked" | "noStores";

export type ConsentStore = { id: string; name: string; subdomain: string };

export type ConsentCheck =
  | { kind: "problem"; problem: ConsentProblem }
  /** Send the browser back to the client with an OAuth error. */
  | { kind: "redirect"; to: string }
  | { kind: "signin" }
  | {
      kind: "ok";
      client: Pick<OAuthClientRecord, "name" | "logoUrl" | "clientUri">;
      redirectUri: string;
      scope: string | null;
      sellerName: string;
      stores: ConsentStore[];
    };

type Validated = {
  client: OAuthClientRecord;
  redirectUri: string;
  codeChallenge: string;
  state: string | null;
  scope: string | null;
  resource: string | null;
};

async function validateRequest(
  query: string,
): Promise<{ ok: true; value: Validated } | { ok: false; check: ConsentCheck }> {
  const params = new URLSearchParams(query.length > 8_000 ? "" : query);
  const basics = readAuthorizeClient(params);
  if (!basics) return { ok: false, check: { kind: "problem", problem: "badRequest" } };

  const client = await resolveClient(basics.clientId);
  if (!client) return { ok: false, check: { kind: "problem", problem: "unknownClient" } };
  // An unregistered redirect is never redirected to (RFC 6749 §4.1.2.1).
  if (!redirectUriMatches(client.redirectUris, basics.redirectUri)) {
    return { ok: false, check: { kind: "problem", problem: "badRedirect" } };
  }

  try {
    const parsed = readAuthorizeParams(params);
    const resource = checkResource(parsed.resource, allowedMcpResources());
    return {
      ok: true,
      value: {
        client,
        redirectUri: basics.redirectUri,
        codeChallenge: parsed.codeChallenge,
        state: parsed.state,
        scope: parsed.scope,
        resource,
      },
    };
  } catch (error) {
    if (!(error instanceof OAuthError)) throw error;
    return {
      ok: false,
      check: {
        kind: "redirect",
        to: buildRedirect(basics.redirectUri, {
          error: error.error,
          error_description: error.description,
          state: params.get("state"),
        }),
      },
    };
  }
}

async function loadSellerStores(sellerId: string): Promise<ConsentStore[]> {
  return db
    .select({ id: stores.id, name: stores.name, subdomain: stores.subdomain })
    .from(stores)
    .where(and(eq(stores.sellerId, sellerId), isNull(stores.deletedAt)))
    .orderBy(desc(stores.isPrimary), asc(stores.createdAt))
    .limit(100);
}

async function currentSeller(): Promise<
  { ok: true; userId: string; sellerId: string } | { ok: false; check: ConsentCheck }
> {
  try {
    const seller = await requireSeller();
    return { ok: true, userId: seller.userId, sellerId: seller.sellerId };
  } catch (error) {
    if (!isAccessError(error)) throw error;
    if (error.code === "unauthorized") return { ok: false, check: { kind: "signin" } };
    if (error.code === "no_seller") return { ok: false, check: { kind: "problem", problem: "noSeller" } };
    return { ok: false, check: { kind: "problem", problem: "blocked" } };
  }
}

/** For the page: what to show for this authorize request. */
export async function checkConsentRequest(query: string): Promise<ConsentCheck> {
  const request = await validateRequest(query);
  if (!request.ok) return request.check;
  const seller = await currentSeller();
  if (!seller.ok) return seller.check;

  const sellerStores = await loadSellerStores(seller.sellerId);
  if (sellerStores.length === 0) return { kind: "problem", problem: "noStores" };
  const [row] = await db
    .select({ name: sellers.displayName, business: sellers.businessName })
    .from(sellers)
    .where(eq(sellers.id, seller.sellerId))
    .limit(1);

  const { client } = request.value;
  return {
    kind: "ok",
    client: { name: client.name, logoUrl: client.logoUrl, clientUri: client.clientUri },
    redirectUri: request.value.redirectUri,
    scope: request.value.scope,
    sellerName: row?.name || row?.business || "",
    stores: sellerStores,
  };
}

export type ConsentDecision =
  | { ok: true; redirectTo: string }
  | { ok: false; error: "pickStore" | "failed" | ConsentProblem };

/** "Allow": writes the grant and a one-time code, returns where to send the browser. */
export async function approveAgentConsent(input: {
  query: string;
  allStores: boolean;
  storeIds: string[];
  scopes: string[];
}): Promise<ConsentDecision> {
  try {
    const request = await validateRequest(String(input.query ?? ""));
    if (!request.ok) {
      return request.check.kind === "redirect"
        ? { ok: true, redirectTo: request.check.to }
        : { ok: false, error: request.check.kind === "problem" ? request.check.problem : "failed" };
    }
    const seller = await currentSeller();
    if (!seller.ok) return { ok: false, error: seller.check.kind === "problem" ? seller.check.problem : "failed" };

    const allStores = input.allStores === true;
    const storeIds = Array.isArray(input.storeIds) ? input.storeIds.filter((v) => typeof v === "string").slice(0, 100) : [];
    if (!allStores && storeIds.length === 0) return { ok: false, error: "pickStore" };
    const scopes = Array.isArray(input.scopes) ? input.scopes.filter((v) => typeof v === "string").slice(0, 20) : [];

    const { value } = request;
    const { code } = await createAuthorization({
      client: value.client,
      sellerId: seller.sellerId,
      // Owners only until F-09 staff ships: the approving user is the seller.
      userId: seller.userId,
      allStores,
      storeIds,
      scopes,
      redirectUri: value.redirectUri,
      codeChallenge: value.codeChallenge,
      resource: value.resource,
    });
    return { ok: true, redirectTo: buildRedirect(value.redirectUri, { code, state: value.state }) };
  } catch (error) {
    if (error instanceof OAuthError && error.error === "access_denied") return { ok: false, error: "pickStore" };
    logServerError("integration", "mcp consent approve failed", {}, error);
    return { ok: false, error: "failed" };
  }
}

/** "Cancel": tells the client the seller said no. */
export async function denyAgentConsent(input: { query: string }): Promise<ConsentDecision> {
  const request = await validateRequest(String(input.query ?? ""));
  if (!request.ok) {
    return request.check.kind === "redirect" ? { ok: true, redirectTo: request.check.to } : { ok: false, error: "failed" };
  }
  return {
    ok: true,
    redirectTo: buildRedirect(request.value.redirectUri, {
      error: "access_denied",
      error_description: "The seller declined.",
      state: request.value.state,
    }),
  };
}
