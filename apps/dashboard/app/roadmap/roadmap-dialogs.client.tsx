"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ChevronUp, Loader2, LogIn, Send, Store } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import { cn } from "@/lib/utils";
import { ROADMAP_DESCRIPTION_MAX, ROADMAP_TITLE_MAX } from "./roadmap.dto";
import { findSimilar } from "./roadmap.lib";
import { suggestFeature } from "./roadmap.server";
import { ROADMAP_CATEGORIES, type RoadmapCategory, type RoadmapItem, type RoadmapViewer } from "./roadmap.types";

const PRIMARY_BTN =
  "inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-[#f2a420] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";
const GHOST_BTN =
  "inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function SuggestDialog({
  open,
  onOpenChange,
  items,
  onCreated,
  onOpenItem,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: RoadmapItem[];
  onCreated: (item: RoadmapItem) => void;
  onOpenItem: (item: RoadmapItem) => void;
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
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setTouched(false);
        onOpenChange(next);
      }}
    >
      <DialogContent className="gap-0 p-0 sm:max-w-[560px]">
        <DialogHeader className="border-b border-border px-5 py-4 text-start sm:px-6">
          <DialogTitle className="text-[17px] font-bold">{t("form.title")}</DialogTitle>
          <DialogDescription className="text-[13px]">{t("form.subtitle")}</DialogDescription>
        </DialogHeader>

        <form id="roadmap-suggest" onSubmit={submit} className="flex flex-col gap-4 px-5 py-5 sm:px-6" noValidate>
          <div>
            <label htmlFor="rm-title" className="mb-1.5 block text-sm font-semibold">
              {t("form.titleLabel")}
            </label>
            <Input
              id="rm-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={ROADMAP_TITLE_MAX}
              placeholder={t("form.titlePlaceholder")}
              aria-invalid={titleError ? true : undefined}
              autoFocus
            />
            <small className={cn("mt-1 block text-xs", titleError ? "text-destructive" : "text-muted-foreground")}>
              {titleError ?? t("form.titleHint")}
            </small>
          </div>

          {similar.length > 0 && (
            <div className="rounded-xl bg-accent-soft p-3 text-[13px] text-accent-ink">
              <b className="mb-1.5 block font-semibold">{t("form.similar")}</b>
              <div className="flex flex-col">
                {similar.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onOpenChange(false);
                      onOpenItem(item);
                    }}
                    className="flex items-center gap-1.5 rounded-md py-1 text-start text-foreground transition-colors hover:text-primary-ink"
                  >
                    <ChevronUp className="size-3.5 shrink-0" />
                    <span className="font-montserrat font-semibold tabular-nums">{item.votes}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="truncate">{item.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <span className="mb-1.5 block text-sm font-semibold">{t("form.categoryLabel")}</span>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("form.categoryLabel")}>
              {ROADMAP_CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={category === c}
                  onClick={() => setCategory(c)}
                  className={cn(
                    "h-[34px] rounded-full border px-3.5 text-[13px] transition-colors",
                    category === c
                      ? "border-primary bg-primary-soft font-semibold text-primary-ink"
                      : "border-border bg-card hover:border-foreground/20",
                  )}
                >
                  {t(`categories.${c}`)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="rm-desc" className="mb-1.5 block text-sm font-semibold">
              {t("form.descriptionLabel")}
            </label>
            <Textarea
              id="rm-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={ROADMAP_DESCRIPTION_MAX}
              placeholder={t("form.descriptionPlaceholder")}
              aria-invalid={descriptionError ? true : undefined}
              className="min-h-[110px] resize-y leading-relaxed"
            />
            <div className="mt-1 flex justify-between gap-2 text-xs">
              <small className="text-destructive">{descriptionError}</small>
              <small className="font-montserrat tabular-nums text-muted-foreground">
                {description.length}/{ROADMAP_DESCRIPTION_MAX}
              </small>
            </div>
          </div>
        </form>

        <DialogFooter className="gap-2 border-t border-border px-5 py-3.5 sm:px-6">
          <button type="button" className={GHOST_BTN} onClick={() => onOpenChange(false)}>
            {t("form.cancel")}
          </button>
          <button type="submit" form="roadmap-suggest" className={PRIMARY_BTN} disabled={isPending}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4 rtl:-scale-x-100" />}
            {t("form.submit")}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
  const isUser = viewer.kind === "user";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader className="items-center text-center">
          <span className="mb-2 grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary-ink">
            {isUser ? <Store className="size-5" /> : <LogIn className="size-5" />}
          </span>
          <DialogTitle className="text-lg font-bold">{t("auth.title")}</DialogTitle>
          <DialogDescription className="text-pretty">{isUser ? t("auth.userBody") : t("auth.body")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 sm:flex-row-reverse sm:justify-center">
          {isUser ? (
            <Link href="/signup" className={PRIMARY_BTN}>
              {t("auth.finishSignup")}
            </Link>
          ) : (
            <>
              <Link href="/login?next=/roadmap" className={PRIMARY_BTN}>
                <LogIn className="size-4 rtl:-scale-x-100" />
                {t("signIn")}
              </Link>
              <Link href="/signup" className={GHOST_BTN}>
                {t("startSelling")}
              </Link>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
