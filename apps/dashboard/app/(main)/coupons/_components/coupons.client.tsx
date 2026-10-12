"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, MoreHorizontal, Pencil, Plus, TicketPercent, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
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
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Switch } from "@workspace/ui/components/switch";
import { cn } from "@workspace/ui/lib/utils";
import {
  deleteSellerCoupon,
  setSellerCouponActive,
  type SellerCouponRow,
  type SellerCouponsPage,
} from "@/actions/coupons";
import { formatDate, formatMoney, formatNumber } from "@/lib/i18n/format";
import { CouponEditor } from "./coupon-editor";
import { CouponTicketStub } from "./coupon-ticket";
import {
  COUPON_FILTERS,
  channelsKey,
  getCouponStatus,
  matchesFilter,
  type CouponFilter,
  type CouponStatus,
} from "./coupons.lib";

export function CouponsView({ coupons: initialCoupons, products, storeHost }: SellerCouponsPage) {
  const t = useTranslations("coupons");
  const router = useRouter();
  const [coupons, setCoupons] = useState(initialCoupons);
  const [filter, setFilter] = useState<CouponFilter>("all");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<SellerCouponRow | null>(null);
  const [deleting, setDeleting] = useState<SellerCouponRow | null>(null);
  const [now] = useState(() => Date.now());

  useEffect(() => setCoupons(initialCoupons), [initialCoupons]);

  const withStatus = useMemo(
    () => coupons.map((c) => ({ coupon: c, status: getCouponStatus(c, now) })),
    [coupons, now]
  );
  const counts = useMemo(
    () =>
      Object.fromEntries(
        COUPON_FILTERS.map((f) => [f, withStatus.filter((r) => matchesFilter(r.status, f)).length])
      ) as Record<CouponFilter, number>,
    [withStatus]
  );
  const visible = withStatus.filter((r) => matchesFilter(r.status, filter));

  const openEditor = (coupon: SellerCouponRow | null) => {
    setEditing(coupon);
    setEditorOpen(true);
  };

  const editor = (
    <CouponEditor
      open={editorOpen}
      onOpenChange={setEditorOpen}
      coupon={editing}
      products={products}
      storeHost={storeHost}
      onSaved={() => router.refresh()}
    />
  );

  if (coupons.length === 0) {
    return (
      <>
        <div className="flex max-w-xl flex-col items-start gap-4 py-10">
          <TicketPercent className="size-10 text-primary" aria-hidden />
          <h2 className="text-xl font-semibold">{t("empty.title")}</h2>
          <p className="text-muted-foreground">{t("empty.body")}</p>
          <Button onClick={() => openEditor(null)}>
            <Plus className="size-4" aria-hidden />
            {t("empty.action")}
          </Button>
        </div>
        {editor}
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <p className="max-w-2xl text-muted-foreground">{t("intro")}</p>
        <Button onClick={() => openEditor(null)} className="shrink-0">
          <Plus className="size-4" aria-hidden />
          {t("create")}
        </Button>
      </div>

      <div
        role="group"
        aria-label={t("title")}
        className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1"
      >
        {COUPON_FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              filter === f
                ? "border-foreground bg-foreground text-background"
                : "text-muted-foreground hover:border-foreground/40 hover:text-foreground"
            )}
          >
            {t(`filters.${f}`)}
            <span className="tabular-nums opacity-70">{counts[f]}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
          {t("emptyFilter")}
        </p>
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {visible.map(({ coupon, status }) => (
            <CouponRow
              key={coupon.id}
              coupon={coupon}
              status={status}
              onEdit={() => openEditor(coupon)}
              onDelete={() => setDeleting(coupon)}
              onActiveChange={(isActive) =>
                setCoupons((list) => list.map((c) => (c.id === coupon.id ? { ...c, isActive } : c)))
              }
            />
          ))}
        </ul>
      )}

      {editor}

      <DeleteCouponDialog
        coupon={deleting}
        onClose={() => setDeleting(null)}
        onDeleted={() => router.refresh()}
      />
    </div>
  );
}

function CouponRow({
  coupon,
  status,
  onEdit,
  onDelete,
  onActiveChange,
}: {
  coupon: SellerCouponRow;
  status: CouponStatus;
  onEdit: () => void;
  onDelete: () => void;
  onActiveChange: (isActive: boolean) => void;
}) {
  const t = useTranslations("coupons");
  const locale = useLocale();
  const [isToggling, startToggle] = useTransition();

  const copyCode = async () => {
    await navigator.clipboard.writeText(coupon.code);
    toast.success(t("row.copied"));
  };

  const toggle = (isActive: boolean) => {
    onActiveChange(isActive);
    startToggle(async () => {
      const result = await setSellerCouponActive(coupon.id, isActive);
      if (result.success) {
        toast.success(isActive ? t("toggled.on") : t("toggled.off"));
      } else {
        onActiveChange(!isActive);
        toast.error(t("toggled.failed"));
      }
    });
  };

  const usedRatio =
    coupon.usageLimit != null ? Math.min(1, coupon.usageCount / coupon.usageLimit) : null;

  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 p-4 md:grid-cols-[auto_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
      <CouponTicketStub
        discountType={coupon.discountType}
        discountValue={coupon.discountValue}
        status={status}
        notchClassName="bg-card"
      />

      {/* Code, name and what it covers */}
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-1.5">
          <span dir="ltr" className="truncate font-mono text-base font-semibold tracking-wider">
            {coupon.code}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground"
            onClick={copyCode}
            aria-label={t("row.copy")}
          >
            <Copy className="size-3.5" aria-hidden />
          </Button>
        </div>
        <p className="truncate text-sm">{coupon.name}</p>
        <p className="text-xs text-muted-foreground">
          {new Intl.ListFormat(locale, { type: "unit", style: "short" }).format(
            [
              coupon.productIds
                ? t("row.someProducts", { count: coupon.productIds.length })
                : t("row.allProducts"),
              t(`row.channels.${channelsKey(coupon.channels)}`),
              coupon.minimumPurchase != null
                ? t("row.minPurchase", { amount: formatMoney(coupon.minimumPurchase, locale) })
                : null,
            ].filter((part): part is string => part !== null)
          )}
        </p>
      </div>

      {/* Usage */}
      <div className="col-span-3 col-start-1 min-w-0 space-y-1.5 md:col-span-1 md:col-start-auto">
        <p className="text-sm tabular-nums">
          {coupon.usageLimit != null
            ? t("row.usesOf", {
                count: formatNumber(coupon.usageCount, locale),
                limit: formatNumber(coupon.usageLimit, locale),
              })
            : t("row.uses", { count: coupon.usageCount })}
        </p>
        {usedRatio != null && (
          <div
            className="h-1.5 w-full max-w-40 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={coupon.usageLimit!}
            aria-valuenow={coupon.usageCount}
          >
            <div className="h-full rounded-full bg-primary" style={{ width: `${usedRatio * 100}%` }} />
          </div>
        )}
        {coupon.discountGiven > 0 && (
          <p className="text-xs text-muted-foreground">
            {t("row.saved", { amount: formatMoney(coupon.discountGiven, locale) })}
          </p>
        )}
      </div>

      {/* Status and dates */}
      <div className="col-span-2 col-start-1 min-w-0 space-y-1 md:col-span-1 md:col-start-auto">
        <StatusLabel status={status} />
        <p className="text-xs text-muted-foreground tabular-nums">
          {t("row.dates", {
            start: formatDate(coupon.startsAt, locale),
            end: formatDate(coupon.expiresAt, locale),
          })}
        </p>
      </div>

      <div className="col-start-3 row-start-1 flex items-center gap-1 md:col-start-auto md:row-start-auto">
        <Switch
          checked={coupon.isActive}
          onCheckedChange={toggle}
          disabled={isToggling}
          aria-label={t("row.toggle")}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8" aria-label={t("row.actions")}>
              <MoreHorizontal className="size-4" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="size-4" aria-hidden />
              {t("row.edit")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={copyCode}>
              <Copy className="size-4" aria-hidden />
              {t("row.copy")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              <Trash2 className="size-4" aria-hidden />
              {t("row.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}

function StatusLabel({ status }: { status: CouponStatus }) {
  const t = useTranslations("coupons.status");
  return (
    <p className="flex items-center gap-1.5 text-sm font-medium">
      <span
        aria-hidden
        className={cn(
          "size-2 rounded-full",
          status === "running" && "bg-emerald-500",
          status === "scheduled" && "bg-primary",
          status !== "running" && status !== "scheduled" && "bg-muted-foreground/50"
        )}
      />
      {t(status)}
    </p>
  );
}

function DeleteCouponDialog({
  coupon,
  onClose,
  onDeleted,
}: {
  coupon: SellerCouponRow | null;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const t = useTranslations("coupons.deleteDialog");
  const [isDeleting, startDelete] = useTransition();

  const confirm = (event: React.MouseEvent) => {
    event.preventDefault();
    if (!coupon) return;
    startDelete(async () => {
      const result = await deleteSellerCoupon(coupon.id);
      if (!result.success) {
        toast.error(t("failed"));
        return;
      }
      toast.success(result.archived ? t("archived") : t("deleted"));
      onDeleted();
      onClose();
    });
  };

  return (
    <AlertDialog open={!!coupon} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("title", { code: coupon?.code ?? "" })}</AlertDialogTitle>
          <AlertDialogDescription>{t("body")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirm}
            disabled={isDeleting}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {t("confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
