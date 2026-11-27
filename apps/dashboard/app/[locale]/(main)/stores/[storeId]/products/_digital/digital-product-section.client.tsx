"use client";

import { useEffect, useRef, useState } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Download, FileText, LoaderCircle, Package, Plus, Shapes, Truck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SellerButton } from "@/components/seller-ui";
import { FieldError, FieldHint, SectionCard } from "@/app/[locale]/(main)/stores/[storeId]/products/add/form-kit";
import { useFieldError } from "../add/sections/fields";
import type { AddProductFormData } from "../add/add-product.schema";
import { useProductStoreId } from "../_components/product-store.client";
import {
  DIGITAL_FILES_BUCKET,
  DIGITAL_FILES_MAX,
  DIGITAL_FILE_ACCEPT,
  digitalFileProblem,
  formatDigitalFileSize,
} from "./digital-files.lib";
import { createDigitalFileUploadUrl } from "./digital-files.server";
import type { ProductTypeValue } from "./digital-files.dto";

/** Section id: a missing file scrolls here (add-product.tsx). */
export const PRODUCT_TYPE_SECTION_ID = "sec-product-type";

type Uploading = { key: string; name: string; size: number; progress: number };

/**
 * Sends one file to the signed upload URL with progress. The same request
 * `uploadToSignedUrl` makes (PUT, multipart, no overwrite), done with XHR
 * because fetch can't report upload progress. The anon key is public.
 */
function putToSignedUrl(path: string, token: string, file: File, onProgress: (ratio: number) => void): Promise<void> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const url = `${base}/storage/v1/object/upload/sign/${DIGITAL_FILES_BUCKET}/${path}?token=${encodeURIComponent(token)}`;
  const body = new FormData();
  body.append("cacheControl", "3600");
  body.append("", file);
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.setRequestHeader("apikey", anon);
    xhr.setRequestHeader("authorization", `Bearer ${anon}`);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`upload failed: ${xhr.status}`)));
    xhr.onerror = () => reject(new Error("upload failed"));
    xhr.send(body);
  });
}

/**
 * The product form's first card (ROADMAP.md F-108a): Physical (the default)
 * or Digital. A digital product has no stock count, no pre-order, no options
 * and no shipping; switching back to Physical gives those values back. Its
 * files upload straight to private storage and are saved with the product.
 */
export function DigitalProductSection({ onBusyChange }: { /** True while a file is uploading: the form waits before saving. */ onBusyChange?: (busy: boolean) => void }) {
  const t = useTranslations("productForm.sections.digital");
  const form = useFormContext<AddProductFormData>();
  const storeId = useProductStoreId();
  const productType = (useWatch({ control: form.control, name: "productType" }) ?? "physical") as ProductTypeValue;
  const digital = productType === "digital";
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "digitalFiles", keyName: "key" });
  const filesError = useFieldError("digitalFiles");
  const [uploading, setUploading] = useState<Uploading[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  // What Physical had before Digital took it away; given back on the way back.
  const stash = useRef<Pick<AddProductFormData, "trackStock" | "preorderEnabled" | "preorderShipsAt" | "variants" | "variantTypes"> | null>(null);
  const [removedOptions, setRemovedOptions] = useState(false);

  const setType = (next: ProductTypeValue) => {
    if (next === productType) return;
    const set = <K extends keyof AddProductFormData>(name: K, value: AddProductFormData[K]) =>
      form.setValue(name as never, value as never, { shouldDirty: true });
    if (next === "digital") {
      const values = form.getValues();
      stash.current = {
        trackStock: values.trackStock,
        preorderEnabled: values.preorderEnabled,
        preorderShipsAt: values.preorderShipsAt,
        variants: values.variants ?? [],
        variantTypes: values.variantTypes ?? [],
      };
      setRemovedOptions((values.variants ?? []).length > 0);
      set("trackStock", false);
      set("preorderEnabled", false);
      set("preorderShipsAt", null);
      set("variants", []);
      set("variantTypes", []);
    } else if (stash.current) {
      const saved = stash.current;
      set("trackStock", saved.trackStock);
      set("preorderEnabled", saved.preorderEnabled);
      set("preorderShipsAt", saved.preorderShipsAt);
      set("variants", saved.variants);
      set("variantTypes", saved.variantTypes);
      stash.current = null;
      setRemovedOptions(false);
    } else {
      // A product that was saved as digital: stock is counted again as a physical product.
      set("trackStock", true);
    }
    // The files stay in the form until save: saving as Physical deletes them.
    set("productType", next);
    form.clearErrors("digitalFiles");
  };

  const uploadOne = async (file: File) => {
    const key = `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`;
    setUploading((list) => [...list, { key, name: file.name, size: file.size, progress: 0 }]);
    try {
      const signed = await createDigitalFileUploadUrl(storeId, { name: file.name, size: file.size });
      if (!signed.success) throw new Error(signed.error);
      await putToSignedUrl(signed.path, signed.token, file, (ratio) =>
        setUploading((list) => list.map((item) => (item.key === key ? { ...item, progress: ratio } : item))),
      );
      append({ path: signed.path, name: file.name, size: file.size, type: file.type || "" });
      form.clearErrors("digitalFiles");
    } catch (error) {
      console.error("Digital file upload failed:", error);
      toast.error(t("uploadFailed", { name: file.name }));
    } finally {
      setUploading((list) => list.filter((item) => item.key !== key));
    }
  };

  const addFiles = (list: FileList | null) => {
    if (!list?.length) return;
    let room = DIGITAL_FILES_MAX - fields.length - uploading.length;
    for (const file of Array.from(list)) {
      const problem = digitalFileProblem(file);
      if (problem) {
        toast.error(t(problem === "type" ? "badType" : problem === "size" ? "tooLarge" : "emptyFile", { name: file.name }));
        continue;
      }
      if (room <= 0) {
        toast.error(t("tooMany", { max: DIGITAL_FILES_MAX }));
        break;
      }
      room -= 1;
      void uploadOne(file);
    }
  };

  const busy = uploading.length > 0;
  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);
  const full = fields.length + uploading.length >= DIGITAL_FILES_MAX;

  return (
    <SectionCard id={PRODUCT_TYPE_SECTION_ID} icon={Shapes} title={t("title")} description={t("description")} invalid={Boolean(digital && filesError)}>
      <div role="radiogroup" aria-label={t("title")} className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <TypeChoice icon={Truck} title={t("physical")} description={t("physicalHint")} selected={!digital} onSelect={() => setType("physical")} />
        <TypeChoice icon={Download} title={t("digital")} description={t("digitalHint")} selected={digital} onSelect={() => setType("digital")} />
      </div>

      {digital && removedOptions && <FieldHint>{t("optionsRemoved")}</FieldHint>}

      {digital && (
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[13.5px] font-bold text-(--s-ink)">{t("filesTitle")}</span>
            <SellerButton type="button" variant="mini" size="xs" disabled={full} onClick={() => inputRef.current?.click()}>
              <Plus aria-hidden />
              {t("addFiles")}
            </SellerButton>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={DIGITAL_FILE_ACCEPT}
              className="hidden"
              onChange={(event) => {
                addFiles(event.target.files);
                event.target.value = "";
              }}
            />
          </div>

          {fields.length === 0 && !busy ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className={cn(
                "flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border-[1.5px] border-dashed border-(--s-field) bg-(--s-surface) px-4 py-6 text-center transition-colors hover:border-(--s-primary)",
                filesError && "border-destructive/60",
              )}
            >
              <Package className="size-5 text-(--s-faint)" aria-hidden />
              <span className="text-[13px] font-semibold text-(--s-ink)">{t("emptyTitle")}</span>
              <span className="text-xs text-(--s-subtle)">{t("emptyHint")}</span>
            </button>
          ) : (
            <ul className="flex flex-col gap-2">
              {fields.map((file, index) => (
                <li key={file.key} className="flex items-center gap-3 rounded-2xl border-[1.5px] border-(--s-field) bg-(--s-surface) px-3.5 py-2.5">
                  <FileText className="size-4 shrink-0 text-(--s-faint)" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-(--s-ink)" dir="auto">
                      {file.name}
                    </span>
                    <span className="block font-montserrat text-xs text-(--s-subtle)" dir="ltr">
                      {formatDigitalFileSize(file.size)}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    aria-label={t("removeFile", { name: file.name })}
                    title={t("removeFile", { name: file.name })}
                    className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-full text-(--s-muted) transition-colors hover:bg-destructive-soft hover:text-destructive"
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                </li>
              ))}
              {uploading.map((item) => (
                <li key={item.key} className="flex items-center gap-3 rounded-2xl border-[1.5px] border-(--s-field) bg-(--s-surface) px-3.5 py-2.5">
                  <LoaderCircle className="size-4 shrink-0 animate-spin text-(--s-faint)" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-(--s-ink)" dir="auto">
                      {item.name}
                    </span>
                    <span
                      className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-(--s-surface-2)"
                      role="progressbar"
                      aria-label={t("uploading", { name: item.name })}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(item.progress * 100)}
                    >
                      <span className="block h-full rounded-full bg-primary transition-[width]" style={{ width: `${Math.round(item.progress * 100)}%` }} />
                    </span>
                  </span>
                  <span className="shrink-0 font-montserrat text-xs tabular-nums text-(--s-subtle)" dir="ltr">
                    {Math.round(item.progress * 100)}%
                  </span>
                </li>
              ))}
            </ul>
          )}

          <FieldHint>{t("limits", { max: DIGITAL_FILES_MAX })}</FieldHint>
          <FieldError>{filesError}</FieldError>
        </div>
      )}
    </SectionCard>
  );
}

function TypeChoice({
  icon: Icon,
  title,
  description,
  selected,
  onSelect,
}: {
  icon: typeof Truck;
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-2xl border-[1.5px] bg-(--s-surface) px-4 py-3.5 text-start transition-colors",
        selected ? "border-(--s-primary) bg-primary-soft" : "border-(--s-field) hover:border-(--s-field-strong)",
      )}
    >
      <Icon className={cn("mt-0.5 size-[18px] shrink-0", selected ? "text-primary-ink" : "text-(--s-faint)")} aria-hidden />
      <span className="min-w-0">
        <span className="block text-[13.5px] font-bold text-(--s-ink)">{title}</span>
        <span className="block text-xs leading-[1.6] text-(--s-subtle)">{description}</span>
      </span>
    </button>
  );
}
