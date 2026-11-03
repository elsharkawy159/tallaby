"use client";

import { ArrowRight, Check, ImagePlus, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Progress } from "@workspace/ui/components/progress";
import { Textarea } from "@workspace/ui/components/textarea";
import { STORE_INDUSTRIES } from "@/lib/stores/industries.lib";
import { BuilderReviewPanel } from "./builder-review.client";
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
 * The AI Store Builder's chat (ROADMAP.md F-54c). Plain on purpose: the owner
 * designs the look later. Everything shown comes back from the server, so a
 * reload lands in the same place. Every question is an i18n string.
 */

const STEPS_WITH_TEXT = new Set(["name", "about", "contact", "social", "brief", "products", "shipping", "returns"]);

const MAX_SIDE = 1536;

/** A smaller JPEG for the upload (the route refuses over 1.5 MB, and every pixel is billed when read). */
async function shrinkImage(file: File): Promise<Blob> {
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

async function post<T>(url: string, init: RequestInit): Promise<T | { ok: false; error: BuilderErrorCode }> {
  try {
    return (await (await fetch(url, init)).json()) as T;
  } catch {
    return { ok: false, error: "failed" };
  }
}

const postJson = <T,>(url: string, body: unknown) => post<T>(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

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

  if (!aiReady) return <p className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">{t("errors.disabled")}</p>;

  if (!view || view.status === "abandoned") {
    return (
      <div className="mx-auto max-w-xl space-y-4 rounded-xl border p-6">
        <h1 className="flex items-center gap-2 text-lg font-semibold">
          <Sparkles className="size-5 text-primary" aria-hidden />
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("intro")}</p>
        <p className="text-xs text-muted-foreground">
          {t("limits", { products: BUILDER_LIMITS.products, photos: BUILDER_LIMITS.photos })}
        </p>
        {error && <p className="text-sm text-destructive">{t(`errors.${error}`)}</p>}
        <Button onClick={() => void send({ action: "start" })} disabled={busy}>
          {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {t("start")}
        </Button>
      </div>
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
      <div className="mx-auto max-w-xl space-y-4 rounded-xl border p-6" aria-live="polite">
        <h1 className="flex items-center gap-2 text-lg font-semibold">
          <Loader2 className="size-5 animate-spin text-primary" aria-hidden />
          {t("buildingTitle")}
        </h1>
        <Progress value={percent} className="h-2" />
        <p className="text-sm text-muted-foreground">{current && t.has(`steps.${current}`) ? t(`steps.${current}` as never) : t("buildingHint")}</p>
        <p className="text-xs text-muted-foreground">{t("buildingResume")}</p>
        {error && <p className="text-sm text-destructive">{t(`errors.${error}`)}</p>}
      </div>
    );
  }

  const { state, step } = view;
  const textMax = step === "shipping" ? BUILDER_LIMITS.shippingTextMax : BUILDER_LIMITS.textMax;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="flex items-center gap-2 text-lg font-semibold">
          <Sparkles className="size-5 text-primary" aria-hidden />
          {t("title")}
        </h1>
        <Button variant="ghost" size="sm" onClick={() => void send({ action: "restart" })} disabled={busy}>
          {t("restart")}
        </Button>
      </div>

      <ol className="flex flex-col gap-3" aria-live="polite">
        {state.messages.map((message, index) =>
          message.role === "assistant" ? (
            <li key={index} className="max-w-[85%] text-sm">
              {t.has(`q.${message.key}`) ? t(`q.${message.key}` as never) : message.key}
            </li>
          ) : (
            <li key={index} className="max-w-[85%] self-end whitespace-pre-wrap rounded-lg bg-muted px-3 py-2 text-sm">
              {message.text.startsWith("chip:") ? chipLabel(message.text.slice(5)) : message.text}
            </li>
          ),
        )}
      </ol>

      {step === "industry" && (
        <div className="flex flex-wrap gap-2">
          {industries.map((industry) => (
            <Button key={industry.id} variant="outline" size="sm" disabled={busy} onClick={() => void answer({ type: "chip", value: industry.id })}>
              {locale === "en" ? industry.en : industry.ar}
              {industry.id === state.industrySuggestion && <Badge variant="secondary">{t("recommended")}</Badge>}
            </Button>
          ))}
          <Button variant="outline" size="sm" disabled={busy} onClick={() => void answer({ type: "chip", value: OTHER_INDUSTRY })}>
            {t("chips.other")}
          </Button>
        </div>
      )}

      {step === "brief" && state.brief && (
        <div className="space-y-3 rounded-xl border p-4 text-sm">
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
          <Button disabled={busy} onClick={() => void answer({ type: "chip", value: "confirm" })}>
            <Check className="size-4" aria-hidden />
            {t("chips.confirm")}
          </Button>
          <p className="text-xs text-muted-foreground">{t("brief.changeHint")}</p>
        </div>
      )}
      {step === "brief" && !state.brief && (
        <Button variant="outline" disabled={busy} onClick={() => void send({ action: "start" })}>
          {t("retry")}
        </Button>
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
          <Button disabled={busy} onClick={() => logoInput.current?.click()}>
            <ImagePlus className="size-4" aria-hidden />
            {t("logoUpload")}
          </Button>
          <Button variant="outline" disabled={busy} onClick={() => void answer({ type: "skip" })}>
            {t("logoSkip")}
          </Button>
        </div>
      )}

      {step === "template" && (
        <div className="grid gap-3 sm:grid-cols-3">
          {view.templates.map((template) => (
            <div key={template.key} className="flex flex-col gap-2 rounded-xl border p-3 text-sm">
              <div className="font-medium">{locale === "en" ? template.name.en : template.name.ar}</div>
              <p className="line-clamp-3 text-xs text-muted-foreground">{locale === "en" ? template.description.en : template.description.ar}</p>
              <div className="flex gap-1">
                {template.palette.slice(0, 5).map((color) => (
                  <span key={color} className="size-4 rounded-full border" style={{ backgroundColor: color }} />
                ))}
              </div>
              <a href={`${templatesBaseUrl}/${template.key}`} target="_blank" rel="noreferrer" className="text-xs text-primary underline">
                {t("templatePreview")}
              </a>
              <Button size="sm" disabled={busy} onClick={() => void answer({ type: "chip", value: template.key })}>
                {t("templateUse")}
              </Button>
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
          <Button variant="outline" size="sm" disabled={busy} onClick={() => void answer({ type: "skip" })}>
            {t("chips.skip")}
          </Button>
        </div>
      )}

      {step === "shipping" && !state.shippingAwaitingPrice && (
        <div className="flex flex-wrap gap-2">
          {(["tallaby_rates", "egypt_flat", "cairo_giza"] as const).map((value) => (
            <Button key={value} variant="outline" size="sm" disabled={busy} onClick={() => void answer({ type: "chip", value })}>
              {t(`chips.${value}`)}
            </Button>
          ))}
          <Button variant="outline" size="sm" disabled={busy} onClick={() => void answer({ type: "skip" })}>
            {t("chips.skip")}
          </Button>
        </div>
      )}
      {step === "shipping" && state.shippingAwaitingPrice && <p className="text-sm">{t("shippingPrice")}</p>}

      {step === "returns" && (
        <div className="flex flex-wrap gap-2">
          {RETURN_DAYS.map((days) => (
            <Button key={days} variant="outline" size="sm" disabled={busy} onClick={() => void answer({ type: "chip", value: `days:${days}` })}>
              {t("returnsDays", { days })}
            </Button>
          ))}
          <Button variant="outline" size="sm" disabled={busy} onClick={() => void answer({ type: "chip", value: "none" })}>
            {t("chips.none")}
          </Button>
          <Button variant="outline" size="sm" disabled={busy} onClick={() => void answer({ type: "skip" })}>
            {t("chips.skip")}
          </Button>
        </div>
      )}

      {step === "summary" && (
        <div className="space-y-3 rounded-xl border p-4 text-sm">
          <p>{t("summary.store", { name: state.name ?? "" })}</p>
          <p>{t("summary.products", { count: state.products.length })}</p>
          <p className="text-xs text-muted-foreground">{t("summary.note")}</p>
          <Button disabled={busy} onClick={() => void answer({ type: "chip", value: "build" })}>
            <Sparkles className="size-4" aria-hidden />
            {t("chips.build")}
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{t(`errors.${error}`)}</p>}

      {STEPS_WITH_TEXT.has(step) && (
        <form
          className="space-y-1"
          onSubmit={(event) => {
            event.preventDefault();
            if (text.trim() && !busy) void answer({ type: "text", text });
          }}
        >
          <div className="flex items-end gap-2">
            <Textarea
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
            <Button type="submit" size="icon" disabled={busy || !text.trim()} aria-label={t("send")}>
              {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />}
            </Button>
          </div>
          <p className="text-end text-xs text-muted-foreground">
            {text.length} / {textMax}
          </p>
        </form>
      )}
    </div>
  );
}

const num = (value: string) => {
  const parsed = Number(value);
  return value.trim() !== "" && Number.isFinite(parsed) ? parsed : null;
};

function ProductsEditor({
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
        <Input value={name} maxLength={120} onChange={(event) => setName(event.target.value)} placeholder={t("product.name")} aria-label={t("product.name")} />
        <Button type="submit" variant="outline" disabled={busy || !name.trim() || products.length >= BUILDER_LIMITS.products}>
          <Plus className="size-4" aria-hidden />
          {t("product.add")}
        </Button>
      </form>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{t("product.count", { count: products.length, max: BUILDER_LIMITS.products })}</p>
        <Button disabled={busy || !products.length} onClick={onDone}>
          {t("chips.done")}
        </Button>
      </div>
    </div>
  );
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
  const [name, setName] = useState(product.name);
  const [details, setDetails] = useState(product.details);
  const [price, setPrice] = useState(product.price?.toString() ?? "");
  const [stock, setStock] = useState(product.stock?.toString() ?? "");
  const [unlimited, setUnlimited] = useState(product.unlimited);
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
    <div className="space-y-2 rounded-xl border p-3">
      <div className="flex items-center gap-2">
        <Input value={name} maxLength={120} aria-label={t("product.name")} onChange={(event) => setName(event.target.value)} onBlur={() => save()} />
        <Button variant="ghost" size="icon" disabled={busy} aria-label={t("product.remove")} onClick={() => onRemove(product.id)}>
          <Trash2 className="size-4" aria-hidden />
        </Button>
      </div>
      <Textarea value={details} rows={2} maxLength={BUILDER_LIMITS.textMax} placeholder={t("product.details")} aria-label={t("product.details")} onChange={(event) => setDetails(event.target.value)} onBlur={() => save()} />
      <div className="flex flex-wrap items-center gap-2">
        <Input className="w-28" inputMode="decimal" value={price} placeholder={t("product.price")} aria-label={t("product.price")} onChange={(event) => setPrice(event.target.value)} onBlur={() => save()} />
        <Input className="w-28" inputMode="numeric" value={stock} disabled={unlimited} placeholder={t("product.stock")} aria-label={t("product.stock")} onChange={(event) => setStock(event.target.value)} onBlur={() => save()} />
        <label className="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            checked={unlimited}
            onChange={(event) => {
              setUnlimited(event.target.checked);
              save({ unlimited: event.target.checked });
            }}
          />
          {t("product.unlimited")}
        </label>
        {missing && <span className="text-xs text-destructive">{t("product.missing")}</span>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {product.photos.map((path) => (
          <button
            key={path}
            type="button"
            className="relative size-14 overflow-hidden rounded-md border"
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
        <Button variant="outline" size="sm" disabled={busy || product.photos.length >= BUILDER_LIMITS.photosPerProduct} onClick={() => fileInput.current?.click()}>
          <ImagePlus className="size-4" aria-hidden />
          {t("product.addPhoto", { count: product.photos.length, max: BUILDER_LIMITS.photosPerProduct })}
        </Button>
      </div>
    </div>
  );
}
