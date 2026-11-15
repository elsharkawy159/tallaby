import { validateAdminAccess } from "@/lib/auth/admin-auth";
import { SellerNotificationsForm } from "./seller-notifications.client";

export const dynamic = "force-dynamic";

/**
 * Admin › Seller notifications (owner request 2026-11-15): one message to a
 * group of sellers, from a ready template or written by hand. Same bell row
 * and push as the one-seller "Send notification" dialog on a seller's page.
 */
export default async function SellerNotificationsPage() {
  await validateAdminAccess("canManageUsers");
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Seller notifications</h1>
        <p className="text-sm text-muted-foreground">
          Send one message to a group of sellers. It appears in their dashboard bell and as a phone or browser alert,
          exactly as written, so pick the language your sellers read (usually Arabic). Every send is logged in each
          seller&apos;s audit tab.
        </p>
      </div>
      <SellerNotificationsForm />
    </div>
  );
}
