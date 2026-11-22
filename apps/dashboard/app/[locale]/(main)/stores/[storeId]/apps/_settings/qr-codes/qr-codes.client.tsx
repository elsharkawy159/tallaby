"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Download, QrCode } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { searchQrProducts } from "./qr-codes.server";
import { qrDestinationUrl, QR_PNG_OPTIONS, type QrDestination } from "./qr-codes.lib";

type Option = { id: string; label: string };
type DestinationKind = QrDestination["kind"];
type Products = Awaited<ReturnType<typeof searchQrProducts>>;

function DestinationSelect({ id, value, onChange, options, placeholder }: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange} disabled={!options.length}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options.map((option) => <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>)}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export function StoreQrCodes({ storeId, baseUrl, pages }: {
  storeId: string;
  baseUrl: string | null;
  pages: Option[];
}) {
  const t = useTranslations("qrCodes");
  const [kind, setKind] = useState<DestinationKind>("home");
  const [pageSlug, setPageSlug] = useState("");
  const [productId, setProductId] = useState("");
  const [query, setQuery] = useState("");
  const [productResult, setProductResult] = useState<{ query: string; rows: Products | null } | null>(null);
  const productList = productResult?.query === query ? productResult : null;
  const productSlug = productList?.rows?.find((product) => product.id === productId)?.slug;
  const [generated, setGenerated] = useState<{ url: string; png: string | null } | null>(null);

  useEffect(() => {
    if (kind !== "product") return;
    let stale = false;
    const timer = window.setTimeout(() => {
      void searchQrProducts(storeId, query).then(
        (rows) => { if (!stale) setProductResult({ query, rows }); },
        () => { if (!stale) setProductResult({ query, rows: null }); },
      );
    }, 250);
    return () => { stale = true; window.clearTimeout(timer); };
  }, [kind, query, storeId]);

  const slug = kind === "page" ? pageSlug : productSlug;
  const destination: QrDestination | null = kind === "home" ? { kind } : slug ? { kind, slug } : null;
  const url = baseUrl && destination ? qrDestinationUrl(baseUrl, destination) : null;
  const preview = generated?.url === url ? generated : null;

  useEffect(() => {
    if (!url) return;
    let stale = false;
    void import("qrcode").then(({ default: qr }) => qr.toDataURL(url, QR_PNG_OPTIONS)).then(
      (png) => { if (!stale) setGenerated({ url, png }); },
      () => { if (!stale) setGenerated({ url, png: null }); },
    );
    return () => { stale = true; };
  }, [url]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t(baseUrl ? "description" : "offline")}</CardDescription>
      </CardHeader>
      {baseUrl ? (
        <CardContent className="grid items-start gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="qr-kind">{t("destination")}</FieldLabel>
              <DestinationSelect id="qr-kind" value={kind} onChange={(value) => setKind(value as DestinationKind)} options={[
                { id: "home", label: t("home") },
                { id: "page", label: t("page") },
                { id: "product", label: t("product") },
              ]} />
            </Field>
            {kind === "page" ? (
              <Field>
                <FieldLabel htmlFor="qr-page">{t("page")}</FieldLabel>
                <DestinationSelect id="qr-page" value={pageSlug} onChange={setPageSlug} options={pages}
                  placeholder={t(pages.length ? "selectPage" : "noPages")} />
              </Field>
            ) : null}
            {kind === "product" ? (
              <>
                <Field>
                  <FieldLabel htmlFor="qr-product-search">{t("searchProducts")}</FieldLabel>
                  <Input id="qr-product-search" type="search" maxLength={100} value={query} onChange={(event) => {
                    setQuery(event.target.value);
                    setProductId("");
                  }} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="qr-product">{t("product")}</FieldLabel>
                  <DestinationSelect id="qr-product" value={productId} onChange={setProductId}
                    options={productList?.rows ?? []}
                    placeholder={t(!productList ? "loadingProducts" : productList.rows === null ? "searchError" :
                      productList.rows.length ? "selectProduct" : "noProducts")} />
                </Field>
              </>
            ) : null}
            {url ? (
              <div className="min-w-0 rounded-xl border bg-muted/35 p-3">
                <p className="mb-1 text-xs font-medium text-muted-foreground">{t("link")}</p>
                <a href={url} dir="ltr" target="_blank" rel="noopener noreferrer"
                  className="block break-all text-start text-sm text-primary underline underline-offset-2">{url}</a>
              </div>
            ) : null}
          </FieldGroup>

          <div className="flex min-w-0 flex-col items-center gap-4 rounded-xl border bg-muted/35 p-5">
            {preview?.png ? (
              <Image src={preview.png} unoptimized width={224} height={224} alt={t("title")}
                className="h-auto max-w-full rounded-md" />
            ) : (
              <div className="flex aspect-square w-full max-w-56 flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground"
                role="status">
                <QrCode aria-hidden className="size-7" />
                {t(preview ? "generationError" : url ? "generating" : "chooseDestination")}
              </div>
            )}
            {preview?.png ? (
              <Button asChild variant="secondary" className="w-full">
                <a href={preview.png} download="tallaby-qr.png">
                  <Download data-icon="inline-start" />
                  {t("download")}
                </a>
              </Button>
            ) : null}
          </div>
        </CardContent>
      ) : null}
    </Card>
  );
}
