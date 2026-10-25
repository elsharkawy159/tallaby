"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { STORE_FONTS, type DesignSystem, type SiteConfig } from "@workspace/store-sections";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Switch } from "@workspace/ui/components/switch";
import type { TemplateEditorChange, TemplateWorking } from "./template-adapter.lib";

const COLORS = [
  ["primary", "Brand (buttons, links)"],
  ["secondary", "Soft background"],
  ["background", "Page background"],
  ["foreground", "Text"],
  ["muted", "Muted text"],
  ["border", "Lines"],
  ["accent", "Highlight"],
] as const;

const HEX_RE = /^#[0-9a-f]{6}$/i;

/** The template's colours, fonts, corner radius and page width (`designSystem`). */
export function TemplateDesignPanel({ designSystem, onChange }: { designSystem: DesignSystem; onChange: (designSystem: DesignSystem) => void }) {
  const colors = designSystem.colors ?? {};
  const typography = designSystem.typography ?? {};
  const spacing = designSystem.spacing ?? {};
  const setColor = (key: string, value: string) => onChange({ ...designSystem, colors: { ...colors, [key]: value } });
  const select = "h-8 w-full rounded-md border bg-background px-2 text-sm";
  return (
    <div className="space-y-5">
      <section className="space-y-2">
        <h3 className="text-xs font-medium">Colours</h3>
        {COLORS.map(([key, label]) => {
          const value = (colors as Record<string, string | undefined>)[key] ?? "";
          return (
            <div key={key} className="flex items-center gap-2">
              <input
                type="color"
                aria-label={label}
                className="size-8 shrink-0 cursor-pointer rounded border"
                value={HEX_RE.test(value) ? value : "#000000"}
                onChange={(event) => setColor(key, event.target.value)}
              />
              <span className="min-w-0 flex-1 truncate text-xs">{label}</span>
              <Input
                dir="ltr"
                className="h-8 w-24 font-mono text-xs"
                defaultValue={value}
                key={value}
                onBlur={(event) => event.target.value !== value && setColor(key, event.target.value.trim())}
              />
            </div>
          );
        })}
      </section>
      <section className="space-y-2">
        <h3 className="text-xs font-medium">Fonts</h3>
        {(["headingFont", "bodyFont"] as const).map((key) => (
          <label key={key} className="block space-y-1 text-xs">
            {key === "headingFont" ? "Headings" : "Text"}
            <select
              className={select}
              value={typography[key] ?? STORE_FONTS[0].name}
              onChange={(event) => onChange({ ...designSystem, typography: { ...typography, [key]: event.target.value } })}
            >
              {STORE_FONTS.map((font) => (
                <option key={font.name} value={font.name}>
                  {font.name}
                </option>
              ))}
            </select>
          </label>
        ))}
      </section>
      <section className="grid grid-cols-2 gap-2">
        <label className="space-y-1 text-xs">
          Corner radius (px)
          <Input
            type="number"
            min={0}
            max={64}
            className="h-8"
            value={spacing.borderRadius ?? ""}
            onChange={(event) => {
              const n = Number(event.target.value);
              if (event.target.value !== "" && Number.isFinite(n)) onChange({ ...designSystem, spacing: { ...spacing, borderRadius: Math.max(0, Math.min(64, n)) } });
            }}
          />
        </label>
        <label className="space-y-1 text-xs">
          Page width (px)
          <Input
            type="number"
            min={320}
            max={2560}
            step={10}
            className="h-8"
            defaultValue={spacing.containerMaxWidth ?? ""}
            onBlur={(event) => {
              const n = Math.round(Number(event.target.value));
              if (event.target.value !== "" && n >= 320 && n <= 2560) onChange({ ...designSystem, spacing: { ...spacing, containerMaxWidth: n } });
            }}
          />
        </label>
      </section>
    </div>
  );
}

type PageChange = Extract<TemplateEditorChange, { kind: "pages" }>;

const pageIdOf = (working: TemplateWorking, slug: string) => Object.entries(working.pageIds).find(([, s]) => s === slug)?.[0];

/** The template's pages: names in both languages, link, menu, SEO; add and remove (never the home or product page). */
export function TemplatePagesPanel({ working, onChange }: { working: TemplateWorking; onChange: (change: PageChange) => void }) {
  const [adding, setAdding] = useState({ ar: "", en: "", slug: "" });
  const config: SiteConfig = working.config;
  return (
    <div className="space-y-3">
      {config.pages.map((page) => {
        const id = pageIdOf(working, page.slug);
        if (!id) return null;
        const names = working.pageNames[page.slug] ?? { ar: page.name, en: page.name };
        const fixed = page.isHome || page.kind === "product";
        return (
          <details key={id} className="rounded-md border p-2 text-xs">
            <summary className="cursor-pointer font-medium">
              {names.en || names.ar} <span className="font-mono text-muted-foreground">/{page.isHome ? "" : page.slug}</span>
            </summary>
            <div className="mt-2 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {(["ar", "en"] as const).map((locale) => (
                  <label key={locale} className="space-y-1">
                    Name ({locale})
                    <Input
                      dir={locale === "ar" ? "rtl" : "ltr"}
                      className="h-8"
                      maxLength={80}
                      defaultValue={names[locale]}
                      onBlur={(event) => event.target.value.trim() && event.target.value !== names[locale] && onChange({ kind: "pages", op: "update", pageId: id, name: { ...names, [locale]: event.target.value } })}
                    />
                  </label>
                ))}
              </div>
              {!fixed && (
                <label className="block space-y-1">
                  Link
                  <Input
                    dir="ltr"
                    className="h-8 font-mono"
                    maxLength={80}
                    defaultValue={page.slug}
                    onBlur={(event) => event.target.value !== page.slug && onChange({ kind: "pages", op: "update", pageId: id, slug: event.target.value.trim() })}
                  />
                </label>
              )}
              <label className="block space-y-1">
                SEO title
                <Input
                  className="h-8"
                  maxLength={120}
                  defaultValue={page.seo?.title ?? ""}
                  onBlur={(event) => event.target.value !== (page.seo?.title ?? "") && onChange({ kind: "pages", op: "update", pageId: id, seo: { ...page.seo, title: event.target.value.trim() || undefined } })}
                />
              </label>
              <label className="block space-y-1">
                SEO description
                <Input
                  className="h-8"
                  maxLength={320}
                  defaultValue={page.seo?.description ?? ""}
                  onBlur={(event) =>
                    event.target.value !== (page.seo?.description ?? "") && onChange({ kind: "pages", op: "update", pageId: id, seo: { ...page.seo, description: event.target.value.trim() || undefined } })
                  }
                />
              </label>
              {page.kind !== "product" && (
                <div className="flex items-center justify-between">
                  <Label htmlFor={`nav-${id}`}>In the menu</Label>
                  <Switch id={`nav-${id}`} checked={page.showInNav ?? true} onCheckedChange={(checked) => onChange({ kind: "pages", op: "update", pageId: id, showInNav: checked })} />
                </div>
              )}
              {!fixed && (
                <Button type="button" variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => window.confirm(`Remove the page “${names.en || names.ar}”?`) && onChange({ kind: "pages", op: "remove", pageId: id })}>
                  <Trash2 className="size-3" /> Remove page
                </Button>
              )}
            </div>
          </details>
        );
      })}
      <form
        className="space-y-2 rounded-md border border-dashed p-2 text-xs"
        onSubmit={(event) => {
          event.preventDefault();
          if (!adding.slug.trim() || !(adding.ar.trim() || adding.en.trim())) return;
          onChange({ kind: "pages", op: "create", name: { ar: adding.ar, en: adding.en }, slug: adding.slug.trim() });
          setAdding({ ar: "", en: "", slug: "" });
        }}
      >
        <p className="font-medium">New page</p>
        <div className="grid grid-cols-2 gap-2">
          <Input dir="rtl" className="h-8" placeholder="الاسم" maxLength={80} value={adding.ar} onChange={(e) => setAdding({ ...adding, ar: e.target.value })} />
          <Input className="h-8" placeholder="Name" maxLength={80} value={adding.en} onChange={(e) => setAdding({ ...adding, en: e.target.value })} />
        </div>
        <Input dir="ltr" className="h-8 font-mono" placeholder="link, e.g. our-story" maxLength={80} value={adding.slug} onChange={(e) => setAdding({ ...adding, slug: e.target.value.toLowerCase() })} />
        <Button type="submit" size="sm" className="h-7 text-xs">
          <Plus className="size-3" /> Add page
        </Button>
      </form>
    </div>
  );
}
