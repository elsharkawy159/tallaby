"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Loader2, LogIn, Send, Sparkles, Store } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Field, IconTile, Modal, SellerButton, TextArea, TextInput } from "@/components/seller-ui";
import { cn } from "@/lib/utils";
import { ROADMAP_DESCRIPTION_MAX, ROADMAP_TITLE_MAX } from "./roadmap.dto";
import { canVote, findSimilar } from "./roadmap.lib";
import { suggestFeature } from "./roadmap.server";
import { ROADMAP_CATEGORIES, type RoadmapCategory, type RoadmapItem, type RoadmapViewer } from "./roadmap.types";

export function SuggestDialog({
  open,
  onOpenChange,
  items,
  onCreated,
  onOpenItem,
  onVote,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: RoadmapItem[];
  onCreated: (item: RoadmapItem) => void;
  onOpenItem: (item: RoadmapItem) => void;
  onVote: (item: RoadmapItem) => void;
}) {
  const t = useTranslations("roadmap");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<RoadmapCategory>("orders");
  const [touched, setTouched] = useState(false);
  const [isPending, startTransition] = useTransition();
  const similar = useMemo(() => findSimilar(items, title), [items, title]);

  const titleError = touched && title.trim().length < 3 ? t("form.titleTooShort") : null;
  const descriptionError = touched && description.trim().length < 10 ? t("form.descriptionTooShort") : null;

  const reset = () => {
    setTitle("");
    setDescription("");
    setCategory("orders");
    setTouched(false);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (title.trim().length < 3 || description.trim().length < 10) return;
    startTransition(async () => {
      const result = await suggestFeature({ title, description, category });
      if (!result.success) {
        toast.error(t(`toast.${result.error}`));
        return;
      }
      toast.success(t("toast.suggested"));
      onCreated(result.data);
      reset();
      onOpenChange(false);
    });
  };

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next) setTouched(false);
        onOpenChange(next);
      }}
      width={520}
      title={t("form.title")}
      description={t("form.subtitle")}
      footer={
        <>
          <SellerButton variant="outline" className="h-[46px]" onClick={() => onOpenChange(false)}>
            {t("form.cancel")}
          </SellerButton>
          <SellerButton type="submit" form="roadmap-suggest" className="h-[46px]" disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : <Send className="rtl:-scale-x-100" />}
            {t("form.submit")}
          </SellerButton>
        </>
      }
    >
      <form id="roadmap-suggest" onSubmit={submit} className="flex min-w-0 flex-col gap-3.5" noValidate>
        <Field
          label={t("form.titleLabel")}
          htmlFor="rm-title"
          hint={
            <span className="font-montserrat tabular-nums">
              {title.length}/{ROADMAP_TITLE_MAX}
            </span>
          }
          note={t("form.titleHint")}
          error={titleError}
        >
          <TextInput
            id="rm-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={ROADMAP_TITLE_MAX}
            placeholder={t("form.titlePlaceholder")}
            aria-invalid={titleError ? true : undefined}
            autoFocus
          />
        </Field>

        {similar.length > 0 && (
          <div className="flex flex-col gap-2 rounded-2xl border border-(--tallaby-amber-100) bg-accent-soft p-3 dark:border-transparent">
            <b className="flex items-center gap-1.5 text-[12.5px] font-bold text-accent-ink">
              <Sparkles className="size-3.5 shrink-0" />
              {t("form.similar")}
            </b>
            {similar.map((item) => (
              <div key={item.id} className="flex items-center gap-2 rounded-xl bg-(--s-surface) py-1.5 ps-3 pe-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    onOpenItem(item);
                  }}
                  className="min-h-10 min-w-0 flex-1 cursor-pointer truncate text-start text-[13px] text-(--s-text) hover:text-(--s-link)"
                >
                  {item.title}
                </button>
                {canVote(item.status) && (
                  <SellerButton variant="mini" size="xs" aria-pressed={item.voted} onClick={() => onVote(item)}>
                    {item.voted ? t("voted") : t("vote")}
                    <span aria-hidden>·</span>
                    <span className="font-montserrat tabular-nums">{item.votes}</span>
                  </SellerButton>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <span className="text-[13.5px] font-bold text-(--s-text)">{t("form.categoryLabel")}</span>
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={t("form.categoryLabel")}>
            {ROADMAP_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={category === c}
                onClick={() => setCategory(c)}
                className={cn(
                  "inline-flex h-[34px] cursor-pointer items-center rounded-full border border-(--s-field) bg-(--s-surface) px-3 text-[12.5px] font-semibold text-(--s-muted) transition-colors duration-150 hover:border-(--tallaby-teal-300) max-[600px]:h-10",
                  category === c && "border-(--s-solid) bg-(--s-solid) text-(--s-solid-fg)",
                )}
              >
                {t(`categories.${c}`)}
              </button>
            ))}
          </div>
        </div>

        <Field
          label={t("form.descriptionLabel")}
          htmlFor="rm-desc"
          hint={
            <span className="font-montserrat tabular-nums">
              {description.length}/{ROADMAP_DESCRIPTION_MAX}
            </span>
          }
          error={descriptionError}
        >
          <TextArea
            id="rm-desc"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={ROADMAP_DESCRIPTION_MAX}
            placeholder={t("form.descriptionPlaceholder")}
            aria-invalid={descriptionError ? true : undefined}
          />
        </Field>
      </form>
    </Modal>
  );
}

/** Shown when a guest (or a signed-in non-seller) tries to vote or suggest. */
export function SignInDialog({
  open,
  onOpenChange,
  viewer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  viewer: RoadmapViewer;
}) {
  const t = useTranslations("roadmap");
  const tCommon = useTranslations("common");
  const isUser = viewer.kind === "user";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={tCommon("close")} className="sm:max-w-[420px]">
        <DialogHeader className="items-center text-center">
          <IconTile icon={isUser ? Store : LogIn} tone="primary" className="mb-2" />
          <DialogTitle className="text-lg font-bold text-(--s-ink)">{t("auth.title")}</DialogTitle>
          <DialogDescription className="text-pretty text-[13px] text-(--s-muted)">
            {isUser ? t("auth.userBody") : t("auth.body")}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 min-[481px]:flex-row-reverse min-[481px]:justify-center">
          {isUser ? (
            <SellerButton asChild>
              <Link href="/signup">{t("auth.finishSignup")}</Link>
            </SellerButton>
          ) : (
            <>
              <SellerButton asChild>
                <Link href="/login?next=/roadmap">
                  <LogIn className="rtl:-scale-x-100" />
                  {t("signIn")}
                </Link>
              </SellerButton>
              <SellerButton variant="outline" asChild>
                <Link href="/signup">{t("startSelling")}</Link>
              </SellerButton>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
