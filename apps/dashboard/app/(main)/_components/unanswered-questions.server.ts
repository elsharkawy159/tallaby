"use server";

import { revalidatePath } from "next/cache";
import { answerProductQuestion } from "@/actions/products";

export async function handleAnswerQuestion(data: {
  questionId: string;
  answer: string;
}) {
  const res = await answerProductQuestion(data);
  // Revalidate dashboard to refresh lists
  revalidatePath("/");
  return res;
}
