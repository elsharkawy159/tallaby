"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Reply } from "lucide-react";
import { useLocale, useNow, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { formatRelativeTime } from "@/lib/i18n/format";
import type { HomeQuestion } from "./home.queries";
import { ProductThumb } from "./home-ui";
import { handleAnswerQuestion } from "./unanswered-questions.server";

/** Question list with an inline reply box per row. Answered rows leave immediately. */
export function UnansweredQuestionsClient({ questions }: { questions: HomeQuestion[] }) {
  const t = useTranslations("home.questions");
  const tToast = useTranslations("toast");
  const locale = useLocale();
  const now = useNow({ updateInterval: 60_000 });
  const [rows, removeRow] = useOptimistic(questions, (state, id: string) =>
    state.filter((q) => q.id !== id)
  );
  const [openId, setOpenId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const submit = (id: string) => {
    const answer = answers[id]?.trim() ?? "";
    if (!answer) {
      toast.error(tToast("pleaseWriteAnswerFirst"));
      return;
    }
    setPendingId(id);
    startTransition(async () => {
      removeRow(id);
      const res = await handleAnswerQuestion({ questionId: id, answer });
      setPendingId(null);
      if (res.success) {
        toast.success(tToast("answerSubmitted"));
        setAnswers(({ [id]: _, ...rest }) => rest);
        setOpenId(null);
      } else {
        // The optimistic removal rolls back on its own when the transition ends.
        // Server errors are English internals, so show our own message.
        toast.error(tToast("failedToSubmitAnswer"));
      }
    });
  };

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1.5 px-5 pb-7 pt-6 text-center text-[13px] text-muted-foreground">
        <b className="text-sm text-foreground">{t("emptyTitle")}</b>
        <span>{t("emptyDescription")}</span>
      </div>
    );
  }

  return (
    <ul className="flex flex-col px-5 pb-3.5 pt-1.5">
      {rows.map((q) => {
        const open = openId === q.id;
        const inputId = `answer-${q.id}`;
        return (
          <li key={q.id} className="flex items-start gap-3.5 border-b py-3.5 last:border-b-0">
            <ProductThumb src={q.image} />
            <div className="min-w-0 flex-1">
              <b className="block font-semibold leading-relaxed">{q.question}</b>
              <small className="text-xs text-muted-foreground">
                {q.productTitle}
                {q.createdAt && <> · {formatRelativeTime(q.createdAt, locale, now)}</>}
              </small>
              {open && (
                <form
                  className="mt-2.5 flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    submit(q.id);
                  }}
                >
                  <label htmlFor={inputId} className="sr-only">
                    {t("answerPlaceholder")}
                  </label>
                  <Input
                    id={inputId}
                    autoFocus
                    maxLength={2000}
                    placeholder={t("answerPlaceholder")}
                    value={answers[q.id] ?? ""}
                    onChange={(e) => setAnswers((s) => ({ ...s, [q.id]: e.target.value }))}
                    className="h-[38px] rounded-[10px]"
                  />
                  <Button
                    type="submit"
                    variant="secondary"
                    size="sm"
                    className="h-[38px] rounded-[9px]"
                    disabled={pendingId === q.id || !answers[q.id]?.trim()}
                  >
                    {t("send")}
                  </Button>
                </form>
              )}
            </div>
            <Button
              type="button"
              variant="neutral"
              size="sm"
              className="rounded-[9px]"
              aria-expanded={open}
              aria-controls={open ? inputId : undefined}
              onClick={() => setOpenId(open ? null : q.id)}
            >
              <Reply aria-hidden />
              {t("reply")}
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
