"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ImagePlus, Loader2, MoreHorizontal, Pencil, Plus, RotateCcw, Sparkles, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@workspace/ui/components/sheet";
import { Switch } from "@workspace/ui/components/switch";
import { Textarea } from "@workspace/ui/components/textarea";
import { cn } from "@workspace/ui/lib/utils";
import { AUTOFILL_LIMITS, type AutofillErrorCode } from "@workspace/lib/products/autofill";
import { createClient } from "@/supabase/client";
import type { AdminAutofillResponse } from "@/app/api/stores/[storeId]/product-autofill/route";
import {
  createStoreProductAction,
  createStoreProductImageUploadUrl,
  restoreStoreProductsAction,
  searchStoreProductCategories,
  setStoreProductStatusAction,
  trashStoreProductsAction,
} from "./store-products.server";
import { emptyStoreProductForm, formValuesFromAutofill, type StoreProductFormValues } from "./store-products.lib";

// ── Row actions ─────────────────────────────────────────────────────────────

export function StoreProductRowActions({
  storeId,
  productId,
  status,
  inTrash,
  hasImage,
  canWrite,
}: {
  storeId: string;
  productId: string;
  status: string;
  inTrash: boolean;
  hasImage: boolean;
  canWrite: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const run = (action: () => Promise<{ success: true; message: string } | { success: false; error: string }>) =>
    startTransition(async () => {
      const result = await action();
      if (result.success) {
        if (result.message) toast.success(result.message);
        router.refresh();
      } else toast.error(result.error);
    });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8 shrink-0" disabled={pending} aria-label="Product actions">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <MoreHorizontal className="size-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {!inTrash && canWrite ? (
          <DropdownMenuItem asChild>
            <Link href={`/products/${productId}/edit`}>
              <Pencil className="size-4" /> Edit
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem asChild>
          <Link href={`/products/${productId}`}>
            <Eye className="size-4" /> View details
          </Link>
        </DropdownMenuItem>
        {canWrite ? <DropdownMenuSeparator /> : null}
        {canWrite && !inTrash && status === "draft" ? (
          <DropdownMenuItem disabled={!hasImage} onSelect={() => run(() => setStoreProductStatusAction(storeId, productId, "active"))}>
            <Eye className="size-4" /> {hasImage ? "Publish" : "Publish (needs a photo)"}
          </DropdownMenuItem>
        ) : null}
        {canWrite && !inTrash && status === "active" ? (
          <DropdownMenuItem onSelect={() => run(() => setStoreProductStatusAction(storeId, productId, "draft"))}>
            <EyeOff className="size-4" /> Hide (make draft)
          </DropdownMenuItem>
        ) : null}
        {canWrite && !inTrash ? (
          <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => run(() => trashStoreProductsAction(storeId, [productId]))}>
            <Trash2 className="size-4" /> Move to Trash
          </DropdownMenuItem>
        ) : null}
        {canWrite && inTrash ? (
          <DropdownMenuItem onSelect={() => run(() => restoreStoreProductsAction(storeId, [productId]))}>
            <RotateCcw className="size-4" /> Restore
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ── Add product ─────────────────────────────────────────────────────────────

type StoreCategoryOption = { id: string; name: string; nameAr: string | null; products: number };

const AI_ERRORS: Record<AutofillErrorCode, string> = {
  unauthorized: "Only admins can use this. Sign in again.",
  disabled: "AI is not set up on Admin (GOOGLE_GENERATIVE_AI_API_KEY).",
  empty: "Describe the product or add a photo first.",
  tooLarge: `Too much to send: up to ${AUTOFILL_LIMITS.maxImages} photos and ${AUTOFILL_LIMITS.maxTextLength} characters.`,
  pdfTooLong: "The PDF is too long.",
  badFile: "Use JPEG, PNG or WebP photos.",
  rateLimited: "Too many tries in a minute. Wait a moment.",
  dailyLimit: "You reached today's AI limit. Fill the form by hand or try tomorrow.",
  noCredits: "No AI credits left.",
  busy: "The AI is busy. Try again in a minute.",
  timeout: "The AI took too long. Try again with fewer photos.",
  failed: "The AI could not fill the form. Try again or fill it by hand.",
};

type Photo = { key: string; previewUrl: string; file: File; publicUrl: string | null; failed?: boolean };

const fileSlug = (name: string) =>
  name
    .replace(/\.[^.]*$/, "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

async function uploadPhoto(storeId: string, file: File): Promise<string> {
  const ext = (file.name.split(".").pop() || "jpg").replace(/[^A-Za-z0-9]/g, "").slice(0, 8) || "jpg";
  const signed = await createStoreProductImageUploadUrl(storeId, `${Date.now()}-${fileSlug(file.name) || "photo"}.${ext}`);
  if (!signed.success) throw new Error(signed.error);
  const { error } = await createClient()
    .storage.from("products")
    .uploadToSignedUrl(signed.data.path, signed.data.token, file, { cacheControl: "31536000", contentType: file.type || undefined });
  if (error) throw error;
  return signed.data.publicUrl;
}

/** A smaller JPEG for the model (each photo is billed; the stored photo stays full size). */
async function shrinkForAi(file: File, maxSide = 1600): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("resize failed"))), "image/jpeg", 0.85));
}

export function AddStoreProductButton(props: {
  storeId: string;
  currencyLabel: string;
  sellerCanPublish: boolean;
  storeCategories: StoreCategoryOption[];
}) {
  const [open, setOpen] = useState(false);
  // A new key per opening resets the sheet.
  const [session, setSession] = useState(0);
  return (
    <>
      <Button
        onClick={() => {
          setSession((n) => n + 1);
          setOpen(true);
        }}
      >
        <Plus className="size-4" /> Add product
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-2xl">
          <AddProductSheetBody key={session} {...props} onDone={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}

function AddProductSheetBody({
  storeId,
  currencyLabel,
  sellerCanPublish,
  storeCategories,
  onDone,
}: {
  storeId: string;
  currencyLabel: string;
  sellerCanPublish: boolean;
  storeCategories: StoreCategoryOption[];
  onDone: () => void;
}) {
  const router = useRouter();
  const [values, setValues] = useState<StoreProductFormValues>(() => ({ ...emptyStoreProductForm(), publish: sellerCanPublish }));
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [brief, setBrief] = useState("");
  const [aiState, setAiState] = useState<{ busy: boolean; filled: boolean; warnings: string[]; remaining: number | null }>({
    busy: false,
    filled: false,
    warnings: [],
    remaining: null,
  });
  const [saving, startSaving] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);
  const set = <K extends keyof StoreProductFormValues>(key: K, value: StoreProductFormValues[K]) => setValues((v) => ({ ...v, [key]: value }));

  useEffect(() => () => photos.forEach((p) => URL.revokeObjectURL(p.previewUrl)), []); // eslint-disable-line react-hooks/exhaustive-deps

  const uploading = photos.some((p) => !p.publicUrl && !p.failed);
  const uploadedUrls = photos.flatMap((p) => (p.publicUrl ? [p.publicUrl] : []));

  const addFiles = (files: FileList | null) => {
    const picked = Array.from(files ?? [])
      .filter((file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type))
      .slice(0, Math.max(0, 10 - photos.length));
    if (!picked.length) return;
    const added = picked.map((file) => ({ key: `${file.name}-${file.size}-${Math.random()}`, previewUrl: URL.createObjectURL(file), file, publicUrl: null }));
    setPhotos((list) => [...list, ...added]);
    for (const photo of added) {
      uploadPhoto(storeId, photo.file)
        .then((publicUrl) => setPhotos((list) => list.map((p) => (p.key === photo.key ? { ...p, publicUrl } : p))))
        .catch((error: unknown) => {
          toast.error(`${photo.file.name}: ${error instanceof Error ? error.message : "upload failed"}`);
          setPhotos((list) => list.map((p) => (p.key === photo.key ? { ...p, failed: true } : p)));
        });
    }
  };

  const removePhoto = (key: string) =>
    setPhotos((list) => {
      const gone = list.find((p) => p.key === key);
      if (gone) URL.revokeObjectURL(gone.previewUrl);
      return list.filter((p) => p.key !== key);
    });

  const fillWithAi = async () => {
    setAiState((s) => ({ ...s, busy: true }));
    try {
      const form = new FormData();
      form.set("text", brief);
      const forAi = photos.filter((p) => !p.failed).slice(0, AUTOFILL_LIMITS.maxImages);
      for (const photo of forAi) form.append("images", await shrinkForAi(photo.file), "photo.jpg");
      const response = await fetch(`/api/stores/${storeId}/product-autofill`, { method: "POST", body: form });
      const data = (await response.json().catch(() => ({ ok: false, error: "failed" }))) as AdminAutofillResponse;
      if (!data.ok) {
        toast.error(AI_ERRORS[data.error] ?? AI_ERRORS.failed);
        return;
      }
      const sentUrls = forAi.map((p) => p.publicUrl ?? "");
      const filled = formValuesFromAutofill(data.output, { imageUrls: sentUrls });
      const knownCategory = storeCategories.find(
        (c) => filled.storeCategoryName && [c.name, c.nameAr].some((n) => n?.trim() === filled.storeCategoryName?.trim()),
      );
      setValues((v) => ({
        ...v,
        ...filled,
        storeCategoryId: knownCategory?.id ?? v.storeCategoryId,
        storeCategoryName: knownCategory ? "" : (filled.storeCategoryName ?? v.storeCategoryName),
        ...(data.category && !v.categoryId
          ? { categoryId: data.category.id, categoryLabel: [data.category.name, data.category.nameAr].filter(Boolean).join(" · ") }
          : {}),
      }));
      setAiState({ busy: false, filled: true, warnings: data.output.warnings, remaining: data.remainingToday });
      toast.success("Filled in. Check every field before adding.");
    } catch {
      toast.error(AI_ERRORS.failed);
    } finally {
      setAiState((s) => ({ ...s, busy: false }));
    }
  };

  const submit = () =>
    startSaving(async () => {
      const result = await createStoreProductAction(storeId, { ...values, images: uploadedUrls });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message);
      router.refresh();
      onDone();
    });

  return (
    <div className="flex min-h-full flex-col">
      <SheetHeader className="border-b px-6 py-4">
        <SheetTitle>Add product</SheetTitle>
        <SheetDescription>
          Add photos and a few words, let AI write the listing in Arabic and English, then check it. Or fill it in yourself.
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 space-y-8 px-6 py-6">
        <section aria-labelledby="add-photos" className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h3 id="add-photos" className="font-medium">
              Photos
            </h3>
            <span className="text-xs text-muted-foreground">{photos.length}/10 · the first {AUTOFILL_LIMITS.maxImages} go to AI</span>
          </div>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {photos.map((photo, index) => (
              <div key={photo.key} className={cn("group relative aspect-square overflow-hidden rounded-md border bg-muted", photo.failed && "border-destructive")}>
                {/* eslint-disable-next-line @next/next/no-img-element -- a local blob preview */}
                <img src={photo.previewUrl} alt="" className={cn("size-full object-cover", !photo.publicUrl && "opacity-60")} />
                {!photo.publicUrl && !photo.failed ? <Loader2 className="absolute inset-0 m-auto size-5 animate-spin text-foreground" /> : null}
                {index === 0 ? <span className="absolute bottom-1 start-1 rounded bg-background/90 px-1 text-[10px] font-medium">Cover</span> : null}
                <button
                  type="button"
                  onClick={() => removePhoto(photo.key)}
                  className="absolute end-1 top-1 grid size-6 place-items-center rounded-full bg-background/90 opacity-0 shadow transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
                  aria-label="Remove photo"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
            {photos.length < 10 ? (
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="grid aspect-square place-items-center rounded-md border border-dashed text-muted-foreground transition-colors hover:border-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex flex-col items-center gap-1 text-xs">
                  <ImagePlus className="size-5" /> Add
                </span>
              </button>
            ) : null}
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            hidden
            onChange={(event) => {
              addFiles(event.target.files);
              event.target.value = "";
            }}
          />
        </section>

        <section aria-labelledby="add-ai" className="space-y-3 rounded-lg border bg-muted/40 p-4">
          <h3 id="add-ai" className="flex items-center gap-2 font-medium">
            <Sparkles className="size-4" aria-hidden /> Fill with AI
          </h3>
          <Textarea
            value={brief}
            onChange={(event) => setBrief(event.target.value.slice(0, AUTOFILL_LIMITS.maxTextLength))}
            placeholder="What it is, sizes or colors, price and stock if the seller gave them. Paste the seller's message here."
            rows={4}
            dir="auto"
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              Uses the sellers&apos; product AI. It is not charged to the seller. Prices and stock come only from what you write.
              {aiState.remaining !== null ? ` ${aiState.remaining} left today.` : ""}
            </p>
            <Button type="button" variant="secondary" onClick={fillWithAi} disabled={aiState.busy || uploading || (!brief.trim() && photos.length === 0)}>
              {aiState.busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {aiState.filled ? "Fill again" : "Fill with AI"}
            </Button>
          </div>
          {aiState.warnings.length ? (
            <ul className="list-disc space-y-1 ps-5 text-sm text-amber-700 dark:text-amber-400" dir="auto">
              {aiState.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          ) : null}
        </section>

        <ProductFields values={values} set={set} storeId={storeId} currencyLabel={currencyLabel} storeCategories={storeCategories} />

        <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
          <div>
            <Label htmlFor="add-publish" className="font-medium">
              Show on the store now
            </Label>
            <p className="text-xs text-muted-foreground">
              {sellerCanPublish ? "Off keeps it as a hidden draft." : "The seller's account is not approved yet, so it is saved as a draft."}
            </p>
          </div>
          <Switch id="add-publish" checked={values.publish && sellerCanPublish} disabled={!sellerCanPublish} onCheckedChange={(checked) => set("publish", checked)} />
        </div>
      </div>

      <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t bg-background px-6 py-3">
        <Button type="button" variant="ghost" onClick={onDone} disabled={saving}>
          Cancel
        </Button>
        <Button type="button" onClick={submit} disabled={saving || uploading || aiState.busy}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : null}
          {uploading ? "Uploading photos…" : "Add product"}
        </Button>
      </div>
    </div>
  );
}

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function ProductFields({
  values,
  set,
  storeId,
  currencyLabel,
  storeCategories,
}: {
  values: StoreProductFormValues;
  set: <K extends keyof StoreProductFormValues>(key: K, value: StoreProductFormValues[K]) => void;
  storeId: string;
  currencyLabel: string;
  storeCategories: StoreCategoryOption[];
}) {
  return (
    <div className="space-y-8">
      <section aria-labelledby="add-copy" className="space-y-4">
        <h3 id="add-copy" className="font-medium">
          Listing
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="title-ar" label="Title (Arabic)">
            <Input id="title-ar" dir="rtl" value={values.titleAr} maxLength={255} onChange={(e) => set("titleAr", e.target.value)} />
          </Field>
          <Field id="title-en" label="Title (English)">
            <Input id="title-en" dir="ltr" value={values.titleEn} maxLength={255} onChange={(e) => set("titleEn", e.target.value)} />
          </Field>
          <Field id="desc-ar" label="Short description (Arabic)">
            <Textarea id="desc-ar" dir="rtl" rows={5} value={values.descriptionAr} maxLength={5000} onChange={(e) => set("descriptionAr", e.target.value)} />
          </Field>
          <Field id="desc-en" label="Short description (English)">
            <Textarea id="desc-en" dir="ltr" rows={5} value={values.descriptionEn} maxLength={5000} onChange={(e) => set("descriptionEn", e.target.value)} />
          </Field>
          <Field id="bullets-ar" label="Key points (Arabic)" hint="One per line.">
            <Textarea id="bullets-ar" dir="rtl" rows={4} value={values.bulletsAr} onChange={(e) => set("bulletsAr", e.target.value)} />
          </Field>
          <Field id="bullets-en" label="Key points (English)" hint="One per line.">
            <Textarea id="bullets-en" dir="ltr" rows={4} value={values.bulletsEn} onChange={(e) => set("bulletsEn", e.target.value)} />
          </Field>
          <Field id="kw-ar" label="Search keywords (Arabic)" hint="Separated by commas.">
            <Input id="kw-ar" dir="rtl" value={values.keywordsAr} onChange={(e) => set("keywordsAr", e.target.value)} />
          </Field>
          <Field id="kw-en" label="Search keywords (English)" hint="Separated by commas.">
            <Input id="kw-en" dir="ltr" value={values.keywordsEn} onChange={(e) => set("keywordsEn", e.target.value)} />
          </Field>
        </div>
        {values.contentAr || values.contentEn ? (
          <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
            <span className="text-muted-foreground">AI wrote a detailed description in both languages. Edit it later in the product editor.</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => (set("contentAr", ""), set("contentEn", ""))}>
              Remove
            </Button>
          </div>
        ) : null}
      </section>

      <section aria-labelledby="add-price" className="space-y-4">
        <h3 id="add-price" className="font-medium">
          Price and stock
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="price" label={`Price (${currencyLabel})`}>
            <Input id="price" inputMode="decimal" dir="ltr" value={values.price} onChange={(e) => set("price", e.target.value)} />
          </Field>
          <Field id="compare" label={`Before discount (${currencyLabel})`} hint="Optional, shown struck through.">
            <Input id="compare" inputMode="decimal" dir="ltr" value={values.compareAtPrice} onChange={(e) => set("compareAtPrice", e.target.value)} />
          </Field>
          <Field id="qty" label="Stock">
            <Input id="qty" inputMode="numeric" dir="ltr" value={values.trackStock ? values.quantity : ""} disabled={!values.trackStock} placeholder={values.trackStock ? "0" : "Unlimited"} onChange={(e) => set("quantity", e.target.value)} />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={!values.trackStock} onCheckedChange={(checked) => set("trackStock", !checked)} />
          Unlimited stock (made to order, digital or a service)
        </label>
      </section>

      <section aria-labelledby="add-category" className="space-y-4">
        <h3 id="add-category" className="font-medium">
          Category
        </h3>
        <CategoryPicker storeId={storeId} value={values.categoryId ? { id: values.categoryId, label: values.categoryLabel } : null} onChange={(c) => (set("categoryId", c?.id ?? null), set("categoryLabel", c?.label ?? ""))} />
        <Field id="store-category" label="Store category" hint="Where it shows in this store's menu. Pick one, or type a new name to add it.">
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              id="store-category"
              value={values.storeCategoryId ?? ""}
              onChange={(e) => set("storeCategoryId", e.target.value || null)}
              className="h-9 rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-1/2"
            >
              <option value="">{storeCategories.length ? "None or a new one" : "No store categories yet"}</option>
              {storeCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameAr ? `${c.nameAr} · ${c.name}` : c.name}
                </option>
              ))}
            </select>
            {!values.storeCategoryId ? (
              <Input aria-label="New store category name" dir="auto" placeholder="New category name" value={values.storeCategoryName} maxLength={80} onChange={(e) => set("storeCategoryName", e.target.value)} className="sm:w-1/2" />
            ) : null}
          </div>
        </Field>
      </section>
    </div>
  );
}

function CategoryPicker({
  storeId,
  value,
  onChange,
}: {
  storeId: string;
  value: { id: string; label: string } | null;
  onChange: (value: { id: string; label: string } | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Array<{ id: string; label: string; parent: string }>>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    let live = true;
    const timer = setTimeout(async () => {
      setSearching(true);
      const result = await searchStoreProductCategories(storeId, term);
      if (!live) return;
      setSearching(false);
      setResults(
        result.success
          ? result.data.map((c) => ({
              id: c.id,
              label: [c.name, c.nameAr].filter(Boolean).join(" · "),
              parent: [c.parent, c.parentAr].filter(Boolean).join(" · "),
            }))
          : [],
      );
    }, 250);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [query, storeId]);

  return (
    <Field id="tallaby-category" label="Tallaby category" hint="Required. The closest match from Tallaby's list.">
      {value ? (
        <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
          <span>{value.label || "Selected"}</span>
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
            Change
          </Button>
        </div>
      ) : (
        <div className="space-y-1">
          <div className="relative">
            <Input id="tallaby-category" dir="auto" placeholder="Search, e.g. mugs or أكواب" value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" />
            {searching ? <Loader2 className="absolute end-2.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" /> : null}
          </div>
          {results.length ? (
            <ul className="max-h-56 overflow-y-auto rounded-md border" role="listbox" aria-label="Categories">
              {results.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={false}
                    onClick={() => {
                      onChange({ id: c.id, label: c.label });
                      setQuery("");
                    }}
                    className="w-full px-3 py-2 text-start text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                  >
                    {c.label}
                    {c.parent ? <span className="ms-2 text-xs text-muted-foreground">in {c.parent}</span> : null}
                  </button>
                </li>
              ))}
            </ul>
          ) : query.trim().length >= 2 && !searching ? (
            <p className="text-xs text-muted-foreground">No category matches. Try a shorter word.</p>
          ) : null}
        </div>
      )}
    </Field>
  );
}
