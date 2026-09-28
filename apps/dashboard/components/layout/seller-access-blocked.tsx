import { getTranslations } from "next-intl/server";
import { logout } from "@/actions/auth";
import { STOREFRONT_URL } from "@/lib/constants";
import { getSellerStatusMessage } from "@/lib/utils/seller";
import type { SellerAccess } from "@/lib/auth/seller-access";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { LanguageSwitcher } from "./language-switcher.client";

type BlockedAccess = Extract<SellerAccess, { allowed: false }>;

/**
 * Full-page replacement for the dashboard when the signed-in user has no
 * seller row, or their seller status is not `approved`.
 */
export async function SellerAccessBlocked({ access }: { access: BlockedAccess }) {
  const t = await getTranslations();
  const noSeller = access.reason === "no_seller";
  const statusKey = noSeller ? null : getSellerStatusMessage(access.reason).key;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {noSeller
              ? t("sellerAccess.noSellerTitle")
              : t(`sellerStatus.${statusKey!}.title`)}
          </CardTitle>
          <CardDescription>
            {noSeller
              ? t("sellerAccess.noSellerMessage")
              : t(`sellerStatus.${statusKey!}.message`)}
          </CardDescription>
        </CardHeader>
        <CardContent />
        <CardFooter className="flex flex-col gap-2 sm:flex-row">
          {noSeller && (
            <Button asChild className="w-full sm:w-auto">
              <a href={`${STOREFRONT_URL}/onboarding`}>
                {t("sellerAccess.becomeSeller")}
              </a>
            </Button>
          )}
          <form action={logout} className="w-full sm:w-auto">
            <Button type="submit" variant="outline" className="w-full">
              {t("sellerAccess.signOut")}
            </Button>
          </form>
          <LanguageSwitcher className="w-full justify-center sm:w-auto" />
        </CardFooter>
      </Card>
    </div>
  );
}
