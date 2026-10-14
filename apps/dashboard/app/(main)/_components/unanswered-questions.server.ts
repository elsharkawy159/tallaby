"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { answerProductQuestion } from "@/actions/products";

const answerSchema = z.object({
  questionId: z.string().uuid(),
  answer: z.string().trim().min(1).max(2000),
});

export async function handleAnswerQuestion(input: { questionId: string; answer: string }) {
  const parsed = answerSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: undefined };

  // Ownership is checked inside answerProductQuestion.
  const res = await answerProductQuestion(parsed.data);
  // Refresh the home counters (attention list, badge).
  revalidatePath("/");
  return res;
}
