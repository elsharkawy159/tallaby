"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Textarea } from "@workspace/ui/components/textarea";
import {
  answerProductQuestionAction,
  updateProductAnswerAction,
} from "@/actions/products";

type QAProps = {
  productId: string;
  questions: Array<{
    id: string;
    question: string;
    createdAt?: string;
    productAnswers?: Array<{ id: string; answer: string; createdAt?: string }>;
    user?: { fullName?: string | null; email?: string | null } | null;
  }>;
};

export function ProductQA({ productId, questions }: QAProps) {
  const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  const handleDraftChange = (qid: string, value: string) => {
    setDrafts((s) => ({ ...s, [qid]: value }));
  };

  const handleSubmit = async (qid: string, answerId?: string) => {
    setSubmitting(qid);
    try {
      const form = new FormData();
      form.set("productId", productId);
      if (answerId) {
        form.set("answerId", answerId);
        form.set("answer", drafts[qid] || "");
        await updateProductAnswerAction(form);
        setEditingAnswerId(null);
      } else {
        form.set("questionId", qid);
        form.set("answer", drafts[qid] || "");
        await answerProductQuestionAction(form);
      }
      // Let revalidatePath refresh the server data; we optimistically clear draft
      setDrafts((s) => ({ ...s, [qid]: "" }));
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Questions & Answers</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {questions.length === 0 ? (
          <div className="text-sm text-muted-foreground">No questions yet.</div>
        ) : (
          questions.map((q) => {
            const existing = q.productAnswers?.[0] || null;
            const isEditing = editingAnswerId === existing?.id;
            const hasAnswer = Boolean(existing);
            return (
              <div key={q.id} className="rounded-md border p-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-medium">{q.question}</div>
                    {q.createdAt && (
                      <div className="text-xs text-muted-foreground">
                        {new Date(q.createdAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                  {hasAnswer && !isEditing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingAnswerId(existing!.id);
                        setDrafts((s) => ({ ...s, [q.id]: existing!.answer }));
                      }}
                    >
                      Edit answer
                    </Button>
                  )}
                </div>

                {hasAnswer && !isEditing ? (
                  <div className="rounded-md bg-muted p-3">
                    <div className="text-sm">{existing!.answer}</div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Textarea
                      placeholder={
                        hasAnswer ? "Update your answer" : "Write an answer"
                      }
                      value={drafts[q.id] ?? ""}
                      onChange={(e) => handleDraftChange(q.id, e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleSubmit(q.id, existing?.id)}
                        disabled={
                          submitting === q.id || !(drafts[q.id] ?? "").trim()
                        }
                      >
                        {submitting === q.id
                          ? "Submitting..."
                          : hasAnswer
                            ? "Save"
                            : "Submit"}
                      </Button>
                      {isEditing && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setEditingAnswerId(null);
                            setDrafts((s) => ({ ...s, [q.id]: "" }));
                          }}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
