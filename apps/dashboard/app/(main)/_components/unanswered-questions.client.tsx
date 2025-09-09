"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Separator } from "@workspace/ui/components/separator";
import { toast } from "sonner";
import { handleAnswerQuestion } from "./unanswered-questions.server";
import { MessageCircleQuestion, Send } from "lucide-react";
import { getPublicUrl } from "@/lib/utils";

type QuestionRow = {
  id: string;
  question: string;
  createdAt?: string | null;
  productId: string;
  productTitle: string;
  productSku?: string | null;
  productImages?: string[] | null;
};

export function UnansweredQuestionsClient({
  initial,
}: {
  initial: QuestionRow[];
}) {
  const [rows, setRows] = useState<QuestionRow[]>(initial);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const handleChange = (id: string, v: string) => {
    setAnswers((s) => ({ ...s, [id]: v }));
  };

  const handleSubmit = (id: string) => {
    const payload = { questionId: id, answer: answers[id]?.trim() ?? "" };
    if (!payload.answer) {
      toast.error("Please write an answer first");
      return;
    }
    startTransition(async () => {
      const res = await handleAnswerQuestion(payload);
      if (res.success) {
        toast.success("Answer submitted");
        setRows((r) => r.filter((q) => q.id !== id));
        setAnswers((s) => ({ ...s, [id]: "" }));
      } else {
        toast.error(res.error || "Failed to submit answer");
      }
    });
  };

  if (rows.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircleQuestion className="h-5 w-5" /> Unanswered Product
            Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No pending questions right now.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <MessageCircleQuestion className="h-5 w-5" /> Unanswered Questions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {rows.map((q) => (
          <div key={q.id} className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                <Image
                  src={getPublicUrl(q.productImages?.[0] ?? "", "products")}
                  alt={q.productTitle}
                  width={48}
                  height={48}
                  className="h-12 w-12 object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {q.productTitle}
                </div>
                <div className="text-xs text-muted-foreground">
                  SKU: {q.productSku ?? "N/A"}
                </div>
                <div className="text-sm mt-2">Q: {q.question}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Type your answer..."
                value={answers[q.id] ?? ""}
                onChange={(e) => handleChange(q.id, e.target.value)}
              />
              <Button
                onClick={() => handleSubmit(q.id)}
                disabled={isPending || !answers[q.id]?.trim()}
              >
                <Send className="h-4 w-4 mr-1" />
                Send
              </Button>
            </div>
            <Separator />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
