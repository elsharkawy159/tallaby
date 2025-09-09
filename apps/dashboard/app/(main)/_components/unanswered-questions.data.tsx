import { getSellerUnansweredQuestions } from "@/actions/products";
import { UnansweredQuestionsClient } from "./unanswered-questions.client";

export async function UnansweredQuestionsData() {
  const res = await getSellerUnansweredQuestions({ limit: 5, offset: 0 });
  const rows = Array.isArray(res?.data) ? (res.data as any) : [];
  return <UnansweredQuestionsClient initial={rows} />;
}
