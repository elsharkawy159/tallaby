"use client";

import { useId, useState, useTransition } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, LayoutTemplate, Link2, LoaderCircle, MessageSquareText, RotateCcw, Send, X } from "lucide-react";
import {
  isHttpsUrl,
  MAX_OPEN_THEME_REQUESTS,
  THEME_REQUEST_DESCRIPTION_MAX,
  THEME_REQUEST_MAX_IMAGES,
  THEME_REQUEST_NOTE_MAX,
  THEME_REQUEST_URL_MAX,
  themeRequestImageProblem,
  type SellerThemeRequestView,
  type ThemeRequestStatus,
} from "@workspace/lib/theme-requests";
import { DropZone, Field, IconTile, Modal, SellerButton, SellerCard, StatusBadge, TextArea, TextInput, type BadgeTone } from "@/components/seller-ui";
import { uploadThemeRequestImage } from "@/components/inputs/use-seller-upload";
import { cn } from "@/lib/utils";
import { listMyThemeRequests, submitThemeRequest } from "./theme-requests.server";
import type { ThemeRequestsView } from "./theme-requests.dto";

const themeRequestsKey = ["theme-requests"] as const;

const STATUS_TONE: Record<ThemeRequestStatus, BadgeTone> = {
  new: "muted",
  in_progress: "info",
  ready: "success",
  declined: "danger",
};

const ACCEPT = "image/jpeg,image/png,image/webp";

async function fetchThemeRequests(): Promise<ThemeRequestsView> {
  const result = await listMyThemeRequests();
  if (!result.success) throw new Error(result.error);
  return result.data;
}

/**
 * Website › Templates › "Request a theme" (ROADMAP.md F-77): the banner with
 * the button at the top of the gallery, the request dialog and the seller's
 * "My theme requests" list (status, date, the team's reply). A built theme
 * ships to the gallery for everyone; the seller hears back by bell, push and
 * email.
 */
export function ThemeRequests({ storeId, readOnly }: { storeId: string; readOnly: boolean }) {
  const t = useTranslations("themeRequests");
  const [open, setOpen] = useState(false);
  const query = useQuery({ queryKey: themeRequestsKey, queryFn: fetchThemeRequests, retry: 1 });
  const maxOpen = query.data?.maxOpen ?? MAX_OPEN_THEME_REQUESTS;
  const atLimit = (query.data?.openCount ?? 0) >= maxOpen;
  const items = query.data?.items ?? [];

  return (
    <section id="theme-requests" aria-labelledby="theme-requests-title" className="sui-rise flex scroll-mt-24 flex-col gap-3 [animation-delay:.05s]">
      <SellerCard className="flex items-center gap-4 rounded-[22px] px-5 py-4 max-[720px]:flex-col max-[720px]:items-stretch max-[720px]:gap-3 max-[720px]:px-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <IconTile icon={LayoutTemplate} tone="accent" className="max-[720px]:size-[34px]" />
          <div className="min-w-0">
            <h2 id="theme-requests-title" className="text-[15.5px] font-bold leading-normal text-(--s-ink)">
              {t("bannerTitle")}
            </h2>
            <p className="text-pretty text-[13px] text-(--s-subtle)">
              {atLimit ? t("limitReached", { max: maxOpen }) : t("bannerBody")}
            </p>
          </div>
        </div>
        <SellerButton variant="amber" disabled={readOnly || atLimit || query.isPending} onClick={() => setOpen(true)}>
          <MessageSquareText aria-hidden />
          {t("button")}
        </SellerButton>
      </SellerCard>

      <ThemeRequestDialog storeId={storeId} open={open} onOpenChange={setOpen} maxOpen={maxOpen} />

      {query.isError && (
        <p className="flex flex-wrap items-center gap-2 text-[13px] text-(--s-subtle)">
          {t("loadFailed")}
          <SellerButton variant="mini" size="xs" onClick={() => void query.refetch()}>
            <RotateCcw aria-hidden />
            {t("retry")}
          </SellerButton>
        </p>
      )}

      {items.length > 0 && <ThemeRequestList items={items} />}
    </section>
  );
}

function ThemeRequestList({ items }: { items: SellerThemeRequestView[] }) {
  const t = useTranslations("themeRequests");
  const format = useFormatter();
  return (
    <SellerCard className="flex flex-col gap-1 rounded-[22px] px-5 py-4 max-[720px]:px-4">
      <h3 className="text-[14.5px] font-bold text-(--s-ink)">{t("listTitle")}</h3>
      <ul className="flex flex-col divide-y divide-(--s-line)">
        {items.map((item) => (
          <li key={item.id} className="flex flex-col gap-1.5 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-(--s-text)" dir="auto">
                {item.description || item.referenceUrl || t("images", { count: item.imageCount })}
              </p>
              <StatusBadge tone={STATUS_TONE[item.status]}>{t(`status.${item.status}`)}</StatusBadge>
            </div>
            <p className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-(--s-faint)">
              <span>{t("sentOn", { date: format.dateTime(new Date(item.createdAt), { dateStyle: "medium" }) })}</span>
              {item.referenceUrl && item.description && (
                <span className="max-w-full truncate" dir="ltr">
                  {item.referenceUrl}
                </span>
              )}
              {item.imageCount > 0 && <span>{t("images", { count: item.imageCount })}</span>}
            </p>
            {item.adminReply && (
              <div className="rounded-2xl bg-(--s-tint) px-3.5 py-2.5 text-[13px] text-(--s-body)">
                <b className="mb-0.5 block text-xs font-bold text-(--s-ink)">{t("reply")}</b>
                <p className="whitespace-pre-line text-pretty" dir="auto">
                  {item.adminReply}
                </p>
              </div>
            )}
          </li>
        ))}
      </ul>
    </SellerCard>
  );
}

type Picked = { key: string; name: string; preview: string; path: string | null; failed: boolean };

function ThemeRequestDialog({
  storeId,
  open,
  onOpenChange,
  maxOpen,
}: {
  storeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maxOpen: number;
}) {
  const t = useTranslations("themeRequests");
  const queryClient = useQueryClient();
  const ids = { url: useId(), description: useId(), note: useId() };
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [note, setNote] = useState("");
  const [images, setImages] = useState<Picked[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const uploading = images.some((image) => !image.path && !image.failed);
  const trimmedUrl = url.trim();
  const urlInvalid = trimmedUrl.length > 0 && !isHttpsUrl(trimmedUrl);
  const uploaded = images.filter((image) => image.path).map((image) => image.path!);
  const hasContent = trimmedUrl.length > 0 || uploaded.length > 0 || description.trim().length > 0;

  const reset = () => {
    images.forEach((image) => URL.revokeObjectURL(image.preview));
    setUrl("");
    setDescription("");
    setNote("");
    setImages([]);
    setError(null);
  };

  const close = (next: boolean) => {
    if (!next && isPending) return;
    onOpenChange(next);
  };

  const addFiles = (files: File[]) => {
    const room = THEME_REQUEST_MAX_IMAGES - images.length;
    if (room <= 0) {
      toast.error(t("imageMax"));
      return;
    }
    if (files.length > room) toast.error(t("imageMax"));
    for (const file of files.slice(0, room)) {
      const problem = themeRequestImageProblem(file);
      if (problem) {
        toast.error(t(problem === "type" ? "imageType" : "imageSize"));
        continue;
      }
      const key = crypto.randomUUID();
      const picked: Picked = { key, name: file.name, preview: URL.createObjectURL(file), path: null, failed: false };
      setImages((current) => [...current, picked]);
      uploadThemeRequestImage(file)
        .then((path) => setImages((current) => current.map((image) => (image.key === key ? { ...image, path } : image))))
        .catch((uploadError) => {
          console.error("Theme request image upload failed:", uploadError);
          toast.error(t("uploadFailed"));
          setImages((current) => current.map((image) => (image.key === key ? { ...image, failed: true } : image)));
        });
    }
  };

  const remove = (key: string) =>
    setImages((current) => {
      const gone = current.find((image) => image.key === key);
      if (gone) URL.revokeObjectURL(gone.preview);
      return current.filter((image) => image.key !== key);
    });

  const submit = () => {
    setError(null);
    if (urlInvalid) {
      setError(t("urlInvalid"));
      return;
    }
    if (!hasContent) {
      setError(t("empty"));
      return;
    }
    startTransition(async () => {
      const result = await submitThemeRequest(storeId, {
        referenceUrl: trimmedUrl || null,
        description: description.trim() || null,
        note: note.trim() || null,
        imagePaths: uploaded,
      });
      if (!result.success) {
        const message = result.error === "tooManyOpen" ? t("limitReached", { max: maxOpen }) : t(`errors.${result.error}`);
        setError(message);
        if (result.error === "tooManyOpen") void queryClient.invalidateQueries({ queryKey: themeRequestsKey });
        return;
      }
      toast.success(t("sent"));
      reset();
      onOpenChange(false);
      void queryClient.invalidateQueries({ queryKey: themeRequestsKey });
    });
  };

  return (
    <Modal
      open={open}
      onOpenChange={close}
      width={560}
      title={t("dialogTitle")}
      description={t("dialogDescription")}
      className="max-h-[92dvh] overflow-y-auto"
      footer={
        <>
          <SellerButton variant="outline" disabled={isPending} onClick={() => close(false)}>
            {t("cancel")}
          </SellerButton>
          <SellerButton variant="solid" disabled={isPending || uploading} onClick={submit}>
            {isPending ? <LoaderCircle className="animate-spin" aria-hidden /> : <Send aria-hidden />}
            {isPending ? t("sending") : t("submit")}
          </SellerButton>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label={t("urlLabel")} hint={t("optional")} htmlFor={ids.url} error={urlInvalid ? t("urlInvalid") : undefined}>
          <div className="relative">
            <Link2 aria-hidden className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-(--s-subtle)" />
            <TextInput
              id={ids.url}
              type="url"
              inputMode="url"
              dir="ltr"
              autoComplete="off"
              maxLength={THEME_REQUEST_URL_MAX}
              placeholder={t("urlPlaceholder")}
              value={url}
              aria-invalid={urlInvalid || undefined}
              onChange={(event) => setUrl(event.target.value)}
              className="ps-10 text-start"
            />
          </div>
        </Field>

        <Field label={t("imagesLabel")} hint={t("optional")} note={t("imagesHint")}>
          {images.length < THEME_REQUEST_MAX_IMAGES && (
            <DropZone
              title={t("dropTitle")}
              icon={ImagePlus}
              accept={ACCEPT}
              multiple
              disabled={isPending}
              onFiles={addFiles}
              className="p-5"
            />
          )}
          {images.length > 0 && (
            <ul className="grid grid-cols-3 gap-2">
              {images.map((image) => (
                <li key={image.key} className="relative aspect-square overflow-hidden rounded-2xl border border-(--s-line) bg-(--s-tint)">
                  {/* A local preview (blob URL) of the chosen file. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.preview} alt={image.name} className={cn("size-full object-cover", (!image.path || image.failed) && "opacity-50")} />
                  {!image.path && !image.failed && (
                    <span className="absolute inset-0 grid place-items-center" aria-label={t("uploading")}>
                      <LoaderCircle className="size-5 animate-spin text-(--s-ink)" aria-hidden />
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(image.key)}
                    disabled={isPending}
                    aria-label={t("removeImage")}
                    className="absolute end-1.5 top-1.5 grid size-8 place-items-center rounded-full bg-(--s-surface)/90 text-(--s-ink) shadow-sm"
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Field>

        <Field label={t("descriptionLabel")} hint={`${description.length}/${THEME_REQUEST_DESCRIPTION_MAX}`} htmlFor={ids.description}>
          <TextArea
            id={ids.description}
            rows={4}
            maxLength={THEME_REQUEST_DESCRIPTION_MAX}
            placeholder={t("descriptionPlaceholder")}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Field>

        <Field label={t("noteLabel")} hint={t("optional")} htmlFor={ids.note}>
          <TextArea
            id={ids.note}
            rows={2}
            maxLength={THEME_REQUEST_NOTE_MAX}
            placeholder={t("notePlaceholder")}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </Field>

        <p className="text-xs text-(--s-faint)">{t("limitNote", { max: maxOpen })}</p>
        {error && (
          <p role="alert" className="text-[13px] font-semibold text-destructive">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
