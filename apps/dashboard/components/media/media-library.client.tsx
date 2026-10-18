"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import {
  Check,
  ChevronLeft,
  Copy,
  Folder,
  FolderPlus,
  Globe,
  ImageUp,
  LayoutGrid,
  List,
  LoaderCircle,
  Pencil,
  Store,
  Trash2,
  X,
} from "lucide-react";
import { MEDIA_ACCEPT, MEDIA_MAX_BYTES, mediaAlt, type MediaScope } from "@workspace/lib/media";
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
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { SegmentedControl, SegmentedControlItem } from "@workspace/ui/components/segmented-control";
import { cn } from "@/lib/utils";
import { createFolder, deleteFolder, deleteMedia, listMedia, renameFolder, updateMedia } from "./media.server";
import { folderTrail, formatBytes } from "./media.lib";
import { useMediaUpload } from "./use-media-upload.client";
import type { MediaAssetView, MediaErrorKey, MediaFolderView, MediaLibraryView } from "./media.dto";

const SELECT_CLASS =
  "h-9 w-full rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/**
 * The media library of one store (PLAN.md P4-09): folders, drag-and-drop
 * upload of several images, grid/list views, AR/EN alt text, usage hints,
 * shared vs this-store files, delete. `mode="pick"` turns a click into a
 * selection for the editor's image fields (MediaPicker).
 */
export function MediaLibrary({
  storeId,
  initial,
  readOnly = false,
  mode = "manage",
  onPick,
}: {
  storeId: string;
  initial?: MediaLibraryView;
  readOnly?: boolean;
  mode?: "manage" | "pick";
  onPick?: (asset: MediaAssetView) => void;
}) {
  const t = useTranslations("mediaLibrary");
  const locale = useLocale();
  const [scope, setScope] = useState<MediaScope>("all");
  const [folderId, setFolderId] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [data, setData] = useState<MediaLibraryView | null>(initial ?? null);
  const [loading, startLoading] = useTransition();
  const [uploadShared, setUploadShared] = useState(false);
  const [details, setDetails] = useState<MediaAssetView | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [folderDialog, setFolderDialog] = useState<{ folder?: MediaFolderView } | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<MediaFolderView | null>(null);

  const showError = useCallback((error: MediaErrorKey | "uploadFailed") => toast.error(t(`errors.${error}`)), [t]);

  const load = useCallback(
    (next: { folderId: string | null; scope: MediaScope }) =>
      startLoading(async () => {
        const result = await listMedia(storeId, next);
        if (result.success) setData(result.data);
        else showError(result.error);
      }),
    [storeId, showError],
  );

  // The page passes the root listing; the picker loads on mount.
  useEffect(() => {
    if (!initial) load({ folderId: null, scope: "all" });
  }, [initial, load]);

  const folders = data?.folders ?? [];
  const currentFolder = folderId ? folders.find((f) => f.id === folderId) ?? null : null;
  const trail = useMemo(() => folderTrail(folders, folderId), [folders, folderId]);
  const children = folders.filter(
    (f) => f.parentId === folderId && (scope === "all" || (scope === "shared" ? f.storeId === null : f.storeId !== null)),
  );
  // Inside a folder, files take the folder's scope.
  const targetShared = currentFolder ? currentFolder.storeId === null : uploadShared;

  const go = (next: { folderId?: string | null; scope?: MediaScope }) => {
    const target = { folderId: next.folderId !== undefined ? next.folderId : folderId, scope: next.scope ?? scope };
    setFolderId(target.folderId);
    setScope(target.scope);
    load(target);
  };

  const onUploaded = useCallback(
    (asset: MediaAssetView) => {
      const fits = scope === "all" || (scope === "shared") === (asset.storeId === null);
      if (fits) setData((current) => (current ? { ...current, assets: [asset, ...current.assets] } : current));
      if (mode === "pick") setPicked(asset.id);
    },
    [scope, mode],
  );
  const { upload, items, isUploading, clearFinished } = useMediaUpload({ storeId, onUploaded });

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: MEDIA_ACCEPT,
    multiple: true,
    maxFiles: 20,
    noClick: true,
    disabled: readOnly,
    onDrop: (accepted, rejected) => {
      if (rejected.length) {
        toast.error(t(rejected.some((r) => r.file.size > MEDIA_MAX_BYTES) ? "errors.tooLarge" : "errors.invalidType"));
      }
      void upload(accepted, { shared: targetShared, folderId });
    },
  });

  const replaceAsset = (asset: MediaAssetView) => {
    setData((current) =>
      current
        ? {
            ...current,
            // Moved to another folder: it leaves this listing.
            assets: current.assets.flatMap((a) => (a.id !== asset.id ? [a] : folderId === null || asset.folderId === folderId ? [asset] : [])),
          }
        : current,
    );
    setDetails(asset);
  };
  const removeAsset = (id: string) => {
    setData((current) => (current ? { ...current, assets: current.assets.filter((a) => a.id !== id) } : current));
    setDetails(null);
  };

  const onRemoveFolder = async (folder: MediaFolderView) => {
    const result = await deleteFolder(storeId, folder.id);
    setDeletingFolder(null);
    if (!result.success) return showError(result.error);
    toast.success(t("folderDeleted"));
    go({ folderId: folder.parentId });
  };

  const assets = data?.assets ?? [];
  const pickedAsset = assets.find((a) => a.id === picked) ?? null;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl value={scope} onValueChange={(value) => go({ scope: value as MediaScope, folderId: null })} aria-label={t("scope.label")}>
          <SegmentedControlItem value="all">{t("scope.all")}</SegmentedControlItem>
          <SegmentedControlItem value="store">{t("scope.store")}</SegmentedControlItem>
          <SegmentedControlItem value="shared">{t("scope.shared")}</SegmentedControlItem>
        </SegmentedControl>
        <div className="ms-auto flex items-center gap-2">
          {!readOnly && (
            <Button type="button" size="sm" variant="outline" onClick={() => setFolderDialog({})}>
              <FolderPlus aria-hidden />
              {t("newFolder")}
            </Button>
          )}
          <SegmentedControl value={view} onValueChange={(value) => setView(value as "grid" | "list")} aria-label={t("viewLabel")}>
            <SegmentedControlItem value="grid" aria-label={t("gridView")}>
              <LayoutGrid className="size-4" />
            </SegmentedControlItem>
            <SegmentedControlItem value="list" aria-label={t("listView")}>
              <List className="size-4" />
            </SegmentedControlItem>
          </SegmentedControl>
        </div>
      </div>

      {/* Breadcrumb */}
      <nav aria-label={t("breadcrumb")} className="flex flex-wrap items-center gap-1 text-sm">
        <button type="button" className={cn("rounded px-1.5 py-0.5 hover:bg-muted", !folderId && "font-semibold")} onClick={() => go({ folderId: null })}>
          {t("root")}
        </button>
        {trail.map((folder) => (
          <span key={folder.id} className="flex items-center gap-1">
            <ChevronLeft className="size-3.5 text-muted-foreground ltr:rotate-180" aria-hidden />
            <button type="button" className={cn("rounded px-1.5 py-0.5 hover:bg-muted", folder.id === folderId && "font-semibold")} onClick={() => go({ folderId: folder.id })}>
              {folder.name}
            </button>
          </span>
        ))}
        {currentFolder && !readOnly && (
          <span className="ms-2 flex items-center gap-1">
            <Button type="button" size="icon" variant="ghost" className="size-7" onClick={() => setFolderDialog({ folder: currentFolder })} aria-label={t("renameFolder")}>
              <Pencil className="size-3.5" />
            </Button>
            <Button type="button" size="icon" variant="ghost" className="size-7" onClick={() => setDeletingFolder(currentFolder)} aria-label={t("deleteFolder")}>
              <Trash2 className="size-3.5" />
            </Button>
          </span>
        )}
        {loading && <LoaderCircle className="ms-2 size-4 animate-spin text-muted-foreground" aria-label={t("loading")} />}
      </nav>

      {/* Upload */}
      {!readOnly && (
        <div
          {...getRootProps()}
          className={cn(
            "flex flex-col items-center gap-2 rounded-xl border-2 border-dashed p-5 text-center transition-colors",
            isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
          )}
        >
          <input {...getInputProps()} aria-label={t("browse")} />
          <ImageUp className="size-7 text-muted-foreground" aria-hidden />
          <p className="text-sm font-medium">{isDragActive ? t("dropNow") : t("dropHere")}</p>
          <p className="text-xs text-muted-foreground">{t("dropHint")}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button type="button" size="sm" onClick={open} disabled={isUploading}>
              {isUploading ? <LoaderCircle className="animate-spin" aria-hidden /> : <ImageUp aria-hidden />}
              {t("browse")}
            </Button>
            {currentFolder ? (
              <span className="text-xs text-muted-foreground">{t(targetShared ? "uploadIntoShared" : "uploadIntoStore")}</span>
            ) : (
              <label className="flex items-center gap-2 text-xs">
                <Checkbox checked={uploadShared} onCheckedChange={(checked) => setUploadShared(checked === true)} />
                {t("uploadShared")}
              </label>
            )}
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div className="space-y-1 rounded-lg border p-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-medium">{t("uploads")}</span>
            <Button type="button" size="sm" variant="ghost" onClick={clearFinished} disabled={items.every((i) => i.status === "uploading")}>
              {t("clear")}
            </Button>
          </div>
          <ul className="max-h-40 space-y-1 overflow-auto">
            {items.map((item) => (
              <li key={item.key} className="flex items-center gap-2">
                {item.status === "uploading" && <LoaderCircle className="size-3.5 animate-spin" aria-hidden />}
                {item.status === "done" && <Check className="size-3.5 text-emerald-600" aria-hidden />}
                {item.status === "failed" && <X className="size-3.5 text-destructive" aria-hidden />}
                <span className="min-w-0 flex-1 truncate" dir="auto">
                  {item.name}
                </span>
                {item.error && <span className="text-xs text-destructive">{t(`errors.${item.error}`)}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Folders */}
      {children.length > 0 && (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {children.map((folder) => (
            <li key={folder.id}>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-start text-sm hover:bg-muted"
                onClick={() => go({ folderId: folder.id })}
              >
                <Folder className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="min-w-0 flex-1 truncate">{folder.name}</span>
                <ScopeIcon shared={folder.storeId === null} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Files */}
      {data && assets.length === 0 && !loading && (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{t(folderId ? "emptyFolder" : "empty")}</p>
      )}
      {view === "grid" ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {assets.map((asset) => (
            <li key={asset.id}>
              <button
                type="button"
                onClick={() => (mode === "pick" ? setPicked(asset.id) : setDetails(asset))}
                onDoubleClick={() => mode === "pick" && onPick?.(asset)}
                className={cn(
                  "group w-full overflow-hidden rounded-lg border text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  picked === asset.id && "ring-2 ring-primary",
                )}
              >
                <div className="relative aspect-square bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element -- public store-media object */}
                  <img src={asset.url} alt={mediaAlt(asset.altText, locale)} loading="lazy" className="size-full object-cover" />
                  <span className="absolute end-1.5 top-1.5 rounded-full bg-background/90 p-1">
                    <ScopeIcon shared={asset.storeId === null} />
                  </span>
                </div>
                <div className="space-y-0.5 p-2">
                  <p className="truncate text-xs font-medium" dir="auto">
                    {asset.filename}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {asset.usage > 0 ? t("usedIn", { count: asset.usage }) : t("unused")}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        assets.length > 0 && (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="p-2 text-start font-medium">{t("columns.file")}</th>
                  <th className="p-2 text-start font-medium">{t("columns.size")}</th>
                  <th className="p-2 text-start font-medium">{t("columns.scope")}</th>
                  <th className="p-2 text-start font-medium">{t("columns.usage")}</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => (
                  <tr
                    key={asset.id}
                    className={cn("cursor-pointer border-t hover:bg-muted/40", picked === asset.id && "bg-primary/5")}
                    onClick={() => (mode === "pick" ? setPicked(asset.id) : setDetails(asset))}
                    onDoubleClick={() => mode === "pick" && onPick?.(asset)}
                  >
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element -- public store-media object */}
                        <img src={asset.url} alt="" loading="lazy" className="size-10 rounded object-cover" />
                        <span className="min-w-0 truncate" dir="auto">
                          {asset.filename}
                        </span>
                      </div>
                    </td>
                    <td className="p-2 whitespace-nowrap" dir="ltr">
                      {formatBytes(asset.bytes, locale)}
                      {asset.width && asset.height ? ` · ${asset.width}×${asset.height}` : ""}
                    </td>
                    <td className="p-2">
                      <Badge variant="secondary">{t(asset.storeId === null ? "badge.shared" : "badge.store")}</Badge>
                    </td>
                    <td className="p-2 text-muted-foreground">{asset.usage > 0 ? t("usedIn", { count: asset.usage }) : t("unused")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {mode === "pick" && (
        <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t bg-background pt-3">
          <Button type="button" disabled={!pickedAsset} onClick={() => pickedAsset && onPick?.(pickedAsset)}>
            {t("pick")}
          </Button>
        </div>
      )}

      {details && (
        <AssetDetails
          storeId={storeId}
          asset={details}
          folders={folders}
          readOnly={readOnly}
          onClose={() => setDetails(null)}
          onSaved={replaceAsset}
          onDeleted={removeAsset}
          showError={showError}
        />
      )}

      {folderDialog && (
        <FolderDialog
          storeId={storeId}
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
    </div>
  );
}

function ScopeIcon({ shared }: { shared: boolean }) {
  const t = useTranslations("mediaLibrary");
  return shared ? (
    <Globe className="size-3.5 text-muted-foreground" aria-label={t("badge.shared")} />
  ) : (
    <Store className="size-3.5 text-muted-foreground" aria-label={t("badge.store")} />
  );
}

function AssetDetails({
  storeId,
  asset,
  folders,
  readOnly,
  onClose,
  onSaved,
  onDeleted,
  showError,
}: {
  storeId: string;
  asset: MediaAssetView;
  folders: MediaFolderView[];
  readOnly: boolean;
  onClose: () => void;
  onSaved: (asset: MediaAssetView) => void;
  onDeleted: (id: string) => void;
  showError: (error: MediaErrorKey) => void;
}) {
  const t = useTranslations("mediaLibrary");
  const locale = useLocale();
  const [alt, setAlt] = useState({ ar: asset.altText.ar ?? "", en: asset.altText.en ?? "" });
  const [folder, setFolder] = useState(asset.folderId ?? "");
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  // Only folders of the file's own scope can hold it.
  const fitting = folders.filter((f) => f.storeId === asset.storeId);

  const save = () =>
    startTransition(async () => {
      const result = await updateMedia(storeId, asset.id, { altText: alt, folderId: folder || null });
      if (!result.success) return showError(result.error);
      toast.success(t("saved"));
      onSaved(result.data);
    });

  const remove = () =>
    startTransition(async () => {
      const result = await deleteMedia(storeId, asset.id);
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

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="truncate" dir="auto">
            {asset.filename}
          </DialogTitle>
          <DialogDescription>
            {formatBytes(asset.bytes, locale)}
            {asset.width && asset.height ? ` · ${asset.width}×${asset.height}` : ""} · {t(asset.storeId === null ? "badge.shared" : "badge.store")}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- public store-media object */}
          <img src={asset.url} alt={mediaAlt(asset.altText, locale)} className="max-h-72 w-full rounded-lg border bg-muted object-contain" />
          <fieldset disabled={readOnly || pending} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="media-alt-ar">{t("altAr")}</Label>
              <Input id="media-alt-ar" dir="rtl" maxLength={250} value={alt.ar} onChange={(e) => setAlt({ ...alt, ar: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="media-alt-en">{t("altEn")}</Label>
              <Input id="media-alt-en" dir="ltr" maxLength={250} value={alt.en} onChange={(e) => setAlt({ ...alt, en: e.target.value })} />
            </div>
            <p className="text-xs text-muted-foreground">{t("altHint")}</p>
            <div className="space-y-1">
              <Label htmlFor="media-folder">{t("folder")}</Label>
              <select id="media-folder" className={SELECT_CLASS} value={folder} onChange={(e) => setFolder(e.target.value)}>
                <option value="">{t("root")}</option>
                {fitting.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-muted-foreground">{asset.usage > 0 ? t("usedIn", { count: asset.usage }) : t("unused")}</p>
          </fieldset>
        </div>
        <DialogFooter className="flex-wrap gap-2 sm:justify-between">
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={copy}>
              <Copy aria-hidden />
              {t("copyUrl")}
            </Button>
            {!readOnly && (
              <Button type="button" variant="outline" size="sm" className="text-destructive" onClick={() => setConfirmDelete(true)} disabled={pending}>
                <Trash2 aria-hidden />
                {t("delete")}
              </Button>
            )}
          </div>
          {!readOnly && (
            <Button type="button" size="sm" onClick={save} disabled={pending}>
              {pending && <LoaderCircle className="animate-spin" aria-hidden />}
              {t("save")}
            </Button>
          )}
        </DialogFooter>

        <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("deleteConfirm")}
                {asset.usage > 0 && <span className="mt-2 block font-medium text-destructive">{t("deleteUsedWarning", { count: asset.usage })}</span>}
                {asset.storeId === null && <span className="mt-2 block">{t("deleteSharedWarning")}</span>}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={remove}>{t("delete")}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}

function FolderDialog({
  storeId,
  folder,
  parent,
  onClose,
  onDone,
  showError,
}: {
  storeId: string;
  /** Set when renaming. */
  folder?: MediaFolderView;
  /** New folders inside a folder take its scope. */
  parent: MediaFolderView | null;
  onClose: () => void;
  onDone: () => void;
  showError: (error: MediaErrorKey) => void;
}) {
  const t = useTranslations("mediaLibrary");
  const [name, setName] = useState(folder?.name ?? "");
  const [shared, setShared] = useState(parent ? parent.storeId === null : false);
  const [pending, startTransition] = useTransition();

  const submit = () =>
    startTransition(async () => {
      const result = folder
        ? await renameFolder(storeId, folder.id, name)
        : await createFolder(storeId, { name, shared, parentId: parent?.id ?? null });
      if (!result.success) return showError(result.error);
      onDone();
    });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{folder ? t("renameFolder") : t("newFolder")}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) submit();
          }}
        >
          <div className="space-y-1">
            <Label htmlFor="media-folder-name">{t("folderName")}</Label>
            <Input id="media-folder-name" value={name} maxLength={120} autoFocus onChange={(e) => setName(e.target.value)} />
          </div>
          {!folder && (
            <label className="flex items-start gap-2 text-sm">
              <Checkbox checked={shared} disabled={parent !== null} onCheckedChange={(checked) => setShared(checked === true)} />
              <span>
                {t("folderShared")}
                <span className="block text-xs text-muted-foreground">{t(parent ? "folderInherits" : "folderSharedHint")}</span>
              </span>
            </label>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={pending || !name.trim()}>
              {pending && <LoaderCircle className="animate-spin" aria-hidden />}
              {folder ? t("save") : t("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
