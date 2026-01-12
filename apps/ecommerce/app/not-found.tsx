import { Button } from "@workspace/ui/components";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <main className="grid min-h-full place-items-center bg-white px-6 py-24 sm:py-32 lg:px-8">
      <div className="text-center">
        <p className="text-base font-semibold text-primary">404</p>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight text-balance text-gray-900 sm:text-7xl">
          {t("pageNotFound")}
        </h1>
        <p className="mt-6 text-lg font-medium text-pretty text-gray-500 sm:text-xl/8">
          {t("sorryNotFound")}
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Button asChild>
            <Link href="/">{t("goBackHome")}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/contact" className="text-gray-900">
              {t("contactSupport")} <span aria-hidden="true">&rarr;</span>
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
