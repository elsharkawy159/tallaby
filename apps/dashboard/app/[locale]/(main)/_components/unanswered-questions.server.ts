"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { answerProductQuestion } from "@/actions/products";

const answerSchema = z.object({
  questionId: z.string().uuid(),
  answer: z.string().trim().min(1).max(2000),
});

export async function handleAnswerQuestion(input: { storeId: string | null; questionId: string; answer: string }) {
  const parsed = answerSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: undefined };

  // Ownership is checked inside answerProductQuestion: the store against the session, the question's product against the store (F-87c).
  const res = await answerProductQuestion({ ...parsed.data, storeId: typeof input?.storeId === "string" ? input.storeId : null });
  // Refresh the home counters (attention list, badge).
  revalidatePath("/");
  return res;
}
