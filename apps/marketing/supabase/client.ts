import { createBrowserClient } from "@supabase/ssr";

/** Browser client, used only to start Google sign-in (PKCE verifier cookie). */
export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
