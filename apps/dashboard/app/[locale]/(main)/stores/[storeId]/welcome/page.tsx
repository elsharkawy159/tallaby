import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Link } from "@/i18n/navigation";
import { PageContainer, PageHeader, SellerButton } from "@/components/seller-ui";
import type { StoreRow } from "@workspace/lib/stores/server";
import { loadStorePage } from "@/lib/stores/store-page.server";
import { SignupPixelData } from "../../../_components/signup-pixel.data";
import { PendingProductSavedToast } from "../products/_components/product-saved-toast.client";
import { storeFontVariables } from "../website/_components/store-fonts";
import { StoreWelcome } from "./welcome.client";
import { loadWelcomeData } from "./welcome.data";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("storeWelcome");
  return { title: t("title") };
}

type SearchParams = Promise<{ welcome?: string | string[]; signup?: string | string[] }>;

/**
 * The store welcome page (docs/plans/seller-welcome.md, owner 2026-11-15,
 * simplified 2026-11-17): the store's setup as one flat list of at most three
 * steps, done in minutes, with a "Go to dashboard" skip at the top. A new seller lands here once after
 * signup (`?welcome=1&signup=…`, from the home), where the Meta
 * CompleteRegistration fires. A foreign or missing store is a 404 (rule 5).
 * The title and skip are a static frame; the store's data streams behind one
 * Suspense boundary.
 */
export default async function StoreWelcomePage({ params, searchParams }: { params: Promise<{ storeId: string }>; searchParams: SearchParams }) {
  const [{ storeId }, query] = await Promise.all([params, searchParams]);
  const store = await loadStorePage(storeId);
  const t = await getTranslations("storeWelcome");
  const welcome = query.welcome === "1";
  const signup = typeof query.signup === "string" ? query.signup : undefined;

  return (
    <PageContainer narrow>
      <PageHeader
        className="sui-rise"
        title={welcome ? t("welcomeTitle") : t("title")}
        description={welcome ? t("welcomeDescription") : t("description")}
        actions={
          <SellerButton asChild variant="outline" size="sm">
            <Link href="/">
              {t("skip")}
              <ArrowLeft className="ltr:rotate-180" aria-hidden />
            </Link>
          </SellerButton>
        }
      />
      {welcome && signup && (
        <Suspense fallback={null}>
          <SignupPixelData signup={signup} />
        </Suspense>
      )}
      <PendingProductSavedToast />
      <Suspense fallback={<WelcomeSkeleton />}>
        <WelcomeSections store={store} />
      </Suspense>
    </PageContainer>
  );
}

async function WelcomeSections({ store }: { store: StoreRow }) {
  const data = await loadWelcomeData(store, await getLocale());
  if (!data) notFound();
  return <StoreWelcome data={data} fontClassName={storeFontVariables} />;
}

function WelcomeSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden>
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-1.5 w-full rounded-full" />
      {/* One card: the open first step, then two closed ones. */}
      <Skeleton className="h-[480px] w-full rounded-[24px] max-[600px]:rounded-[20px]" />
    </div>
  );
}
