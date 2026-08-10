import { createClient as createSupabaseClient } from "@supabase/supabase-js";

let serviceClient: ReturnType<typeof createSupabaseClient> | null = null;

/**
 * Service-role Supabase client for trusted server-only operations
 * (private storage uploads, signed URL minting). Bypasses RLS —
 * every caller is responsible for its own authorization checks
 * (ownership, order/download-token validation) before using it.
 * Never import this in client components or expose it to the browser.
 */
export function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase service role client is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  if (!serviceClient) {
    serviceClient = createSupabaseClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  return serviceClient;
}

export const DIGITAL_PRODUCTS_BUCKET = "digital-products";
