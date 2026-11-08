"use client";

import { Eye, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@workspace/ui/components/sheet";
import { SellerButton, TextAction } from "@/components/seller-ui";
import { STORE_INDUSTRIES } from "@/lib/stores/industries.lib";
import { readLogoColors } from "@/lib/brand/logo-colors.client";
import { checkPickedFile, readSheetFile } from "@/app/(main)/products/add/from-file/from-file-parse.client";
import { ProductsEditor, post, postJson, shrinkImage } from "@/app/(main)/ai-builder/builder.client";
import { builderPreviewLink, intakeFileLink, skipIntakeFile, updateBuildFileRow, type BuilderPreviewResult } from "@/app/(main)/ai-builder/builder.actions";
import { buildItemKeys } from "@/app/(main)/ai-builder/builder.lib";
import {
  BUILDER_LIMITS,
  type BuilderAnswerValue,
  type BuilderBuildResponse,
  type BuilderChatResponse,
  type BuilderErrorCode,
  type BuilderProgress,
  type BuilderQuestion,
  type BuilderQuestionOption,
  type BuilderReview,
  type BuilderView,
} from "@/app/(main)/ai-builder/builder.dto";
import { ActivityRow, AssistantMessage, ChatThread } from "./chat-thread.client";
import { BuildProgressCard, FileDropCard, FileFixCard, SummaryCard } from "./cards.client";
import { Composer, type Attachments } from "./composer.client";
import { DoneCard } from "./done-card.client";
import { PreviewPane, type PaneContent, type PaneTemplate } from "./preview-pane.client";
import { QuestionCard } from "./question-card.client";
import { TopBar, type BuildStatusPill } from "./top-bar.client";
import { useMediaQuery } from "./use-reduced-motion.client";
import {
  CHAT_WIDTH,
  CHAT_WIDTH_STORAGE_KEY,
  attachFileBody,
  changesSite,
  clampChatWidth,
  draftReady,
  dragWidth,
  finishedBetween,
  parseCardSummary,
  parseStoredWidth,
  type PreviewDevice,
} from "./workspace.lib";

/**
 * The AI Store Builder chat page (ROADMAP.md F-82i; spec 2026-11-08 §10):
 * Lovable-style, the chat on the LEFT and the store on the RIGHT in both
 * languages (the owner's layout; the text inside each pane keeps its own
 * direction). Everything shown comes back from the server, so a reload lands
 * in the same place; the browser only reads files and colours.
 */

type Preview = Extract<BuilderPreviewResult, { ok: true }>;

/** The chat width saved in this browser (try/catch: storage can be blocked), or the default. */
function savedChatWidth(): number {
  if (typeof window === "undefined") return CHAT_WIDTH.initial;
  try {
    const saved = parseStoredWidth(window.localStorage.getItem(CHAT_WIDTH_STORAGE_KEY));
    return saved ? clampChatWidth(saved, window.innerWidth) : CHAT_WIDTH.initial;
  } catch {
    return CHAT_WIDTH.initial;
  }
}
const RETRYABLE = new Set<BuilderErrorCode>(["failed", "timeout", "busy", "rateLimited", "locked"]);

export function BuilderWorkspace({
  initialView,
  initialReview,
  aiReady,
  siteOrigin,
  welcome,
}: {
  initialView: BuilderView | null;
  initialReview: BuilderReview | null;
  aiReady: boolean;
  siteOrigin: string;
  welcome: boolean;
}) {
  const t = useTranslations("aiBuilder");
  const locale = useLocale();
  const dir = locale === "en" ? "ltr" : "rtl";
  const desktop = useMediaQuery("(min-width: 1024px)");

  const [view, setViewState] = useState<BuilderView | null>(initialView);
  const [revealFrom, setRevealFrom] = useState(initialView?.state.messages.length ?? 0);
  const [review, setReview] = useState<BuilderReview | null>(initialReview);
  const [progress, setProgress] = useState<BuilderProgress | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<BuilderErrorCode | null>(initialView?.notice ?? null);
  const [draft, setDraft] = useState<Record<string, BuilderAnswerValue>>({});
  const [text, setText] = useState("");
  const [focusSignal, setFocusSignal] = useState(0);
  const [device, setDevice] = useState<PreviewDevice>("desktop");
  const [paneTemplate, setPaneTemplate] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [fileReading, setFileReading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [runKey, setRunKey] = useState(0);
  const [runError, setRunError] = useState<BuilderErrorCode | null>(null);
  // Read once in the browser; the width is only applied on desktop, which is never the server render.
  const [chatWidth, setChatWidth] = useState<number>(savedChatWidth);
  const scroller = useRef<HTMLDivElement>(null);
  const composerInput = useRef<HTMLTextAreaElement>(null);
  const [lastBody, setLastBody] = useState<unknown>(null);

  /** A new view from the server: messages after the ones already shown reveal. */
  const viewRef = useRef(initialView);
  const setView = useCallback((next: BuilderView | null) => {
    const current = viewRef.current;
    viewRef.current = next;
    setRevealFrom(current && next && current.id === next.id ? current.state.messages.length : (next?.state.messages.length ?? 0));
    setViewState(next);
  }, []);

  // ── Requests: one at a time, each saves the whole conversation ─────────────
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const enqueue = useCallback(<T,>(run: () => Promise<T>): Promise<T> => {
    const next = queue.current.then(run, run);
    queue.current = next.catch(() => {});
    return next;
  }, []);

  const request = useCallback(
    (body: unknown, quiet = false) =>
      enqueue(async () => {
        if (!quiet) setBusy(true);
        setError(null);
        setLastBody(body);
        const result = await postJson<BuilderChatResponse>("/api/ai/store-builder/chat", body);
        if (result.ok) {
          setView(result.view);
          setError(result.view.notice);
        } else {
          if ("view" in result && result.view) setView(result.view);
          setError(result.error);
        }
        if (!quiet) setBusy(false);
        return result.ok;
      }),
    [enqueue, setView],
  );
  const send = useCallback((body: unknown) => request(body, false), [request]);

  const sendAnswers = useCallback(
    async (answers: Record<string, BuilderAnswerValue>) => {
      const ok = await send({ action: "answers", answers });
      if (ok) {
        setDraft({});
        setPaneTemplate(null);
        setFocusSignal((value) => value + 1);
      }
      return ok;
    },
    [send],
  );

  const upload = useCallback(
    (file: File, target: "logo" | "product", productId?: string) =>
      enqueue(async () => {
        setBusy(true);
        setError(null);
        try {
          const form = new FormData();
          form.set("file", await shrinkImage(file), "photo.jpg");
          form.set("target", target);
          if (productId) form.set("productId", productId);
          const result = await post<BuilderChatResponse>("/api/ai/store-builder/upload", { method: "POST", body: form });
          if (result.ok) setView(result.view);
          else setError(result.error);
        } catch {
          setError("badFile");
        }
        setBusy(false);
      }),
    [enqueue, setView],
  );

  // ── The chat column's width (desktop) ──────────────────────────────────────
  const saveWidth = (width: number) => {
    try {
      window.localStorage.setItem(CHAT_WIDTH_STORAGE_KEY, String(width));
    } catch {
      // Storage blocked: the width lasts this visit only.
    }
  };
  const drag = useRef<{ x: number; width: number } | null>(null);
  const onHandleDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, width: chatWidth };
  };
  const onHandleMove = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current) setChatWidth(dragWidth(drag.current.width, drag.current.x, event.clientX, window.innerWidth));
  };
  const onHandleUp = () => {
    if (drag.current) saveWidth(chatWidth);
    drag.current = null;
  };
  const onHandleKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 48 : 16;
    const next = event.key === "ArrowRight" ? chatWidth + step : event.key === "ArrowLeft" ? chatWidth - step : event.key === "Home" ? CHAT_WIDTH.min : event.key === "End" ? CHAT_WIDTH.max : null;
    if (next === null) return;
    event.preventDefault();
    const width = clampChatWidth(next, window.innerWidth);
    setChatWidth(width);
    saveWidth(width);
  };

  // ── The preview link ──────────────────────────────────────────────────────
  const viewId = view?.id ?? null;
  const status = view?.status ?? null;
  const keys = useMemo(() => (view ? buildItemKeys(view.state) : []), [view]);
  const draftWritten = status === "review" || (status === "building" && progress !== null && draftReady(keys, progress.current));

  const loadPreview = useCallback(async (buildId: string, withDraft: boolean) => {
    const result = await builderPreviewLink(buildId, withDraft).catch(() => null);
    if (result?.ok) {
      setPreview(result);
      setReloadKey((value) => value + 1);
    }
  }, []);

  useEffect(() => {
    // The link is fetched, then stored: no state is set before the request answers.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (viewId && status !== "abandoned") void loadPreview(viewId, draftWritten);
    // Re-signed when the build starts writing drafts and when it ends; step reloads come from the run loop.
  }, [viewId, status, draftWritten, loadPreview]);

  // ── The build: one step per request until the server says it's done ───────
  const building = status === "building";
  useEffect(() => {
    if (!building || !viewId) return;
    let stopped = false;
    let current: string | null | undefined;
    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    const run = async () => {
      let failures = 0;
      setRunError(null);
      while (!stopped) {
        const result = await postJson<BuilderBuildResponse>("/api/ai/store-builder/run", { action: "step", buildId: viewId });
        if (stopped) return;
        if (!result.ok) {
          // Another tab is running this build, or a passing error: its steps are saved, so try again.
          if (result.error !== "locked" && ++failures >= 3) {
            setRunError(result.error);
            return;
          }
          await wait(3000);
          continue;
        }
        failures = 0;
        const stepKeys = buildItemKeys(result.view.state);
        const finished = current === undefined ? [] : finishedBetween(stepKeys, current, result.progress.current);
        current = result.progress.current;
        setView(result.view);
        setProgress(result.progress);
        if (result.review) setReview(result.review);
        if (finished.some(changesSite) && draftReady(stepKeys, result.progress.current)) void loadPreview(viewId, true);
        if (result.view.status !== "building") return;
      }
    };
    void run();
    return () => {
      stopped = true;
    };
  }, [building, viewId, runKey, setView, loadPreview]);

  // A finished build whose review wasn't sent with the page.
  useEffect(() => {
    if (status !== "review" || review || !viewId) return;
    void postJson<BuilderBuildResponse>("/api/ai/store-builder/run", { action: "step", buildId: viewId }).then((result) => {
      if (result.ok && result.review) setReview(result.review);
    });
  }, [status, review, viewId]);

  const regenerate = useCallback(async () => {
    if (!view) return;
    setBusy(true);
    setError(null);
    const result = await postJson<BuilderBuildResponse>("/api/ai/store-builder/run", { action: "regenerate", buildId: view.id });
    if (result.ok) {
      setView(result.view);
      setReview(result.review);
      void loadPreview(view.id, true);
    } else setError(result.error);
    setBusy(false);
  }, [view, setView, loadPreview]);

  // ── Files ──────────────────────────────────────────────────────────────────
  const sendSheet = useCallback(
    async (file: File, buffer: ArrayBuffer) => {
      const { model } = await readSheetFile(file, buffer);
      return send(attachFileBody(model));
    },
    [send],
  );

  const readFile = useCallback(
    async (file: File) => {
      setFileError(null);
      setFileReading(true);
      try {
        checkPickedFile(file);
        if (!(await sendSheet(file, await file.arrayBuffer()))) setFileError(t("v2.fileUnreadable"));
      } catch {
        setFileError(t("v2.fileUnreadable"));
      }
      setFileReading(false);
    },
    [sendSheet, t],
  );

  // The hero's file: read here in the browser (the server never parses it), from a short-lived signed link.
  const intakeTried = useRef<string | null>(null);
  const intakePending = view?.status === "collecting" && view.state.intakeFilePending;
  useEffect(() => {
    if (!intakePending || !viewId || intakeTried.current === viewId) return;
    intakeTried.current = viewId;
    const read = async () => {
      setFileReading(true);
      let ok = false;
      try {
        const link = await intakeFileLink(viewId);
        if (link.ok) {
          const response = await fetch(link.url, { credentials: "omit" });
          if (response.ok) {
            const blob = await response.blob();
            const file = new File([blob], link.name, { type: blob.type });
            checkPickedFile(file);
            ok = await sendSheet(file, await blob.arrayBuffer());
          }
        }
      } catch {
        ok = false;
      }
      if (!ok) {
        const skipped = await skipIntakeFile(viewId).catch(() => null);
        if (skipped?.ok) setView(skipped.view);
      }
      setFileReading(false);
    };
    void read();
  }, [intakePending, viewId, sendSheet, setView]);

  const uploadLogo = useCallback(
    async (file: File) => {
      const colors = await readLogoColors(file).catch(() => [] as string[]);
      await upload(file, "logo");
      if (colors.length) await request({ action: "logoColors", colors: colors.slice(0, 3) }, true);
    },
    [upload, request],
  );

  const fixRow = useCallback(
    async (row: number, patch: { price?: string; stock?: number; unlimited?: boolean }) => {
      if (!view) return false;
      const result = await updateBuildFileRow(view.id, row, patch).catch(() => null);
      if (result?.ok) setView(result.view);
      return Boolean(result?.ok);
    },
    [view, setView],
  );

  // ── Labels ─────────────────────────────────────────────────────────────────
  const templateName = useCallback(
    (key: string) => {
      const template = view?.templates.find((item) => item.key === key);
      return template ? ((locale === "en" ? template.name.en || template.name.ar : template.name.ar || template.name.en) ?? key) : key;
    },
    [view?.templates, locale],
  );
  const industryName = useCallback(
    (id: string) => {
      const industry = STORE_INDUSTRIES.find((item) => item.id === id);
      return industry ? (locale === "en" ? industry.en : industry.ar) : null;
    },
    [locale],
  );

  const optionLabel = useCallback(
    (question: BuilderQuestion, option: BuilderQuestionOption) => {
      if (option.label) return option.label;
      if (option.key) return t(`v2.options.${option.key}` as never, option.params as never);
      if (question.id === "industry") return industryName(option.value) ?? option.value;
      if (question.kind === "templates") return templateName(option.value);
      return option.value;
    },
    [t, industryName, templateName],
  );

  /** A seller bubble saved as codes (`card:industry:fashion style:luxe+warm`), in words. */
  const sellerLabel = useCallback(
    (raw: string) => {
      if (raw.startsWith("chip:")) {
        const value = raw.slice(5);
        return industryName(value) ?? (t.has(`chips.${value}` as never) ? t(`chips.${value}` as never) : t("v2.answered"));
      }
      const option = (key: string, params?: Record<string, string | number>) => (t.has(`v2.options.${key}` as never) ? t(`v2.options.${key}` as never, params as never) : null);
      const words = parseCardSummary(raw).map(({ id, value }) => {
        if (value === "skip") return t("chips.skip");
        if (value === "text") return t("v2.answered");
        switch (id) {
          case "storeName":
            return value;
          case "industry":
            return industryName(value) ?? option("industryOther") ?? value;
          case "template":
            return templateName(value);
          case "style":
            return value
              .split("+")
              .map((style) => option(`style_${style}`) ?? style)
              .join("، ");
          case "color":
            return value === "template" ? (option("templateColors") ?? value) : value;
          case "returns": {
            const days = /^days:(\d+)$/.exec(value);
            return days ? (option("returnsDays", { days: Number(days[1]) }) ?? value) : (option("returnsNone") ?? value);
          }
          case "shipping":
            return option({ tallaby_rates: "shippingTallaby", cairo_giza: "shippingCairoGiza", egypt_flat: "shippingFlat" }[value] ?? "") ?? value;
          case "products":
            return option({ file: "productsFile", photos: "productsPhotos", type: "productsType", none: "productsNone" }[value] ?? "") ?? value;
          case "productsDone":
            return option(value === "back" ? "productsBack" : "productsDoneNow") ?? value;
          case "fileFix":
            return option("fileContinue") ?? value;
          case "whatsapp":
            return value === "same" ? t("ws.chat.sameNumber") : value;
          case "build":
            return option("buildNow") ?? value;
          default:
            return t("v2.answered");
        }
      });
      return words.length ? words.join(" · ") : t("v2.answered");
    },
    [t, industryName, templateName],
  );

  // ── What the pane shows ────────────────────────────────────────────────────
  const card = view?.card ?? null;
  const round = view?.round ?? null;
  const paneTemplates: PaneTemplate[] = useMemo(
    () =>
      (view?.templates ?? []).map((template, index) => ({
        key: template.key,
        name: templateName(template.key),
        recommended: index === 0,
        palette: template.palette,
      })),
    [view?.templates, templateName],
  );

  const content: PaneContent = useMemo(() => {
    if (!view || view.status === "abandoned") return { kind: "empty", building: false };
    if (view.status === "review") return preview?.src ? { kind: "store", src: preview.src, published: preview.published } : { kind: "empty", building: false };
    const chosen = view.state.templateKey;
    const chosenTemplate = chosen ? (paneTemplates.find((item) => item.key === chosen) ?? { key: chosen, name: templateName(chosen), recommended: false, palette: [] }) : null;
    if (view.status === "building") {
      if (preview?.src && draftWritten) return { kind: "store", src: preview.src, published: preview.published };
      return chosenTemplate ? { kind: "template", template: chosenTemplate, selected: true, canChoose: false, backToAll: false } : { kind: "empty", building: true };
    }
    if (round === "design" && paneTemplates.length) {
      const focused = paneTemplate ? paneTemplates.find((item) => item.key === paneTemplate) : undefined;
      const selected = draft.template?.choice ?? null;
      return focused
        ? { kind: "template", template: focused, selected: selected === focused.key, canChoose: true, backToAll: true }
        : { kind: "templates", templates: paneTemplates, selected };
    }
    if (chosenTemplate) return { kind: "template", template: chosenTemplate, selected: true, canChoose: false, backToAll: false };
    if (preview?.src) return { kind: "store", src: preview.src, published: preview.published };
    return { kind: "empty", building: false };
  }, [view, preview, draftWritten, paneTemplates, paneTemplate, draft.template?.choice, round, templateName]);

  const chooseTemplate = useCallback(
    (key: string) => {
      setDraft((current) => ({ ...current, template: { choice: key } }));
      setSheetOpen(false);
      void sendAnswers({ template: { choice: key } });
    },
    [sendAnswers],
  );
  const focusTemplate = useCallback(
    (key: string) => {
      setPaneTemplate(key);
      if (!desktop) setSheetOpen(true);
    },
    [desktop],
  );

  // ── Scrolling and announcements ────────────────────────────────────────────
  const messageCount = view?.state.messages.length ?? 0;
  const currentStep = progress?.current ?? null;
  useEffect(() => {
    const box = scroller.current;
    if (!box) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    box.scrollTo({ top: box.scrollHeight, behavior: reduced ? "auto" : "smooth" });
  }, [messageCount, round, status, review, currentStep, fileReading, error]);

  const lastAssistant = [...(view?.state.messages ?? [])].reverse().find((message) => message.role === "assistant");
  const announce =
    status === "building"
      ? progress?.current && t.has(`steps.${progress.current.split(":")[0]}` as never)
        ? t(`steps.${progress.current.split(":")[0]}` as never)
        : t("buildingHint")
      : status === "review" && review
        ? t(review.published ? "ws.done.title" : "ws.done.titleNotPublished")
        : lastAssistant?.role === "assistant" && t.has(lastAssistant.key as never)
          ? t(lastAssistant.key as never, (lastAssistant.params ?? {}) as never)
          : "";

  // ── The composer ───────────────────────────────────────────────────────────
  const collecting = status === "collecting";
  const sendText = async () => {
    const typed = text.trim();
    if (!typed) return;
    if (!view || view.status === "abandoned") {
      if (!(await send({ action: "start" }))) return;
    }
    if (await send({ action: "edit", text: typed })) {
      setText("");
      composerInput.current?.focus();
    }
  };
  const colorOnCard = card?.questions.some((question) => question.kind === "color");
  const attach: Attachments = collecting
    ? {
        file: !view?.state.products.length ? (file) => void readFile(file) : undefined,
        logo: view?.state.intakeDone ? (file) => void uploadLogo(file) : undefined,
        photos: round === "products" && !view?.state.productsChoice && !view?.state.fileRows.length ? () => void sendAnswers({ products: { choice: "photos" } }) : undefined,
      }
    : {};
  const onColor =
    collecting && view?.state.intakeDone
      ? (hex: string) => {
          if (colorOnCard) setDraft((current) => ({ ...current, color: { text: hex } }));
          else void send({ action: "edit", text: hex });
        }
      : undefined;
  const placeholder = !view
    ? t("v2.placeholders.describe")
    : status === "building"
      ? t("ws.composer.building")
      : status === "review"
        ? t("ws.composer.done")
        : round === "describe"
          ? t("v2.placeholders.describe")
          : t("v2.placeholders.edit");

  // ── The chat's rows after the messages ─────────────────────────────────────
  const state = view?.state;
  const productsForm = collecting && round === "products" && (state?.productsChoice === "photos" || state?.productsChoice === "type") && !state.productsDone;
  const showCard = collecting && card && card.questions.length > 0 && round !== "summary" && !(productsForm && card.questions[0]?.id === "productsDone");
  const errorText = error ? t(`errors.${error}`) : null;

  const extra = view ? (
    <>
      {fileReading && <ActivityRow state="running">{t("ws.chat.readingFile")}</ActivityRow>}
      {collecting && round === "products" && state?.productsChoice === "file" && !state.fileRows.length && !state.intakeFilePending && (
        <FileDropCard busy={busy} reading={fileReading} error={fileError} onPick={(file) => void readFile(file)} />
      )}
      {collecting && round === "products" && view.fileProblems.length > 0 && <FileFixCard problems={view.fileProblems} busy={busy} onFix={fixRow} />}
      {productsForm && (
        <li className="ms-10 flex flex-col gap-2 rounded-[20px] border border-(--s-line) bg-(--s-surface) p-4">
          <ProductsEditor
            products={state.products}
            photoUrls={view.photoUrls}
            busy={busy}
            onSave={(product) => request({ action: "saveProduct", product }, true)}
            onRemove={(productId) => void send({ action: "removeProduct", productId })}
            onRemovePhoto={(productId, path) => void send({ action: "removePhoto", productId, path })}
            onUpload={(file, productId) => void upload(file, "product", productId)}
            onDone={() => void sendAnswers({ productsDone: { choice: "done" } })}
          />
          <TextAction className="self-start" onClick={() => void sendAnswers({ productsDone: { choice: "back" } })}>
            {t("v2.options.productsBack")}
          </TextAction>
        </li>
      )}
      {showCard && card && (
        <QuestionCard
          view={view}
          card={card}
          draft={draft}
          onDraft={(id, value) => setDraft((current) => ({ ...current, [id]: value ?? {} }))}
          busy={busy}
          onSend={(answers) => void sendAnswers(answers)}
          optionLabel={optionLabel}
          focusSignal={focusSignal}
          previewTemplate={paneTemplate}
          onPreviewTemplate={focusTemplate}
          onMoreTemplates={() => {
            setPaneTemplate(null);
            void send({ action: "moreTemplates" });
          }}
        />
      )}
      {collecting && round === "summary" && <SummaryCard view={view} busy={busy} onBuild={() => void sendAnswers({ build: { choice: "build" } })} />}
      {status === "building" && <BuildProgressCard view={view} progress={progress} error={runError ? t(`errors.${runError}`) : null} onRetry={() => setRunKey((value) => value + 1)} />}
      {status === "review" &&
        (review ? (
          <DoneCard
            buildId={view.id}
            review={review}
            address={preview?.address ?? null}
            busy={busy}
            error={errorText}
            onRegenerate={() => void regenerate()}
            onNew={() => {
              setReview(null);
              setPreview(null);
              void send({ action: "start" });
            }}
          />
        ) : (
          <ActivityRow state="running">{t("reviewLoading")}</ActivityRow>
        ))}
      {errorText && status !== "review" && (
        <li role="alert" className="ms-10 flex flex-wrap items-center gap-2 rounded-2xl bg-destructive-soft px-3.5 py-2.5 text-[13px] text-destructive">
          <span className="min-w-0 flex-1">{errorText}</span>
          {error && RETRYABLE.has(error) && lastBody !== null && (
            <TextAction onClick={() => void send(lastBody)}>
              <RotateCcw aria-hidden />
              {t("retry")}
            </TextAction>
          )}
        </li>
      )}
    </>
  ) : null;

  // ── Top bar ────────────────────────────────────────────────────────────────
  const pill: BuildStatusPill = !view || status === "abandoned" ? "new" : status === "building" ? "building" : status === "review" ? (review?.published ? "published" : "ready") : "collecting";
  const storeName = preview?.storeName ?? state?.name ?? null;
  const openStoreHref = preview?.published ? preview.src : null;
  const editorStore = review?.storeId ?? (status === "review" ? view?.storeId : null);
  const editorHref = editorStore ? `/stores/${editorStore}/editor` : null;

  const pane = (
    <PreviewPane
      content={content}
      address={preview?.address ?? null}
      device={desktop ? device : "desktop"}
      siteOrigin={siteOrigin}
      reloadKey={reloadKey}
      refreshing={status === "building"}
      onRefresh={() => viewId && void loadPreview(viewId, draftWritten)}
      onFocusTemplate={focusTemplate}
      onBackToTemplates={() => setPaneTemplate(null)}
      onChooseTemplate={chooseTemplate}
    />
  );

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-(--s-surface-2)">
      <TopBar
        storeName={storeName}
        status={pill}
        device={device}
        onDevice={setDevice}
        showDevice={content.kind === "store" || content.kind === "template"}
        openStoreHref={openStoreHref}
        editorHref={editorHref}
      />
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announce}
      </p>
      {/* The chat stays on the left in Arabic too (the owner's layout); each pane keeps the page's direction inside. */}
      <div dir="ltr" className="flex min-h-0 flex-1">
        <main
          dir={dir}
          aria-label={t("ws.chat.title")}
          className="flex min-h-0 w-full shrink-0 flex-col bg-(--s-surface) lg:w-(--chat-w) lg:border-e lg:border-(--s-line)"
          style={desktop ? { ["--chat-w" as string]: `${chatWidth}px` } : undefined}
        >
          <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-6 pt-6 max-[600px]:px-4">
            <div className="mx-auto flex max-w-[680px] flex-col gap-5">
              {!aiReady ? (
                <EmptyIntro title={t("title")} body={t("errors.disabled")} />
              ) : !view || view.status === "abandoned" ? (
                <EmptyIntro
                  title={t("ws.empty.title")}
                  body={welcome ? t("ws.empty.welcome") : t("ws.empty.body")}
                  note={t("limits", { products: BUILDER_LIMITS.products, photos: BUILDER_LIMITS.photos })}
                  error={errorText}
                  action={
                    <SellerButton disabled={busy} onClick={() => void send({ action: "start" })}>
                      {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />}
                      {t("ws.empty.start")}
                    </SellerButton>
                  }
                />
              ) : (
                <ChatThread view={view} revealFrom={revealFrom} sellerLabel={sellerLabel} extra={extra} />
              )}
            </div>
          </div>
          <div className="shrink-0 px-4 pb-4 pt-1 max-[1023px]:pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="mx-auto max-w-[680px]">
              {!desktop && view && view.status !== "abandoned" && (
                <div className="mb-2 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setSheetOpen(true)}
                    className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-(--s-solid) px-5 text-[13.5px] font-bold text-(--s-solid-fg) shadow-(--s-shadow-bar)"
                  >
                    <Eye className="size-4" aria-hidden />
                    {t("ws.phonePill")}
                  </button>
                </div>
              )}
              <Composer
                value={text}
                onChange={setText}
                onSend={() => void sendText()}
                busy={busy}
                disabled={!aiReady || (view !== null && view.status !== "abandoned" && !collecting)}
                max={BUILDER_LIMITS.textMax}
                placeholder={placeholder}
                attach={attach}
                onColor={onColor}
                inputRef={composerInput}
              />
              <p className="mt-1.5 text-center text-[11px] text-(--s-faint) max-[600px]:hidden">{t("ws.composer.hint")}</p>
            </div>
          </div>
        </main>

        {desktop && (
          <>
            <div
              role="separator"
              aria-orientation="vertical"
              aria-label={t("ws.resize")}
              aria-valuemin={CHAT_WIDTH.min}
              aria-valuemax={CHAT_WIDTH.max}
              aria-valuenow={chatWidth}
              tabIndex={0}
              onPointerDown={onHandleDown}
              onPointerMove={onHandleMove}
              onPointerUp={onHandleUp}
              onPointerCancel={onHandleUp}
              onKeyDown={onHandleKey}
              className="group relative -ms-1 w-2 shrink-0 cursor-col-resize touch-none focus-visible:outline-none"
            >
              <span className="absolute inset-y-0 start-1/2 w-px -translate-x-1/2 bg-transparent transition-colors group-hover:bg-(--tallaby-teal-300) group-focus-visible:w-[3px] group-focus-visible:bg-(--s-focus)" />
            </div>
            <aside dir={dir} aria-label={t("ws.preview.title")} className="min-h-0 min-w-0 flex-1">
              {pane}
            </aside>
          </>
        )}
      </div>

      {!desktop && (
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent side="bottom" className="h-[92dvh] gap-0 rounded-t-[24px] p-0">
            <SheetTitle className="sr-only">{t("ws.preview.title")}</SheetTitle>
            <SheetDescription className="sr-only">{t("ws.preview.sheetHint")}</SheetDescription>
            <div className="h-full pt-8">{pane}</div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}

function EmptyIntro({ title, body, note, error, action }: { title: string; body: string; note?: string; error?: string | null; action?: ReactNode }) {
  return (
    <ol className="flex flex-col gap-5">
      <AssistantMessage>
        <span className="flex flex-col gap-3">
          <span className="text-[19px] font-bold leading-snug text-(--s-ink)">{title}</span>
          <span>{body}</span>
          {note && <span className="text-[12.5px] text-(--s-subtle)">{note}</span>}
          {error && (
            <span role="alert" className="text-[13px] font-semibold text-destructive">
              {error}
            </span>
          )}
          {action && <span className="mt-1">{action}</span>}
        </span>
      </AssistantMessage>
    </ol>
  );
}

