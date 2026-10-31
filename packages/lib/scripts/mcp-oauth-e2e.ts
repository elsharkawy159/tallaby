/**
 * End-to-end check of the MCP OAuth storage (ROADMAP.md F-29b) against the
 * DATABASE_URL database (run on staging only, after 0133):
 *   register (DCR) → consent (grant + code) → code exchange with PKCE →
 *   resolveAgentActor → refresh rotation → reuse of the old refresh token
 *   revokes the grant → the access token stops working.
 * Uses the first approved seller with a live store; deletes the client it
 * created at the end (grants, codes and tokens cascade).
 *
 *   pnpm --filter @workspace/lib exec tsx scripts/mcp-oauth-e2e.ts
 */
import { randomBytes } from "node:crypto";
import { and, db, eq, isNull, oauthClients, sellers, stores } from "@workspace/db";
import { OAuthError, parseRegistrationRequest, pkceChallengeS256 } from "../src/agents";
import {
  createAuthorization,
  exchangeAuthorizationCode,
  refreshAgentTokens,
  registerDcrClient,
  resolveAgentActor,
} from "../src/agents/server";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`FAILED: ${message}`);
  console.log(`ok - ${message}`);
}

async function expectInvalidGrant(promise: Promise<unknown>, message: string) {
  try {
    await promise;
  } catch (error) {
    assert(error instanceof OAuthError && error.error === "invalid_grant", message);
    return;
  }
  throw new Error(`FAILED: ${message} (no error)`);
}

async function main() {
  const [seller] = await db
    .select({ sellerId: sellers.id, storeId: stores.id })
    .from(sellers)
    .innerJoin(stores, and(eq(stores.sellerId, sellers.id), isNull(stores.deletedAt)))
    .where(eq(sellers.status, "approved"))
    .limit(1);
  if (!seller) throw new Error("no approved seller with a store");

  const redirectUri = "https://claude.ai/api/mcp/auth_callback";
  const meta = parseRegistrationRequest({ client_name: "E2E test client", redirect_uris: [redirectUri] });
  if (!meta.ok) throw new Error("metadata");
  const client = await registerDcrClient(meta.metadata);
  try {
    const verifier = randomBytes(32).toString("base64url");
    const { code } = await createAuthorization({
      client,
      sellerId: seller.sellerId,
      userId: seller.sellerId,
      allStores: false,
      storeIds: [seller.storeId],
      scopes: ["products.write", "website.publish", "bogus"],
      redirectUri,
      codeChallenge: pkceChallengeS256(verifier),
      resource: "https://mcp.tallaby.com/mcp",
    });
    assert(code.startsWith("tby_ac_"), "consent issues a code");

    await expectInvalidGrant(
      exchangeAuthorizationCode({ code, clientId: client.clientId, redirectUri, codeVerifier: `${verifier}x`, resource: null }),
      "wrong PKCE verifier is rejected",
    );

    const first = await exchangeAuthorizationCode({
      code,
      clientId: client.clientId,
      redirectUri,
      codeVerifier: verifier,
      resource: "https://mcp.tallaby.com/mcp",
    });
    assert(first.accessToken.startsWith("tby_at_") && first.refreshToken.startsWith("tby_rt_"), "code exchange issues tokens");
    assert(first.scopes.join(" ") === "store.read products.write website.publish", "scopes are normalized");

    await expectInvalidGrant(
      exchangeAuthorizationCode({ code, clientId: client.clientId, redirectUri, codeVerifier: verifier, resource: null }),
      "a code works only once",
    );
    assert((await resolveAgentActor(first.accessToken)) === null, "code reuse revoked the grant");

    // Fresh grant for the refresh checks.
    const verifier2 = randomBytes(32).toString("base64url");
    const { code: code2 } = await createAuthorization({
      client,
      sellerId: seller.sellerId,
      userId: seller.sellerId,
      allStores: true,
      storeIds: [],
      scopes: [],
      redirectUri,
      codeChallenge: pkceChallengeS256(verifier2),
      resource: null,
    });
    const tokens = await exchangeAuthorizationCode({ code: code2, clientId: client.clientId, redirectUri, codeVerifier: verifier2, resource: null });

    const actor = await resolveAgentActor(tokens.accessToken, { ip: "127.0.0.1", userAgent: "e2e" });
    assert(actor?.sellerId === seller.sellerId, "access token resolves to the seller");
    assert(actor!.storeIds.includes(seller.storeId), "all-stores grant includes the seller's store");
    assert(actor!.scopes.join(" ") === "store.read", "empty scope list keeps store.read only");

    const rotated = await refreshAgentTokens({ refreshToken: tokens.refreshToken, clientId: client.clientId });
    assert(rotated.refreshToken !== tokens.refreshToken, "refresh rotates the refresh token");
    assert((await resolveAgentActor(tokens.accessToken)) === null, "old access token stops after refresh");
    assert((await resolveAgentActor(rotated.accessToken))?.grantId === actor!.grantId, "new access token works");

    await expectInvalidGrant(
      refreshAgentTokens({ refreshToken: tokens.refreshToken, clientId: client.clientId }),
      "reused refresh token is rejected",
    );
    assert((await resolveAgentActor(rotated.accessToken)) === null, "refresh reuse revoked the whole grant");

    try {
      await createAuthorization({
        client,
        sellerId: seller.sellerId,
        userId: seller.sellerId,
        allStores: false,
        storeIds: ["00000000-0000-4000-8000-000000000000"],
        scopes: [],
        redirectUri,
        codeChallenge: pkceChallengeS256(verifier2),
        resource: null,
      });
      throw new Error("FAILED: foreign store accepted");
    } catch (error) {
      assert(error instanceof OAuthError && error.error === "access_denied", "a store the seller does not own is refused");
    }

    console.log("\nall checks passed");
  } finally {
    await db.delete(oauthClients).where(eq(oauthClients.id, client.id));
    console.log("cleaned up test client");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
