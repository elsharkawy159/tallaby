"use client";
import { useState, useEffect } from "react";
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
import { CouponForm } from "@/components/forms/coupon-form";
import { GuidanceWidget } from "@/components/layout/GuidanceWidget";

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
    if (confirm("Are you sure you want to delete this coupon?")) {
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
    if (!coupon.isActive) return <Badge variant="secondary">Inactive</Badge>;
    if (coupon.isExpired) return <Badge variant="destructive">Expired</Badge>;
    if (coupon.isNotStarted) return <Badge variant="outline">Pending</Badge>;
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit)
      return <Badge variant="secondary">Exhausted</Badge>;
    return <Badge variant="default">Active</Badge>;
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
            <span>${coupon.discountValue}</span>
          </div>
        );
      case "free_shipping":
        return <Badge variant="outline">Free Shipping</Badge>;
      case "buy_x_get_y":
        return <Badge variant="outline">Buy X Get Y</Badge>;
      default:
        return <span>{coupon.discountValue}</span>;
    }
  };

  const getUsageProgress = (coupon: Coupon) => {
    if (!coupon.usageLimit) return null;
    const percentage = (coupon.usageCount / coupon.usageLimit) * 100;
    return (
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Coupons Management
          </h1>
          <p className="text-gray-600">
            Create and manage promotional coupons and discounts
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Coupons
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{coupons.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Coupons
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
              <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
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
                Expired Coupons
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
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search coupons..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button onClick={handleAddCoupon}>
              <Plus className="h-4 w-4 mr-2" />
              Create Coupon
            </Button>
          </div>
        </div>

        {/* Coupons Table */}
        <Card>
          <CardHeader>
            <CardTitle>Coupons</CardTitle>
            <CardDescription>
              Manage your promotional coupons and discounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Coupon</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Validity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium bg-gray-100 px-2 py-1 rounded text-sm">
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
                        <div className="text-sm text-gray-500">
                          {coupon.name}
                        </div>
                        {coupon.description && (
                          <div className="text-xs text-gray-400">
                            {coupon.description.substring(0, 50)}...
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {getDiscountDisplay(coupon)}
                        {coupon.minimumPurchase && (
                          <div className="text-xs text-gray-500">
                            Min: ${coupon.minimumPurchase}
                          </div>
                        )}
                        {coupon.maximumDiscount && (
                          <div className="text-xs text-gray-500">
                            Max: ${coupon.maximumDiscount}
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
                          <div className="text-xs text-gray-500">
                            {coupon.perUserLimit} per user
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          <span>
                            From:{" "}
                            {new Date(coupon.startsAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          <span>
                            To:{" "}
                            {new Date(coupon.expiresAt).toLocaleDateString()}
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
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => handleEditCoupon(coupon)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => copyToClipboard(coupon.code)}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Code
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteCoupon(coupon.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
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
                Previous
              </Button>
              <span className="flex items-center px-4">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Coupon Form Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCoupon ? "Edit Coupon" : "Create New Coupon"}
              </DialogTitle>
              <DialogDescription>
                {editingCoupon
                  ? "Update your coupon settings"
                  : "Create a new promotional coupon"}
              </DialogDescription>
            </DialogHeader>
            <CouponForm
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
            />
          </DialogContent>
        </Dialog>

        <GuidanceWidget
          title="Coupon Management Tips"
          tips={[
            "Use clear, memorable coupon codes that are easy to type",
            "Set reasonable usage limits to prevent abuse",
            "Monitor coupon performance and adjust strategies accordingly",
            "Create time-limited offers to drive urgency",
            "Test different discount types to see what works best",
            "Keep track of coupon usage and customer behavior",
          ]}
        />
      </div>
    </div>
  );
};
