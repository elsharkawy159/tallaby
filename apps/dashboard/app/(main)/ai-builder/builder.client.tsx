"use client";

import { ArrowRight, Check, ImagePlus, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Progress } from "@workspace/ui/components/progress";
import { CheckRow, EmptyState, IconButton, Note, PageHeader, SellerButton, SellerCard, Tag, TextAction, TextArea, TextInput } from "@/components/seller-ui";
import { STORE_INDUSTRIES } from "@/lib/stores/industries.lib";
import { BuilderReviewPanel } from "./builder-review.client";
import { useRouter } from "next/navigation";
import { syncField, type SyncedField } from "./builder-row.lib";
import {
  BUILDER_LIMITS,
  OTHER_INDUSTRY,
  RETURN_DAYS,
  type BuilderAnswer,
  type BuilderBuildResponse,
  type BuilderChatResponse,
  type BuilderErrorCode,
  type BuilderProduct,
  type BuilderProgress,
  type BuilderReview,
  type BuilderView,
} from "./builder.dto";

/**
 * The AI Store Builder's chat (ROADMAP.md F-54c). Everything shown comes back
 * from the server, so a reload lands in the same place. Every question is an
 * i18n string.
 */

const STEPS_WITH_TEXT = new Set(["name", "about", "contact", "social", "brief", "products", "shipping", "returns"]);

const MAX_SIDE = 1536;

/** A smaller JPEG for the upload (the route refuses over 1.5 MB, and every pixel is billed when read). */
export async function shrinkImage(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("image"));
      img.src = url;
    });
    const scale = Math.min(1, MAX_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("canvas");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("blob"))), "image/jpeg", 0.85));
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function post<T>(url: string, init: RequestInit): Promise<T | { ok: false; error: BuilderErrorCode }> {
  try {
    return (await (await fetch(url, init)).json()) as T;
  } catch {
    return { ok: false, error: "failed" };
  }
}

export const postJson = <T,>(url: string, body: unknown) => post<T>(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

export function BuilderChat({
  initialView,
  initialReview,
  aiReady,
  templatesBaseUrl,
}: {
  initialView: BuilderView | null;
  initialReview: BuilderReview | null;
  aiReady: boolean;
  templatesBaseUrl: string;
}) {
  const t = useTranslations("aiBuilder");
  const locale = useLocale();
  const [view, setView] = useState<BuilderView | null>(initialView);
  const [review, setReview] = useState<BuilderReview | null>(initialReview);
  const [progress, setProgress] = useState<BuilderProgress | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<BuilderErrorCode | null>(initialView?.notice ?? null);
  const logoInput = useRef<HTMLInputElement>(null);
  // One request at a time: each saves the whole conversation, so a field saved on
  // blur and the button that caused the blur must reach the server in order.
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const enqueue = useCallback(<T,>(run: () => Promise<T>): Promise<T> => {
    const next = queue.current.then(run, run);
    queue.current = next.catch(() => {});
    return next;
  }, []);

  const request = useCallback(
    (body: unknown, quiet: boolean) =>
      enqueue(async () => {
        // A quiet save leaves the buttons enabled: disabling them mid-click would swallow the click.
        if (!quiet) setBusy(true);
        setError(null);
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
    [enqueue],
  );
  const send = useCallback((body: unknown) => request(body, false), [request]);

  const answer = useCallback(
    async (value: BuilderAnswer) => {
      const ok = await send({ action: "answer", answer: value });
      if (ok && value.type === "text") setText("");
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
    [enqueue],
  );

  // The build: one step per request until the server says it's done.
  const building = view?.status === "building";
  const buildId = view?.id;
  useEffect(() => {
    if (!building || !buildId) return;
    let stopped = false;
    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    const run = async () => {
      let failures = 0;
      while (!stopped) {
        const result = await postJson<BuilderBuildResponse>("/api/ai/store-builder/run", { action: "step", buildId });
        if (stopped) return;
        if (!result.ok) {
          // Another tab is running this build, or a passing error: its steps are saved, so try again.
          if (result.error !== "locked" && ++failures >= 3) {
            setError(result.error);
            return;
          }
          await wait(3000);
          continue;
        }
        failures = 0;
        setView(result.view);
        setProgress(result.progress);
        if (result.review) setReview(result.review);
        if (result.view.status !== "building") return;
      }
    };
    void run();
    return () => {
      stopped = true;
    };
  }, [building, buildId]);

  const reviewAction = useCallback(
    async (action: "regenerate" | "activate") => {
      if (!view) return;
      setBusy(true);
      setError(null);
      const result = await postJson<BuilderBuildResponse>("/api/ai/store-builder/run", { action, buildId: view.id });
      if (result.ok) {
        setView(result.view);
        setReview(result.review);
      } else setError(result.error);
      setBusy(false);
    },
    [view],
  );

  const chipLabel = useCallback(
    (value: string) => {
      const known = STORE_INDUSTRIES.find((industry) => industry.id === value);
      if (known) return locale === "en" ? known.en : known.ar;
      const days = /^days:(\d+)$/.exec(value);
      if (days) return t("returnsDays", { days: Number(days[1]) });
      const template = view?.templates.find((item) => item.key === value);
      if (template) return (locale === "en" ? template.name.en : template.name.ar) ?? value;
      return t.has(`chips.${value}`) ? t(`chips.${value}` as never) : value;
    },
    [locale, t, view?.templates],
  );

  const industries = useMemo(() => {
    const suggestion = view?.state.industrySuggestion;
    return [...STORE_INDUSTRIES].sort((a, b) => Number(b.id === suggestion) - Number(a.id === suggestion));
  }, [view?.state.industrySuggestion]);

  if (!aiReady) {
    return (
      <SellerCard>
        <EmptyState icon={Sparkles} title={t("title")} description={t("errors.disabled")} />
      </SellerCard>
    );
  }

  if (!view || view.status === "abandoned") {
    return (
      <>
        <PageHeader title={t("title")} description={t("intro")} />
        <SellerCard className="flex flex-col gap-4 p-6 max-[720px]:p-4">
          <p className="text-[13.5px] leading-[1.7] text-(--s-body)">{t("limits", { products: BUILDER_LIMITS.products, photos: BUILDER_LIMITS.photos })}</p>
          {error && <Note tone="danger">{t(`errors.${error}`)}</Note>}
          <SellerButton className="self-start max-[600px]:w-full" onClick={() => void send({ action: "start" })} disabled={busy}>
            {busy && <Loader2 className="animate-spin" aria-hidden />}
            <Sparkles aria-hidden />
            {t("start")}
          </SellerButton>
        </SellerCard>
      </>
    );
  }

  if (view.status === "review") {
    return (
      <BuilderReviewPanel
        review={review}
        busy={busy}
        error={error}
        onRegenerate={() => void reviewAction("regenerate")}
        onActivate={() => void reviewAction("activate")}
        onNew={() => {
          setView(null);
          setReview(null);
          void send({ action: "start" });
        }}
      />
    );
  }

  if (view.status === "building") {
    const percent = progress && progress.total ? Math.round((progress.done / progress.total) * 100) : 0;
    const current = progress?.current?.split(":")[0];
    return (
      <>
        <PageHeader title={t("buildingTitle")} />
        <SellerCard className="flex flex-col gap-3 p-6 max-[720px]:p-4" aria-live="polite">
          <Loader2 className="size-5 animate-spin text-(--s-primary)" aria-hidden />
          <Progress value={percent} className="h-2" />
          <p className="text-[13.5px] text-(--s-muted)">{current && t.has(`steps.${current}`) ? t(`steps.${current}` as never) : t("buildingHint")}</p>
          <p className="text-xs text-(--s-faint)">{t("buildingResume")}</p>
          {error && <Note tone="danger">{t(`errors.${error}`)}</Note>}
        </SellerCard>
      </>
    );
  }

  // A new conversation is v2 (F-82e): the page shows it in the two-pane chat (F-82i).
  if (view.flow === "v2") return <V2Handoff />;

  const { state, step } = view;
  const textMax = step === "shipping" ? BUILDER_LIMITS.shippingTextMax : BUILDER_LIMITS.textMax;

  return (
    <>
      <PageHeader
        title={t("title")}
        actions={
          <SellerButton variant="mini" size="sm" onClick={() => void send({ action: "restart" })} disabled={busy}>
            {t("restart")}
          </SellerButton>
        }
      />

      <SellerCard className="flex flex-col gap-4 p-5 max-[720px]:p-4">
      <ol className="flex flex-col gap-3" aria-live="polite">
        {state.messages.map((message, index) =>
          message.role === "assistant" ? (
            <li key={index} className="max-w-[85%] self-start rounded-[16px] bg-(--s-tint) px-3.5 py-2.5 text-[13.5px] leading-[1.7] text-(--s-text)">
              {t.has(`q.${message.key}`) ? t(`q.${message.key}` as never) : message.key}
            </li>
          ) : (
            <li key={index} className="max-w-[85%] self-end whitespace-pre-wrap rounded-[16px] bg-(--s-solid) px-3.5 py-2.5 text-[13.5px] leading-[1.7] text-(--s-solid-fg)">
              {message.text.startsWith("chip:") ? chipLabel(message.text.slice(5)) : message.text}
            </li>
          ),
        )}
      </ol>

      {step === "industry" && (
        <div className="flex flex-wrap gap-2">
          {industries.map((industry) => (
            <SellerButton key={industry.id} variant="mini" size="sm" disabled={busy} onClick={() => void answer({ type: "chip", value: industry.id })}>
              {locale === "en" ? industry.en : industry.ar}
              {industry.id === state.industrySuggestion && <Tag tone="warning">{t("recommended")}</Tag>}
            </SellerButton>
          ))}
          <SellerButton variant="mini" size="sm" disabled={busy} onClick={() => void answer({ type: "chip", value: OTHER_INDUSTRY })}>
            {t("chips.other")}
          </SellerButton>
        </div>
      )}

      {step === "brief" && state.brief && (
        <div className="flex flex-col gap-3 rounded-2xl border border-(--s-line) bg-(--s-surface) p-4 text-[13.5px] text-(--s-body)">
          <dl className="space-y-1">
            <div>
              <dt className="inline font-medium">{t("brief.tagline")}: </dt>
              <dd className="inline">{locale === "en" ? state.brief.taglineEn : state.brief.taglineAr}</dd>
            </div>
            <div>
              <dt className="inline font-medium">{t("brief.audience")}: </dt>
              <dd className="inline">{state.brief.audience}</dd>
            </div>
            <div>
              <dt className="inline font-medium">{t("brief.tone")}: </dt>
              <dd className="inline">{state.brief.tone}</dd>
            </div>
          </dl>
          <SellerButton className="self-start" disabled={busy} onClick={() => void answer({ type: "chip", value: "confirm" })}>
            <Check aria-hidden />
            {t("chips.confirm")}
          </SellerButton>
          <p className="text-xs text-(--s-faint)">{t("brief.changeHint")}</p>
        </div>
      )}
      {step === "brief" && !state.brief && (
        <SellerButton variant="outline" className="self-start" disabled={busy} onClick={() => void send({ action: "start" })}>
          {t("retry")}
        </SellerButton>
      )}

      {step === "logo" && (
        <div className="flex flex-wrap gap-2">
          <input
            ref={logoInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file, "logo");
              event.target.value = "";
            }}
          />
          <SellerButton disabled={busy} onClick={() => logoInput.current?.click()}>
            <ImagePlus aria-hidden />
            {t("logoUpload")}
          </SellerButton>
          <SellerButton variant="outline" disabled={busy} onClick={() => void answer({ type: "skip" })}>
            {t("logoSkip")}
          </SellerButton>
        </div>
      )}

      {step === "template" && (
        <div className="grid grid-cols-3 gap-2.5 max-[720px]:grid-cols-1">
          {view.templates.map((template) => (
            <div key={template.key} className="flex flex-col gap-2 rounded-2xl border border-(--s-line) bg-(--s-surface) p-3.5 text-[13.5px]">
              <div className="font-bold text-(--s-ink)">{locale === "en" ? template.name.en : template.name.ar}</div>
              <p className="line-clamp-3 text-xs text-(--s-subtle)">{locale === "en" ? template.description.en : template.description.ar}</p>
              <div className="flex gap-1">
                {template.palette.slice(0, 5).map((color) => (
                  <span key={color} className="size-4 rounded-full border border-(--s-line)" style={{ backgroundColor: color }} />
                ))}
              </div>
              <TextAction asChild className="min-h-10 self-start">
                <a href={`${templatesBaseUrl}/${template.key}`} target="_blank" rel="noreferrer">
                  {t("templatePreview")}
                </a>
              </TextAction>
              <SellerButton variant="solid" size="sm" className="mt-auto" disabled={busy} onClick={() => void answer({ type: "chip", value: template.key })}>
                {t("templateUse")}
              </SellerButton>
            </div>
          ))}
        </div>
      )}

      {step === "products" && (
        <ProductsEditor
          products={state.products}
          photoUrls={view.photoUrls}
          busy={busy}
          onSave={(product) => request({ action: "saveProduct", product }, true)}
          onRemove={(productId) => void send({ action: "removeProduct", productId })}
          onRemovePhoto={(productId, path) => void send({ action: "removePhoto", productId, path })}
          onUpload={(file, productId) => void upload(file, "product", productId)}
          onDone={() => void answer({ type: "chip", value: "done" })}
        />
      )}

      {step === "social" && (
        <div>
          <SellerButton variant="mini" size="sm" disabled={busy} onClick={() => void answer({ type: "skip" })}>
            {t("chips.skip")}
          </SellerButton>
        </div>
      )}

      {step === "shipping" && !state.shippingAwaitingPrice && (
        <div className="flex flex-wrap gap-2">
          {(["tallaby_rates", "egypt_flat", "cairo_giza"] as const).map((value) => (
            <SellerButton key={value} variant="mini" size="sm" disabled={busy} onClick={() => void answer({ type: "chip", value })}>
              {t(`chips.${value}`)}
            </SellerButton>
          ))}
          <SellerButton variant="mini" size="sm" disabled={busy} onClick={() => void answer({ type: "skip" })}>
            {t("chips.skip")}
          </SellerButton>
        </div>
      )}
      {step === "shipping" && state.shippingAwaitingPrice && <p className="text-[13.5px] text-(--s-body)">{t("shippingPrice")}</p>}

      {step === "returns" && (
        <div className="flex flex-wrap gap-2">
          {RETURN_DAYS.map((days) => (
            <SellerButton key={days} variant="mini" size="sm" disabled={busy} onClick={() => void answer({ type: "chip", value: `days:${days}` })}>
              {t("returnsDays", { days })}
            </SellerButton>
          ))}
          <SellerButton variant="mini" size="sm" disabled={busy} onClick={() => void answer({ type: "chip", value: "none" })}>
            {t("chips.none")}
          </SellerButton>
          <SellerButton variant="mini" size="sm" disabled={busy} onClick={() => void answer({ type: "skip" })}>
            {t("chips.skip")}
          </SellerButton>
        </div>
      )}

      {step === "summary" && (
        <div className="flex flex-col gap-3 rounded-2xl border border-(--s-line) bg-(--s-surface) p-4 text-[13.5px] text-(--s-body)">
          <p>{t("summary.store", { name: state.name ?? "" })}</p>
          <p>{t("summary.products", { count: state.products.length })}</p>
          <p className="text-xs text-(--s-faint)">{t("summary.note")}</p>
          <SellerButton className="self-start" disabled={busy} onClick={() => void answer({ type: "chip", value: "build" })}>
            <Sparkles aria-hidden />
            {t("chips.build")}
          </SellerButton>
        </div>
      )}

      {error && <Note tone="danger">{t(`errors.${error}`)}</Note>}

      {STEPS_WITH_TEXT.has(step) && (
        <form
          className="space-y-1"
          onSubmit={(event) => {
            event.preventDefault();
            if (text.trim() && !busy) void answer({ type: "text", text });
          }}
        >
          <div className="flex items-end gap-2">
            <TextArea
              className="min-h-[46px] flex-1"
              value={text}
              rows={2}
              maxLength={textMax}
              placeholder={t.has(`placeholders.${step}`) ? t(`placeholders.${step}` as never) : undefined}
              aria-label={t("answer")}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  if (text.trim() && !busy) void answer({ type: "text", text });
                }
              }}
            />
            <SellerButton type="submit" className="w-[46px] px-0" disabled={busy || !text.trim()} aria-label={t("send")}>
              {busy ? <Loader2 className="animate-spin" aria-hidden /> : <ArrowRight className="rtl:rotate-180" aria-hidden />}
            </SellerButton>
          </div>
          <p className="text-end font-montserrat text-xs text-(--s-faint) tabular-nums">
            {text.length} / {textMax}
          </p>
        </form>
      )}
      </SellerCard>
    </>
  );
}

const num = (value: string) => {
  const parsed = Number(value);
  return value.trim() !== "" && Number.isFinite(parsed) ? parsed : null;
};

export function ProductsEditor({
  products,
  photoUrls,
  busy,
  onSave,
  onRemove,
  onRemovePhoto,
  onUpload,
  onDone,
}: {
  products: BuilderProduct[];
  photoUrls: Record<string, string>;
  busy: boolean;
  onSave: (product: { id?: string; name: string; details: string; price: number | null; compareAtPrice: number | null; stock: number | null; unlimited: boolean }) => Promise<boolean>;
  onRemove: (productId: string) => void;
  onRemovePhoto: (productId: string, path: string) => void;
  onUpload: (file: File, productId: string) => void;
  onDone: () => void;
}) {
  const t = useTranslations("aiBuilder");
  const [name, setName] = useState("");

  return (
    <div className="space-y-3">
      {products.map((product) => (
        <ProductRow key={product.id} product={product} photoUrls={photoUrls} busy={busy} onSave={onSave} onRemove={onRemove} onRemovePhoto={onRemovePhoto} onUpload={onUpload} />
      ))}
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const value = name.trim();
          if (!value || busy) return;
          void onSave({ name: value, details: "", price: null, compareAtPrice: null, stock: null, unlimited: false }).then((ok) => ok && setName(""));
        }}
      >
        <TextInput className="min-w-0 flex-1" value={name} maxLength={120} onChange={(event) => setName(event.target.value)} placeholder={t("product.name")} aria-label={t("product.name")} />
        <SellerButton type="submit" variant="outline" className="h-[46px]" disabled={busy || !name.trim() || products.length >= BUILDER_LIMITS.products}>
          <Plus aria-hidden />
          {t("product.add")}
        </SellerButton>
      </form>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-(--s-subtle)">{t("product.count", { count: products.length, max: BUILDER_LIMITS.products })}</p>
        <SellerButton disabled={busy || !products.length} onClick={onDone}>
          {t("chips.done")}
        </SellerButton>
      </div>
    </div>
  );
}

/** Local state for one field that follows the server's value, keeping what the seller is typing (syncField). */
function useServerField<T>(server: T): [T, (value: T) => void] {
  const [field, setField] = useState<SyncedField<T>>({ value: server, synced: server });
  // Adjusting state while rendering when a prop changes (React's documented pattern): no extra render with stale values.
  const next = syncField(field, server);
  if (next !== field) setField(next);
  return [next.value, (value) => setField((current) => ({ ...current, value }))];
}

function ProductRow({
  product,
  photoUrls,
  busy,
  onSave,
  onRemove,
  onRemovePhoto,
  onUpload,
}: {
  product: BuilderProduct;
  photoUrls: Record<string, string>;
  busy: boolean;
  onSave: (product: { id?: string; name: string; details: string; price: number | null; compareAtPrice: number | null; stock: number | null; unlimited: boolean }) => Promise<boolean>;
  onRemove: (productId: string) => void;
  onRemovePhoto: (productId: string, path: string) => void;
  onUpload: (file: File, productId: string) => void;
}) {
  const t = useTranslations("aiBuilder");
  const [name, setName] = useServerField(product.name);
  const [details, setDetails] = useServerField(product.details);
  const [price, setPrice] = useServerField(product.price?.toString() ?? "");
  const [stock, setStock] = useServerField(product.stock?.toString() ?? "");
  const [unlimited, setUnlimited] = useServerField(product.unlimited);
  const fileInput = useRef<HTMLInputElement>(null);

  const save = (patch: Partial<{ price: string; stock: string; unlimited: boolean }> = {}) => {
    const nextPrice = num(patch.price ?? price);
    const nextStock = num(patch.stock ?? stock);
    const isUnlimited = patch.unlimited ?? unlimited;
    void onSave({
      id: product.id,
      name: name.trim() || product.name,
      details: details.trim(),
      price: nextPrice !== null && nextPrice > 0 ? nextPrice : null,
      compareAtPrice: product.compareAtPrice,
      stock: isUnlimited || nextStock === null ? null : Math.max(0, Math.floor(nextStock)),
      unlimited: isUnlimited,
    });
  };

  const missing = !(num(price) ?? 0) || (!unlimited && num(stock) === null);

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-(--s-line) bg-(--s-surface) p-3.5">
      <div className="flex items-center gap-2">
        <TextInput className="min-w-0 flex-1" value={name} maxLength={120} aria-label={t("product.name")} onChange={(event) => setName(event.target.value)} onBlur={() => save()} />
        <IconButton disabled={busy} aria-label={t("product.remove")} onClick={() => onRemove(product.id)}>
          <Trash2 aria-hidden />
        </IconButton>
      </div>
      <TextArea value={details} rows={2} maxLength={BUILDER_LIMITS.textMax} placeholder={t("product.details")} aria-label={t("product.details")} onChange={(event) => setDetails(event.target.value)} onBlur={() => save()} />
      <div className="flex flex-wrap items-center gap-2">
        <TextInput className="w-28" inputMode="decimal" value={price} placeholder={t("product.price")} aria-label={t("product.price")} onChange={(event) => setPrice(event.target.value)} onBlur={() => save()} />
        <TextInput className="w-28" inputMode="numeric" value={stock} disabled={unlimited} placeholder={t("product.stock")} aria-label={t("product.stock")} onChange={(event) => setStock(event.target.value)} onBlur={() => save()} />
        <CheckRow
          className="min-h-10 items-center"
          label={t("product.unlimited")}
          checked={unlimited}
          onChange={(event) => {
            setUnlimited(event.target.checked);
            save({ unlimited: event.target.checked });
          }}
        />
        {missing && <span className="text-xs font-semibold text-destructive">{t("product.missing")}</span>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {product.photos.map((path) => (
          <button
            key={path}
            type="button"
            className="relative size-14 overflow-hidden rounded-xl border border-(--s-line)"
            aria-label={t("product.removePhoto")}
            disabled={busy}
            onClick={() => onRemovePhoto(product.id, path)}
          >
            {photoUrls[path] && <Image src={photoUrls[path]} alt="" fill sizes="56px" className="object-cover" unoptimized />}
          </button>
        ))}
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onUpload(file, product.id);
            event.target.value = "";
          }}
        />
        <SellerButton variant="mini" size="sm" disabled={busy || product.photos.length >= BUILDER_LIMITS.photosPerProduct} onClick={() => fileInput.current?.click()}>
          <ImagePlus aria-hidden />
          {t("product.addPhoto", { count: product.photos.length, max: BUILDER_LIMITS.photosPerProduct })}
        </SellerButton>
      </div>
    </div>
  );
}

/** A v1 page that started a v2 conversation (restart, another build): the server page renders the v2 chat. */
function V2Handoff() {
  const router = useRouter();
  useEffect(() => router.refresh(), [router]);
  return <Loader2 className="mx-auto size-5 animate-spin" aria-hidden />;
}
