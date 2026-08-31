"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { MapsLinkButton } from "@workspace/ui/components/maps-link-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";

import { formatAddress, formatCurrency, formatDate } from "@/lib/format";
import {
  getPaymentStatusColor,
  getStatusColor,
} from "@/lib/shipping-status";
import type { ShippingOrderRow } from "../orders.types";

interface OrdersTableProps {
  rows: ShippingOrderRow[];
  /** Renders a leading checkbox column, controlled by the props below. */
  selectable?: boolean;
  selected?: Set<string>;
  onToggle?: (orderId: string) => void;
  onToggleAll?: (checked: boolean) => void;
  /** Renders a per-row "advance to next stage" button when set (e.g. "Confirm", "Assign"). */
  rowActionLabel?: string;
  rowActionPending?: boolean;
  onRowAction?: (orderId: string) => void;
}

export function OrdersTable({
  rows,
  selectable = false,
  selected,
  onToggle,
  onToggleAll,
  rowActionLabel,
  rowActionPending = false,
  onRowAction,
}: OrdersTableProps) {
  const t = useTranslations("orders");
  const tStatus = useTranslations("status");
  const tPayment = useTranslations("paymentStatus");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  if (rows.length === 0) {
    return (
      <div className="rounded-md border bg-white p-10 text-center dark:bg-gray-950">
        <p className="text-sm text-muted-foreground">{t("noMatch")}</p>
      </div>
    );
  }

  const selectedCount = rows.filter((row) => selected?.has(row.orderId)).length;
  const allSelected = selectable && selectedCount > 0 && selectedCount === rows.length;
  const someSelected = selectable && selectedCount > 0 && selectedCount < rows.length;
  const showRowAction = Boolean(rowActionLabel && onRowAction);
  const emDash = tCommon("emDash");

  return (
    <div className="overflow-x-auto rounded-md border bg-white shadow-sm dark:bg-gray-950">
      <Table>
        <TableHeader>
          <TableRow>
            {selectable && (
              <TableHead className="w-10">
                <Checkbox
                  aria-label={t("selectAllAria")}
                  checked={allSelected ? true : someSelected ? "indeterminate" : false}
                  onCheckedChange={(checked) => onToggleAll?.(checked === true)}
                />
              </TableHead>
            )}
            <TableHead>{t("colOrder")}</TableHead>
            <TableHead>{t("colCustomer")}</TableHead>
            <TableHead>{t("colPhone")}</TableHead>
            <TableHead className="min-w-64">{t("colAddress")}</TableHead>
            <TableHead className="text-end">{t("colAmount")}</TableHead>
            <TableHead className="text-end">{t("colDelivery")}</TableHead>
            <TableHead className="text-end">{t("colDiscount")}</TableHead>
            <TableHead>{t("colPayment")}</TableHead>
            <TableHead>{t("colProvider")}</TableHead>
            <TableHead>{t("colRider")}</TableHead>
            <TableHead>{t("colStatus")}</TableHead>
            <TableHead>{t("colCreated")}</TableHead>
            <TableHead>{t("colUpdated")}</TableHead>
            {showRowAction && <TableHead className="w-32" />}
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.orderId} data-state={selected?.has(row.orderId) ? "selected" : undefined}>
              {selectable && (
                <TableCell>
                  <Checkbox
                    aria-label={t("selectOrderAria", { number: row.orderNumber })}
                    checked={selected?.has(row.orderId) ?? false}
                    onCheckedChange={() => onToggle?.(row.orderId)}
                  />
                </TableCell>
              )}
              <TableCell className="font-medium">
                <Link
                  href={`/orders/${row.orderId}`}
                  className="hover:underline"
                >
                  {row.orderNumber}
                </Link>
              </TableCell>
              <TableCell>{row.customerName ?? emDash}</TableCell>
              <TableCell className="whitespace-nowrap">
                {row.addressPhone ?? row.customerPhone ?? emDash}
              </TableCell>
              <TableCell className="max-w-80 text-muted-foreground">
                <div className="flex items-start gap-2">
                  <span className="min-w-0 truncate">
                    {formatAddress(
                      row.addressLine1
                        ? {
                            addressLine1: row.addressLine1,
                            addressLine2: row.addressLine2,
                            city: row.city ?? "",
                            state: row.state ?? "",
                            postalCode: row.postalCode,
                            country: row.country,
                          }
                        : null
                    )}
                  </span>
                  <MapsLinkButton
                    type="navigation"
                    latitude={row.latitude}
                    longitude={row.longitude}
                    size="sm"
                    className="shrink-0"
                  />
                </div>
              </TableCell>
              <TableCell className="whitespace-nowrap text-end">
                {formatCurrency(Number(row.totalAmount))}
              </TableCell>
              <TableCell className="whitespace-nowrap text-end text-muted-foreground">
                {formatCurrency(Number(row.shippingCost ?? 0))}
              </TableCell>
              <TableCell className="whitespace-nowrap text-end text-muted-foreground">
                {Number(row.discountAmount ?? 0) > 0
                  ? `-${formatCurrency(Number(row.discountAmount))}`
                  : emDash}
              </TableCell>
              <TableCell>
                <Badge className={getPaymentStatusColor(row.paymentStatus ?? "")}>
                  {tPayment((row.paymentStatus ?? "unknown") as "pending")}
                </Badge>
              </TableCell>
              <TableCell>{row.providerName ?? emDash}</TableCell>
              <TableCell>{row.riderName ?? emDash}</TableCell>
              <TableCell>
                <Badge className={getStatusColor(row.shippingStatus)}>
                  {tStatus(row.shippingStatus as "pending")}
                </Badge>
              </TableCell>
              <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                {formatDate(row.createdAt, locale)}
              </TableCell>
              <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                {formatDate(row.updatedAt, locale)}
              </TableCell>
              {showRowAction && (
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={rowActionPending}
                    onClick={() => onRowAction?.(row.orderId)}
                  >
                    {rowActionLabel}
                  </Button>
                </TableCell>
              )}
              <TableCell>
                <Link
                  href={`/orders/${row.orderId}`}
                  aria-label={t("openOrderAria", { number: row.orderNumber })}
                  className="inline-flex text-muted-foreground hover:text-foreground"
                >
                  <ChevronRight className="size-4 rtl:rotate-180" />
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
