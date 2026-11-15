"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { LoaderCircle, Mail } from "lucide-react";
import { IconTile, SellerCard, TextAction } from "@/components/seller-ui";
import { previewCampaignEmail } from "./email-campaigns.server";
import { createPreviewRunner, PREVIEW_DEBOUNCE_MS, previewRequest, withInertLinks } from "./email-campaigns.lib";
import type { CampaignActionError, CampaignActionResult } from "./email-campaigns.types";

type Rendered = { subject: string; html: string };
type PreviewResult = CampaignActionResult<Rendered>;

const WIDE = "(min-width: 1280px)";

const subscribeWide = (onChange: () => void) => {
  const query = window.matchMedia(WIDE);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

/** True when the editor and the preview sit side by side (Tailwind's `xl`). */
export function useWideLayout(): boolean {
  return useSyncExternalStore(
    subscribeWide,
    () => window.matchMedia(WIDE).matches,
    () => false,
  );
}

/**
 * The real email from the backend, through the same renderer and checks as a
 * test send, rendered again when the content settles (ROADMAP.md F-66a). The last
 * good version stays on screen when the content can't be rendered or a call
 * fails. `enabled` is false while the preview is hidden, so a phone on the Edit
 * tab makes no calls.
 */
function useLivePreview(storeId: string, content: unknown, enabled: boolean) {
  const [rendered, setRendered] = useState<Rendered | null>(null);
  const [failed, setFailed] = useState<CampaignActionError | null>(null);
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const runner = useRef<ReturnType<typeof createPreviewRunner<PreviewResult>> | null>(null);
  // The first render after opening, showing the tab or Try again doesn't wait for typing to stop.
  const immediate = useRef(true);

  const request = previewRequest(content);
  const key = request.kind === "ready" ? request.key : null;
  const problem = request.kind === "blocked" ? request.problem : null;

  useEffect(() => {
    const instance = createPreviewRunner<PreviewResult>({
      delayMs: PREVIEW_DEBOUNCE_MS,
      run: (value) =>
        previewCampaignEmail({ storeId, kind: "campaign", content: JSON.parse(value) }).catch(
          (): PreviewResult => ({ success: false, error: "generic" }),
        ),
      isSuccess: (result) => result.success,
      onResult: (result) => {
        if (result.success) {
          setRendered(result.data);
          setFailed(null);
        } else {
          setFailed(result.error);
        }
      },
      onBusy: setBusy,
    });
    runner.current = instance;
    return () => {
      instance.dispose();
      runner.current = null;
    };
  }, [storeId]);

  useEffect(() => {
    if (!enabled || key === null) {
      runner.current?.cancel();
      if (!enabled) immediate.current = true;
      return;
    }
    runner.current?.request(key, { immediate: immediate.current });
    immediate.current = false;
  }, [key, enabled, attempt]);

  const retry = () => {
    immediate.current = true;
    setFailed(null);
    setAttempt((n) => n + 1);
  };

  return { rendered, problem, failed: problem ? null : failed, busy, retry };
}

/** The subject and the email as customers get it. Sandboxed with no scripts, like the win-back preview. */
export function EmailCampaignPreview({
  storeId,
  storeName,
  subject,
  content,
  enabled,
}: {
  storeId: string;
  storeName: string;
  subject: string;
  content: unknown;
  enabled: boolean;
}) {
  const t = useTranslations("emailCampaigns");
  const { rendered, problem, failed, busy, retry } = useLivePreview(storeId, content, enabled);
  const html = useMemo(() => (rendered ? withInertLinks(rendered.html) : null), [rendered]);
  const needsText = problem === "subjectRequired" || problem === "bodyRequired";

  return (
    <SellerCard className="overflow-hidden">
      <div className="space-y-1 border-b border-(--s-line-soft) px-4 py-3 text-[13px]">
        <div className="flex items-center justify-between gap-2">
          <p className="min-w-0 truncate text-(--s-subtle)">
            {t("preview.from")} <span dir="auto" className="font-semibold text-(--s-text)">{storeName}</span>
          </p>
          {busy && (
            <span className="flex shrink-0 items-center gap-1 text-xs text-(--s-subtle)">
              <LoaderCircle className="size-3 animate-spin motion-reduce:hidden" aria-hidden />
              {t("preview.updating")}
            </span>
          )}
        </div>
        <p className="min-w-0 truncate text-(--s-subtle)">
          {t("preview.subject")}{" "}
          <span dir="auto" className="font-semibold text-(--s-text)">
            {subject.trim() || t("list.untitled")}
          </span>
        </p>
      </div>

      {html ? (
        <iframe title={t("preview.title")} sandbox="" srcDoc={html} className="h-[70vh] min-h-96 w-full bg-white" />
      ) : (
        <div className="flex h-[70vh] min-h-96 flex-col items-center justify-center gap-2 p-6 text-center">
          <IconTile icon={Mail} tone="neutral" size="lg" />
          <p className="max-w-xs text-pretty text-[13px] text-(--s-muted)">
            {needsText ? t("preview.needsText") : problem || failed ? "" : t("preview.loading")}
          </p>
        </div>
      )}

      {(problem || failed) && (
        <p className="border-t border-(--s-line-soft) px-4 py-2 text-xs text-(--s-muted)" role="status">
          {failed ? (
            <>
              {t(html ? "preview.failedKept" : "preview.failed")}{" "}
              <TextAction type="button" className="min-h-10" onClick={retry}>
                {t("preview.retry")}
              </TextAction>
            </>
          ) : needsText ? (
            html && t("preview.needsTextKept")
          ) : (
            problem && t(`errors.${problem}`)
          )}
        </p>
      )}
    </SellerCard>
  );
}
