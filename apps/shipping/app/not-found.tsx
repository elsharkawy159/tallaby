import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@workspace/ui/components/button";

export default async function NotFound() {
  const t = await getTranslations("errors");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <h2 className="text-lg font-semibold">{t("notFound")}</h2>
      <p className="text-sm text-muted-foreground">{t("notFoundDescription")}</p>
      <Button asChild>
        <Link href="/">{t("backToDashboard")}</Link>
      </Button>
    </div>
  );
}
