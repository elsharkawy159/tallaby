import { redirect } from "@/i18n/navigation";
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
    redirect({ href: "/login", locale });
  }

  return <>{children}</>;
}
