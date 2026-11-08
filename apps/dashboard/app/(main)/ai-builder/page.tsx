import { aiConfigured } from "@workspace/ai";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { PageContainer } from "@/components/seller-ui";
import { requireSeller } from "@/lib/auth/require-seller.server";
import { SignupPixelData } from "../_components/signup-pixel.data";
import { WelcomeBanner } from "../_components/welcome-banner.client";
import { builderEnabled } from "./builder-access.server";
import { toView } from "./builder-chat.server";
import { BuilderChat } from "./builder.client";
import { loadReview } from "./builder-run.server";
import { loadLatestBuild } from "./builder.store.server";
import { startBuildFromIntake } from "./builder-chat-v2.server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("aiBuilder");
  return { title: t("title"), robots: { index: false } };
}

/** The AI Store Builder (ROADMAP.md F-54): a saved conversation, a build, then a review. Hidden behind its switch. */
export default async function AiBuilderPage({ searchParams }: { searchParams: Promise<{ welcome?: string | string[]; signup?: string | string[]; intake?: string | string[] }> }) {
  if (!builderEnabled()) notFound();
  const { welcome, signup, intake } = await searchParams;
  const seller = await requireSeller();
  // From the tallaby.com hero (F-82d/e): the intake claimed at signup becomes this seller's build (made once; later visits find it).
  // The seller id is the session's; the intake id only finds a row this seller claimed.
  const fromIntake = typeof intake === "string" ? await startBuildFromIntake(seller.sellerId, intake) : null;
  const build = fromIntake?.ok ? fromIntake.build : await loadLatestBuild(seller.sellerId);
  const review = build?.status === "review" ? await loadReview({ sellerId: seller.sellerId, userId: seller.userId, sellerStatus: seller.status }, build) : null;
  return (
    <PageContainer narrow>
      {/* A seller who signed up for the builder lands here instead of on the home page. */}
      {welcome === "1" && <WelcomeBanner />}
      {welcome === "1" && signup && (
        <Suspense fallback={null}>
          <SignupPixelData signup={signup} />
        </Suspense>
      )}
      <BuilderChat
        initialView={build ? toView(build, fromIntake?.ok ? (fromIntake.notice ?? null) : null) : null}
        initialReview={review}
        aiReady={aiConfigured()}
        templatesBaseUrl={`https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "tallaby.com"}/template-preview`}
      />
    </PageContainer>
  );
}
