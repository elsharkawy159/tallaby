import { MessageCircleQuestion } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { CountPill, SellerCard, SellerCardHeader } from "@/components/seller-ui";
import { getHomeSnapshot, getUnansweredQuestions } from "./home.queries";
import { HeaderLink } from "./home-ui";
import { UnansweredQuestionsClient } from "./unanswered-questions.client";

export async function UnansweredQuestionsData() {
  const locale = await getLocale();
  const [questions, snapshot, t] = await Promise.all([
    getUnansweredQuestions(locale),
    getHomeSnapshot(),
    getTranslations("home.questions"),
  ]);
  const total = snapshot?.attention.unansweredQuestions ?? questions.length;
  // Nothing to answer: no card (the design has none). "Needs attention" still shows the 0.
  if (total === 0 && questions.length === 0) return null;

  return (
    <SellerCard id="questions" aria-labelledby="questions-title" className="scroll-mt-24">
      <SellerCardHeader
        id="questions-title"
        title={
          <>
            <MessageCircleQuestion className="size-[18px] text-(--s-primary)" aria-hidden />
            {t("title")}
            <CountPill value={total} />
          </>
        }
        description={t("description")}
        action={<HeaderLink href="/reviews">{t("viewAll")}</HeaderLink>}
      />
      {/* The store the list is read from (the selected store, F-87c); the answer action checks it again. */}
      <UnansweredQuestionsClient questions={questions} storeId={snapshot?.setupStoreId ?? null} />
    </SellerCard>
  );
}
