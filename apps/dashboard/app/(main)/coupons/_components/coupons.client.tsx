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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
  deleteSellerCoupon,
  setSellerCouponActive,
  type SellerCouponRow,
  type SellerCouponsPage,
} from "@/actions/coupons";
import { formatDate, formatMoney, formatMoneyMarked, formatNumber } from "@/lib/i18n/format";
import { MixedCurrencyNote, useAccountMoney } from "@/components/account-money.client";
import { MoneyText } from "@/components/money";
import {
  Chip,
  Chips,
  EmptyState,
  IconButton,
  PageHeader,
  SellerButton,
  SellerCard,
  StatusBadge,
  Tag,
  Toggle,
  type BadgeTone,
} from "@/components/seller-ui";
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

export function CouponsView({ coupons: initialCoupons, storeHost, stores }: SellerCouponsPage) {
  const t = useTranslations("coupons");
  const locale = useLocale();
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
      storeHost={storeHost}
      stores={stores}
      onSaved={() => router.refresh()}
    />
  );

  if (coupons.length === 0) {
    return (
      <>
        <PageHeader title={t("title")} description={t("intro")} />
        <SellerCard>
          <EmptyState
            icon={TicketPercent}
            title={t("empty.title")}
            description={t("empty.body")}
            action={
              <SellerButton onClick={() => openEditor(null)}>
                <Plus aria-hidden />
                {t("empty.action")}
              </SellerButton>
            }
          />
        </SellerCard>
        {editor}
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("intro")}
        actions={
          <SellerButton onClick={() => openEditor(null)}>
            <Plus aria-hidden />
            {t("create")}
          </SellerButton>
        }
      />
      <MixedCurrencyNote />

      <Chips role="group" aria-label={t("title")}>
        {COUPON_FILTERS.map((f) => (
          <Chip key={f} pressed={filter === f} onClick={() => setFilter(f)}>
            {t(`filters.${f}`)}
            <span className="font-montserrat tabular-nums opacity-70">{formatNumber(counts[f], locale)}</span>
          </Chip>
        ))}
      </Chips>

      {visible.length === 0 ? (
        <SellerCard>
          <EmptyState icon={TicketPercent} title={t("emptyFilter")} />
        </SellerCard>
      ) : (
        <ul className="overflow-hidden rounded-[20px] border border-(--s-line) bg-(--s-surface)">
          {visible.map(({ coupon, status }) => (
            <CouponRow
              key={coupon.id}
              coupon={coupon}
              status={status}
              multiStore={stores.length > 1}
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
    </>
  );
}

function CouponRow({
  coupon,
  status,
  multiStore,
  onEdit,
  onDelete,
  onActiveChange,
}: {
  coupon: SellerCouponRow;
  status: CouponStatus;
  /** The list is the selected store's coupons plus all-stores ones: only those get a badge. */
  multiStore: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onActiveChange: (isActive: boolean) => void;
}) {
  const t = useTranslations("coupons");
  const locale = useLocale();
  const { unit } = useAccountMoney();
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
    <li className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-3 p-4 transition-colors duration-150 hover:bg-(--s-tint) min-[721px]:grid-cols-[auto_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto] [&+&]:border-t [&+&]:border-(--s-line-soft) max-[600px]:gap-x-3">
      <CouponTicketStub
        discountType={coupon.discountType}
        discountValue={coupon.discountValue}
        status={status}
        notchClassName="bg-(--s-surface)"
      />

      {/* Code, name and what it covers */}
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-1.5">
          <bdi dir="ltr" className="truncate font-montserrat text-[15px] font-bold tracking-wider text-(--s-ink)">
            {coupon.code}
          </bdi>
          <IconButton onClick={copyCode} aria-label={t("row.copy")} className="[&_svg]:size-3.5">
            <Copy aria-hidden />
          </IconButton>
        </div>
        <div className="flex min-w-0 items-center gap-1.5">
          <p className="truncate text-[13.5px] font-semibold text-(--s-text)">{coupon.name}</p>
          {multiStore && coupon.storeId === null && <Tag>{t("row.allStores")}</Tag>}
        </div>
        <p className="text-xs text-(--s-subtle)">
          {new Intl.ListFormat(locale, { type: "unit", style: "short" }).format(
            [
              coupon.productIds
                ? t("row.someProducts", { count: coupon.productIds.length })
                : t("row.allProducts"),
              t(`row.channels.${channelsKey(coupon.channels)}`),
              coupon.minimumPurchase != null
                ? t("row.minPurchase", { amount: formatMoney(coupon.minimumPurchase, locale, unit) })
                : null,
            ].filter((part): part is string => part !== null)
          )}
        </p>
      </div>

      {/* Usage */}
      <div className="col-span-2 col-start-1 min-w-0 space-y-1.5 min-[721px]:col-span-1 min-[721px]:col-start-auto">
        <p className="text-[13px] tabular-nums text-(--s-body)">
          {coupon.usageLimit != null
            ? t("row.usesOf", {
                count: formatNumber(coupon.usageCount, locale),
                limit: formatNumber(coupon.usageLimit, locale),
              })
            : t("row.uses", { count: coupon.usageCount })}
        </p>
        {usedRatio != null && (
          <div
            className="h-1.5 w-full max-w-40 overflow-hidden rounded-full bg-(--s-fill)"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={coupon.usageLimit!}
            aria-valuenow={coupon.usageCount}
          >
            <div className="h-full rounded-full bg-(--s-primary)" style={{ width: `${usedRatio * 100}%` }} />
          </div>
        )}
        {coupon.discountGiven > 0 && (
          <p className="text-xs text-(--s-subtle)">
            <MoneyText locale={locale}>{t("row.saved", { amount: formatMoneyMarked(coupon.discountGiven, locale, unit) })}</MoneyText>
          </p>
        )}
      </div>

      {/* Status and dates */}
      <div className="col-span-2 col-start-1 min-w-0 space-y-1 min-[721px]:col-span-1 min-[721px]:col-start-auto">
        <StatusLabel status={status} />
        <p className="text-xs text-(--s-subtle) tabular-nums">
          {t("row.dates", {
            start: formatDate(coupon.startsAt, locale),
            end: formatDate(coupon.expiresAt, locale),
          })}
        </p>
      </div>

      <div className="flex items-center justify-end gap-1 max-[720px]:col-span-2 max-[720px]:justify-between max-[720px]:border-t max-[720px]:border-(--s-line-soft) max-[720px]:pt-2">
        <Toggle
          checked={coupon.isActive}
          onCheckedChange={toggle}
          disabled={isToggling}
          aria-label={t("row.toggle")}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconButton aria-label={t("row.actions")}>
              <MoreHorizontal aria-hidden />
            </IconButton>
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

const STATUS_TONE: Record<CouponStatus, BadgeTone> = {
  running: "success",
  scheduled: "info",
  off: "muted",
  ended: "muted",
  usedUp: "warning",
};

function StatusLabel({ status }: { status: CouponStatus }) {
  const t = useTranslations("coupons.status");
  return <StatusBadge tone={STATUS_TONE[status]}>{t(status)}</StatusBadge>;
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
