"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  ArrowDownAZ,
  ArrowLeft,
  Check,
  FolderTree,
  GripVertical,
  ListOrdered,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Tag,
  Trash2,
  Upload,
} from "lucide-react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
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
import { BUTTON_CLASS, FIELD_CLASS, FieldHint, SMALL_BUTTON_CLASS, SectionCard } from "@/app/(main)/stores/[storeId]/products/add/form-kit";
import { SELLER_IMAGE_ACCEPT_ATTR, useSellerUpload } from "@/components/inputs/use-seller-upload";
import { useDebounce } from "@/hooks/use-debounce";
import { cn, getPublicUrl } from "@/lib/utils";
import {
  addTaxonomyItem,
  deleteTaxonomyItem,
  reorderTaxonomyItems,
  searchTaxonomyPack,
  updateTaxonomyItem,
} from "./categories-brands.server";
import {
  SELLER_TAXONOMY_MAX_ITEMS,
  TAXONOMY_NAME_MAX,
  type PackSuggestion,
  type SellerTaxonomyItem,
  type TaxonomyErrorKey,
  type TaxonomyKind,
} from "./categories-brands.dto";
import {
  TAXONOMY_IMAGE_BUCKET,
  TAXONOMY_UPLOAD_FOLDER,
  groupTaxonomyTree,
  moveTaxonomyItem,
  parentChoices,
  placeTaxonomyItem,
  sortTaxonomyTreeByLabel,
  taxonomyLabel,
  taxonomyNameKey,
} from "./categories-brands.lib";
import { RemoteImage } from "@/components/media/remote-image";
import { CategoryOrderDialog } from "../category-order/category-order.client";
import { useProductStoreId } from "../_components/product-store.client";

const KEY: Record<TaxonomyKind, "categories" | "brands"> = { category: "categories", brand: "brands" };

/** Products › Categories or Products › Brands: one of the seller's own lists. */
export function TaxonomyManager({ kind, initialItems }: { kind: TaxonomyKind; initialItems: SellerTaxonomyItem[] }) {
  const t = useTranslations("categoriesBrands");
  const [items, setItems] = useState(initialItems);
  const k = KEY[kind];

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <header>
        <h1 className="flex items-center gap-2.5 text-[clamp(22px,2.4vw,28px)] font-bold leading-[1.35] text-(--s-ink)">
          {t(`${k}.pageTitle`)}
          <span className="rounded-full bg-primary-soft px-2.5 py-0.5 font-montserrat text-sm font-bold tabular-nums text-primary-ink">{items.length}</span>
        </h1>
        <p className="mt-0.5 text-pretty text-[14.5px] leading-[1.7] text-(--s-muted) max-[600px]:text-[13.5px]">{t(`${k}.pageSubtitle`)}</p>
      </header>
      <TaxonomyList kind={kind} items={items} setItems={setItems} />
    </div>
  );
}

function useErrorToast() {
  const t = useTranslations("categoriesBrands.errors");
  return (error: TaxonomyErrorKey): void => {
    toast.error(t(error, { max: SELLER_TAXONOMY_MAX_ITEMS }));
  };
}

function ItemImage({
  kind,
  item,
  className,
}: {
  kind: TaxonomyKind;
  item: { name: string; image: string | null };
  className?: string;
}) {
  const src = item.image ? getPublicUrl(item.image, TAXONOMY_IMAGE_BUCKET[kind]) : "";
  return (
    <span
      className={cn(
        "flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted text-sm font-semibold text-muted-foreground",
        className,
      )}
    >
      {src ? (
        <RemoteImage src={src} alt="" width={40} height={40} className="size-full object-contain" />
      ) : (
        item.name.slice(0, 1).toUpperCase()
      )}
    </span>
  );
}

function TaxonomyList({
  kind,
  items,
  setItems,
}: {
  kind: TaxonomyKind;
  items: SellerTaxonomyItem[];
  setItems: React.Dispatch<React.SetStateAction<SellerTaxonomyItem[]>>;
}) {
  const t = useTranslations("categoriesBrands");
  const tOrder = useTranslations("categoryOrder");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<SellerTaxonomyItem | null>(null);
  const [removing, setRemoving] = useState<SellerTaxonomyItem | null>(null);
  const [arranging, setArranging] = useState<SellerTaxonomyItem | null>(null);
  const [confirmSort, setConfirmSort] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isOrdering, startOrdering] = useTransition();
  const showError = useErrorToast();
  // The page's store (the URL segment); the server checks it against the session again (F-87d).
  const storeId = useProductStoreId();
  const k = KEY[kind];
  const filtering = query.trim().length > 0;

  // Main rows with their sub-categories (categories, 0171); brands and stores with no sub-categories are flat.
  const groups = useMemo(() => groupTaxonomyTree(items), [items]);
  const nested = groups.some((g) => g.children.length > 0);
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  /** A main category counts its sub-categories' products too. */
  const totals = useMemo(
    () => new Map(groups.map((g) => [g.item.id, g.item.ownProductCount + g.children.reduce((n, c) => n + c.ownProductCount, 0)])),
    [groups],
  );
  const countOf = (item: SellerTaxonomyItem) => totals.get(item.id) ?? item.ownProductCount;
  const childCount = (id: string) => groups.find((g) => g.item.id === id)?.children.length ?? 0;

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.name.toLowerCase().includes(q) || i.nameAr?.toLowerCase().includes(q));
  }, [items, query]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  /** Show the new order now; put the old one back if saving fails. */
  const saveOrder = (next: SellerTaxonomyItem[], successMessage?: string) => {
    const previous = items;
    setItems(next);
    startOrdering(async () => {
      const result = await reorderTaxonomyItems(
        storeId,
        kind,
        next.map((i) => i.id),
      );
      if (!result.success) {
        setItems(previous);
        return showError(result.error);
      }
      if (successMessage) toast.success(successMessage);
    });
  };

  /** Only siblings move: a main row (with its sub-categories) among main rows, a sub-category inside its main one. */
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const activeItem = byId.get(String(active.id));
    let overId = String(over.id);
    // A main row dropped over a sub-category lands at that sub-category's main row.
    const overItem = byId.get(overId);
    if (activeItem && groups.some((g) => g.item.id === activeItem.id) && overItem?.parentId && !groups.some((g) => g.item.id === overId)) {
      overId = overItem.parentId;
    }
    const next = moveTaxonomyItem(items, String(active.id), overId);
    if (next) saveOrder(next);
  };

  /** One row's content: image, name and counts, then its actions. */
  const renderRow = (item: SellerTaxonomyItem, parentLabel: string | null, child = false) => {
    const subs = childCount(item.id);
    return (
      <>
        <ItemImage kind={kind} item={item} className={child ? "size-8 text-xs" : undefined} />
        {/* On a phone the actions take their own line, or the name is cut to a letter or two. */}
        <div className="min-w-0 flex-1 max-[480px]:basis-[calc(100%-116px)]">
          <p className="truncate text-sm font-medium">{taxonomyLabel(item, locale)}</p>
          <p className="truncate text-xs text-muted-foreground">
            {parentLabel ? `${t("subOf", { name: parentLabel })} · ` : ""}
            {t("productCount", { count: countOf(item) })}
            {subs > 0 ? ` · ${t("subCount", { count: subs })}` : ""}
            {item.sourceId ? ` · ${t("fromPack")}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3 max-[480px]:w-full max-[480px]:justify-end">
          {kind === "category" && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setArranging(item)}
              aria-label={tOrder("open")}
              title={tOrder("open")}
            >
              <ListOrdered className="size-4" />
            </Button>
          )}
          <Button type="button" variant="ghost" size="icon" onClick={() => setEditing(item)} aria-label={t("edit")}>
            <Pencil className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={() => setRemoving(item)}
            aria-label={t("delete")}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </>
    );
  };

  const confirmDelete = () => {
    const item = removing;
    if (!item) return;
    startTransition(async () => {
      const result = await deleteTaxonomyItem(storeId, kind, item.id);
      if (!result.success) return showError(result.error);
      // Its sub-categories become main categories (0171 ON DELETE SET NULL), where it was.
      setItems((current) => current.filter((i) => i.id !== item.id).map((i) => (i.parentId === item.id ? { ...i, parentId: null } : i)));
      setRemoving(null);
      toast.success(t("deleted"));
    });
  };

  return (
    <SectionCard
      id={`seller-${k}`}
      icon={kind === "category" ? FolderTree : Tag}
      title={t(`${k}.title`)}
      description={t(`${k}.description`)}
      action={
        <div className="flex flex-wrap gap-2">
          {items.length > 1 && (
            <Button
              type="button"
              size="sm"
              variant="neutral"
              className={SMALL_BUTTON_CLASS}
              onClick={() => setConfirmSort(true)}
              disabled={isOrdering}
            >
              <ArrowDownAZ className="size-4" />
              {t("sortAz")}
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            className={SMALL_BUTTON_CLASS}
            onClick={() => setAdding(true)}
            disabled={items.length >= SELLER_TAXONOMY_MAX_ITEMS}
          >
            <Plus className="size-4" />
            {t(`${k}.add`)}
          </Button>
        </div>
      }
    >
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="max-w-sm text-sm text-muted-foreground text-pretty">{t(`${k}.empty`)}</p>
          <Button type="button" variant="outline" className={BUTTON_CLASS} onClick={() => setAdding(true)}>
            <Plus className="size-4" />
            {t(`${k}.add`)}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.length > 8 && (
            <div className="relative">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t(`${k}.filter`)}
                className={cn(FIELD_CLASS, "ps-9")}
              />
            </div>
          )}
          {items.length > 1 && (
            <FieldHint>
              {filtering ? t("filteringHint") : t("reorderHint")}
              {!filtering && nested ? ` ${t("subReorderHint")}` : ""}
            </FieldHint>
          )}
          <DndContext id={`taxonomy-${kind}`} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            {filtering ? (
              // Filtered: the matches in list order, no dragging; a sub-category says which main category it is in.
              <SortableContext items={shown.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                <ul className="divide-y divide-(--s-line-soft) overflow-hidden rounded-[20px] border border-(--s-line) bg-(--s-surface)">
                  {shown.map((item) => {
                    const parent = item.parentId ? byId.get(item.parentId) : undefined;
                    return (
                      <SortableRow key={item.id} id={item.id} disabled handleLabel={t("dragHandle", { name: taxonomyLabel(item, locale) })}>
                        {renderRow(item, parent ? taxonomyLabel(parent, locale) : null)}
                      </SortableRow>
                    );
                  })}
                  {shown.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted-foreground">{t("noMatches")}</li>}
                </ul>
              </SortableContext>
            ) : (
              <SortableContext items={groups.map((g) => g.item.id)} strategy={verticalListSortingStrategy}>
                <ul className="divide-y divide-(--s-line-soft) overflow-hidden rounded-[20px] border border-(--s-line) bg-(--s-surface)">
                  {groups.map(({ item, children }) => (
                    <SortableRow
                      key={item.id}
                      id={item.id}
                      disabled={isOrdering || groups.length < 2}
                      handleLabel={t("dragHandle", { name: taxonomyLabel(item, locale) })}
                      nested={
                        children.length > 0 ? (
                          <SortableContext items={children.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                            {/* Sub-categories sit under their main category, indented from the start side (RTL-safe). */}
                            <ul className="ms-6 divide-y divide-(--s-line-soft) border-s-2 border-t border-(--s-line-soft) max-[480px]:ms-3">
                              {children.map((child) => (
                                <SortableRow
                                  key={child.id}
                                  id={child.id}
                                  disabled={isOrdering || children.length < 2}
                                  handleLabel={t("dragHandle", { name: taxonomyLabel(child, locale) })}
                                >
                                  {renderRow(child, null, true)}
                                </SortableRow>
                              ))}
                            </ul>
                          </SortableContext>
                        ) : undefined
                      }
                    >
                      {renderRow(item, null)}
                    </SortableRow>
                  ))}
                </ul>
              </SortableContext>
            )}
          </DndContext>
        </div>
      )}

      <AddItemDialog
        kind={kind}
        open={adding}
        onOpenChange={setAdding}
        items={items}
        onAdded={(item) => setItems((current) => (item.parentId ? placeTaxonomyItem([...current, item], item.id, item.parentId) : [...current, item]))}
      />
      <EditDialog
        kind={kind}
        item={editing}
        items={items}
        onClose={() => setEditing(null)}
        onSaved={({ parentId, ...patch }) =>
          setItems((current) => {
            const next = current.map((i) => (i.id === patch.id ? { ...i, ...patch } : i));
            // A new main category moves it where the server puts it (last in its new level).
            return parentId === undefined ? next : placeTaxonomyItem(next, patch.id, parentId);
          })
        }
      />
      {kind === "category" && (
        <CategoryOrderDialog
          category={arranging ? { id: arranging.id, label: taxonomyLabel(arranging, locale) } : null}
          onClose={() => setArranging(null)}
        />
      )}
      <AlertDialog open={confirmSort} onOpenChange={setConfirmSort}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("sortAzConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("sortAzConfirmBody")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setQuery("");
                saveOrder(sortTaxonomyTreeByLabel(items, locale), t("sorted"));
              }}
            >
              {t("sortAzConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!removing} onOpenChange={(open) => !open && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteTitle", { name: removing ? taxonomyLabel(removing, locale) : "" })}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteBody", { count: removing?.ownProductCount ?? 0 })}
              {removing && childCount(removing.id) > 0 ? ` ${t("deleteChildrenBody", { count: childCount(removing.id) })}` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isPending && <LoaderCircle className="size-4 animate-spin" />}
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SectionCard>
  );
}

/** A list row that can be dragged by its handle (pointer or keyboard). */
function SortableRow({
  id,
  disabled,
  handleLabel,
  children,
  nested,
}: {
  id: string;
  disabled: boolean;
  handleLabel: string;
  children: React.ReactNode;
  /** Rows shown under this one that move with it (a main category's sub-categories). */
  nested?: React.ReactNode;
}) {
  const { setNodeRef, setActivatorNodeRef, listeners, attributes, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn("bg-(--s-surface)", isDragging && "relative z-10 rounded-xl shadow-(--s-shadow-menu)")}
    >
      <div className="flex items-center gap-3 px-3.5 py-3 transition-colors duration-150 hover:bg-(--s-tint) max-[480px]:flex-wrap">
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        disabled={disabled}
        aria-label={handleLabel}
        className="-ms-1 flex size-10 shrink-0 touch-none items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring enabled:cursor-grab enabled:active:cursor-grabbing disabled:opacity-40"
      >
        <GripVertical className="size-4" />
      </button>
      {children}
      </div>
      {nested}
    </li>
  );
}

/** Upload, change or remove an item's image (value: public URL, pack path or null). */
function ImageField({
  kind,
  name,
  value,
  onChange,
  onBusyChange,
  disabled,
}: {
  kind: TaxonomyKind;
  name: string;
  value: string | null;
  onChange: (value: string | null) => void;
  onBusyChange: (busy: boolean) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("categoriesBrands");
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, isUploading } = useSellerUpload({ folder: TAXONOMY_UPLOAD_FOLDER });
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => onBusyChange(isUploading), [isUploading, onBusyChange]);

  const pick = async (file: File) => {
    const blob = URL.createObjectURL(file);
    setPreview(blob);
    const url = await upload(file);
    if (url) onChange(url);
    setPreview(null);
    URL.revokeObjectURL(blob);
  };

  return (
    <div className="space-y-1.5">
      <span className="block text-sm font-medium">{t("image")}</span>
      <div className="flex items-center gap-3">
        <div className="relative">
          <ItemImage kind={kind} item={{ name: name || "?", image: preview ?? value }} className="size-16 text-lg" />
          {isUploading && (
            <div className="absolute inset-0 grid place-items-center rounded-lg bg-black/40">
              <LoaderCircle className="size-5 animate-spin text-white" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="neutral"
              className={SMALL_BUTTON_CLASS}
              disabled={disabled || isUploading}
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="size-4" />
              {value ? t("changeImage") : t("uploadImage")}
            </Button>
            {value && (
              <Button
                type="button"
                variant="soft"
                className={cn(SMALL_BUTTON_CLASS, "text-destructive hover:bg-destructive-soft hover:text-destructive")}
                disabled={disabled || isUploading}
                onClick={() => onChange(null)}
              >
                <Trash2 className="size-4" />
                {t("removeImage")}
              </Button>
            )}
          </div>
          <FieldHint>{t("imageHint")}</FieldHint>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={SELLER_IMAGE_ACCEPT_ATTR}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void pick(file);
          }}
        />
      </div>
    </div>
  );
}

/**
 * "Main category" (categories only, two levels): none, or one of the store's
 * main categories, never the category itself. Locked (with a hint) for a
 * category that has sub-categories of its own. Hidden when there is nothing to
 * pick. The server checks the choice again.
 */
function ParentField({
  items,
  value,
  onChange,
  selfId,
  locked = false,
  disabled,
}: {
  items: SellerTaxonomyItem[];
  value: string | null;
  onChange: (value: string | null) => void;
  selfId?: string;
  locked?: boolean;
  disabled?: boolean;
}) {
  const t = useTranslations("categoriesBrands");
  const locale = useLocale();
  const choices = useMemo(() => parentChoices(items, selfId), [items, selfId]);
  if (!choices.length && !value && !locked) return null;
  return (
    <div className="space-y-1.5">
      <label className="block space-y-1.5 text-sm font-medium">
        <span>{t("parentLabel")}</span>
        <select
          value={value ?? ""}
          disabled={disabled || locked}
          onChange={(e) => onChange(e.target.value || null)}
          className="h-11 w-full min-w-0 cursor-pointer rounded-[14px] border-[1.5px] border-(--s-field) bg-(--s-surface) px-3 text-sm text-(--s-text) outline-none focus-visible:border-(--s-primary) disabled:cursor-not-allowed disabled:opacity-60"
        >
          <option value="">{t("parentNone")}</option>
          {choices.map((c) => (
            <option key={c.id} value={c.id}>
              {taxonomyLabel(c, locale)}
            </option>
          ))}
        </select>
      </label>
      <FieldHint>{locked ? t("parentLockedHint") : t("parentHint")}</FieldHint>
    </div>
  );
}

type CustomItem = { name: string; nameAr: string; image: string | null };

/** Search the Tallaby pack as you type; pick a match or create your own. */
function AddItemDialog({
  kind,
  open,
  onOpenChange,
  items,
  onAdded,
}: {
  kind: TaxonomyKind;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: SellerTaxonomyItem[];
  onAdded: (item: SellerTaxonomyItem) => void;
}) {
  const t = useTranslations("categoriesBrands");
  const locale = useLocale();
  const showError = useErrorToast();
  const k = KEY[kind];
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 250);
  const [suggestions, setSuggestions] = useState<PackSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [custom, setCustom] = useState<CustomItem | null>(null);
  // The main category to add it under (categories only); null adds a main category.
  const [parentId, setParentId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const storeId = useProductStoreId();

  useEffect(() => {
    if (!open) {
      setQuery("");
      setSuggestions([]);
      setCustom(null);
      setParentId(null);
    }
  }, [open]);

  useEffect(() => {
    const term = debounced.trim();
    if (!open || !term) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    searchTaxonomyPack(kind, term).then((result) => {
      if (cancelled) return;
      setSearching(false);
      setSuggestions(result.success ? result.data : []);
    });
    return () => {
      cancelled = true;
    };
  }, [debounced, kind, open]);

  const taken = useMemo(() => {
    // Names are unique among siblings (0171): the main categories, or the chosen main category's sub-categories.
    const siblings =
      kind !== "category" ? items : parentId ? items.filter((i) => i.parentId === parentId) : groupTaxonomyTree(items).map((g) => g.item);
    return {
      sources: new Set(items.map((i) => i.sourceId).filter(Boolean)),
      names: new Set(siblings.flatMap((i) => [taxonomyNameKey(i.name), ...(i.nameAr ? [taxonomyNameKey(i.nameAr)] : [])])),
    };
  }, [items, kind, parentId]);
  const term = query.trim();
  const canCreate = term.length > 0 && !taken.names.has(taxonomyNameKey(term));

  const add = (input: { sourceId: string } | CustomItem) =>
    startTransition(async () => {
      // Brands never send parentId (the server refuses it).
      const result = await addTaxonomyItem(storeId, kind, kind === "category" && parentId ? { ...input, parentId } : input);
      if (!result.success) return showError(result.error);
      onAdded(result.data);
      toast.success(t("added", { name: taxonomyLabel(result.data, locale) }));
      onOpenChange(false);
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{t(`${k}.add`)}</DialogTitle>
          <DialogDescription>{t(`${k}.addHint`)}</DialogDescription>
        </DialogHeader>

        {kind === "category" && <ParentField items={items} value={parentId} onChange={setParentId} disabled={isPending} />}

        {custom ? (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              add(custom);
            }}
          >
            <label className="block space-y-1.5 text-sm font-medium">
              <span>{t("nameEn")}</span>
              <Input
                autoFocus
                value={custom.name}
                maxLength={TAXONOMY_NAME_MAX}
                onChange={(e) => setCustom({ ...custom, name: e.target.value })}
                className={FIELD_CLASS}
              />
            </label>
            <label className="block space-y-1.5 text-sm font-medium">
              <span>{t("nameAr")}</span>
              <Input
                dir="rtl"
                value={custom.nameAr}
                maxLength={TAXONOMY_NAME_MAX}
                onChange={(e) => setCustom({ ...custom, nameAr: e.target.value })}
                className={FIELD_CLASS}
              />
            </label>
            <ImageField
              kind={kind}
              name={custom.name}
              value={custom.image}
              onChange={(image) => setCustom((current) => (current ? { ...current, image } : current))}
              onBusyChange={setUploading}
              disabled={isPending}
            />
            <DialogFooter className="gap-2 sm:justify-between">
              <Button type="button" variant="ghost" className={BUTTON_CLASS} onClick={() => setCustom(null)} disabled={isPending}>
                <ArrowLeft className="size-4 rtl:rotate-180" />
                {t("back")}
              </Button>
              <Button type="submit" className={BUTTON_CLASS} disabled={isPending || uploading || !custom.name.trim()}>
                {isPending && <LoaderCircle className="size-4 animate-spin" />}
                {t("save")}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                value={query}
                maxLength={TAXONOMY_NAME_MAX}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t(`${k}.searchPlaceholder`)}
                className={cn(FIELD_CLASS, "ps-9")}
              />
              {searching && (
                <LoaderCircle className="absolute end-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>

            <div className="max-h-[320px] overflow-y-auto">
              {!term ? (
                <p className="px-1 py-6 text-center text-sm text-muted-foreground">{t("typeToSearch")}</p>
              ) : (
                <ul className="space-y-1">
                  {suggestions.map((s) => {
                    const added = taken.sources.has(s.id) || taken.names.has(taxonomyNameKey(s.name));
                    const parent = locale === "ar" && s.parentNameAr ? s.parentNameAr : s.parentName;
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          disabled={added || isPending}
                          onClick={() => add({ sourceId: s.id })}
                          className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-start transition-colors hover:bg-muted disabled:cursor-default disabled:opacity-60 disabled:hover:bg-transparent"
                        >
                          <ItemImage kind={kind} item={s} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">{taxonomyLabel(s, locale)}</span>
                            {parent && <span className="block truncate text-xs text-muted-foreground">{parent}</span>}
                          </span>
                          {added ? (
                            <Badge variant="success">
                              <Check className="size-3" />
                              {t("inYourList")}
                            </Badge>
                          ) : (
                            <Plus className="size-4 text-muted-foreground" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                  {!searching && suggestions.length === 0 && (
                    <li className="px-1 py-3 text-center text-sm text-muted-foreground">{t("noPackMatches")}</li>
                  )}
                  {canCreate && (
                    <li className="border-t pt-1">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => setCustom({ name: term, nameAr: "", image: null })}
                        className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-start text-sm font-medium text-primary-ink transition-colors hover:bg-primary-soft"
                      >
                        <Plus className="size-4" />
                        <span className="min-w-0 flex-1 truncate">{t("createOwn", { name: term })}</span>
                      </button>
                    </li>
                  )}
                </ul>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Rename an item and set or remove its image. */
function EditDialog({
  kind,
  item,
  items,
  onClose,
  onSaved,
}: {
  kind: TaxonomyKind;
  item: SellerTaxonomyItem | null;
  items: SellerTaxonomyItem[];
  onClose: () => void;
  /** `parentId` only when it changed. */
  onSaved: (patch: { id: string; name: string; nameAr: string | null; image: string | null; parentId?: string | null }) => void;
}) {
  const t = useTranslations("categoriesBrands");
  const showError = useErrorToast();
  const [values, setValues] = useState<{ name: string; nameAr: string; image: string | null; parentId: string | null }>({
    name: "",
    nameAr: "",
    image: null,
    parentId: null,
  });
  // A category with sub-categories stays a main category (two levels).
  const hasChildren = !!item && items.some((i) => i.parentId === item.id);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const storeId = useProductStoreId();

  useEffect(() => {
    if (item) setValues({ name: item.name, nameAr: item.nameAr ?? "", image: item.image, parentId: item.parentId });
  }, [item]);

  const save = () => {
    if (!item) return;
    // Send the image only when it changed, so a pack image path is kept as is.
    const imageChanged = values.image !== item.image;
    // Likewise the main category: sent only when it changed (a move puts it last in its new level).
    const parentChanged = kind === "category" && values.parentId !== item.parentId;
    startTransition(async () => {
      const result = await updateTaxonomyItem(storeId, kind, item.id, {
        name: values.name,
        nameAr: values.nameAr,
        ...(imageChanged ? { image: values.image } : {}),
        ...(parentChanged ? { parentId: values.parentId } : {}),
      });
      if (!result.success) return showError(result.error);
      onSaved({
        id: item.id,
        name: values.name.trim().replace(/\s+/g, " "),
        nameAr: values.nameAr.trim() || null,
        image: values.image,
        ...(parentChanged ? { parentId: values.parentId } : {}),
      });
      toast.success(t("saved"));
      onClose();
    });
  };

  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{t("edit")}</DialogTitle>
          <DialogDescription>{t("editHint")}</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <label className="block space-y-1.5 text-sm font-medium">
            <span>{t("nameEn")}</span>
            <Input
              value={values.name}
              maxLength={TAXONOMY_NAME_MAX}
              onChange={(e) => setValues({ ...values, name: e.target.value })}
              className={FIELD_CLASS}
            />
          </label>
          <label className="block space-y-1.5 text-sm font-medium">
            <span>{t("nameAr")}</span>
            <Input
              dir="rtl"
              value={values.nameAr}
              maxLength={TAXONOMY_NAME_MAX}
              onChange={(e) => setValues({ ...values, nameAr: e.target.value })}
              className={FIELD_CLASS}
            />
          </label>
          {kind === "category" && (
            <ParentField
              items={items}
              value={values.parentId}
              onChange={(parentId) => setValues((current) => ({ ...current, parentId }))}
              selfId={item?.id}
              locked={hasChildren}
              disabled={isPending}
            />
          )}
          <ImageField
            kind={kind}
            name={values.name}
            value={values.image}
            onChange={(image) => setValues((current) => ({ ...current, image }))}
            onBusyChange={setUploading}
            disabled={isPending}
          />
          <DialogFooter>
            <Button type="submit" className={BUTTON_CLASS} disabled={isPending || uploading || !values.name.trim()}>
              {isPending && <LoaderCircle className="size-4 animate-spin" />}
              {t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
