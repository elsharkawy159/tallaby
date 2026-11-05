"use client";

import { useCallback, useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Check,
  ChevronLeft,
  Copy,
  Folder,
  FolderInput,
  FolderPlus,
  Globe,
  ImageUp,
  Images,
  LayoutGrid,
  List,
  LoaderCircle,
  Pencil,
  Search,
  SquareCheck,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { MEDIA_MAX_BYTES, isMediaMimeType, mediaAlt, type MediaScope } from "@workspace/lib/media";
import { useEditorAdapter } from "@workspace/store-editor";
import { folderTrail, formatBytes } from "@workspace/store-editor/media/media.lib";
import type { MediaAssetView, MediaErrorKey, MediaFolderView, MediaLibraryView } from "@workspace/store-editor/media/media.dto";
import { useMediaUpload } from "@workspace/store-editor/media/use-media-upload.client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@workspace/ui/components/sheet";
import { RemoteImage } from "@/components/media/remote-image";
import {
  CheckRow,
  Chip,
  Chips,
  DropZone,
  EmptyState,
  Field,
  IconButton,
  Modal,
  NativeSelect,
  Note,
  PageHeader,
  Segmented,
  SellerButton,
  Tag,
  TextInput,
} from "@/components/seller-ui";
import { cn } from "@/lib/utils";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/avif";
const MAX_FILES = 20;

/**
 * Website › Media (Claude Design "Seller Media" v3; PLAN.md P4-09): upload,
 * folders, shared vs this-store files, details and bulk actions. It runs on the
 * same adapter and upload hook as the shared `MediaLibrary` (the picker and the
 * website editor keep that one), so every call stays store-scoped on the server.
 */
export function MediaManager({ initial, readOnly, children }: { initial: MediaLibraryView; readOnly: boolean; children?: ReactNode }) {
  const media = useEditorAdapter().media;
  const t = useTranslations("mediaLibrary");
  const tw = useTranslations("sellerWebsite.media");
  const locale = useLocale();
  const [scope, setScope] = useState<MediaScope>("all");
  const [folderId, setFolderId] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [data, setData] = useState<MediaLibraryView>(initial);
  const [loading, startLoading] = useTransition();
  const [query, setQuery] = useState("");
  const [uploadShared, setUploadShared] = useState(false);
  const [details, setDetails] = useState<MediaAssetView | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [folderDialog, setFolderDialog] = useState<{ folder?: MediaFolderView } | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<MediaFolderView | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [moving, setMoving] = useState(false);
  const [bulkBusy, startBulk] = useTransition();

  const showError = useCallback((error: MediaErrorKey | "uploadFailed") => toast.error(t(`errors.${error}`)), [t]);

  const load = useCallback(
    (next: { folderId: string | null; scope: MediaScope }) =>
      startLoading(async () => {
        const result = await media.list(next);
        if (result.success) setData(result.data);
        else showError(result.error);
      }),
    [media, showError],
  );

  const folders = data.folders;
  const currentFolder = folderId ? (folders.find((f) => f.id === folderId) ?? null) : null;
  const trail = useMemo(() => folderTrail(folders, folderId), [folders, folderId]);
  const children_ = folders.filter(
    (f) => f.parentId === folderId && (scope === "all" || (scope === "shared" ? f.storeId === null : f.storeId !== null)),
  );
  // Inside a folder, files take the folder's scope.
  const targetShared = currentFolder ? currentFolder.storeId === null : uploadShared;

  const clearSelection = () => {
    setSelected(new Set());
    setSelecting(false);
  };

  const go = (next: { folderId?: string | null; scope?: MediaScope }) => {
    const target = { folderId: next.folderId !== undefined ? next.folderId : folderId, scope: next.scope ?? scope };
    setFolderId(target.folderId);
    setScope(target.scope);
    setSelected(new Set());
    load(target);
  };

  const onUploaded = useCallback(
    (asset: MediaAssetView) => {
      const fits = scope === "all" || (scope === "shared") === (asset.storeId === null);
      if (fits) setData((current) => ({ ...current, assets: [asset, ...current.assets] }));
    },
    [scope],
  );
  const { upload, items, isUploading, clearFinished } = useMediaUpload({ onUploaded });

  const onFiles = (files: File[]) => {
    const list = files.slice(0, MAX_FILES);
    const accepted = list.filter((file) => isMediaMimeType(file.type) && file.size <= MEDIA_MAX_BYTES);
    if (accepted.length < list.length) toast.error(t(list.some((file) => file.size > MEDIA_MAX_BYTES) ? "errors.tooLarge" : "errors.invalidType"));
    if (accepted.length) void upload(accepted, { shared: targetShared, folderId });
  };

  const needle = query.trim().toLowerCase();
  const assets = needle ? data.assets.filter((asset) => asset.filename.toLowerCase().includes(needle)) : data.assets;
  const selectedAssets = data.assets.filter((asset) => selected.has(asset.id));
  const selectMode = selecting || selected.size > 0;
  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const replaceAsset = (asset: MediaAssetView) => {
    // Moved to another folder: it leaves this listing.
    setData((current) => ({
      ...current,
      assets: current.assets.flatMap((a) => (a.id !== asset.id ? [a] : folderId === null || asset.folderId === folderId ? [asset] : [])),
    }));
    setDetails(asset);
  };
  const removeAsset = (id: string) => {
    setData((current) => ({ ...current, assets: current.assets.filter((a) => a.id !== id) }));
    setDetails(null);
  };

  const onRemoveFolder = async (folder: MediaFolderView) => {
    const result = await media.deleteFolder(folder.id);
    setDeletingFolder(null);
    if (!result.success) return showError(result.error);
    toast.success(t("folderDeleted"));
    go({ folderId: folder.parentId });
  };

  const copyLinks = async () => {
    try {
      await navigator.clipboard.writeText(selectedAssets.map((asset) => asset.url).join("\n"));
      toast.success(t("copied"));
    } catch {
      toast.error(t("errors.generic"));
    }
  };

  const bulkDelete = () =>
    startBulk(async () => {
      let failed: MediaErrorKey | null = null;
      for (const asset of selectedAssets) {
        const result = await media.remove(asset.id);
        if (result.success) setData((current) => ({ ...current, assets: current.assets.filter((a) => a.id !== asset.id) }));
        else failed = result.error;
      }
      setConfirmBulkDelete(false);
      if (failed) showError(failed);
      else toast.success(t("deleted"));
      clearSelection();
    });

  const bulkMove = (target: string | null) =>
    startBulk(async () => {
      let failed: MediaErrorKey | null = null;
      for (const asset of selectedAssets) {
        const result = await media.update(asset.id, { altText: asset.altText, folderId: target });
        if (!result.success) failed = result.error;
      }
      setMoving(false);
      if (failed) showError(failed);
      else toast.success(tw("moved"));
      clearSelection();
      load({ folderId, scope });
    });

  const usedCount = selectedAssets.reduce((sum, asset) => sum + (asset.usage > 0 ? 1 : 0), 0);
  // A file only goes into a folder of its own scope, so a move needs one scope.
  const selectedStores = new Set(selectedAssets.map((asset) => asset.storeId));
  const moveTargets = selectedStores.size === 1 ? folders.filter((f) => selectedStores.has(f.storeId)) : [];

  return (
    <>
      <PageHeader
        className="sui-rise"
        title={t("title")}
        description={t("description")}
        actions={
          !readOnly && (
            <SellerButton asChild>
              <label className="cursor-pointer has-focus-visible:outline-[3px] has-focus-visible:outline-offset-2 has-focus-visible:outline-(--s-focus)">
                {isUploading ? <LoaderCircle className="animate-spin" aria-hidden /> : <Upload aria-hidden />}
                {tw("upload")}
                <input
                  type="file"
                  accept={ACCEPT}
                  multiple
                  className="sr-only"
                  disabled={isUploading}
                  onChange={(e) => {
                    onFiles(Array.from(e.target.files ?? []));
                    e.target.value = "";
                  }}
                />
              </label>
            </SellerButton>
          )
        }
      />
      {children}
      {readOnly && <Note>{t("errors.readOnly")}</Note>}

      <div className="sui-rise flex flex-wrap items-center gap-2.5">
        <Segmented
          solid
          label={t("scope.label")}
          value={scope}
          onChange={(value) => go({ scope: value, folderId: null })}
          options={[
            { value: "all" as const, label: t("scope.all") },
            { value: "store" as const, label: t("scope.store") },
            { value: "shared" as const, label: t("scope.shared") },
          ]}
          className="max-[600px]:w-full"
        />
        <label className="flex h-[42px] min-w-[180px] max-w-[260px] flex-1 items-center gap-2 rounded-full border-[1.5px] border-(--s-field) bg-(--s-surface) px-3.5 text-(--s-subtle) focus-within:border-(--s-primary) max-[600px]:max-w-none max-[600px]:basis-full">
          <Search className="size-4 shrink-0" aria-hidden />
          <input
            type="search"
            className="min-w-0 flex-1 bg-transparent text-[13px] text-(--s-text) outline-none placeholder:text-(--s-placeholder)"
            placeholder={tw("search")}
            aria-label={tw("search")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        {loading && <LoaderCircle className="size-4 animate-spin text-(--s-subtle)" aria-label={t("loading")} />}
        <div className="ms-auto flex flex-wrap items-center gap-2 max-[600px]:ms-0 max-[600px]:w-full">
          {!readOnly && (
            <>
              <SellerButton variant="mini" size="sm" aria-pressed={selectMode} className="aria-pressed:border-(--s-primary)" onClick={() => (selectMode ? clearSelection() : setSelecting(true))}>
                <SquareCheck aria-hidden />
                {tw("select")}
              </SellerButton>
              <SellerButton variant="mini" size="sm" onClick={() => setFolderDialog({})}>
                <FolderPlus aria-hidden />
                {t("newFolder")}
              </SellerButton>
            </>
          )}
          <Segmented
            label={t("viewLabel")}
            className="max-[600px]:ms-auto"
            value={view}
            onChange={setView}
            options={[
              {
                value: "grid" as const,
                label: (
                  <span className="grid place-items-center">
                    <LayoutGrid className="size-[15px]" aria-hidden />
                    <span className="sr-only">{t("gridView")}</span>
                  </span>
                ),
              },
              {
                value: "list" as const,
                label: (
                  <span className="grid place-items-center">
                    <List className="size-[15px]" aria-hidden />
                    <span className="sr-only">{t("listView")}</span>
                  </span>
                ),
              },
            ]}
          />
        </div>
      </div>

      {/* Where we are in the folders, and the folders here. */}
      {(trail.length > 0 || children_.length > 0) && (
        <div className="flex flex-col gap-2">
          {trail.length > 0 && (
            <nav aria-label={t("breadcrumb")} className="flex flex-wrap items-center gap-1 text-[13px]">
              <button type="button" className="cursor-pointer rounded-lg px-1.5 py-1 font-semibold text-(--s-link) hover:bg-(--s-hover)" onClick={() => go({ folderId: null })}>
                {t("root")}
              </button>
              {trail.map((folder) => (
                <span key={folder.id} className="flex items-center gap-1">
                  <ChevronLeft className="size-3.5 text-(--s-faint) ltr:rotate-180" aria-hidden />
                  <button
                    type="button"
                    aria-current={folder.id === folderId ? "page" : undefined}
                    className="cursor-pointer rounded-lg px-1.5 py-1 font-semibold text-(--s-link) hover:bg-(--s-hover) aria-[current=page]:text-(--s-ink)"
                    onClick={() => go({ folderId: folder.id })}
                  >
                    {folder.name}
                  </button>
                </span>
              ))}
              {currentFolder && !readOnly && (
                <span className="ms-1 flex items-center gap-0.5">
                  <IconButton onClick={() => setFolderDialog({ folder: currentFolder })} aria-label={t("renameFolder")} title={t("renameFolder")} className="size-8">
                    <Pencil className="!size-3.5" aria-hidden />
                  </IconButton>
                  <IconButton onClick={() => setDeletingFolder(currentFolder)} aria-label={t("deleteFolder")} title={t("deleteFolder")} className="size-8">
                    <Trash2 className="!size-3.5" aria-hidden />
                  </IconButton>
                </span>
              )}
            </nav>
          )}
          {children_.length > 0 && (
            <Chips>
              {children_.map((folder) => (
                <Chip key={folder.id} onClick={() => go({ folderId: folder.id })}>
                  <Folder aria-hidden />
                  {folder.name}
                  {folder.storeId === null && <Globe aria-label={t("badge.shared")} className="text-(--s-subtle)" />}
                </Chip>
              ))}
            </Chips>
          )}
        </div>
      )}

      {!readOnly && (
        <DropZone
          className="sui-rise"
          icon={ImageUp}
          title={t("dropHere")}
          hint={
            <span className="flex flex-col items-center gap-1.5">
              <span className="text-pretty">{t("dropHint")}</span>
            </span>
          }
          accept={ACCEPT}
          multiple
          disabled={isUploading}
          onFiles={onFiles}
        />
      )}
      {!readOnly &&
        (currentFolder ? (
          <p className="-mt-2.5 text-xs text-(--s-faint)">{t(targetShared ? "uploadIntoShared" : "uploadIntoStore")}</p>
        ) : (
          <CheckRow className="-mt-2 text-[12.5px]" label={t("uploadShared")} checked={uploadShared} onChange={(e) => setUploadShared(e.target.checked)} />
        ))}

      {items.length > 0 && (
        <div className="flex flex-col gap-1.5 rounded-[18px] border border-(--s-line) bg-(--s-surface) p-3 text-[13px]">
          <div className="flex items-center justify-between">
            <b className="font-bold text-(--s-text)">{t("uploads")}</b>
            <SellerButton variant="mini" size="xs" onClick={clearFinished} disabled={items.every((i) => i.status === "uploading")}>
              {t("clear")}
            </SellerButton>
          </div>
          <ul className="flex max-h-40 flex-col gap-1 overflow-auto">
            {items.map((item) => (
              <li key={item.key} className="flex items-center gap-2">
                {item.status === "uploading" && <LoaderCircle className="size-3.5 shrink-0 animate-spin" aria-hidden />}
                {item.status === "done" && <Check className="size-3.5 shrink-0 text-success" aria-hidden />}
                {item.status === "failed" && <X className="size-3.5 shrink-0 text-destructive" aria-hidden />}
                <span className="min-w-0 flex-1 truncate" dir="auto">
                  {item.name}
                </span>
                {item.error && <span className="text-xs text-destructive">{t(`errors.${item.error}`)}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {assets.length === 0 && !loading ? (
        <div className="rounded-[20px] border border-(--s-line) bg-(--s-surface)">
          <EmptyState icon={Images} title={needle ? tw("noMatches") : t(folderId ? "emptyFolder" : "empty")} />
        </div>
      ) : view === "grid" ? (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-3 max-[480px]:grid-cols-2">
          {assets.map((asset) => (
            <li key={asset.id} className="group relative">
              <button
                type="button"
                aria-label={asset.filename}
                onClick={() => (selectMode ? toggle(asset.id) : setDetails(asset))}
                className={cn(
                  "flex w-full cursor-pointer flex-col overflow-hidden rounded-[18px] border border-(--s-line) bg-(--s-surface) text-start transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:shadow-(--s-shadow-hover) motion-reduce:hover:translate-y-0",
                  selected.has(asset.id) && "border-(--s-primary) shadow-[0_0_0_3px_var(--s-focus-soft)]",
                )}
              >
                <span className="relative block aspect-square w-full bg-(--s-fill)">
                  <RemoteImage src={asset.url} alt={mediaAlt(asset.altText, locale)} fill sizes="(min-width: 768px) 200px, 50vw" className="object-cover" />
                </span>
                <span className="block min-w-0 px-2.5 py-2">
                  <b dir="ltr" className="block truncate text-end font-montserrat text-xs font-semibold text-(--s-text) ltr:text-start">
                    {asset.filename}
                  </b>
                  <small className="block truncate text-[11px] text-(--s-faint)">{asset.usage > 0 ? t("usedIn", { count: asset.usage }) : t("unused")}</small>
                </span>
              </button>
              {asset.storeId === null && (
                <span title={t("badge.shared")} className="pointer-events-none absolute start-2 top-2 grid size-6 place-items-center rounded-lg bg-white/90 text-(--tallaby-teal-700)">
                  <Globe className="size-[13px]" aria-label={t("badge.shared")} />
                </span>
              )}
              {!readOnly && (
                <SelectBox
                  checked={selected.has(asset.id)}
                  label={tw("selectOne", { name: asset.filename })}
                  onToggle={() => toggle(asset.id)}
                  className={cn("absolute end-2 top-2", selectMode ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100")}
                />
              )}
            </li>
          ))}
        </ul>
      ) : (
        <ul className="flex flex-col overflow-hidden rounded-[18px] border border-(--s-line) bg-(--s-surface)">
          {assets.map((asset) => (
            <li key={asset.id} className="flex items-center gap-3 px-3 py-2 transition-colors duration-150 hover:bg-(--s-tint) [&+&]:border-t [&+&]:border-(--s-line-soft)">
              {!readOnly && <SelectBox checked={selected.has(asset.id)} label={tw("selectOne", { name: asset.filename })} onToggle={() => toggle(asset.id)} />}
              <button type="button" className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-start" onClick={() => (selectMode ? toggle(asset.id) : setDetails(asset))}>
                <RemoteImage src={asset.url} alt="" width={48} height={48} className="size-12 shrink-0 rounded-[10px] bg-(--s-fill) object-cover" />
                <span className="min-w-0 flex-1">
                  <b dir="auto" className="block truncate font-montserrat text-[13px] font-semibold text-(--s-text)">
                    {asset.filename}
                  </b>
                  <small className="block truncate text-[11.5px] text-(--s-subtle)">
                    <bdi dir="ltr">
                      {formatBytes(asset.bytes, locale)}
                      {asset.width && asset.height ? ` · ${asset.width}×${asset.height}` : ""}
                    </bdi>
                    {" · "}
                    {asset.usage > 0 ? t("usedIn", { count: asset.usage }) : t("unused")}
                  </small>
                </span>
                <Tag tone={asset.storeId === null ? "info" : "muted"} className="max-[600px]:hidden">
                  {t(asset.storeId === null ? "badge.shared" : "badge.store")}
                </Tag>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Bulk actions, floating like the save bar. */}
      <div
        inert={selected.size === 0}
        className={cn(
          "fixed bottom-5 left-1/2 z-[60] flex max-w-[calc(100vw-24px)] -translate-x-1/2 items-center gap-1 rounded-full bg-(--tallaby-teal-900) py-2 pe-2 ps-4 text-white shadow-(--s-shadow-bar) transition-transform duration-[350ms] ease-[cubic-bezier(.2,.7,.2,1)] dark:bg-[#1b4b5a]",
          selected.size === 0 && "translate-y-[calc(100%+40px)]",
        )}
      >
        <b className="me-1.5 whitespace-nowrap text-[13.5px] font-bold">{tw("selectedCount", { count: selected.size })}</b>
        <BulkButton icon={Copy} label={t("copyUrl")} onClick={() => void copyLinks()} disabled={bulkBusy} />
        <BulkButton icon={FolderInput} label={tw("move")} onClick={() => setMoving(true)} disabled={bulkBusy || moveTargets.length === 0} />
        <BulkButton icon={Trash2} label={t("delete")} danger onClick={() => setConfirmBulkDelete(true)} disabled={bulkBusy} />
        <button type="button" aria-label={tw("clearSelection")} onClick={clearSelection} className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full text-[#c6d8dc] hover:bg-white/10 hover:text-white max-[600px]:size-10">
          <X className="size-[15px]" aria-hidden />
        </button>
      </div>

      <AssetDrawer
        asset={details}
        folders={folders}
        readOnly={readOnly}
        onClose={() => setDetails(null)}
        onSaved={replaceAsset}
        onDeleted={removeAsset}
        showError={showError}
      />

      {folderDialog && (
        <FolderDialog
          folder={folderDialog.folder}
          parent={folderDialog.folder ? null : currentFolder}
          onClose={() => setFolderDialog(null)}
          onDone={() => {
            setFolderDialog(null);
            load({ folderId, scope });
          }}
          showError={showError}
        />
      )}

      {moving && (
        <MoveDialog pending={bulkBusy} folders={moveTargets} count={selected.size} onClose={() => setMoving(false)} onMove={bulkMove} />
      )}

      <AlertDialog open={confirmBulkDelete} onOpenChange={setConfirmBulkDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tw("deleteManyTitle", { count: selected.size })}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteConfirm")}
              {usedCount > 0 && <span className="mt-2 block font-semibold text-destructive">{tw("deleteManyUsed", { count: usedCount })}</span>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkBusy}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={bulkBusy}
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                bulkDelete();
              }}
            >
              {bulkBusy && <LoaderCircle className="animate-spin" aria-hidden />}
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deletingFolder !== null} onOpenChange={(open) => !open && setDeletingFolder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteFolder")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteFolderConfirm", { name: deletingFolder?.name ?? "" })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingFolder && onRemoveFolder(deletingFolder)}>{t("delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function BulkButton({ icon: Icon, label, danger, ...props }: React.ComponentProps<"button"> & { icon: typeof Copy; label: string; danger?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[13px] font-semibold hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 max-[600px]:size-10 max-[600px]:justify-center max-[600px]:px-0",
        danger ? "text-[#fca5a5]" : "text-[#c6d8dc] hover:text-white",
      )}
      {...props}
    >
      <Icon className="size-[15px]" aria-hidden />
      <span className="max-[600px]:hidden">{label}</span>
    </button>
  );
}

function SelectBox({ checked, label, onToggle, className }: { checked: boolean; label: string; onToggle: () => void; className?: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onToggle}
      className={cn(
        "grid size-7 shrink-0 cursor-pointer place-items-center rounded-lg border-[1.5px] transition-opacity duration-150 max-[600px]:size-9",
        checked ? "border-(--s-primary) bg-(--s-primary) text-(--s-solid-fg)" : "border-(--s-field-strong) bg-white/90 text-transparent",
        className,
      )}
    >
      <Check className="size-3.5" strokeWidth={3} aria-hidden />
    </button>
  );
}

/** Image details (`.drw`): a side drawer, full width on phones. */
function AssetDrawer({
  asset,
  folders,
  readOnly,
  onClose,
  onSaved,
  onDeleted,
  showError,
}: {
  asset: MediaAssetView | null;
  folders: MediaFolderView[];
  readOnly: boolean;
  onClose: () => void;
  onSaved: (asset: MediaAssetView) => void;
  onDeleted: (id: string) => void;
  showError: (error: MediaErrorKey) => void;
}) {
  const tw = useTranslations("sellerWebsite.media");
  const locale = useLocale();
  return (
    <Sheet open={asset !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side={locale === "en" ? "right" : "left"} className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[400px]">
        <div className="border-b border-(--s-line-soft) px-4 py-3.5 pe-12">
          <SheetTitle className="text-[15px] font-bold text-(--s-ink)">{tw("detailsTitle")}</SheetTitle>
          <SheetDescription className="sr-only">{asset?.filename}</SheetDescription>
        </div>
        {asset && <AssetDetails key={asset.id + asset.folderId} asset={asset} folders={folders} readOnly={readOnly} onSaved={onSaved} onDeleted={onDeleted} showError={showError} />}
      </SheetContent>
    </Sheet>
  );
}

function AssetDetails({
  asset,
  folders,
  readOnly,
  onSaved,
  onDeleted,
  showError,
}: {
  asset: MediaAssetView;
  folders: MediaFolderView[];
  readOnly: boolean;
  onSaved: (asset: MediaAssetView) => void;
  onDeleted: (id: string) => void;
  showError: (error: MediaErrorKey) => void;
}) {
  const media = useEditorAdapter().media;
  const t = useTranslations("mediaLibrary");
  const tw = useTranslations("sellerWebsite.media");
  const locale = useLocale();
  const [alt, setAlt] = useState({ ar: asset.altText.ar ?? "", en: asset.altText.en ?? "" });
  const [folder, setFolder] = useState(asset.folderId ?? "");
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  // Only folders of the file's own scope can hold it.
  const fitting = folders.filter((f) => f.storeId === asset.storeId);

  useEffect(() => {
    setAlt({ ar: asset.altText.ar ?? "", en: asset.altText.en ?? "" });
  }, [asset.altText.ar, asset.altText.en]);

  const save = () =>
    startTransition(async () => {
      const result = await media.update(asset.id, { altText: alt, folderId: folder || null });
      if (!result.success) return showError(result.error);
      toast.success(t("saved"));
      onSaved(result.data);
    });

  const remove = () =>
    startTransition(async () => {
      const result = await media.remove(asset.id);
      setConfirmDelete(false);
      if (!result.success) return showError(result.error);
      toast.success(t("deleted"));
      onDeleted(asset.id);
    });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(asset.url);
      toast.success(t("copied"));
    } catch {
      toast.error(t("errors.generic"));
    }
  };

  const facts: [string, ReactNode][] = [
    [t("columns.file"), <bdi key="f" dir="auto" className="break-all">{asset.filename}</bdi>],
    [
      t("columns.size"),
      <bdi key="s" dir="ltr">
        {formatBytes(asset.bytes, locale)}
        {asset.width && asset.height ? ` · ${asset.width}×${asset.height}` : ""}
      </bdi>,
    ],
    [t("columns.scope"), t(asset.storeId === null ? "badge.shared" : "badge.store")],
    [t("columns.usage"), asset.usage > 0 ? t("usedIn", { count: asset.usage }) : t("unused")],
  ];

  return (
    <>
      <fieldset disabled={readOnly || pending} className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-auto p-4">
        <div className="relative aspect-square shrink-0 overflow-hidden rounded-[18px] border border-(--s-line) bg-(--s-fill)">
          <RemoteImage src={asset.url} alt={mediaAlt(asset.altText, locale)} fill sizes="400px" className="object-contain" />
        </div>
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-[13px]">
          {facts.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-(--s-subtle)">{label}</dt>
              <dd className="text-end font-semibold text-(--s-text)">{value}</dd>
            </div>
          ))}
        </dl>
        <Field label={tw("imageLink")}>
          <div className="flex gap-1.5">
            <TextInput readOnly dir="ltr" value={asset.url} aria-label={tw("imageLink")} className="h-10 min-w-0 flex-1 font-mono text-xs" />
            <SellerButton variant="mini" size="sm" className="h-10" onClick={() => void copy()}>
              <Copy aria-hidden />
              {t("copyUrl")}
            </SellerButton>
          </div>
        </Field>
        <Field label={t("altAr")} htmlFor="media-alt-ar">
          <TextInput id="media-alt-ar" dir="rtl" maxLength={250} value={alt.ar} onChange={(e) => setAlt({ ...alt, ar: e.target.value })} />
        </Field>
        <Field label={t("altEn")} htmlFor="media-alt-en" note={t("altHint")}>
          <TextInput id="media-alt-en" dir="ltr" maxLength={250} value={alt.en} onChange={(e) => setAlt({ ...alt, en: e.target.value })} />
        </Field>
        <Field label={t("folder")} htmlFor="media-folder">
          <NativeSelect id="media-folder" value={folder} onChange={(e) => setFolder(e.target.value)}>
            <option value="">{t("root")}</option>
            {fitting.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </fieldset>
      {!readOnly && (
        <div className="flex gap-2 border-t border-(--s-line-soft) p-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
          <SellerButton variant="solid" size="sm" className="flex-1" onClick={save} disabled={pending}>
            {pending && <LoaderCircle className="animate-spin" aria-hidden />}
            {t("save")}
          </SellerButton>
          <SellerButton variant="outline" size="sm" className="text-destructive [&_svg]:text-destructive" onClick={() => setConfirmDelete(true)} disabled={pending}>
            <Trash2 aria-hidden />
            {t("delete")}
          </SellerButton>
        </div>
      )}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteConfirm")}
              {asset.usage > 0 && <span className="mt-2 block font-semibold text-destructive">{t("deleteUsedWarning", { count: asset.usage })}</span>}
              {asset.storeId === null && <span className="mt-2 block">{t("deleteSharedWarning")}</span>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-destructive text-white hover:bg-destructive/90">
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function MoveDialog({
  folders,
  count,
  pending,
  onClose,
  onMove,
}: {
  folders: MediaFolderView[];
  count: number;
  pending: boolean;
  onClose: () => void;
  onMove: (folderId: string | null) => void;
}) {
  const t = useTranslations("mediaLibrary");
  const tw = useTranslations("sellerWebsite.media");
  const [target, setTarget] = useState("");
  return (
    <Modal
      open
      onOpenChange={(open) => !open && !pending && onClose()}
      title={tw("moveTitle", { count })}
      footer={
        <>
          <SellerButton variant="outline" onClick={onClose} disabled={pending}>
            {t("cancel")}
          </SellerButton>
          <SellerButton variant="solid" onClick={() => onMove(target || null)} disabled={pending}>
            {pending && <LoaderCircle className="animate-spin" aria-hidden />}
            {tw("move")}
          </SellerButton>
        </>
      }
    >
      <Field label={t("folder")} htmlFor="media-move-folder">
        <NativeSelect id="media-move-folder" value={target} onChange={(e) => setTarget(e.target.value)}>
          <option value="">{t("root")}</option>
          {folders.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </NativeSelect>
      </Field>
    </Modal>
  );
}

function FolderDialog({
  folder,
  parent,
  onClose,
  onDone,
  showError,
}: {
  /** Set when renaming. */
  folder?: MediaFolderView;
  /** New folders inside a folder take its scope. */
  parent: MediaFolderView | null;
  onClose: () => void;
  onDone: () => void;
  showError: (error: MediaErrorKey) => void;
}) {
  const media = useEditorAdapter().media;
  const t = useTranslations("mediaLibrary");
  const [name, setName] = useState(folder?.name ?? "");
  const [shared, setShared] = useState(parent ? parent.storeId === null : false);
  const [pending, startTransition] = useTransition();

  const submit = () =>
    startTransition(async () => {
      const result = folder ? await media.renameFolder(folder.id, name) : await media.createFolder({ name, shared, parentId: parent?.id ?? null });
      if (!result.success) return showError(result.error);
      onDone();
    });

  return (
    <Modal open onOpenChange={(open) => !open && onClose()} title={folder ? t("renameFolder") : t("newFolder")}>
      <form
        className="flex flex-col gap-3.5"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) submit();
        }}
      >
        <Field label={t("folderName")} htmlFor="media-folder-name">
          <TextInput id="media-folder-name" value={name} maxLength={120} autoFocus onChange={(e) => setName(e.target.value)} />
        </Field>
        {!folder && (
          <CheckRow
            label={t("folderShared")}
            description={t(parent ? "folderInherits" : "folderSharedHint")}
            checked={shared}
            disabled={parent !== null}
            onChange={(e) => setShared(e.target.checked)}
          />
        )}
        <div className="flex gap-2 [&>*]:flex-1">
          <SellerButton variant="outline" onClick={onClose}>
            {t("cancel")}
          </SellerButton>
          <SellerButton type="submit" variant="solid" disabled={pending || !name.trim()}>
            {pending && <LoaderCircle className="animate-spin" aria-hidden />}
            {folder ? t("save") : t("create")}
          </SellerButton>
        </div>
      </form>
    </Modal>
  );
}
