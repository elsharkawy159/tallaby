import { storeRedirect } from "@/i18n/store-navigation.server";
import { getLocale } from "next-intl/server";
import { createClient } from "@/supabase/server";

// Auth gate — resolved per request from the session cookie.
export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data?.user) {
    const locale = await getLocale();
    await storeRedirect({ href: "/login", locale });
  }

  return <>{children}</>;
}
