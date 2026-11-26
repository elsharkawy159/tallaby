import { cache } from "react";
import { getBillingState } from "@workspace/lib/billing/server";

/**
 * Billing settings and the current rate, read once per render (React cache():
 * per request only, never across requests, CLAUDE.md rule 8). The layout reads
 * them for the EGP rate, the order lock and the welcome gift. Outside a render
 * (server actions, route handlers) this is a fresh read every call.
 */
export const loadBillingState = cache(getBillingState);
