/**
 * OAuth client metadata for MCP assistants (ROADMAP.md F-29b): Dynamic Client
 * Registration requests (RFC 7591) and Client ID Metadata Documents (CIMD,
 * draft-ietf-oauth-client-id-metadata-document). Only public clients with
 * PKCE are supported (`token_endpoint_auth_method: none`). Pure.
 */
import { z } from "zod";
import { isAllowedRedirectUri } from "./redirect-uri.lib";

export type ClientMetadata = {
  name: string;
  redirectUris: string[];
  clientUri: string | null;
  logoUrl: string | null;
  softwareId: string | null;
};

const optionalHttpsUrl = z
  .string()
  .max(2000)
  .optional()
  .nullable()
  .transform((value) => (value && isHttpsUrl(value) ? value : null));

const baseSchema = z.object({
  redirect_uris: z.array(z.string()).min(1).max(20),
  client_name: z.string().trim().max(200).optional().nullable(),
  client_uri: optionalHttpsUrl,
  logo_uri: optionalHttpsUrl,
  software_id: z.string().trim().max(200).optional().nullable(),
  grant_types: z.array(z.string()).max(10).optional().nullable(),
  response_types: z.array(z.string()).max(10).optional().nullable(),
  token_endpoint_auth_method: z.string().max(100).optional().nullable(),
});

export type ClientMetadataResult =
  | { ok: true; metadata: ClientMetadata }
  | { ok: false; error: "invalid_redirect_uri" | "invalid_client_metadata"; description: string };

function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

function hostOf(value: string): string | null {
  try {
    return new URL(value).hostname || null;
  } catch {
    return null;
  }
}

function toMetadata(
  input: z.infer<typeof baseSchema>,
  fallbackName: string,
  options: { allowConfidentialMethods: boolean },
): ClientMetadataResult {
  const bad = input.redirect_uris.find((uri) => !isAllowedRedirectUri(uri));
  if (bad !== undefined) {
    return { ok: false, error: "invalid_redirect_uri", description: "A redirect_uri is not allowed." };
  }
  if (input.grant_types && !input.grant_types.includes("authorization_code")) {
    return { ok: false, error: "invalid_client_metadata", description: "grant_types must include authorization_code." };
  }
  if (input.response_types && !input.response_types.includes("code")) {
    return { ok: false, error: "invalid_client_metadata", description: "response_types must include code." };
  }
  const method = input.token_endpoint_auth_method;
  // DCR: a client asking for a secret still gets a public client (the response
  // says `none`). CIMD: a document asking for key auth cannot be honoured.
  if (method && method !== "none" && !options.allowConfidentialMethods) {
    return { ok: false, error: "invalid_client_metadata", description: "Only token_endpoint_auth_method none is supported." };
  }
  return {
    ok: true,
    metadata: {
      name: input.client_name?.trim() || fallbackName,
      redirectUris: [...new Set(input.redirect_uris)],
      clientUri: input.client_uri,
      logoUrl: input.logo_uri,
      softwareId: input.software_id?.trim() || null,
    },
  };
}

/** Parses a DCR request body. */
export function parseRegistrationRequest(body: unknown): ClientMetadataResult {
  const parsed = baseSchema.safeParse(body);
  if (!parsed.success) {
    return { ok: false, error: "invalid_client_metadata", description: "Invalid client metadata." };
  }
  const fallback = hostOf(parsed.data.client_uri ?? "") ?? hostOf(parsed.data.redirect_uris[0] ?? "") ?? "AI assistant";
  return toMetadata(parsed.data, fallback, { allowConfidentialMethods: true });
}

/**
 * A CIMD client_id: an https URL with a path, no fragment, no credentials, no
 * dot segments (the document lives at that exact URL).
 */
export function isCimdClientId(clientId: string): boolean {
  if (clientId.length > 2000 || !clientId.startsWith("https://")) return false;
  try {
    const url = new URL(clientId);
    if (url.protocol !== "https:" || url.username || url.password || url.hash || clientId.includes("#")) return false;
    if (url.pathname === "/" || url.pathname === "") return false;
    if (/(^|\/)\.\.?(\/|$)/.test(url.pathname)) return false;
    return url.toString() === clientId;
  } catch {
    return false;
  }
}

/** Validates a fetched CIMD document for `clientId`. */
export function parseCimdDocument(clientId: string, doc: unknown): ClientMetadataResult {
  const parsed = baseSchema.extend({ client_id: z.string() }).safeParse(doc);
  if (!parsed.success || parsed.data.client_id !== clientId) {
    return { ok: false, error: "invalid_client_metadata", description: "Client metadata document is invalid." };
  }
  return toMetadata(parsed.data, hostOf(clientId) ?? "AI assistant", { allowConfidentialMethods: false });
}

/** How long a fetched CIMD document is trusted before it is fetched again. */
export const CIMD_CACHE_SECONDS = 24 * 60 * 60;

/** The DCR response body (RFC 7591 §3.2.1). */
export function registrationResponse(clientId: string, metadata: ClientMetadata, issuedAt: Date) {
  return {
    client_id: clientId,
    client_id_issued_at: Math.floor(issuedAt.getTime() / 1000),
    client_name: metadata.name,
    redirect_uris: metadata.redirectUris,
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    token_endpoint_auth_method: "none",
    ...(metadata.clientUri ? { client_uri: metadata.clientUri } : {}),
    ...(metadata.logoUrl ? { logo_uri: metadata.logoUrl } : {}),
    ...(metadata.softwareId ? { software_id: metadata.softwareId } : {}),
  };
}
