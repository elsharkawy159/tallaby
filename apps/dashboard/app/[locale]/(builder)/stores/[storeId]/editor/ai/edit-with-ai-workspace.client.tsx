"use client";

import Image from "next/image";
import { ArrowRight, Eye, Loader2, Monitor, PenLine, RotateCw, Smartphone, ExternalLink, Rocket, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type DragEvent, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@workspace/ui/components/sheet";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/supabase/client";
import { SellerButton } from "@/components/seller-ui";
import { TallabyMark } from "@/app/[locale]/(builder)/ai-builder/_components/chat-thread.client";
import { useMediaQuery } from "@/app/[locale]/(builder)/ai-builder/_components/use-reduced-motion.client";
import { TOP_UP_TO_GO_ONLINE_HREF } from "@/lib/billing/top-up-to-go-online.lib";
import { requestWelcomeGiftCheck } from "@/components/layout/welcome-gift.lib";
import { usePublishNeedsProductToast } from "@/lib/stores/publish-needs-product.client";
import { manualEditorHref } from "../editor-entry.lib";
import { previewLink, publish, siteStatus } from "../server/editor.server";
import { cancelEditWithAiAction, confirmEditWithAiAction, createEditWithAiUploads, editWithAiTurn, undoEditWithAi } from "./server/edit-with-ai.server";
import type { EditWithAiUpload } from "./server/edit-with-ai.dto";
import { chatStorageKey, createEditWithAiChat, type ChatState, type EditWithAiChat } from "./edit-with-ai-chat.lib";
import { canPublish, PREVIEW_WIDTH, publishErrorKey, type PreviewDevice } from "./edit-with-ai-page.lib";
import { ChatMessages } from "./edit-with-ai-messages.client";
import { Composer } from "./edit-with-ai-composer.client";

/**
 * The "Edit with AI" page (owner request 2026-11-26): the chat on the start
 * side and a live preview of the store's drafts beside it (a Preview button
 * opens it full-screen on a phone). Every change goes through the server
 * actions, which check the store again; the preview only ever shows a link
 * the server signed. Publish is the editor's own action.
 */

export type EditWithAiWorkspaceProps = {
  storeId: string;
  storeName: string;
  readOnly: boolean;
  previewEnabled: boolean;
  initialPreviewUrl: string | null;
  initialUnpublished: boolean;
};

const EMPTY: ChatState = { messages: [], draft: "", attachments: [], pending: false, waitingUploads: false };

export const SUGGESTIONS = ["hero", "faq", "product", "announcement", "import"] as const;
/** Suggestions that need a photo or a file: they open the file picker too. */
const ATTACH_SUGGESTIONS = new Set<(typeof SUGGESTIONS)[number]>(["hero", "product", "import"]);

async function uploadToSignedUrl(upload: EditWithAiUpload, file: File) {
  const { error } = await createClient()
    .storage.from(upload.bucket)
    .uploadToSignedUrl(upload.path, upload.token, file, { contentType: file.type || undefined });
  if (error) throw error;
}

/** The chat for one store, kept in this tab's sessionStorage. */
export function useEditWithAiChat(storeId: string, uiLocale: "ar" | "en", on: { siteChanged: (url: string | null) => void; storeChanged: (tool: string) => void }) {
  const handlers = useRef(on);
  useEffect(() => {
    handlers.current = on;
  });
  const [chat] = useState<EditWithAiChat>(() =>
    createEditWithAiChat({
      uiLocale,
      actions: {
        turn: (input) => editWithAiTurn(storeId, input),
        uploads: (input) => createEditWithAiUploads(storeId, input),
        undo: (token) => undoEditWithAi(storeId, token),
        confirm: (actionId) => confirmEditWithAiAction(storeId, actionId),
        cancel: (actionId) => cancelEditWithAiAction(storeId, actionId),
      },
      uploadFile: uploadToSignedUrl,
      storage: typeof window === "undefined" ? null : safeSessionStorage(),
      storageKey: chatStorageKey(storeId),
      onSiteChanged: (url) => handlers.current.siteChanged(url),
      onStoreChanged: (tool) => handlers.current.storeChanged(tool),
      objectUrl: typeof URL !== "undefined" && "createObjectURL" in URL ? { create: (file) => URL.createObjectURL(file), revoke: (url) => URL.revokeObjectURL(url) } : undefined,
    }),
  );
  const state = useSyncExternalStore(chat.subscribe, chat.getState, () => EMPTY);
  return { chat, state };
}

function safeSessionStorage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function EditWithAiWorkspace({ storeId, storeName, readOnly, previewEnabled, initialPreviewUrl, initialUnpublished }: EditWithAiWorkspaceProps) {
  const t = useTranslations("editWithAi");
  const locale = useLocale();
  const uiLocale = locale === "en" ? "en" : "ar";
  const router = useRouter();
  const needsProduct = usePublishNeedsProductToast(storeId);
  const desktop = useMediaQuery("(min-width: 1024px)");
  const touch = useMediaQuery("(pointer: coarse)");

  const [preview, setPreview] = useState<{ url: string | null; reloadKey: number; loading: boolean }>({ url: initialPreviewUrl, reloadKey: 0, loading: false });
  const [device, setDevice] = useState<PreviewDevice>("desktop");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [unpublished, setUnpublished] = useState(initialUnpublished);
  const [publishing, setPublishing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const refreshStatus = useCallback(async () => {
    const status = await siteStatus(storeId).catch(() => null);
    if (status?.success) setUnpublished(status.data.hasUnpublishedChanges);
  }, [storeId]);

  /** A fresh signed link when the server gave none (it is bound to the drafts as they are). */
  const refreshPreview = useCallback(
    async (url?: string | null) => {
      if (!previewEnabled) return;
      if (url) {
        setPreview((p) => ({ url, reloadKey: p.reloadKey + 1, loading: false }));
        return;
      }
      setPreview((p) => ({ ...p, loading: true }));
      const link = await previewLink(storeId).catch(() => null);
      setPreview((p) => ({ url: link?.success ? link.data.url : p.url, reloadKey: p.reloadKey + 1, loading: false }));
    },
    [storeId, previewEnabled],
  );

  const { chat, state } = useEditWithAiChat(storeId, uiLocale, {
    siteChanged: (url) => {
      void refreshPreview(url);
      void refreshStatus();
    },
    storeChanged: () => {
      void refreshPreview(null);
      void refreshStatus();
    },
  });

  // No link from the server render (a passing error, or the rate limit): sign one in the browser.
  const needsFirstLink = previewEnabled && !initialPreviewUrl;
  useEffect(() => {
    // The link is fetched, then stored.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (needsFirstLink) void refreshPreview(null);
  }, [needsFirstLink, refreshPreview]);

  // Newest message in view.
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [state.messages.length, state.pending]);

  const onPublish = async () => {
    if (!canPublish({ hasUnpublishedChanges: unpublished, publishing, readOnly })) return;
    setPublishing(true);
    const result = await publish(storeId).catch(() => null);
    setPublishing(false);
    if (result?.success) {
      requestWelcomeGiftCheck();
      setUnpublished(false);
      toast.success(t("publish.success"));
      return;
    }
    const error = result ? publishErrorKey(result.error) : "generic";
    if (error === "noActiveProduct") return needsProduct();
    if (error === "topUpRequired") {
      toast.error(t("publish.topUpRequired"));
      router.push(TOP_UP_TO_GO_ONLINE_HREF);
      return;
    }
    if (error === "templateNotChosen") {
      toast.error(t("publish.templateNotChosen"), {
        action: { label: t("publish.chooseTemplate"), onClick: () => router.push(`/stores/${encodeURIComponent(storeId)}/website/templates`) },
      });
      return;
    }
    if (error === "nothingToPublish") {
      setUnpublished(false);
      toast(t("publish.nothingToPublish"));
      return;
    }
    toast.error(t(`publish.${error}`));
  };

  const pick = (kind: (typeof SUGGESTIONS)[number]) => {
    chat.setDraft(t(`suggestions.text.${kind}`));
    if (ATTACH_SUGGESTIONS.has(kind)) fileInput.current?.click();
    requestAnimationFrame(() => input.current?.focus());
  };

  const stop = () => {
    chat.stop();
    input.current?.focus();
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    if (readOnly || state.pending) return;
    const files = Array.from(event.dataTransfer.files ?? []);
    if (files.length) chat.addFiles(files);
  };

  const dir = uiLocale === "en" ? "ltr" : "rtl";
  const pane = (
    <PreviewPane
      url={preview.url}
      reloadKey={preview.reloadKey}
      loading={preview.loading}
      enabled={previewEnabled}
      device={desktop ? device : "mobile"}
      onDevice={setDevice}
      showDevice={desktop}
      onRefresh={() => void refreshPreview(null)}
    />
  );

  return (
    <div dir={dir} className="seller-shell flex h-dvh flex-col overflow-hidden bg-(--s-surface-2)">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-(--s-line) bg-(--s-surface)/90 px-3 backdrop-blur max-[600px]:px-2">
        <Link
          href={`/stores/${encodeURIComponent(storeId)}/editor`}
          aria-label={t("topBar.back")}
          title={t("topBar.back")}
          className="grid size-10 shrink-0 place-items-center rounded-xl text-(--s-subtle) hover:bg-(--s-hover) hover:text-(--s-ink)"
        >
          <ArrowRight className="size-[18px] ltr:rotate-180" aria-hidden />
        </Link>
        <TallabyMark />
        <div className="flex min-w-0 flex-col leading-tight">
          <h1 className="truncate text-[14px] font-bold text-(--s-ink)">{t("title")}</h1>
          <span className="truncate text-[12px] text-(--s-muted)">{storeName}</span>
        </div>
        <div className="ms-auto flex items-center gap-1.5">
          <SellerButton variant="mini" size="sm" asChild>
            <Link href={manualEditorHref(storeId)}>
              <PenLine aria-hidden />
              <span className="max-[480px]:sr-only">{t("topBar.manual")}</span>
            </Link>
          </SellerButton>
          <SellerButton
            variant="solid"
            size="sm"
            disabled={!canPublish({ hasUnpublishedChanges: unpublished, publishing, readOnly })}
            onClick={() => void onPublish()}
            title={unpublished ? t("topBar.unpublished") : t("topBar.upToDate")}
          >
            {publishing ? <Loader2 className="animate-spin" aria-hidden /> : <Rocket aria-hidden />}
            {publishing ? t("topBar.publishing") : t("topBar.publish")}
          </SellerButton>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <main
          aria-label={t("chat.label")}
          className="relative flex min-h-0 w-full shrink-0 flex-col bg-(--s-surface) lg:w-[440px] lg:border-e lg:border-(--s-line)"
          onDragOver={(event) => {
            if (readOnly || !event.dataTransfer.types.includes("Files")) return;
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
          }}
          onDrop={onDrop}
          onKeyDown={(event) => {
            if (event.key === "Escape" && state.pending) {
              event.stopPropagation();
              stop();
            }
          }}
        >
          {dragging && (
            <div className="pointer-events-none absolute inset-2 z-20 grid place-items-center rounded-[22px] border-2 border-dashed border-(--s-primary) bg-(--s-surface)/90 text-[14px] font-bold text-(--s-ink)">
              {t("composer.dropHere")}
            </div>
          )}
          <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-6 pb-6 max-[600px]:px-4">
            <div className="mx-auto flex max-w-[680px] flex-col gap-5">
              {readOnly && (
                <p role="status" className="rounded-2xl bg-(--s-tint) px-3.5 py-2.5 text-[13px] text-(--s-muted)">
                  {t("readOnly")}
                </p>
              )}
              {state.messages.length === 0 && !state.pending ? (
                <EmptyIntro onPick={pick} disabled={readOnly} />
              ) : (
                <>
                  <ChatMessages
                    messages={state.messages}
                    pending={state.pending}
                    storeId={storeId}
                    onUndo={(id) => void chat.undo(id)}
                    onConfirm={(id, actionId) => void chat.confirm(id, actionId)}
                    onCancel={(id, actionId) => void chat.cancel(id, actionId)}
                  />
                  {!state.pending && (
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => chat.clear()}
                        className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold text-(--s-subtle) hover:bg-(--s-hover) hover:text-(--s-ink)"
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                        {t("chat.clear")}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="shrink-0 px-4 pt-1 pb-4 max-[1023px]:pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="mx-auto max-w-[680px]">
              {!desktop && (
                <div className="mb-2 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setSheetOpen(true)}
                    className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-(--s-solid) px-5 text-[13.5px] font-bold text-(--s-solid-fg) shadow-(--s-shadow-bar)"
                  >
                    <Eye className="size-4" aria-hidden />
                    {t("preview.open")}
                  </button>
                </div>
              )}
              <Composer
                value={state.draft}
                onChange={(value) => chat.setDraft(value)}
                onSend={() => void chat.send()}
                onStop={stop}
                onPickFiles={(files) => chat.addFiles(files)}
                onRemove={(id) => chat.removeAttachment(id)}
                attachments={state.attachments}
                pending={state.pending}
                waitingUploads={state.waitingUploads}
                disabled={readOnly}
                touch={touch}
                inputRef={input}
                fileRef={fileInput}
              />
              <p className="mt-1.5 text-center text-[11px] text-(--s-faint) max-[600px]:hidden">{t("composer.hint")}</p>
            </div>
          </div>
        </main>

        {desktop && (
          <aside aria-label={t("preview.title")} className="min-h-0 min-w-0 flex-1">
            {pane}
          </aside>
        )}
      </div>

      {!desktop && (
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent side="bottom" className="h-dvh gap-0 rounded-none p-0">
            <SheetTitle className="sr-only">{t("preview.title")}</SheetTitle>
            <SheetDescription className="sr-only">{t("preview.sheetHint")}</SheetDescription>
            <div className="h-full pt-10">{pane}</div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}

function EmptyIntro({ onPick, disabled }: { onPick: (kind: (typeof SUGGESTIONS)[number]) => void; disabled: boolean }) {
  const t = useTranslations("editWithAi");
  return (
    <div className="flex flex-col items-center gap-4 pt-6 text-center">
      {/* Decorative (docs/dashboard-photos.md §4): the title carries the meaning. */}
      <Image src="/illustrations/features/add-ai.png" alt="" aria-hidden width={72} height={72} className="size-[72px] select-none" />
      <div className="flex flex-col gap-1.5">
        <h2 className="text-[19px] leading-snug font-bold text-(--s-ink)">{t("empty.title")}</h2>
        <p className="text-[13.5px] leading-[1.8] text-pretty text-(--s-muted)">{t("empty.body")}</p>
      </div>
      <ul aria-label={t("suggestions.label")} className="flex flex-wrap justify-center gap-2">
        {SUGGESTIONS.map((kind) => (
          <li key={kind}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onPick(kind)}
              className="min-h-10 cursor-pointer rounded-full border border-(--s-line) bg-(--s-surface) px-3.5 text-[13px] text-(--s-muted) transition-colors hover:border-(--s-primary) hover:text-(--s-ink) disabled:cursor-default disabled:opacity-50"
            >
              {t(`suggestions.chip.${kind}`)}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PreviewPane({
  url,
  reloadKey,
  loading,
  enabled,
  device,
  onDevice,
  showDevice,
  onRefresh,
}: {
  url: string | null;
  reloadKey: number;
  loading: boolean;
  enabled: boolean;
  device: PreviewDevice;
  onDevice: (device: PreviewDevice) => void;
  showDevice: boolean;
  onRefresh: () => void;
}) {
  const t = useTranslations("editWithAi.preview");
  const width = PREVIEW_WIDTH[device];
  const devices: { value: PreviewDevice; icon: typeof Monitor }[] = [
    { value: "desktop", icon: Monitor },
    { value: "mobile", icon: Smartphone },
  ];
  return (
    <section aria-label={t("title")} className="flex h-full min-h-0 flex-col gap-3 p-3 max-[1023px]:p-2">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[18px] border border-(--s-line) bg-(--s-surface) shadow-[0_20px_50px_rgb(13_55_67/0.08)]">
        <div className="flex h-12 shrink-0 items-center gap-2 border-b border-(--s-line) bg-(--s-surface-2) px-3">
          <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-(--s-ink)">{t("title")}</span>
          {showDevice && (
            <div role="group" aria-label={t("device")} className="inline-flex gap-0.5 rounded-full bg-(--s-fill) p-[3px]">
              {devices.map(({ value, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={device === value}
                  aria-label={t(value)}
                  title={t(value)}
                  onClick={() => onDevice(value)}
                  className="grid h-8 w-9 cursor-pointer place-items-center rounded-full text-(--s-muted) transition-colors aria-pressed:bg-(--s-surface) aria-pressed:text-(--s-ink) aria-pressed:shadow-[0_1px_3px_rgb(13_55_67/0.12)]"
                >
                  <Icon className="size-4" aria-hidden />
                </button>
              ))}
            </div>
          )}
          <IconLinkButton label={t("refresh")} disabled={!enabled || loading} onClick={onRefresh}>
            <RotateCw className={cn("size-4", loading && "animate-spin")} aria-hidden />
          </IconLinkButton>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("newTab")}
              title={t("newTab")}
              className="grid size-9 place-items-center rounded-full text-(--s-subtle) hover:bg-(--s-hover) hover:text-(--s-ink)"
            >
              <ExternalLink className="size-4" aria-hidden />
            </a>
          )}
        </div>
        <div className="relative flex min-h-0 flex-1 justify-center bg-(--s-fill)">
          {url ? (
            <iframe
              key={`${url}:${reloadKey}`}
              src={url}
              title={t("frame")}
              className="h-full border-0 bg-white"
              style={{ width: width ?? "100%", maxWidth: "100%" }}
            />
          ) : (
            <p className="m-auto max-w-sm px-8 text-center text-[13px] leading-[1.8] text-(--s-subtle)">{enabled ? t("loading") : t("unavailable")}</p>
          )}
        </div>
      </div>
    </section>
  );
}

function IconLinkButton({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid size-9 cursor-pointer place-items-center rounded-full text-(--s-subtle) hover:bg-(--s-hover) hover:text-(--s-ink) disabled:opacity-40"
    >
      {children}
    </button>
  );
}
