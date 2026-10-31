/**
 * Tallaby OAuth 2.1 server storage for MCP assistants (ROADMAP.md F-29b,
 * design note §4, §9; migration 0133). Used by the dashboard's OAuth routes
 * (register, consent, token, revoke) and by the MCP server (resolveAgentActor).
 *
 * Rules:
 *   - only digests of codes and tokens are stored (tokens.lib.ts);
 *   - the seller comes from the signed-in session at consent time, and store
 *     ids are checked against that seller in SQL before a grant is written;
 *   - an authorization code works once; a second use revokes the grant;
 *   - refresh tokens rotate on every use; replaying an old one revokes the
 *     grant (stolen-token detection);
 *   - every call re-checks the grant, the client and the seller's status, and
 *     narrows the grant to stores the seller still owns.
 * No caching anywhere (CLAUDE.md rule 8).
 */
import { randomUUID } from "node:crypto";
import {
  agentGrants,
  agentTokens,
  and,
  db,
  eq,

  inArray,
  isNull,
  oauthAuthCodes,
  oauthClients,
  or,
  sellers,
  sql,
  stores,
} from "@workspace/db";
import { logServerError } from "@workspace/db/log";
import { AGENT_ALLOWED_SELLER_STATUSES, type AgentActor } from "./actor.lib";
import { CIMD_CACHE_SECONDS, type ClientMetadata, isCimdClientId, parseCimdDocument } from "./clients.lib";
import { checkResource, OAuthError, parseResourceList } from "./oauth.lib";
import { redirectUriMatches } from "./redirect-uri.lib";
import { fetchPublicJson } from "./safe-fetch.server";
import { type AgentScope, normalizeScopes } from "./scopes.lib";
import {
  ACCESS_TOKEN_TTL_SECONDS,
  AUTH_CODE_TTL_SECONDS,
  generateToken,
  hashToken,
  REFRESH_TOKEN_TTL_SECONDS,
  tokenKindOf,
  verifyPkceS256,
} from "./tokens.lib";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Queryable = typeof db | Tx;

export type OAuthClientRecord = {
  id: string;
  clientId: string;
  kind: "dcr" | "cimd" | "pat";
  name: string;
  redirectUris: string[];
  clientUri: string | null;
  logoUrl: string | null;
};

export type IssuedTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  scopes: AgentScope[];
  grantId: string;
};

function pepper(): string | null {
  return process.env.MCP_TOKEN_PEPPER || null;
}

/** Tallaby's MCP resource URLs (RFC 8707), from `MCP_RESOURCE_URLS`. */
export function allowedMcpResources(): string[] {
  return parseResourceList(process.env.MCP_RESOURCE_URLS);
}

function addSeconds(date: Date, seconds: number): string {
  return new Date(date.getTime() + seconds * 1000).toISOString();
}

const clientColumns = {
  id: oauthClients.id,
  clientId: oauthClients.clientId,
  kind: oauthClients.kind,
  name: oauthClients.name,
  redirectUris: oauthClients.redirectUris,
  clientUri: oauthClients.clientUri,
  logoUrl: oauthClients.logoUrl,
  disabledAt: oauthClients.disabledAt,
  metadataFetchedAt: oauthClients.metadataFetchedAt,
};

type ClientRow = {
  id: string;
  clientId: string;
  kind: string;
  name: string;
  redirectUris: string[];
  clientUri: string | null;
  logoUrl: string | null;
  disabledAt: string | null;
  metadataFetchedAt: string | null;
};

function toRecord(row: ClientRow): OAuthClientRecord {
  return {
    id: row.id,
    clientId: row.clientId,
    kind: row.kind as OAuthClientRecord["kind"],
    name: row.name,
    redirectUris: row.redirectUris,
    clientUri: row.clientUri,
    logoUrl: row.logoUrl,
  };
}

// ── Clients ─────────────────────────────────────────────────────────────────

/** Dynamic Client Registration (RFC 7591): a new public client. */
export async function registerDcrClient(metadata: ClientMetadata): Promise<OAuthClientRecord> {
  const clientId = generateToken("client");
  const [row] = await db
    .insert(oauthClients)
    .values({
      clientId,
      kind: "dcr",
      name: metadata.name,
      redirectUris: metadata.redirectUris,
      clientUri: metadata.clientUri,
      logoUrl: metadata.logoUrl,
      softwareId: metadata.softwareId,
    })
    .returning(clientColumns);
  return toRecord(row!);
}

async function refreshCimdClient(clientId: string, now: Date): Promise<OAuthClientRecord | null> {
  let doc: unknown;
  try {
    doc = await fetchPublicJson(clientId, { maxBytes: 16 * 1024, timeoutMs: 5000 });
  } catch {
    return null;
  }
  const parsed = parseCimdDocument(clientId, doc);
  if (!parsed.ok) return null;
  const m = parsed.metadata;
  const fetchedAt = now.toISOString();
  const [row] = await db
    .insert(oauthClients)
    .values({
      clientId,
      kind: "cimd",
      name: m.name,
      redirectUris: m.redirectUris,
      clientUri: m.clientUri,
      logoUrl: m.logoUrl,
      softwareId: m.softwareId,
      metadataFetchedAt: fetchedAt,
    })
    .onConflictDoUpdate({
      target: oauthClients.clientId,
      set: {
        name: m.name,
        redirectUris: m.redirectUris,
        clientUri: m.clientUri,
        logoUrl: m.logoUrl,
        softwareId: m.softwareId,
        metadataFetchedAt: fetchedAt,
      },
      // Never revive a client Tallaby disabled, never turn a DCR row into CIMD.
      setWhere: and(isNull(oauthClients.disabledAt), eq(oauthClients.kind, "cimd")),
    })
    .returning(clientColumns);
  return row && !row.disabledAt ? toRecord(row) : null;
}

/**
 * Looks up a client by `client_id`. A CIMD URL is fetched (SSRF-guarded) the
 * first time and again once the cached copy is a day old; if the refetch fails
 * the cached copy keeps working. Disabled clients resolve to null.
 */
export async function resolveClient(clientId: string, now = new Date()): Promise<OAuthClientRecord | null> {
  if (typeof clientId !== "string" || clientId.length < 8 || clientId.length > 2000) return null;
  const [row] = await db.select(clientColumns).from(oauthClients).where(eq(oauthClients.clientId, clientId)).limit(1);
  if (row?.disabledAt) return null;

  if (isCimdClientId(clientId) && (!row || row.kind === "cimd")) {
    const stale =
      !row?.metadataFetchedAt || now.getTime() - new Date(row.metadataFetchedAt).getTime() > CIMD_CACHE_SECONDS * 1000;
    if (stale) {
      const fresh = await refreshCimdClient(clientId, now);
      if (fresh) return fresh;
    }
  }
  return row ? toRecord(row) : null;
}

// ── Consent → grant + code ─────────────────────────────────────────────────

export type CreateAuthorizationInput = {
  client: OAuthClientRecord;
  sellerId: string;
  userId: string;
  allStores: boolean;
  storeIds: string[];
  scopes: string[];
  redirectUri: string;
  codeChallenge: string;
  resource: string | null;
  now?: Date;
};

/** The seller's live stores among `storeIds` (all of them when `storeIds` is null). */
async function ownedStoreIds(q: Queryable, sellerId: string, storeIds: string[] | null): Promise<string[]> {
  if (storeIds !== null && storeIds.length === 0) return [];
  const rows = await q
    .select({ id: stores.id })
    .from(stores)
    .where(
      and(
        eq(stores.sellerId, sellerId),
        isNull(stores.deletedAt),
        storeIds === null ? undefined : inArray(stores.id, storeIds),
      ),
    );
  return rows.map((r) => r.id);
}

/**
 * Called by the consent page after "Allow". Writes the grant and a one-time
 * code. Throws OAuthError when the redirect, stores or resource do not check
 * out; the page has already validated them, this is the server-side re-check.
 */
export async function createAuthorization(input: CreateAuthorizationInput): Promise<{ code: string; grantId: string }> {
  const now = input.now ?? new Date();
  if (!redirectUriMatches(input.client.redirectUris, input.redirectUri)) {
    throw new OAuthError("invalid_request", "redirect_uri is not registered for this client.");
  }
  const resource = checkResource(input.resource, allowedMcpResources());
  const scopes = normalizeScopes(input.scopes);
  const requested = [...new Set(input.storeIds)];
  if (!input.allStores && (requested.length === 0 || requested.length > 100)) {
    throw new OAuthError("invalid_request", "Choose at least one store.");
  }

  const code = generateToken("code");
  const grantId = await db.transaction(async (tx) => {
    if (!input.allStores) {
      const owned = await ownedStoreIds(tx, input.sellerId, requested);
      if (owned.length !== requested.length) throw new OAuthError("access_denied", "Unknown store.");
    }
    const [grant] = await tx
      .insert(agentGrants)
      .values({
        sellerId: input.sellerId,
        userId: input.userId,
        clientId: input.client.id,
        clientLabel: input.client.name.slice(0, 200),
        allStores: input.allStores,
        storeIds: input.allStores ? [] : requested,
        scopes,
        resource,
      })
      .returning({ id: agentGrants.id });
    await tx.insert(oauthAuthCodes).values({
      codeHash: hashToken(code, pepper()),
      grantId: grant!.id,
      redirectUri: input.redirectUri,
      codeChallenge: input.codeChallenge,
      resource,
      expiresAt: addSeconds(now, AUTH_CODE_TTL_SECONDS),
    });
    await tx.update(oauthClients).set({ lastUsedAt: now.toISOString() }).where(eq(oauthClients.id, input.client.id));
    return grant!.id;
  });
  return { code, grantId };
}

// ── Tokens ──────────────────────────────────────────────────────────────────

async function issueTokenPair(tx: Tx, grantId: string, familyId: string, now: Date) {
  const accessToken = generateToken("access");
  const refreshToken = generateToken("refresh");
  await tx.insert(agentTokens).values([
    {
      grantId,
      kind: "access",
      tokenHash: hashToken(accessToken, pepper()),
      familyId,
      expiresAt: addSeconds(now, ACCESS_TOKEN_TTL_SECONDS),
    },
    {
      grantId,
      kind: "refresh",
      tokenHash: hashToken(refreshToken, pepper()),
      familyId,
      expiresAt: addSeconds(now, REFRESH_TOKEN_TTL_SECONDS),
    },
  ]);
  return { accessToken, refreshToken, expiresIn: ACCESS_TOKEN_TTL_SECONDS };
}

async function revokeGrantTx(q: Queryable, grantId: string, reason: string, now: Date) {
  const at = now.toISOString();
  await q
    .update(agentGrants)
    .set({ revokedAt: at, revokedReason: reason })
    .where(and(eq(agentGrants.id, grantId), isNull(agentGrants.revokedAt)));
  await q
    .update(agentTokens)
    .set({ revokedAt: at })
    .where(and(eq(agentTokens.grantId, grantId), isNull(agentTokens.revokedAt)));
}

const INVALID_GRANT = () => new OAuthError("invalid_grant", "The code or token is invalid, expired or already used.");

/** `grant_type=authorization_code` with PKCE. */
export async function exchangeAuthorizationCode(input: {
  code: string;
  clientId: string;
  redirectUri: string;
  codeVerifier: string;
  resource: string | null;
  now?: Date;
}): Promise<IssuedTokens> {
  const now = input.now ?? new Date();
  if (tokenKindOf(input.code) !== "code") throw INVALID_GRANT();
  const resource = checkResource(input.resource, allowedMcpResources());
  const client = await resolveClient(input.clientId, now);
  if (!client) throw new OAuthError("invalid_client", "Unknown client.", 401);

  const outcome = await db.transaction(async (tx) => {
    const [code] = await tx
      .select()
      .from(oauthAuthCodes)
      .where(eq(oauthAuthCodes.codeHash, hashToken(input.code, pepper())))
      .limit(1)
      .for("update");
    if (!code) return { kind: "invalid" as const };
    if (code.usedAt) return { kind: "reused" as const, grantId: code.grantId };

    const [grant] = await tx
      .select({ id: agentGrants.id, clientId: agentGrants.clientId, scopes: agentGrants.scopes, revokedAt: agentGrants.revokedAt })
      .from(agentGrants)
      .where(eq(agentGrants.id, code.grantId))
      .limit(1);
    const valid =
      grant &&
      !grant.revokedAt &&
      grant.clientId === client.id &&
      new Date(code.expiresAt).getTime() > now.getTime() &&
      code.redirectUri === input.redirectUri &&
      (resource === null || code.resource === null || code.resource === resource) &&
      verifyPkceS256(input.codeVerifier, code.codeChallenge);
    if (!valid) return { kind: "invalid" as const };

    await tx.update(oauthAuthCodes).set({ usedAt: now.toISOString() }).where(eq(oauthAuthCodes.codeHash, code.codeHash));
    const tokens = await issueTokenPair(tx, grant.id, randomUUID(), now);
    return { kind: "ok" as const, tokens, grantId: grant.id, scopes: grant.scopes };
  });

  if (outcome.kind === "reused") {
    // RFC 6749 §4.1.2: a code used twice revokes what it produced.
    await revokeGrantTx(db, outcome.grantId, "code_reuse", now);
    throw INVALID_GRANT();
  }
  if (outcome.kind !== "ok") throw INVALID_GRANT();
  return { ...outcome.tokens, scopes: normalizeScopes(outcome.scopes), grantId: outcome.grantId };
}

/** `grant_type=refresh_token`: rotate (old refresh token is spent, a new pair is issued). */
export async function refreshAgentTokens(input: { refreshToken: string; clientId: string; now?: Date }): Promise<IssuedTokens> {
  const now = input.now ?? new Date();
  if (tokenKindOf(input.refreshToken) !== "refresh") throw INVALID_GRANT();
  const client = await resolveClient(input.clientId, now);
  if (!client) throw new OAuthError("invalid_client", "Unknown client.", 401);

  const outcome = await db.transaction(async (tx) => {
    const [token] = await tx
      .select()
      .from(agentTokens)
      .where(eq(agentTokens.tokenHash, hashToken(input.refreshToken, pepper())))
      .limit(1)
      .for("update");
    if (!token || token.kind !== "refresh") return { kind: "invalid" as const };

    const [grant] = await tx
      .select({ id: agentGrants.id, clientId: agentGrants.clientId, scopes: agentGrants.scopes, revokedAt: agentGrants.revokedAt, sellerStatus: sellers.status })
      .from(agentGrants)
      .innerJoin(sellers, eq(sellers.id, agentGrants.sellerId))
      .where(eq(agentGrants.id, token.grantId))
      .limit(1);
    if (!grant || grant.clientId !== client.id) return { kind: "invalid" as const };
    if (token.usedAt && !token.revokedAt && !grant.revokedAt) return { kind: "reused" as const, grantId: grant.id };
    const live =
      !token.revokedAt &&
      !grant.revokedAt &&
      token.expiresAt !== null &&
      new Date(token.expiresAt).getTime() > now.getTime() &&
      AGENT_ALLOWED_SELLER_STATUSES.has(grant.sellerStatus ?? "");
    if (!live) return { kind: "invalid" as const };

    await tx.update(agentTokens).set({ usedAt: now.toISOString() }).where(eq(agentTokens.id, token.id));
    // The access tokens of the spent pair stop working too.
    await tx
      .update(agentTokens)
      .set({ revokedAt: now.toISOString() })
      .where(and(eq(agentTokens.familyId, token.familyId), eq(agentTokens.kind, "access"), isNull(agentTokens.revokedAt)));
    const tokens = await issueTokenPair(tx, grant.id, token.familyId, now);
    return { kind: "ok" as const, tokens, grantId: grant.id, scopes: grant.scopes };
  });

  if (outcome.kind === "reused") {
    logServerError("integration", "mcp refresh token reuse; grant revoked", { grantId: outcome.grantId });
    await revokeGrantTx(db, outcome.grantId, "refresh_reuse", now);
    throw INVALID_GRANT();
  }
  if (outcome.kind !== "ok") throw INVALID_GRANT();
  return { ...outcome.tokens, scopes: normalizeScopes(outcome.scopes), grantId: outcome.grantId };
}

/**
 * RFC 7009 revocation. A refresh token (or PAT) revokes the whole grant; an
 * access token only itself. Unknown tokens are not an error.
 */
export async function revokePresentedToken(input: { token: string; clientId?: string | null; now?: Date }): Promise<void> {
  const now = input.now ?? new Date();
  const kind = tokenKindOf(input.token);
  if (kind !== "access" && kind !== "refresh" && kind !== "pat") return;
  const [row] = await db
    .select({ id: agentTokens.id, grantId: agentTokens.grantId, kind: agentTokens.kind, clientId: oauthClients.clientId })
    .from(agentTokens)
    .innerJoin(agentGrants, eq(agentGrants.id, agentTokens.grantId))
    .innerJoin(oauthClients, eq(oauthClients.id, agentGrants.clientId))
    .where(eq(agentTokens.tokenHash, hashToken(input.token, pepper())))
    .limit(1);
  if (!row) return;
  if (input.clientId && input.clientId !== row.clientId) return;
  if (row.kind === "access") {
    await db.update(agentTokens).set({ revokedAt: now.toISOString() }).where(and(eq(agentTokens.id, row.id), isNull(agentTokens.revokedAt)));
    return;
  }
  await revokeGrantTx(db, row.grantId, "client", now);
}

/** The seller disconnects an assistant (F-29d). Scoped by seller in SQL. */
export async function revokeAgentGrant(sellerId: string, grantId: string, now = new Date()): Promise<boolean> {
  const [grant] = await db
    .select({ id: agentGrants.id })
    .from(agentGrants)
    .where(and(eq(agentGrants.id, grantId), eq(agentGrants.sellerId, sellerId)))
    .limit(1);
  if (!grant) return false;
  await revokeGrantTx(db, grant.id, "seller", now);
  return true;
}

// ── Token check for the MCP server ──────────────────────────────────────────

const TOUCH_INTERVAL = sql`interval '60 seconds'`;

/**
 * Bearer token → the actor behind it, or null (unknown, expired, revoked,
 * client disabled, seller blocked). Store ids are re-read on every call, so a
 * deleted or transferred store drops out immediately.
 */
export async function resolveAgentActor(
  token: string,
  context: { ip?: string | null; userAgent?: string | null; now?: Date } = {},
): Promise<AgentActor | null> {
  const now = context.now ?? new Date();
  const kind = tokenKindOf(token);
  if (kind !== "access" && kind !== "pat") return null;

  const [row] = await db
    .select({
      tokenId: agentTokens.id,
      tokenKind: agentTokens.kind,
      expiresAt: agentTokens.expiresAt,
      tokenRevokedAt: agentTokens.revokedAt,
      grantId: agentGrants.id,
      grantRevokedAt: agentGrants.revokedAt,
      sellerId: agentGrants.sellerId,
      userId: agentGrants.userId,
      clientLabel: agentGrants.clientLabel,
      scopes: agentGrants.scopes,
      allStores: agentGrants.allStores,
      storeIds: agentGrants.storeIds,
      clientDisabledAt: oauthClients.disabledAt,
      sellerStatus: sellers.status,
    })
    .from(agentTokens)
    .innerJoin(agentGrants, eq(agentGrants.id, agentTokens.grantId))
    .innerJoin(oauthClients, eq(oauthClients.id, agentGrants.clientId))
    .innerJoin(sellers, eq(sellers.id, agentGrants.sellerId))
    .where(eq(agentTokens.tokenHash, hashToken(token, pepper())))
    .limit(1);

  if (!row || row.tokenKind !== kind) return null;
  if (row.tokenRevokedAt || row.grantRevokedAt || row.clientDisabledAt) return null;
  if (row.expiresAt && new Date(row.expiresAt).getTime() <= now.getTime()) return null;
  if (kind === "access" && !row.expiresAt) return null;
  const sellerStatus = row.sellerStatus ?? "pending";
  if (!AGENT_ALLOWED_SELLER_STATUSES.has(sellerStatus)) return null;

  const storeIds = await ownedStoreIds(db, row.sellerId, row.allStores ? null : row.storeIds);

  const at = now.toISOString();
  await Promise.all([
    db
      .update(agentTokens)
      .set({
        lastUsedAt: at,
        lastUsedIp: context.ip?.slice(0, 100) ?? null,
        lastUsedUa: context.userAgent?.slice(0, 300) ?? null,
      })
      .where(and(eq(agentTokens.id, row.tokenId), or(isNull(agentTokens.lastUsedAt), sql`${agentTokens.lastUsedAt} < ${at}::timestamptz - ${TOUCH_INTERVAL}`))),
    db
      .update(agentGrants)
      .set({ lastUsedAt: at })
      .where(and(eq(agentGrants.id, row.grantId), or(isNull(agentGrants.lastUsedAt), sql`${agentGrants.lastUsedAt} < ${at}::timestamptz - ${TOUCH_INTERVAL}`))),
  ]).catch((error) => logServerError("integration", "mcp token touch failed", { grantId: row.grantId }, error));

  return {
    kind: "agent",
    grantId: row.grantId,
    tokenId: row.tokenId,
    tokenKind: kind,
    sellerId: row.sellerId,
    userId: row.userId,
    sellerStatus,
    clientLabel: row.clientLabel,
    scopes: normalizeScopes(row.scopes),
    allStores: row.allStores,
    storeIds,
  };
}

/** Housekeeping for a cron (F-29c/k): spent codes and long-expired tokens. */
export async function purgeExpiredAgentSecrets(now = new Date()): Promise<{ codes: number; tokens: number }> {
  const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const codes = await db.delete(oauthAuthCodes).where(sql`${oauthAuthCodes.expiresAt} < ${cutoff}::timestamptz`).returning({ h: oauthAuthCodes.codeHash });
  // PATs without an expiry are never deleted here.
  const tokens = await db
    .delete(agentTokens)
    .where(sql`${agentTokens.expiresAt} < ${cutoff}::timestamptz`)
    .returning({ id: agentTokens.id });
  return { codes: codes.length, tokens: tokens.length };
}
