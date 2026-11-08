import { aiConfigured } from "@workspace/ai";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { PageContainer } from "@/components/seller-ui";
import { isAccessError, requireSeller } from "@/lib/auth/require-seller.server";
import { SignupPixelData } from "@/app/(main)/_components/signup-pixel.data";
import { WelcomeBanner } from "@/app/(main)/_components/welcome-banner.client";
import { builderEnabled } from "@/app/(main)/ai-builder/builder-access.server";
import { toView } from "@/app/(main)/ai-builder/builder-chat.server";
import { BuilderChat } from "@/app/(main)/ai-builder/builder.client";
import { loadReview } from "@/app/(main)/ai-builder/builder-run.server";
import { loadLatestBuild } from "@/app/(main)/ai-builder/builder.store.server";
import { startBuildFromIntake } from "@/app/(main)/ai-builder/builder-chat-v2.server";
import { BuilderWorkspace } from "./_components/workspace.client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("aiBuilder");
  return { title: t("title"), robots: { index: false } };
}

type SearchParams = { welcome?: string | string[]; signup?: string | string[]; intake?: string | string[] };

/**
 * The AI Store Builder (ROADMAP.md F-54, F-82i): full screen, outside the
 * dashboard sidebar ((builder) group: same seller gate). A v2 conversation is
 * the two-pane chat (chat on the left, the store on the right, in Arabic too);
 * a v1 conversation saved before v2 keeps its old screens. Hidden behind its switch.
 */
export default async function AiBuilderPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  if (!builderEnabled()) notFound();
  const { welcome, signup, intake } = await searchParams;
  // Starting or claiming a build from the hero intake writes, so it needs a seller who may write
  // (a read-only seller still sees their saved build, and the intake waits).
  const writer = typeof intake === "string" ? await requireSeller({ forWrite: true }).catch((error: unknown) => (isAccessError(error) ? null : Promise.reject(error))) : null;
  const seller = writer ?? (await requireSeller());
  const fromHero = Boolean(writer) && typeof intake === "string";
  // From the tallaby.com hero (F-82d/e): the intake claimed at signup becomes this seller's build (made once; later visits find it).
  // The seller id is the session's; the intake id only finds a row this seller claimed.
  const fromIntake = fromHero ? await startBuildFromIntake(seller.sellerId, intake as string) : null;
  const build = fromIntake?.ok ? fromIntake.build : await loadLatestBuild(seller.sellerId);
  const review = build?.status === "review" ? await loadReview({ sellerId: seller.sellerId, userId: seller.userId, sellerStatus: seller.status }, build) : null;
  const view = build ? toView(build, fromIntake?.ok ? (fromIntake.notice ?? null) : null) : null;
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "tallaby.com";
  // Meta CompleteRegistration on the first visit after signup (?signup=email|google; checked for a new account inside).
  const pixel = typeof signup === "string" && (
    <Suspense fallback={null}>
      <SignupPixelData signup={signup} />
    </Suspense>
  );

  if (view && view.flow === "v1") {
    return (
      <div className="seller-shell min-h-dvh bg-background py-6">
        {pixel}
        <PageContainer narrow>
          {welcome === "1" && <WelcomeBanner />}
          <BuilderChat initialView={view} initialReview={review} aiReady={aiConfigured()} templatesBaseUrl={`https://${rootDomain}/template-preview`} />
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="seller-shell">
      {pixel}
      <BuilderWorkspace initialView={view} initialReview={review} aiReady={aiConfigured()} siteOrigin={`https://${rootDomain}`} welcome={welcome === "1"} />
    </div>
  );
}
