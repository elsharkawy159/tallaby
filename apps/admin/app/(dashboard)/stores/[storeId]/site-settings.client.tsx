"use client";

import { useMemo, useRef, useState, useTransition, type CSSProperties, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Globe, ImagePlus, LoaderCircle, Palette, Search, Share2, Store, Trash2, type LucideIcon } from "lucide-react";
import { MEDIA_BUCKET } from "@workspace/lib/media";
import { REGIONAL_CURRENCY_CODES, STORE_CURRENCIES, STORE_CURRENCY_CODES, type CurrencyLabel, type StoreCurrency } from "@workspace/lib";
import { COLOR_FIELDS, PALETTE_PRESETS, RADIUS_OPTIONS, SPACING_OPTIONS, WIDTH_OPTIONS, applyPairing, applyPreset, isHexColor, matchPreset } from "@workspace/store-editor/lib/design.lib";
import { FONT_PAIRINGS, findFontPairing, storeFontFamily } from "@workspace/store-sections/fonts";
import { SOCIAL_PLATFORMS, getSocialPlatform, normalizeSocialLink } from "@workspace/store-sections/social";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { Switch } from "@workspace/ui/components/switch";
import { Textarea } from "@workspace/ui/components/textarea";
import { cn } from "@workspace/ui/lib/utils";
import { createClient } from "@/supabase/client";
import { createSignedUpload, createUploadPaths, recordUpload } from "@/app/(builder)/stores/[storeId]/editor/admin-store-media.server";
import type { DesignValues, DetailsValues, SeoValues, SiteSettingsInitial, SocialRow } from "./site-settings.dto";
import { saveStoreDesignAction, saveStoreDetailsAction, saveStoreSeoAction, saveStoreSocialAction } from "./site-settings.server";

type TabId = "details" | "brand" | "social" | "seo";

/**
 * Which tab, and how its changes reach visitors. Saying it next to the Save
 * button is what keeps admins from assuming a draft change is already live.
 */
const TABS: readonly { id: TabId; label: string; icon: LucideIcon; live: boolean }[] = [
  { id: "details", label: "Store details", icon: Store, live: true },
  { id: "brand", label: "Brand & design", icon: Palette, live: false },
  { id: "social", label: "Social media", icon: Share2, live: true },
  { id: "seo", label: "Search & sharing", icon: Search, live: true },
];

const PRESET_NAMES: Record<string, string> = {
  classic: "Tallaby Classic",
  ocean: "Ocean",
  forest: "Forest",
  sunset: "Sunset",
  berry: "Berry",
  midnight: "Midnight",
  rose: "Rose",
  sand: "Sand",
};

const COLOR_LABELS: Record<string, { label: string; hint: string }> = {
  primary: { label: "Primary", hint: "Buttons, links and the header" },
  accent: { label: "Accent", hint: "Badges, sale tags and highlights" },
  secondary: { label: "Panel", hint: "Light background of cards and bands" },
  background: { label: "Page background", hint: "Behind every section" },
  foreground: { label: "Text", hint: "Headings and body text" },
  muted: { label: "Soft text", hint: "Captions and secondary text" },
  border: { label: "Lines", hint: "Borders and dividers" },
};

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export function SiteSettingsEditor({
  storeId,
  storeName,
  storeHost,
  siteLive,
  readOnly,
  fontClassName,
  initial,
}: {
  storeId: string;
  storeName: string;
  /** The storefront's host as visitors see it (custom domain or subdomain). */
  storeHost: string;
  siteLive: boolean;
  /** Archived or suspended store, or a moderator: nothing can be saved. */
  readOnly: boolean;
  fontClassName: string;
  initial: SiteSettingsInitial;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("details");
  const [saved, setSaved] = useState(initial);
  const [details, setDetails] = useState(initial.details);
  const [social, setSocial] = useState(initial.social);
  const [seo, setSeo] = useState(initial.seo);
  const [design, setDesign] = useState(initial.design.value);
  const [pending, startTransition] = useTransition();

  const dirty: Record<TabId, boolean> = {
    details: !same(details, saved.details),
    brand: !same(design, saved.design.value),
    social: !same(social, saved.social),
    seo: !same(seo, saved.seo),
  };
  const current = TABS.find((t) => t.id === tab)!;

  const socialErrors = useMemo(
    () =>
      Object.fromEntries(
        social.filter((row) => row.value.trim() && !normalizeSocialLink(row.platform, row.value)).map((row) => [row.platform, true]),
      ) as Record<string, boolean>,
    [social],
  );
  const blocked =
    (tab === "details" && (!details.name.trim() || !details.supportedLocales.includes(details.defaultLocale))) ||
    (tab === "social" && Object.keys(socialErrors).length > 0) ||
    (tab === "seo" && seo.titleTemplate.trim() !== "" && seo.titleTemplate.split("%s").length !== 2);

  const reset = () => {
    if (tab === "details") setDetails(saved.details);
    if (tab === "brand") setDesign(saved.design.value);
    if (tab === "social") setSocial(saved.social);
    if (tab === "seo") setSeo(saved.seo);
  };

  const save = (publishNow = false) =>
    startTransition(async () => {
      if (tab === "details") {
        const result = await saveStoreDetailsAction(storeId, details);
        if (!result.success) return void toast.error(result.error);
        setSaved((s) => ({ ...s, details }));
        toast.success(result.message);
      } else if (tab === "social") {
        const result = await saveStoreSocialAction(storeId, social);
        if (!result.success) return void toast.error(result.error);
        setSaved((s) => ({ ...s, social }));
        toast.success(result.message);
      } else if (tab === "seo") {
        const result = await saveStoreSeoAction(storeId, seo);
        if (!result.success) return void toast.error(result.error);
        setSaved((s) => ({ ...s, seo }));
        toast.success(result.message);
      } else {
        const result = await saveStoreDesignAction(storeId, design, saved.design.version, publishNow);
        if (!result.success) return void toast.error(result.error);
        setSaved((s) => ({ ...s, design: { value: design, version: result.data.version } }));
        toast.success(result.message);
      }
      router.refresh();
    });

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="flex flex-col gap-3 border-b px-4 pt-4 sm:px-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h3 className="text-base font-semibold">Website settings</h3>
          <p className="text-xs text-muted-foreground">Every save is recorded in the store&apos;s activity log.</p>
        </div>
        <div role="tablist" aria-label="Website settings" className="-mb-px flex gap-1 overflow-x-auto">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = t.id === tab;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                id={`site-tab-${t.id}`}
                aria-selected={active}
                aria-controls="site-settings-panel"
                onClick={() => setTab(t.id)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 border-b-2 px-3 pb-2.5 pt-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active ? "border-primary font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {t.label}
                {dirty[t.id] && <span className="size-1.5 rounded-full bg-amber-500" aria-label="Unsaved changes" />}
              </button>
            );
          })}
        </div>
      </div>

      <div
        id="site-settings-panel"
        role="tabpanel"
        aria-labelledby={`site-tab-${tab}`}
        className="grid gap-6 p-4 sm:p-5 xl:grid-cols-[minmax(0,1fr)_22rem]"
      >
        <fieldset disabled={readOnly || pending} className="min-w-0 space-y-6">
          {tab === "details" && <DetailsForm storeId={storeId} value={details} onChange={setDetails} />}
          {tab === "brand" && <BrandForm value={design} onChange={setDesign} />}
          {tab === "social" && <SocialForm rows={social} errors={socialErrors} onChange={setSocial} />}
          {tab === "seo" && <SeoForm storeId={storeId} storeName={details.name || storeName} value={seo} onChange={setSeo} />}
        </fieldset>

        <aside className="min-w-0 xl:sticky xl:top-4 xl:self-start" aria-label="Preview">
          <p className="mb-2 text-xs text-muted-foreground">How visitors see it</p>
          {tab === "seo" ? (
            <SeoPreview seo={seo} storeName={details.name || storeName} host={storeHost} description={details.description} />
          ) : (
            <StorePreview
              className={fontClassName}
              details={details}
              design={design}
              social={social}
              host={storeHost}
              focus={tab}
            />
          )}
        </aside>
      </div>

      <div className="flex flex-col gap-3 border-t bg-muted/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className={cn("size-2 shrink-0 rounded-full", current.live ? "bg-emerald-500" : "bg-amber-500")} aria-hidden />
          {readOnly
            ? "Read only. Archived and suspended stores can't be changed, and moderators can only view."
            : current.live
              ? "Changes on this tab are live as soon as you save."
              : siteLive
                ? "Saved to the drafts. Visitors see it after you publish."
                : "Saved to the drafts. The website is offline, so nothing changes for visitors yet."}
        </p>
        {!readOnly && (
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={reset} disabled={!dirty[tab] || pending}>
              Undo changes
            </Button>
            {tab === "brand" ? (
              <>
                <Button variant={siteLive ? "outline" : "default"} size="sm" onClick={() => save(false)} disabled={!dirty.brand || pending}>
                  {pending && <LoaderCircle className="mr-1 size-3.5 animate-spin" aria-hidden />}
                  Save to drafts
                </Button>
                {siteLive && (
                  <Button size="sm" onClick={() => save(true)} disabled={!dirty.brand || pending}>
                    Save and publish
                  </Button>
                )}
              </>
            ) : (
              <Button size="sm" onClick={() => save()} disabled={!dirty[tab] || blocked || pending}>
                {pending && <LoaderCircle className="mr-1 size-3.5 animate-spin" aria-hidden />}
                Save changes
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Form pieces
// ---------------------------------------------------------------------------

function Group({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h4 className="text-sm font-semibold">{title}</h4>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({ id, label, hint, error, children, className }: { id: string; label: string; hint?: string; error?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id} className="text-xs font-medium">
        {label}
      </Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/** An image the storefront shows: a preview, Upload (to the store's media library) and a URL field. */
function ImageField({
  storeId,
  id,
  label,
  hint,
  value,
  onChange,
  shape = "square",
}: {
  storeId: string;
  id: string;
  label: string;
  hint: string;
  value: string;
  onChange: (url: string) => void;
  shape?: "square" | "wide";
}) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const paths = await createUploadPaths(storeId, { shared: false, types: [file.type] });
      if (!paths.success) throw new Error(paths.error === "invalidType" ? "Use a JPG, PNG, WebP or SVG image." : "The upload could not start.");
      const signed = await createSignedUpload(storeId, paths.data[0]!);
      if (!signed.success) throw new Error("The upload could not start.");
      const { error } = await createClient()
        .storage.from(MEDIA_BUCKET)
        .uploadToSignedUrl(signed.data.path, signed.data.token, file, { cacheControl: "31536000", contentType: file.type });
      if (error) throw new Error(error.message);
      const recorded = await recordUpload(storeId, { storagePath: signed.data.path, filename: file.name });
      if (!recorded.success) throw new Error(recorded.error === "tooLarge" ? "The image is too large." : "The image was not accepted.");
      onChange(recorded.data.url);
      toast.success(`${label} uploaded. Save to use it.`);
    } catch (error) {
      toast.error((error as Error).message || "Upload failed. Try again.");
    } finally {
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div className="flex gap-3">
      <div
        className={cn(
          "relative grid shrink-0 place-items-center overflow-hidden rounded-lg border bg-[repeating-conic-gradient(var(--muted)_0_25%,transparent_0_50%)] bg-[length:12px_12px]",
          shape === "wide" ? "h-16 w-28" : "size-16",
        )}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element -- any host the seller used; preview only
          <img src={value} alt="" className="size-full object-contain" />
        ) : (
          <ImagePlus className="size-5 text-muted-foreground" aria-hidden />
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <Label htmlFor={id} className="text-xs font-medium">
          {label}
        </Label>
        <div className="flex gap-1.5">
          <Input id={id} dir="ltr" value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://…" className="h-8 text-xs" />
          <input
            ref={input}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
            }}
          />
          <Button type="button" variant="outline" size="sm" className="h-8 shrink-0" onClick={() => input.current?.click()} disabled={uploading}>
            {uploading ? <LoaderCircle className="size-3.5 animate-spin" aria-hidden /> : "Upload"}
          </Button>
          {value && (
            <Button type="button" variant="ghost" size="icon" className="size-8 shrink-0" onClick={() => onChange("")} aria-label={`Remove ${label.toLowerCase()}`}>
              <Trash2 className="size-3.5" aria-hidden />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}

function DetailsForm({ storeId, value, onChange }: { storeId: string; value: DetailsValues; onChange: (v: DetailsValues) => void }) {
  const set = <K extends keyof DetailsValues>(key: K, next: DetailsValues[K]) => onChange({ ...value, [key]: next });
  const toggleLocale = (locale: "ar" | "en", on: boolean) => {
    const locales = on ? [...new Set([...value.supportedLocales, locale])] : value.supportedLocales.filter((l) => l !== locale);
    if (locales.length === 0) return;
    onChange({ ...value, supportedLocales: locales, defaultLocale: locales.includes(value.defaultLocale) ? value.defaultLocale : locales[0]! });
  };
  const currencies = [...REGIONAL_CURRENCY_CODES, ...STORE_CURRENCY_CODES.filter((c) => !REGIONAL_CURRENCY_CODES.includes(c))];

  return (
    <>
      <Group title="Identity">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="sd-name" label="Store name" error={value.name.trim() ? undefined : "The store needs a name."}>
            <Input id="sd-name" value={value.name} maxLength={80} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field id="sd-cat-ar" label="Category (Arabic)">
              <Input id="sd-cat-ar" dir="rtl" value={value.storeCategoryAr} maxLength={80} onChange={(e) => set("storeCategoryAr", e.target.value)} placeholder="ملابس" />
            </Field>
            <Field id="sd-cat-en" label="Category (English)">
              <Input id="sd-cat-en" value={value.storeCategory} maxLength={80} onChange={(e) => set("storeCategory", e.target.value)} placeholder="Fashion" />
            </Field>
          </div>
          <Field id="sd-desc" label="About the store" hint={`${value.description.length}/2000. Shown in the footer and on the marketplace.`} className="sm:col-span-2">
            <Textarea id="sd-desc" rows={3} maxLength={2000} value={value.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
        </div>
      </Group>

      <Group title="Logo and images" description="Upload adds the file to this store's media library.">
        <div className="grid gap-4 lg:grid-cols-2">
          <ImageField storeId={storeId} id="sd-logo" label="Logo" hint="Header and footer. Square or wide, transparent PNG or SVG works best." value={value.logoUrl} onChange={(v) => set("logoUrl", v)} />
          <ImageField storeId={storeId} id="sd-favicon" label="Browser icon" hint="The small icon in the browser tab. Square, at least 64 px." value={value.faviconUrl} onChange={(v) => set("faviconUrl", v)} />
          <ImageField storeId={storeId} id="sd-banner" label="Banner" hint="The store's cover on the marketplace." value={value.bannerUrl} onChange={(v) => set("bannerUrl", v)} shape="wide" />
        </div>
      </Group>

      <Group title="Contact" description="Shown on the website. Leave a field empty to hide it.">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="sd-phone" label="Phone">
            <Input id="sd-phone" dir="ltr" inputMode="tel" value={value.phone} onChange={(e) => set("phone", e.target.value)} placeholder="01xxxxxxxxx" />
          </Field>
          <Field id="sd-wa" label="WhatsApp">
            <Input id="sd-wa" dir="ltr" inputMode="tel" value={value.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="01xxxxxxxxx" />
          </Field>
          <Field id="sd-email" label="Email">
            <Input id="sd-email" dir="ltr" type="email" value={value.email} onChange={(e) => set("email", e.target.value)} placeholder="hello@store.com" />
          </Field>
        </div>
      </Group>

      <Group title="Language and currency">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <p className="text-xs font-medium">Languages</p>
            <div className="flex gap-4 pt-1.5">
              {(["ar", "en"] as const).map((locale) => (
                <label key={locale} className="flex items-center gap-2 text-sm">
                  <Switch checked={value.supportedLocales.includes(locale)} onCheckedChange={(on) => toggleLocale(locale, on)} />
                  {locale === "ar" ? "Arabic" : "English"}
                </label>
              ))}
            </div>
          </div>
          <Field id="sd-default-locale" label="Opens in">
            <Select value={value.defaultLocale} onValueChange={(v) => set("defaultLocale", v as "ar" | "en")}>
              <SelectTrigger id="sd-default-locale" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {value.supportedLocales.map((locale) => (
                  <SelectItem key={locale} value={locale}>
                    {locale === "ar" ? "Arabic" : "English"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field id="sd-currency" label="Currency">
              <Select
                value={value.currency}
                onValueChange={(v) => {
                  const currency = v as StoreCurrency;
                  onChange({ ...value, currency, currencyLabel: STORE_CURRENCIES[currency][0] as CurrencyLabel });
                }}
              >
                <SelectTrigger id="sd-currency" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((code) => (
                    <SelectItem key={code} value={code}>
                      {code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field id="sd-currency-label" label="Price label">
              <Select value={value.currencyLabel} onValueChange={(v) => set("currencyLabel", v as CurrencyLabel)}>
                <SelectTrigger id="sd-currency-label" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STORE_CURRENCIES[value.currency].map((label) => (
                    <SelectItem key={label} value={label}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">The currency changes only how prices are labelled. Amounts are not converted.</p>
      </Group>
    </>
  );
}

function BrandForm({ value, onChange }: { value: DesignValues; onChange: (v: DesignValues) => void }) {
  const preset = matchPreset(value.colors);
  const pairing = findFontPairing(value.typography);
  const setColor = (key: string, color: string) => {
    const colors = { ...value.colors } as Record<string, string>;
    if (!color) delete colors[key];
    else colors[key] = color;
    onChange({ ...value, colors });
  };
  const setSpacing = (key: "borderRadius" | "containerMaxWidth" | "sectionPaddingY", v: number | undefined) => {
    const spacing = { ...value.spacing } as Record<string, number>;
    if (v === undefined) delete spacing[key];
    else spacing[key] = v;
    onChange({ ...value, spacing });
  };

  return (
    <>
      <Group title="Palette" description="A starting point. Each colour can be changed below.">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PALETTE_PRESETS.map((p) => {
            const colors = [p.colors.primary ?? "#145163", p.colors.accent ?? "#fdad28", p.colors.secondary ?? "#f2f5f4"];
            const active = preset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={active}
                onClick={() => onChange({ ...value, colors: applyPreset(value.colors, p.id) })}
                className={cn(
                  "flex items-center gap-2 rounded-lg border p-2 text-start text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-foreground/30",
                )}
              >
                <span className="flex h-6 w-9 shrink-0 overflow-hidden rounded" aria-hidden>
                  {colors.map((c) => (
                    <span key={c} className="flex-1" style={{ background: c }} />
                  ))}
                </span>
                <span className="truncate">{PRESET_NAMES[p.id] ?? p.id}</span>
              </button>
            );
          })}
        </div>
      </Group>

      <Group title="Colours" description="Empty means the Tallaby Classic colour.">
        <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
          {COLOR_FIELDS.map(({ key, classic }) => {
            const raw = (value.colors as Record<string, string | undefined>)[key] ?? "";
            const valid = !raw || isHexColor(raw);
            const meta = COLOR_LABELS[key] ?? { label: key, hint: "" };
            return (
              <div key={key} className="flex items-center gap-3">
                <label className="relative size-9 shrink-0 cursor-pointer overflow-hidden rounded-md border shadow-inner" style={{ background: valid && raw ? raw : classic }}>
                  <span className="sr-only">Pick {meta.label}</span>
                  <input
                    type="color"
                    value={valid && raw && raw.length === 7 ? raw : classic}
                    onChange={(e) => setColor(key, e.target.value)}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                </label>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{meta.label}</span>
                    {raw && (
                      <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setColor(key, "")}>
                        Reset
                      </button>
                    )}
                  </div>
                  <Input
                    dir="ltr"
                    aria-label={`${meta.label} hex`}
                    value={raw}
                    placeholder={classic}
                    onChange={(e) => setColor(key, e.target.value.trim())}
                    className={cn("mt-1 h-7 font-mono text-xs", !valid && "border-destructive")}
                  />
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{valid ? meta.hint : "Use a hex colour such as #145163."}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Group>

      <Group title="Fonts" description="Heading and body fonts, chosen to read well in Arabic and English.">
        <div className="grid gap-2 sm:grid-cols-2">
          {FONT_PAIRINGS.map((p) => {
            const active = pairing.id === p.id;
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={active}
                onClick={() => onChange({ ...value, typography: applyPairing(value.typography, p) })}
                className={cn(
                  "rounded-lg border px-3 py-2 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-foreground/30",
                )}
              >
                <span className="block text-base font-semibold" style={{ fontFamily: storeFontFamily(p.heading) ?? undefined }}>
                  متجر أنيق Aa
                </span>
                <span className="block text-xs text-muted-foreground">
                  {p.heading === p.body ? p.heading : `${p.heading} with ${p.body}`}
                </span>
              </button>
            );
          })}
        </div>
      </Group>

      <Group title="Shape and spacing">
        <div className="grid gap-4 sm:grid-cols-3">
          <Choice
            label="Corners"
            options={RADIUS_OPTIONS.map((r) => ({ id: String(r), label: r === 0 ? "Square" : `${r}px` }))}
            value={value.spacing.borderRadius === undefined ? "" : String(value.spacing.borderRadius)}
            onChange={(id) => setSpacing("borderRadius", id === "" ? undefined : Number(id))}
            allowClear
          />
          <Choice
            label="Page width"
            options={WIDTH_OPTIONS.map((o) => ({ id: o.id, label: o.id === "narrow" ? "Narrow" : o.id === "wide" ? "Wide" : "Standard" }))}
            value={WIDTH_OPTIONS.find((o) => o.value === value.spacing.containerMaxWidth)?.id ?? "standard"}
            onChange={(id) => setSpacing("containerMaxWidth", WIDTH_OPTIONS.find((o) => o.id === id)?.value)}
          />
          <Choice
            label="Space between sections"
            options={SPACING_OPTIONS.map((o) => ({ id: o.id, label: o.id === "compact" ? "Compact" : o.id === "airy" ? "Airy" : "Standard" }))}
            value={SPACING_OPTIONS.find((o) => o.value === value.spacing.sectionPaddingY)?.id ?? "standard"}
            onChange={(id) => setSpacing("sectionPaddingY", SPACING_OPTIONS.find((o) => o.id === id)?.value)}
          />
        </div>
      </Group>
    </>
  );
}

function Choice({
  label,
  options,
  value,
  onChange,
  allowClear = false,
}: {
  label: string;
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
  allowClear?: boolean;
}) {
  return (
    <div className="space-y-1.5" role="group" aria-label={label}>
      <p className="text-xs font-medium">{label}</p>
      <div className="flex flex-wrap gap-1">
        {allowClear && (
          <Button type="button" size="sm" variant={value === "" ? "secondary" : "ghost"} aria-pressed={value === ""} className="h-7 px-2 text-xs" onClick={() => onChange("")}>
            Theme
          </Button>
        )}
        {options.map((o) => (
          <Button
            key={o.id}
            type="button"
            size="sm"
            variant={value === o.id ? "secondary" : "ghost"}
            aria-pressed={value === o.id}
            className="h-7 px-2 text-xs"
            onClick={() => onChange(o.id)}
          >
            {o.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

function SocialIcon({ platform, className, muted = false }: { platform: string; className?: string; muted?: boolean }) {
  const p = getSocialPlatform(platform);
  if (!p) return null;
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill={muted ? "currentColor" : p.color}>
      <path d={p.icon} />
    </svg>
  );
}

function SocialForm({ rows, errors, onChange }: { rows: SocialRow[]; errors: Record<string, boolean>; onChange: (rows: SocialRow[]) => void }) {
  const update = (index: number, patch: Partial<SocialRow>) => onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  const linked = rows.filter((row) => row.value.trim()).length;
  return (
    <Group
      title={`Accounts (${linked} linked)`}
      description="Paste a link or type the handle. Each link can only point at its own platform. Turn a link off to hide it without deleting it."
    >
      <ul className="divide-y rounded-lg border">
        {rows.map((row, index) => {
          const platform = SOCIAL_PLATFORMS.find((p) => p.key === row.platform);
          if (!platform) return null;
          const id = `social-${row.platform}`;
          const filled = row.value.trim() !== "";
          return (
            <li key={row.platform} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
              <label htmlFor={id} className="flex w-36 shrink-0 items-center gap-2 text-sm font-medium">
                <SocialIcon platform={row.platform} className={cn("size-5", !filled && "opacity-40 grayscale")} />
                {platform.label.en}
              </label>
              <div className="min-w-0 flex-1">
                <Input
                  id={id}
                  dir="ltr"
                  value={row.value}
                  placeholder={platform.placeholder}
                  aria-invalid={errors[row.platform] || undefined}
                  onChange={(e) => update(index, { value: e.target.value })}
                  className={cn("h-8 text-sm", errors[row.platform] && "border-destructive")}
                />
                {errors[row.platform] && <p className="mt-1 text-xs text-destructive">This isn&apos;t a {platform.label.en} link or handle.</p>}
              </div>
              <label className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                <Switch checked={row.enabled} disabled={!filled} onCheckedChange={(enabled) => update(index, { enabled })} aria-label={`Show ${platform.label.en} on the website`} />
                Shown
              </label>
            </li>
          );
        })}
      </ul>
    </Group>
  );
}

function SeoForm({ storeId, storeName, value, onChange }: { storeId: string; storeName: string; value: SeoValues; onChange: (v: SeoValues) => void }) {
  const set = <K extends keyof SeoValues>(key: K, next: SeoValues[K]) => onChange({ ...value, [key]: next });
  const templateBad = value.titleTemplate.trim() !== "" && value.titleTemplate.split("%s").length !== 2;
  const tokenBad = value.googleSiteVerification.trim() !== "" && !/^[A-Za-z0-9_-]{10,100}$/.test(value.googleSiteVerification.trim());
  return (
    <>
      <Group title="Search results">
        <Field
          id="seo-title"
          label="Page title pattern"
          error={templateBad ? "Put %s exactly once, where the page name goes." : undefined}
          hint={`%s is the page name. Empty uses “%s | ${storeName}”.`}
        >
          <Input id="seo-title" value={value.titleTemplate} maxLength={120} placeholder={`%s | ${storeName}`} onChange={(e) => set("titleTemplate", e.target.value)} />
        </Field>
        <Field id="seo-desc" label="Description" hint={`${value.description.length}/320. Around 150 characters shows in full on Google.`}>
          <Textarea id="seo-desc" rows={3} maxLength={320} value={value.description} onChange={(e) => set("description", e.target.value)} />
        </Field>
        <label className="flex items-start justify-between gap-4 rounded-lg border p-3">
          <span>
            <span className="block text-sm font-medium">Show in search engines</span>
            <span className="block text-xs text-muted-foreground">Off asks Google and others not to list the store, and removes its sitemap.</span>
          </span>
          <Switch checked={value.indexing} onCheckedChange={(on) => set("indexing", on)} />
        </label>
      </Group>

      <Group title="Sharing" description="The picture shown when someone shares the store on WhatsApp, Facebook or X.">
        <ImageField
          storeId={storeId}
          id="seo-image"
          label="Share image"
          hint="1200 × 630 px works everywhere."
          value={value.shareImageUrl}
          onChange={(v) => set("shareImageUrl", v)}
          shape="wide"
        />
      </Group>

      <Group title="Google Search Console">
        <Field
          id="seo-gsc"
          label="Verification code"
          error={tokenBad ? "Paste only the code from content=\"…\", 10–100 letters, digits, - or _." : undefined}
          hint="From the HTML tag method. Paste only the content value, not the whole tag."
        >
          <Input id="seo-gsc" dir="ltr" className="font-mono text-xs" value={value.googleSiteVerification} onChange={(e) => set("googleSiteVerification", e.target.value)} />
        </Field>
      </Group>
    </>
  );
}

// ---------------------------------------------------------------------------
// Previews
// ---------------------------------------------------------------------------

const classic = (key: string) => COLOR_FIELDS.find((f) => f.key === key)?.classic ?? "#000000";

/**
 * A small storefront drawn in the store's own colours and fonts: header,
 * a hero line, a product card and the footer with its social icons. The one
 * place on the page in the seller's brand, so a change is visible at once.
 */
function StorePreview({
  className,
  details,
  design,
  social,
  host,
  focus,
}: {
  className: string;
  details: DetailsValues;
  design: DesignValues;
  social: SocialRow[];
  host: string;
  focus: TabId;
}) {
  const c = (key: string) => {
    const v = (design.colors as Record<string, string | undefined>)[key];
    return v && isHexColor(v) ? v : classic(key);
  };
  const radius = design.spacing.borderRadius ?? 8;
  const heading = storeFontFamily(design.typography.headingFont) ?? storeFontFamily("Readex Pro") ?? undefined;
  const body = storeFontFamily(design.typography.bodyFont) ?? storeFontFamily("Readex Pro") ?? undefined;
  const rtl = details.defaultLocale === "ar";
  const links = social.filter((row) => row.enabled && row.value.trim() && normalizeSocialLink(row.platform, row.value));
  const name = details.name.trim() || "Store";
  const category = (rtl ? details.storeCategoryAr : details.storeCategory) || (rtl ? details.storeCategory : details.storeCategoryAr);
  const price = `${rtl ? "٤٥٠" : "450"} ${details.currencyLabel}`;
  const style = { fontFamily: body, background: c("background"), color: c("foreground") } satisfies CSSProperties;
  const ring = (on: boolean) => (on ? "outline outline-2 outline-offset-2 outline-amber-400/80" : "");

  return (
    <div className={cn("overflow-hidden rounded-xl border shadow-sm", className)} dir={rtl ? "rtl" : "ltr"} style={style}>
      <div className="flex items-center gap-1.5 border-b bg-muted px-3 py-1.5" dir="ltr">
        <span className="size-2 rounded-full bg-foreground/15" aria-hidden />
        <span className="size-2 rounded-full bg-foreground/15" aria-hidden />
        <span className="ms-2 flex min-w-0 flex-1 items-center gap-1.5 truncate rounded bg-background px-2 py-0.5 text-[11px] text-muted-foreground">
          {details.faviconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- preview only
            <img src={details.faviconUrl} alt="" className="size-3 shrink-0 rounded-sm object-contain" />
          ) : (
            <Globe className="size-3 shrink-0" aria-hidden />
          )}
          {host}
        </span>
      </div>

      <header className={cn("flex items-center justify-between gap-2 px-4 py-3", ring(focus === "details"))} style={{ borderBottom: `1px solid ${c("border")}` }}>
        <div className="flex min-w-0 items-center gap-2">
          {details.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- preview only
            <img src={details.logoUrl} alt="" className="h-7 max-w-20 shrink-0 object-contain" />
          ) : (
            <span className="grid size-7 shrink-0 place-items-center text-xs font-bold text-white" style={{ background: c("primary"), borderRadius: Math.min(radius, 14) }}>
              {name.charAt(0)}
            </span>
          )}
          <span className="truncate text-sm font-semibold" style={{ fontFamily: heading }}>
            {name}
          </span>
        </div>
        <span className="text-[11px]" style={{ color: c("muted") }}>
          {rtl ? "السلة (٢)" : "Cart (2)"}
        </span>
      </header>

      <div className={cn("space-y-3 px-4 py-5", ring(focus === "brand"))} style={{ background: c("secondary") }}>
        {category && (
          <span className="inline-block px-2 py-0.5 text-[10px] font-semibold text-white" style={{ background: c("accent"), borderRadius: radius }}>
            {category}
          </span>
        )}
        <p className="text-xl font-bold leading-tight" style={{ fontFamily: heading }}>
          {rtl ? "وصل حديثاً" : "New arrivals"}
        </p>
        <p className="line-clamp-2 text-xs" style={{ color: c("muted") }}>
          {details.description.trim() || (rtl ? "أفضل المنتجات المختارة لك، بتوصيل سريع لكل المحافظات." : "Hand-picked products, delivered fast across the country.")}
        </p>
        <div className="flex gap-2">
          <span className="px-3 py-1.5 text-xs font-semibold text-white" style={{ background: c("primary"), borderRadius: radius }}>
            {rtl ? "تسوق الآن" : "Shop now"}
          </span>
          <span className="px-3 py-1.5 text-xs font-semibold" style={{ border: `1px solid ${c("primary")}`, color: c("primary"), borderRadius: radius }}>
            {rtl ? "العروض" : "Offers"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 px-4 py-4">
        {[0, 1].map((i) => (
          <div key={i} className="overflow-hidden" style={{ border: `1px solid ${c("border")}`, borderRadius: radius }}>
            <div className="aspect-[4/3]" style={{ background: `linear-gradient(135deg, ${c("secondary")}, ${c("border")})` }} />
            <div className="space-y-0.5 p-2">
              <p className="truncate text-[11px] font-medium" style={{ fontFamily: heading }}>
                {rtl ? (i ? "حقيبة جلد" : "قميص قطن") : i ? "Leather bag" : "Cotton shirt"}
              </p>
              <p className="text-[11px] font-semibold" style={{ color: c("primary") }}>
                {price}
              </p>
            </div>
          </div>
        ))}
      </div>

      <footer className={cn("space-y-2 px-4 py-3 text-[11px]", ring(focus === "social"))} style={{ borderTop: `1px solid ${c("border")}`, color: c("muted") }}>
        {(details.phone || details.whatsapp || details.email) && (
          <p className="truncate" dir="ltr">
            {[details.phone, details.whatsapp && `WhatsApp ${details.whatsapp}`, details.email].filter(Boolean).join("   ")}
          </p>
        )}
        {links.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {links.map((row) => (
              <SocialIcon key={row.platform} platform={row.platform} className="size-4" muted />
            ))}
          </div>
        ) : (
          focus === "social" && <p>No social links shown yet.</p>
        )}
        <p>© {name}</p>
      </footer>
    </div>
  );
}

/** A Google result and a link-share card, built from the SEO values. */
function SeoPreview({ seo, storeName, host, description }: { seo: SeoValues; storeName: string; host: string; description: string }) {
  const template = seo.titleTemplate.trim() && seo.titleTemplate.split("%s").length === 2 ? seo.titleTemplate.trim() : `%s | ${storeName}`;
  const title = template.replace("%s", storeName);
  const text = seo.description.trim() || description.trim() || "Google writes its own snippet from the page when there is no description.";
  return (
    <div className="space-y-4">
      <div className={cn("rounded-xl border bg-background p-4", !seo.indexing && "opacity-60")}>
        <div className="mb-1 flex items-center gap-2">
          <span className="grid size-6 place-items-center rounded-full bg-muted">
            <Globe className="size-3.5 text-muted-foreground" aria-hidden />
          </span>
          <span className="min-w-0 text-xs leading-tight">
            <span className="block truncate">{storeName}</span>
            <span className="block truncate text-muted-foreground" dir="ltr">
              https://{host}
            </span>
          </span>
        </div>
        <p className="line-clamp-1 text-lg leading-snug text-[#1a0dab] dark:text-[#8ab4f8]">{title}</p>
        <p className="line-clamp-2 text-xs text-muted-foreground">{text}</p>
        {!seo.indexing && (
          <Badge variant="outline" className="mt-2 font-normal">
            Hidden from search engines
          </Badge>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border bg-background">
        <div className="aspect-[1200/630] bg-muted">
          {seo.shareImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- preview only
            <img src={seo.shareImageUrl} alt="" className="size-full object-cover" />
          ) : (
            <div className="grid size-full place-items-center px-6 text-center text-xs text-muted-foreground">No share image. Apps show the logo or nothing.</div>
          )}
        </div>
        <div className="space-y-0.5 border-t p-3">
          <p className="truncate text-[11px] uppercase text-muted-foreground" dir="ltr">
            {host}
          </p>
          <p className="truncate text-sm font-semibold">{title}</p>
          <p className="line-clamp-1 text-xs text-muted-foreground">{text}</p>
        </div>
      </div>
    </div>
  );
}
