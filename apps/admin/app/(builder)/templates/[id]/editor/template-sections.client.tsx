"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowUp, History, LoaderCircle, Monitor, Palette, Plus, Rows3, Smartphone, Trash2, Replace, FileText } from "lucide-react";
import { toast } from "sonner";
import { ADMIN_DEFAULT_REASON } from "@workspace/lib/admin";
import type { TemplateForSections, TemplateLibraryEntry, TemplateLibraryRow } from "@workspace/lib/admin/server";
import type { SectionInstance, SiteConfig, SiteLocale } from "@workspace/store-sections";
import { resolveTemplateRefs, type LibraryTreeRow } from "@workspace/store-sections/library-ref";
import { templateDemoProduct } from "@workspace/store-sections/demo-product";
import { SitePreview, type PreviewCatalog, type PreviewDevice } from "@workspace/store-editor/preview/site-preview.client";
import type { StoreRevisionRow } from "@workspace/store-editor/editor.dto";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { cn } from "@workspace/ui/lib/utils";
import { createClient } from "@/supabase/client";
import { LIBRARY_MEDIA_BUCKET } from "@/lib/library-media.lib";
import { createLibrarySignedUpload, createLibraryUploadPath, recordLibraryUpload } from "@/lib/library-media.server";
import { applyEditorChange, templateWorking, type TemplateEditorChange, type TemplateWorking } from "./template-adapter.lib";
import { listTemplateVersionsAction, publishTemplateAction, restoreTemplateVersionAction, saveTemplateDraftAction, templateLibraryRowAction } from "./template-editor.server";
import { SectionPropsForm } from "./section-props-form.client";
import { applySectionChange, categoryFits, type SectionSlot, type TemplateFieldValues, type TemplateSectionChange } from "./template-sections.lib";
import { TemplateDesignPanel, TemplatePagesPanel } from "./template-settings.client";

type Selection = { slot: SectionSlot; sectionId: string } | null;
type Panel = "section" | "design" | "pages";
type SaveState = "saved" | "saving" | "pending" | "error" | "conflict";

const SAVE_DELAY = 800;
/** Store pages every template can link to, besides its own pages. */
const SYSTEM_LINKS = ["/products", "/cart", "/blog", "/wishlist", "/orders", "/shipping", "/returns"];

const localized = (value: unknown): { ar?: string; en?: string } =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as { ar?: string; en?: string }) : {};

const sameSlot = (a: SectionSlot, b: SectionSlot) => ("part" in a ? "part" in b && a.part === b.part : "page" in b && a.page === b.page);

/**
 * The template screen (owner, 2026-10-26): a template is its sections. The
 * left column lists the page's sections (with the header and footer), the
 * middle shows the page with the demo store, and the right column edits the
 * selected section's values for this template only, or the template's
 * colours and fonts, or its pages. A section's structure and styles are the
 * library section's (Admin › Sections), so a library edit reaches every
 * template that uses it. Every change is saved as the template draft;
 * Publish makes it the version new stores and the gallery use.
 */
export function TemplateSectionsScreen({
  template,
  library,
  fontClassName,
}: {
  template: TemplateForSections & { config: SiteConfig };
  library: TemplateLibraryEntry[];
  fontClassName: string;
}) {
  const name = localized(template.name);
  const title = name.en || name.ar || template.key;
  const [working, setWorking] = useState<TemplateWorking>(() => templateWorking(template.config, template.pageNames));
  const [rows, setRows] = useState<Record<string, TemplateLibraryRow>>(template.rows);
  const [pageSlug, setPageSlug] = useState(() => (template.config.pages.find((p) => p.isHome) ?? template.config.pages[0])?.slug ?? "");
  const [selection, setSelection] = useState<Selection>(null);
  const [panel, setPanel] = useState<Panel>("section");
  const [device, setDevice] = useState<PreviewDevice>("desktop");
  const [locale, setLocale] = useState<SiteLocale>("ar");
  const [adding, setAdding] = useState<{ index: number } | { part: "header" | "footer" } | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const saver = useDraftSaver(template.id, template.draftVersion);

  const config = working.config;
  const page = config.pages.find((p) => p.slug === pageSlug) ?? config.pages[0];
  const industry = template.category;
  const demo = template.meta.demo;

  const commit = (next: ReturnType<typeof applyEditorChange>) => {
    if (!next.ok) {
      toast.error(`That change was refused (${next.error.replace(/_/g, " ")}).`);
      return false;
    }
    setWorking(next.working);
    saver.schedule(next.working);
    return true;
  };
  const change = (c: TemplateSectionChange) => commit(applySectionChange(working, c));
  const editorChange = (c: TemplateEditorChange) => commit(applyEditorChange(working, c));

  // Preview: the page's sections, header and footer built from the library rows.
  const trees = useMemo(() => new Map<string, LibraryTreeRow>(Object.values(rows).map((row) => [row.key, { tree: row.tree, category: row.category }])), [rows]);
  const built = useMemo(() => {
    const one: SiteConfig = { ...config, pages: page ? [page] : [] };
    return resolveTemplateRefs(one, trees, { industry });
  }, [config, page, trees, industry]);
  const builtPage = built.config.pages[0];

  const sectionAt = (slot: SectionSlot, id: string): SectionInstance | null =>
    "part" in slot ? (config[slot.part]?.id === id ? config[slot.part] : null) : (config.pages.find((p) => p.slug === slot.page)?.content.sections.find((s) => s.id === id) ?? null);
  const selected = selection ? sectionAt(selection.slot, selection.sectionId) : null;
  const selectedRow = selected?.libraryRef ? rows[selected.libraryRef.key] : undefined;

  const ensureRow = async (key: string): Promise<boolean> => {
    if (rows[key]) return true;
    const result = await templateLibraryRowAction(key);
    if (!result.success) {
      toast.error("That library section could not be loaded.");
      return false;
    }
    setRows((current) => ({ ...current, [key]: result.data }));
    return true;
  };

  const addSection = async (entry: TemplateLibraryEntry) => {
    const target = adding;
    setAdding(null);
    if (!target || !(await ensureRow(entry.key))) return;
    if ("part" in target) {
      if (change({ kind: "chrome-set", part: target.part, key: entry.key, category: entry.category })) setSelection(null);
    } else if (page) {
      change({ kind: "section-add", page: page.slug, key: entry.key, category: entry.category, index: target.index });
    }
  };

  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    const path = await createLibraryUploadPath(file.type);
    if (!path.success) {
      toast.error("This image type cannot be uploaded.");
      return null;
    }
    const signed = await createLibrarySignedUpload(path.data);
    if (!signed.success) {
      toast.error("The upload could not start.");
      return null;
    }
    const { error } = await createClient()
      .storage.from(LIBRARY_MEDIA_BUCKET)
      .uploadToSignedUrl(signed.data.path, signed.data.token, file, { cacheControl: "31536000", contentType: file.type });
    if (error) {
      toast.error("The upload failed.");
      return null;
    }
    const recorded = await recordLibraryUpload({ storagePath: path.data, filename: file.name });
    if (!recorded.success) {
      toast.error(recorded.error === "tooLarge" ? "The image is larger than 5 MB." : "The image was refused.");
      return null;
    }
    return recorded.data.url;
  }, []);

  const links = useMemo(() => [...config.pages.filter((p) => p.kind !== "product").map((p) => (p.isHome ? "/" : `/${p.slug}`)), ...SYSTEM_LINKS], [config.pages]);

  const productPage = page?.kind === "product";
  const selectChrome = (next: Selection) => {
    setSelection(next);
    setPanel("section");
  };
  const pickerCategory = (entry: TemplateLibraryEntry) =>
    adding && ("part" in adding ? categoryFits(entry.category, { part: adding.part }) : categoryFits(entry.category, { productPage }));

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex flex-wrap items-center gap-2 border-b px-3 py-2">
        <Button asChild variant="ghost" size="icon" className="size-8">
          <Link href="/templates" aria-label="Back to templates">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold">{title}</h1>
          <p className="truncate text-xs text-muted-foreground">
            {template.key} · {template.version === null ? "never published" : `version ${template.version}`}
            {template.isDefault && " · default template"}
          </p>
        </div>
        <SaveIndicator state={saver.state} />
        <Button type="button" variant="outline" size="sm" onClick={() => setVersionsOpen(true)}>
          <History className="size-4" /> Versions
        </Button>
        <Button type="button" size="sm" disabled={saver.state === "conflict"} onClick={() => setPublishing(true)}>
          Publish
        </Button>
      </header>

      {saver.state === "conflict" && (
        <div className="flex items-center justify-between gap-2 border-b bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <span>Someone else saved this template. Reload to get their changes; your last change was not saved.</span>
          <Button type="button" size="sm" variant="outline" onClick={() => window.location.reload()}>
            Reload
          </Button>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        {/* Sections of the page */}
        <aside className="flex w-72 shrink-0 flex-col border-e">
          <div className="space-y-2 border-b p-3">
            <Label htmlFor="template-page" className="text-xs">
              Page
            </Label>
            <select
              id="template-page"
              className="h-8 w-full rounded-md border bg-background px-2 text-sm"
              value={page?.slug ?? ""}
              onChange={(event) => {
                setPageSlug(event.target.value);
                setSelection((s) => (s && "page" in s.slot ? null : s));
              }}
            >
              {config.pages.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {(working.pageNames[p.slug]?.en || p.name) + (p.isHome ? " (home)" : p.kind === "product" ? " (product page)" : "")}
                </option>
              ))}
            </select>
          </div>
          <ol className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
            <ChromeRow part="header" section={config.header} rows={rows} active={selection} onSelect={selectChrome} onReplace={() => setAdding({ part: "header" })} />
            {(page?.content.sections ?? []).map((section, index, all) => (
              <li key={section.id}>
                <SectionRow
                  section={section}
                  rows={rows}
                  missing={built.misses[section.id]}
                  active={selection?.sectionId === section.id && sameSlot(selection.slot, { page: page!.slug })}
                  onSelect={() => {
                    setSelection({ slot: { page: page!.slug }, sectionId: section.id });
                    setPanel("section");
                  }}
                  onUp={index > 0 ? () => change({ kind: "section-move", page: page!.slug, sectionId: section.id, index: index - 1 }) : undefined}
                  onDown={index < all.length - 1 ? () => change({ kind: "section-move", page: page!.slug, sectionId: section.id, index: index + 1 }) : undefined}
                  onRemove={() => {
                    if (!window.confirm("Remove this section from the page?")) return;
                    if (change({ kind: "section-remove", page: page!.slug, sectionId: section.id }) && selection?.sectionId === section.id) setSelection(null);
                  }}
                />
              </li>
            ))}
            <li>
              <Button type="button" variant="outline" size="sm" className="w-full border-dashed text-xs" onClick={() => setAdding({ index: page?.content.sections.length ?? 0 })}>
                <Plus className="size-3" /> Add section
              </Button>
            </li>
            <ChromeRow part="footer" section={config.footer} rows={rows} active={selection} onSelect={selectChrome} onReplace={() => setAdding({ part: "footer" })} />
          </ol>
          <div className="flex gap-1 border-t p-2">
            <Button type="button" variant={panel === "design" ? "secondary" : "ghost"} size="sm" className="flex-1 text-xs" onClick={() => setPanel("design")}>
              <Palette className="size-3" /> Colours & fonts
            </Button>
            <Button type="button" variant={panel === "pages" ? "secondary" : "ghost"} size="sm" className="flex-1 text-xs" onClick={() => setPanel("pages")}>
              <FileText className="size-3" /> Pages
            </Button>
          </div>
        </aside>

        {/* Preview */}
        <main className="flex min-w-0 flex-1 flex-col bg-muted/30">
          <div className="flex items-center justify-end gap-1 border-b bg-background px-3 py-1.5">
            {(["ar", "en"] as const).map((l) => (
              <Button key={l} type="button" variant={locale === l ? "secondary" : "ghost"} className="h-7 px-2 text-xs" onClick={() => setLocale(l)} aria-pressed={locale === l}>
                {l.toUpperCase()}
              </Button>
            ))}
            <Button type="button" variant={device === "desktop" ? "secondary" : "ghost"} size="icon" className="size-7" onClick={() => setDevice("desktop")} aria-label="Desktop" aria-pressed={device === "desktop"}>
              <Monitor className="size-3.5" />
            </Button>
            <Button type="button" variant={device === "mobile" ? "secondary" : "ghost"} size="icon" className="size-7" onClick={() => setDevice("mobile")} aria-label="Phone" aria-pressed={device === "mobile"}>
              <Smartphone className="size-3.5" />
            </Button>
          </div>
          <div className="min-h-0 flex-1 p-2">
            {builtPage && (
              <SitePreview
                key={`${builtPage.slug}:${locale}`}
                className="h-full"
                store={{ name: demo.store.name[locale] ?? demo.store.name.ar ?? title, description: demo.store.description[locale] ?? null, url: "https://example.tallaby.com" }}
                catalog={{ products: demo.products, categories: demo.categories } as PreviewCatalog}
                sections={builtPage.content.sections}
                header={built.config.header}
                footer={built.config.footer}
                designSystem={config.designSystem}
                locale={locale}
                defaultLocale={config.settings.defaultLocale}
                device={device}
                fontClassName={fontClassName}
                product={productPage ? templateDemoProduct(demo, { locale }) : undefined}
              />
            )}
          </div>
        </main>

        {/* Editing panel */}
        <aside className="w-96 shrink-0 overflow-y-auto border-s p-3">
          {panel === "design" && (
            <>
              <h2 className="mb-3 text-sm font-semibold">Colours & fonts</h2>
              <TemplateDesignPanel designSystem={config.designSystem} onChange={(designSystem) => editorChange({ kind: "design", designSystem })} />
            </>
          )}
          {panel === "pages" && (
            <>
              <h2 className="mb-3 text-sm font-semibold">Pages</h2>
              <TemplatePagesPanel working={working} onChange={(c) => editorChange(c)} />
            </>
          )}
          {panel === "section" && !selected && (
            <p className="text-sm text-muted-foreground">Pick a section on the left to edit its text, photos and links for this template.</p>
          )}
          {panel === "section" && selected && selection && (
            <>
              <h2 className="text-sm font-semibold">{sectionName(selected, rows)}</h2>
              {selected.libraryRef && selectedRow ? (
                <>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Values for this template only. To change the section’s layout or styles, edit the library section{" "}
                    <span className="font-mono">{selectedRow.key}</span> in Sections (it changes every template using it).
                  </p>
                  {selected.libraryRef.patch ? (
                    <p className="text-sm text-muted-foreground">This section is stored in the earlier format. Publish once to convert it, then edit it here.</p>
                  ) : (
                    <SectionPropsForm
                      key={selected.id}
                      row={selectedRow}
                      values={(selected.libraryRef.props ?? {}) as TemplateFieldValues}
                      industry={industry}
                      links={links}
                      missing={(built.misses[selected.id] ?? []).filter((m) => m.startsWith("field"))}
                      uploadImage={uploadImage}
                      onChange={(props) => change({ kind: "section-props", slot: selection.slot, sectionId: selected.id, props })}
                    />
                  )}
                </>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  A custom section, not linked to a library section (its tree was edited). It is shown as it is; you can move or remove it, or replace it with a library section.
                </p>
              )}
            </>
          )}
        </aside>
      </div>

      <LibraryPicker
        open={adding !== null}
        entries={library.filter((entry) => pickerCategory(entry))}
        onPick={addSection}
        onClose={() => setAdding(null)}
      />
      <PublishDialog
        open={publishing}
        onClose={() => setPublishing(false)}
        onPublish={async (changelog) => {
          const flushed = await saver.flush();
          if (!flushed) return toast.error("The draft could not be saved, so nothing was published.");
          const result = await publishTemplateAction(template.id, changelog || null, ADMIN_DEFAULT_REASON);
          if (!result.success) return toast.error(result.error === "nothingToPublish" ? "Nothing changed since the last version." : "Publishing failed.");
          saver.published();
          setPublishing(false);
          toast.success(`Published version ${result.data.revisionNumber}.`);
        }}
      />
      <VersionsDialog
        open={versionsOpen}
        templateId={template.id}
        onClose={() => setVersionsOpen(false)}
        onRestore={async (versionId) => {
          await saver.flush();
          const result = await restoreTemplateVersionAction(template.id, versionId, ADMIN_DEFAULT_REASON);
          if (!result.success) return toast.error("That version could not be restored.");
          window.location.reload();
        }}
      />
    </div>
  );
}

function sectionName(section: SectionInstance, rows: Record<string, TemplateLibraryRow>): string {
  const key = section.libraryRef?.key;
  const row = key ? rows[key] : undefined;
  return row ? row.name.en || row.name.ar : key ?? section.source?.replace(/@\d+$/, "") ?? section.id;
}

function SectionRow({
  section,
  rows,
  missing,
  active,
  onSelect,
  onUp,
  onDown,
  onRemove,
}: {
  section: SectionInstance;
  rows: Record<string, TemplateLibraryRow>;
  missing?: string[];
  active: boolean;
  onSelect: () => void;
  onUp?: () => void;
  onDown?: () => void;
  onRemove?: () => void;
}) {
  return (
    <div className={cn("group flex items-center gap-1 rounded-md border px-2 py-1.5 text-xs", active ? "border-primary bg-primary/5" : "hover:bg-muted")}>
      <button type="button" className="min-w-0 flex-1 text-start" onClick={onSelect}>
        <span className="block truncate font-medium">{sectionName(section, rows)}</span>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          {section.libraryRef ? (
            <span className="truncate font-mono">{section.libraryRef.key}</span>
          ) : (
            <Badge variant="outline" className="h-4 px-1 text-[9px]">
              custom
            </Badge>
          )}
          {missing?.length ? (
            <Badge variant="outline" className="h-4 border-amber-400 px-1 text-[9px] text-amber-700">
              check values
            </Badge>
          ) : null}
        </span>
      </button>
      {onUp !== undefined || onDown !== undefined ? (
        <>
          <Button type="button" variant="ghost" size="icon" className="size-6" disabled={!onUp} onClick={onUp} aria-label="Move up">
            <ArrowUp className="size-3" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="size-6" disabled={!onDown} onClick={onDown} aria-label="Move down">
            <ArrowDown className="size-3" />
          </Button>
        </>
      ) : null}
      {onRemove && (
        <Button type="button" variant="ghost" size="icon" className="size-6 text-destructive" onClick={onRemove} aria-label="Remove section">
          <Trash2 className="size-3" />
        </Button>
      )}
    </div>
  );
}

function ChromeRow({
  part,
  section,
  rows,
  active,
  onSelect,
  onReplace,
}: {
  part: "header" | "footer";
  section: SectionInstance | null;
  rows: Record<string, TemplateLibraryRow>;
  active: Selection;
  onSelect: (selection: Selection) => void;
  onReplace: () => void;
}) {
  return (
    <li className="space-y-0.5">
      <p className="px-1 text-[10px] uppercase tracking-wide text-muted-foreground">
        <Rows3 className="me-1 inline size-3" />
        {part}
      </p>
      {section ? (
        <div className="flex items-center gap-1">
          <div className="min-w-0 flex-1">
            <SectionRow
              section={section}
              rows={rows}
              active={!!active && "part" in active.slot && active.slot.part === part}
              onSelect={() => onSelect({ slot: { part }, sectionId: section.id })}
            />
          </div>
          <Button type="button" variant="ghost" size="icon" className="size-6" onClick={onReplace} aria-label={`Replace the ${part}`} title={`Replace the ${part}`}>
            <Replace className="size-3" />
          </Button>
        </div>
      ) : (
        <Button type="button" variant="outline" size="sm" className="w-full border-dashed text-xs" onClick={onReplace}>
          <Plus className="size-3" /> Add a {part}
        </Button>
      )}
    </li>
  );
}

function LibraryPicker({ open, entries, onPick, onClose }: { open: boolean; entries: TemplateLibraryEntry[]; onPick: (entry: TemplateLibraryEntry) => void; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shown = q ? entries.filter((e) => `${e.key} ${e.name.en} ${e.name.ar} ${e.category} ${e.subcategory}`.toLowerCase().includes(q)) : entries;
  const groups = new Map<string, TemplateLibraryEntry[]>();
  for (const entry of shown) groups.set(entry.category, [...(groups.get(entry.category) ?? []), entry]);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-h-[85dvh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add a library section</DialogTitle>
          <DialogDescription>It starts with the library section’s own copy and photos; fill this template’s values after adding it.</DialogDescription>
        </DialogHeader>
        <Input placeholder="Search sections" value={query} onChange={(e) => setQuery(e.target.value)} autoFocus />
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
          {[...groups].map(([category, list]) => (
            <section key={category}>
              <h3 className="mb-1 text-xs font-medium capitalize text-muted-foreground">{category.replace(/-/g, " ")}</h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {list.map((entry) => (
                  <button key={entry.key} type="button" className="rounded-md border p-2 text-start text-xs hover:border-primary hover:bg-primary/5" onClick={() => onPick(entry)}>
                    {entry.thumbnailUrl && (
                      // eslint-disable-next-line @next/next/no-img-element -- library thumbnails from the public bucket
                      <img src={entry.thumbnailUrl} alt="" className="mb-1 aspect-video w-full rounded object-cover" />
                    )}
                    <span className="block truncate font-medium">{entry.name.en || entry.name.ar}</span>
                    <span className="block truncate font-mono text-[10px] text-muted-foreground">
                      {entry.key}
                      {entry.hidden && " · hidden"}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ))}
          {shown.length === 0 && <p className="text-sm text-muted-foreground">No library section fits here.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PublishDialog({ open, onClose, onPublish }: { open: boolean; onClose: () => void; onPublish: (changelog: string) => Promise<unknown> }) {
  const [changelog, setChangelog] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Publish a new template version</DialogTitle>
          <DialogDescription>
            Stores created from now on start from this version, and the seller gallery shows it. Stores that already use the template keep their site. Publishing does not
            change whether the template is shown to sellers (its Active switch).
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            await onPublish(changelog.trim());
            setBusy(false);
            setChangelog("");
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="template-changelog">What changed (optional)</Label>
            <Textarea id="template-changelog" rows={3} maxLength={500} value={changelog} onChange={(e) => setChangelog(e.target.value)} placeholder="New hero copy" autoFocus />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={busy} onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy && <LoaderCircle className="size-4 animate-spin" />}
              Publish version
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function VersionsDialog({ open, templateId, onClose, onRestore }: { open: boolean; templateId: string; onClose: () => void; onRestore: (versionId: string) => Promise<unknown> }) {
  const [versions, setVersions] = useState<StoreRevisionRow[] | null>(null);
  useEffect(() => {
    if (!open) return;
    let live = true;
    void listTemplateVersionsAction(templateId).then((result) => live && setVersions(result.success ? result.data : []));
    return () => {
      live = false;
    };
  }, [open, templateId]);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Versions</DialogTitle>
          <DialogDescription>Restoring a version replaces the current draft with it; publish to make it live.</DialogDescription>
        </DialogHeader>
        {versions === null ? (
          <LoaderCircle className="mx-auto size-5 animate-spin" />
        ) : (
          <ul className="max-h-80 space-y-1 overflow-y-auto text-sm">
            {versions.map((v) => (
              <li key={v.id} className="flex items-center justify-between gap-2 rounded-md border px-2 py-1.5">
                <span>
                  Version {v.revisionNumber} <span className="text-xs text-muted-foreground">{new Date(v.createdAt).toLocaleString()}</span>
                  {v.isLive && <Badge className="ms-2">live</Badge>}
                </span>
                <Button type="button" size="sm" variant="outline" onClick={() => window.confirm(`Replace the draft with version ${v.revisionNumber}?`) && void onRestore(v.id)}>
                  Restore
                </Button>
              </li>
            ))}
            {versions.length === 0 && <li className="text-muted-foreground">No published version yet.</li>}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  const text: Record<SaveState, string> = { saved: "Draft saved", saving: "Saving…", pending: "Unsaved changes", error: "Not saved (retrying on the next change)", conflict: "Not saved" };
  return <span className={cn("text-xs", state === "error" || state === "conflict" ? "text-destructive" : "text-muted-foreground")}>{text[state]}</span>;
}

/**
 * Saves the working config as the template draft, debounced and one save at
 * a time (each needs the previous `draft_version`); a version conflict stops
 * saving until the page is reloaded.
 */
function useDraftSaver(templateId: string, initialVersion: number) {
  const [state, setState] = useState<SaveState>("saved");
  const version = useRef(initialVersion);
  const latest = useRef<TemplateWorking | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queue = useRef<Promise<boolean>>(Promise.resolve(true));
  const stopped = useRef(false);

  const save = useCallback((): Promise<boolean> => {
    const run = queue.current.then(async () => {
      const working = latest.current;
      if (!working || stopped.current) return !stopped.current;
      latest.current = null;
      setState("saving");
      const result = await saveTemplateDraftAction(templateId, working.config, version.current, working.pageNames);
      if (result.success) {
        version.current = result.data.draftVersion;
        setState(latest.current ? "pending" : "saved");
        return true;
      }
      if (result.error === "versionConflict") {
        stopped.current = true;
        setState("conflict");
      } else {
        latest.current ??= working;
        setState("error");
      }
      return false;
    });
    queue.current = run.catch(() => false);
    return run;
  }, [templateId]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (latest.current) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  return {
    state,
    schedule: (working: TemplateWorking) => {
      if (stopped.current) return;
      latest.current = working;
      setState("pending");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void save(), SAVE_DELAY);
    },
    /** Saves now; true when nothing is left unsaved. */
    flush: async () => {
      if (timer.current) clearTimeout(timer.current);
      const ok = await save();
      return ok && !latest.current && !stopped.current;
    },
    /** Publishing cleared the draft and bumped `draft_version` once. */
    published: () => {
      version.current += 1;
    },
  };
}
