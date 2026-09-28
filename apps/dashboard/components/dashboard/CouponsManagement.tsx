"use client";
import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  Copy,
  Calendar,
  Percent,
  DollarSign,
} from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Badge } from "@workspace/ui/components/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
// import { CouponForm } from "@/components/forms/coupon-form";
import { GuidanceWidget } from "@/components/layout/GuidanceWidget";
import { formatDate, formatMoney } from "@/lib/i18n/format";

interface Coupon {
  id: string;
  code: string;
  name: string;
  description?: string;
  discountType: "percentage" | "fixed_amount" | "buy_x_get_y" | "free_shipping";
  discountValue: number;
  minimumPurchase?: number;
  maximumDiscount?: number;
  isActive: boolean;
  isOneTimeUse: boolean;
  usageLimit?: number;
  usageCount: number;
  perUserLimit?: number;
  applicableTo?: string[];
  excludeItems?: string[];
  startsAt: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  // Computed fields
  usagePercentage?: number;
  status?: string;
  isExpired?: boolean;
  isNotStarted?: boolean;
}

export const CouponsManagement = () => {
  const t = useTranslations("coupons");
  const locale = useLocale();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | undefined>();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedDiscountType, setSelectedDiscountType] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Mock seller ID - in real app, get from auth context
  const sellerId = "123e4567-e89b-12d3-a456-426614174000";

  useEffect(() => {
    fetchCoupons();
  }, [currentPage, searchTerm, selectedStatus, selectedDiscountType]);

  const fetchCoupons = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        sellerId,
        page: currentPage.toString(),
        limit: "10",
        status: selectedStatus,
        discountType: selectedDiscountType,
      });

      const response = await fetch(`/api/vendor/coupons?${params}`);
      if (response.ok) {
        const data = await response.json();
        setCoupons(data.coupons);
        setTotalPages(data.pagination.totalPages);
      } else {
        console.error("Failed to fetch coupons");
      }
    } catch (error) {
      console.error("Error fetching coupons:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCoupon = () => {
    setEditingCoupon(undefined);
    setIsModalOpen(true);
  };

  const handleEditCoupon = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setIsModalOpen(true);
  };

  const handleDeleteCoupon = async (id: string) => {
    if (confirm(t("confirmDelete"))) {
      try {
        const response = await fetch(`/api/vendor/coupons/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          fetchCoupons();
        } else {
          console.error("Failed to delete coupon");
        }
      } catch (error) {
        console.error("Error deleting coupon:", error);
      }
    }
  };

  const handleSaveCoupon = async (couponData: any) => {
    try {
      const response = await fetch("/api/vendor/coupons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(couponData),
      });

      if (response.ok) {
        setIsModalOpen(false);
        fetchCoupons();
      } else {
        const error = await response.json();
        console.error("Failed to save coupon:", error);
      }
    } catch (error) {
      console.error("Error saving coupon:", error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const getStatusBadge = (coupon: Coupon) => {
    if (!coupon.isActive)
      return <Badge variant="secondary">{t("status.inactive")}</Badge>;
    if (coupon.isExpired)
      return <Badge variant="destructive">{t("status.expired")}</Badge>;
    if (coupon.isNotStarted)
      return <Badge variant="outline">{t("status.pending")}</Badge>;
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit)
      return <Badge variant="secondary">{t("status.exhausted")}</Badge>;
    return <Badge variant="default">{t("status.active")}</Badge>;
  };

  const getDiscountDisplay = (coupon: Coupon) => {
    switch (coupon.discountType) {
      case "percentage":
        return (
          <div className="flex items-center gap-1">
            <Percent className="h-4 w-4" />
            <span>{coupon.discountValue}%</span>
          </div>
        );
      case "fixed_amount":
        return (
          <div className="flex items-center gap-1">
            <DollarSign className="h-4 w-4" />
            <span dir="ltr">{formatMoney(coupon.discountValue, locale)}</span>
          </div>
        );
      case "free_shipping":
        return <Badge variant="outline">{t("type.freeShipping")}</Badge>;
      case "buy_x_get_y":
        return <Badge variant="outline">{t("type.buyXGetY")}</Badge>;
      default:
        return <span>{coupon.discountValue}</span>;
    }
  };

  const getUsageProgress = (coupon: Coupon) => {
    if (!coupon.usageLimit) return null;
    const percentage = (coupon.usageCount / coupon.usageLimit) * 100;
    return (
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      <div className="p-4 sm:p-6">
        <div className="mb-6">
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("stats.total")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{coupons.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("stats.active")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  coupons.filter(
                    (c) => c.isActive && !c.isExpired && !c.isNotStarted
                  ).length
                }
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("stats.usage")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {coupons.reduce((sum, c) => sum + c.usageCount, 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("stats.expired")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {coupons.filter((c) => c.isExpired).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={t("searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ps-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="h-4 w-4 me-2" />
              {t("filter")}
            </Button>
            <Button onClick={handleAddCoupon}>
              <Plus className="h-4 w-4 me-2" />
              {t("create")}
            </Button>
          </div>
        </div>

        {/* Coupons Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t("tableTitle")}</CardTitle>
            <CardDescription>{t("tableDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("columns.coupon")}</TableHead>
                  <TableHead>{t("columns.discount")}</TableHead>
                  <TableHead>{t("columns.usage")}</TableHead>
                  <TableHead>{t("columns.validity")}</TableHead>
                  <TableHead>{t("columns.status")}</TableHead>
                  <TableHead>{t("columns.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium bg-muted px-2 py-1 rounded text-sm">
                            {coupon.code}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(coupon.code)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {coupon.name}
                        </div>
                        {coupon.description && (
                          <div className="text-xs text-muted-foreground">
                            {coupon.description.substring(0, 50)}...
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {getDiscountDisplay(coupon)}
                        {coupon.minimumPurchase && (
                          <div className="text-xs text-muted-foreground">
                            {t("min", {
                              amount: formatMoney(coupon.minimumPurchase, locale),
                            })}
                          </div>
                        )}
                        {coupon.maximumDiscount && (
                          <div className="text-xs text-muted-foreground">
                            {t("max", {
                              amount: formatMoney(coupon.maximumDiscount, locale),
                            })}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="text-sm">
                          {coupon.usageCount}
                          {coupon.usageLimit && ` / ${coupon.usageLimit}`}
                        </div>
                        {getUsageProgress(coupon)}
                        {coupon.perUserLimit && (
                          <div className="text-xs text-muted-foreground">
                            {t("perUser", { count: coupon.perUserLimit })}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {t("from", { date: formatDate(coupon.startsAt, locale) })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {t("to", { date: formatDate(coupon.expiresAt, locale) })}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(coupon)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{t("columns.actions")}</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => handleEditCoupon(coupon)}
                          >
                            <Edit className="me-2 h-4 w-4" />
                            {t("edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => copyToClipboard(coupon.code)}
                          >
                            <Copy className="me-2 h-4 w-4" />
                            {t("copyCode")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteCoupon(coupon.id)}
                            className="text-red-600 dark:text-red-400"
                          >
                            <Trash2 className="me-2 h-4 w-4" />
                            {t("delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                {t("previous")}
              </Button>
              <span className="flex items-center px-4">
                {t("page", { page: currentPage, total: totalPages })}
              </span>
              <Button
                variant="outline"
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
              >
                {t("next")}
              </Button>
            </div>
          </div>
        )}

        {/* Coupon Form Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCoupon ? t("editTitle") : t("createTitle")}
              </DialogTitle>
              <DialogDescription>
                {editingCoupon ? t("editDescription") : t("createDescription")}
              </DialogDescription>
            </DialogHeader>
            {/* <CouponForm
              defaultValues={editingCoupon}
              onSubmit={handleSaveCoupon}
              onCancel={() => setIsModalOpen(false)}
              isLoading={isLoading}
              products={[
                { id: "1", name: "iPhone 15 Pro" },
                { id: "2", name: "MacBook Air M2" },
                { id: "3", name: "AirPods Pro" },
                { id: "4", name: "iPad Pro" },
              ]}
            /> */}
          </DialogContent>
        </Dialog>

        <GuidanceWidget
          title={t("tips.title")}
          tips={[
            t("tips.codes"),
            t("tips.limits"),
            t("tips.monitor"),
            t("tips.timeLimited"),
            t("tips.test"),
            t("tips.track"),
          ]}
        />
      </div>
    </div>
  );
};
