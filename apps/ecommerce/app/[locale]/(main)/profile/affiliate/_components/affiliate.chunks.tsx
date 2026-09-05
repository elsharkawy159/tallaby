"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Users } from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";

import { Link, useRouter } from "@/i18n/navigation";
import { joinAffiliateProgramAction } from "@/actions/affiliate";

/** Shown when the viewer has no signed-in Tallaby account — matches WalletSignInPrompt's shape. */
export function AffiliateSignInPrompt() {
  const t = useTranslations("affiliate");

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
        <div className="rounded-full bg-primary/10 p-4">
          <Users className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">{t("signInTitle")}</h3>
          <p className="text-sm text-muted-foreground">{t("signInDescription")}</p>
        </div>
        <Button asChild>
          <Link href="/auth?redirect=/profile/affiliate">{t("signIn")}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

/** Shown to a signed-in customer who hasn't activated the affiliate program yet. */
export function AffiliateJoinPrompt() {
  const t = useTranslations("affiliate");
  const router = useRouter();
  const [isJoining, startJoining] = useTransition();

  const handleJoin = () => {
    startJoining(async () => {
      const result = await joinAffiliateProgramAction();
      if (result.success) {
        toast.success(t("joinSuccess", { code: result.data.code }));
        router.refresh();
      } else {
        toast.error(t("joinFailed"));
      }
    });
  };

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
        <div className="rounded-full bg-primary/10 p-4">
          <Users className="h-8 w-8 text-primary" />
        </div>
        <div className="max-w-md space-y-1">
          <h3 className="text-lg font-semibold">{t("joinPromptTitle")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("joinPromptDescription")}
          </p>
        </div>
        <Button onClick={handleJoin} disabled={isJoining}>
          {isJoining ? t("joining") : t("joinCta")}
        </Button>
      </CardContent>
    </Card>
  );
}

export function AffiliateUnavailable() {
  const t = useTranslations("affiliate");

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
        <div className="rounded-full bg-destructive/10 p-4">
          <Users className="h-8 w-8 text-destructive" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">{t("unavailableTitle")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("unavailableDescription")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
