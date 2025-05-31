"use client";
import { useState } from "react";
import { Gift, Plus, Edit, Trash2, Search, Calendar } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Badge } from "@workspace/ui/components/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";

interface Coupon {
  id: string;
  code: string;
  description: string;
  type: "percentage" | "fixed";
  value: number;
  minOrder: number;
  usage: number;
  maxUsage: number;
  expiryDate: string;
  status: "active" | "inactive" | "expired";
}

const initialCoupons: Coupon[] = [
  {
    id: "1",
    code: "SAVE20",
    description: "20% off all electronics",
    type: "percentage",
    value: 20,
    minOrder: 100,
    usage: 45,
    maxUsage: 100,
    expiryDate: "2024-12-31",
    status: "active",
  },
  {
    id: "2",
    code: "NEWUSER50",
    description: "$50 off for new customers",
    type: "fixed",
    value: 50,
    minOrder: 200,
    usage: 23,
    maxUsage: 50,
    expiryDate: "2024-06-30",
    status: "active",
  },
  {
    id: "3",
    code: "FLASH10",
    description: "10% flash sale discount",
    type: "percentage",
    value: 10,
    minOrder: 50,
    usage: 150,
    maxUsage: 150,
    expiryDate: "2024-01-15",
    status: "expired",
  },
];

export const CouponsManagement = () => {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    type: "percentage" as "percentage" | "fixed",
    value: 0,
    minOrder: 0,
    maxUsage: 100,
    expiryDate: "",
  });

  const filteredCoupons = coupons.filter(
    (coupon) =>
      coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coupon.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingCoupon) {
      setCoupons(
        coupons.map((coupon) =>
          coupon.id === editingCoupon.id
            ? { ...coupon, ...formData, status: "active" as const }
            : coupon
        )
      );
    } else {
      const newCoupon: Coupon = {
        id: Date.now().toString(),
        ...formData,
        usage: 0,
        status: "active",
      };
      setCoupons([...coupons, newCoupon]);
    }

    resetForm();
    setIsDialogOpen(false);
  };

  const resetForm = () => {
    setFormData({
      code: "",
      description: "",
      type: "percentage",
      value: 0,
      minOrder: 0,
      maxUsage: 100,
      expiryDate: "",
    });
    setEditingCoupon(null);
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description,
      type: coupon.type,
      value: coupon.value,
      minOrder: coupon.minOrder,
      maxUsage: coupon.maxUsage,
      expiryDate: coupon.expiryDate,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setCoupons(coupons.filter((coupon) => coupon.id !== id));
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Coupons & Discounts
          </h1>
          <p className="text-gray-600 mt-1">
            Manage promotional codes and discount campaigns
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-[#E9520E] hover:bg-[#D4460C]"
              onClick={resetForm}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Coupon
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingCoupon ? "Edit Coupon" : "Create New Coupon"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="code">Coupon Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  placeholder="e.g., SAVE20"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Brief description of the coupon"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Discount Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: "percentage" | "fixed") =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="value">Value</Label>
                  <Input
                    id="value"
                    type="number"
                    value={formData.value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        value: Number(e.target.value),
                      })
                    }
                    placeholder={formData.type === "percentage" ? "20" : "50"}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minOrder">Min Order Value</Label>
                  <Input
                    id="minOrder"
                    type="number"
                    value={formData.minOrder}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minOrder: Number(e.target.value),
                      })
                    }
                    placeholder="100"
                  />
                </div>
                <div>
                  <Label htmlFor="maxUsage">Max Usage</Label>
                  <Input
                    id="maxUsage"
                    type="number"
                    value={formData.maxUsage}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxUsage: Number(e.target.value),
                      })
                    }
                    placeholder="100"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) =>
                    setFormData({ ...formData, expiryDate: e.target.value })
                  }
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#E9520E] hover:bg-[#D4460C]"
                >
                  {editingCoupon ? "Update" : "Create"} Coupon
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Coupons</p>
                <p className="text-2xl font-bold text-gray-900">
                  {coupons.filter((c) => c.status === "active").length}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Gift className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Redemptions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {coupons.reduce((sum, c) => sum + c.usage, 0)}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Discount</p>
                <p className="text-2xl font-bold text-gray-900">15.5%</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Gift className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Revenue Impact</p>
                <p className="text-2xl font-bold text-gray-900">$12.5K</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <Gift className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search coupons by code or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Coupons Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Coupons</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCoupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell className="font-medium">{coupon.code}</TableCell>
                  <TableCell>{coupon.description}</TableCell>
                  <TableCell>
                    {coupon.type === "percentage"
                      ? `${coupon.value}%`
                      : `$${coupon.value}`}
                  </TableCell>
                  <TableCell>
                    {coupon.usage}/{coupon.maxUsage}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        coupon.status === "active"
                          ? "default"
                          : coupon.status === "expired"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {coupon.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{coupon.expiryDate}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(coupon)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(coupon.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
