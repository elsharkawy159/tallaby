import { MessageCircleQuestion } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Badge } from "@workspace/ui/components/badge";
import { getHomeSnapshot, getUnansweredQuestions } from "./home.queries";
import { HeaderLink, HomeCard, HomeCardHeader } from "./home-ui";
import { UnansweredQuestionsClient } from "./unanswered-questions.client";

export async function UnansweredQuestionsData() {
  const locale = await getLocale();
  const [questions, snapshot, t] = await Promise.all([
    getUnansweredQuestions(locale),
    getHomeSnapshot(),
    getTranslations("home.questions"),
  ]);
  const total = snapshot?.attention.unansweredQuestions ?? questions.length;

  return (
    <HomeCard id="questions" aria-labelledby="questions-title" className="scroll-mt-24">
      <HomeCardHeader
        id="questions-title"
        title={
          <>
            <MessageCircleQuestion className="size-[18px] text-primary-ink" aria-hidden />
            {t("title")}
            {total > 0 && <Badge variant="count">{total}</Badge>}
          </>
        }
        description={t("description")}
        action={<HeaderLink href="/reviews">{t("viewAll")}</HeaderLink>}
      />
      <UnansweredQuestionsClient questions={questions} />
    </HomeCard>
  );
}
