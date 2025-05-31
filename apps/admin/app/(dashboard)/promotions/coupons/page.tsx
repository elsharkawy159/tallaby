//@ts-ignore
//@ts-nocheck
"use client";
import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { Input } from "@workspace/ui/components/input";
import {
  Plus,
  Filter,
  Download,
  Search,
  MoreHorizontal,
  TagIcon,
  Calendar,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertCircle,
  Copy,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { format } from "date-fns";
import { DataTable } from "@/app/(dashboard)/_components/data-table/data-table";

// Mock data for demonstration
const coupons = [
  {
    id: "coupon_001",
    code: "WELCOME20",
    name: "New User Discount",
    description: "20% off for new customers",
    discountType: "percentage",
    discountValue: 20,
    minimumPurchase: 50,
    maximumDiscount: 100,
    isActive: true,
    isOneTimeUse: false,
    usageLimit: 1000,
    usageCount: 352,
    perUserLimit: 1,
    applicableTo: {
      type: "global",
      categories: [],
      products: [],
    },
    excludeItems: {
      categories: ["cat_01"],
      products: [],
    },
    startsAt: "2023-09-01T00:00:00Z",
    expiresAt: "2023-12-31T23:59:59Z",
    createdAt: "2023-08-15T10:30:00Z",
    updatedAt: "2023-10-10T14:15:00Z",
  },
  {
    id: "coupon_002",
    code: "SUMMER30",
    name: "Summer Sale",
    description: "30% off on summer collection",
    discountType: "percentage",
    discountValue: 30,
    minimumPurchase: 75,
    maximumDiscount: 150,
    isActive: false,
    isOneTimeUse: false,
    usageLimit: 500,
    usageCount: 487,
    perUserLimit: 1,
    applicableTo: {
      type: "categories",
      categories: ["cat_07", "cat_08", "cat_09"],
      products: [],
    },
    excludeItems: {
      categories: [],
      products: [],
    },
    startsAt: "2023-06-01T00:00:00Z",
    expiresAt: "2023-08-31T23:59:59Z",
    createdAt: "2023-05-15T11:45:00Z",
    updatedAt: "2023-09-01T09:30:00Z",
  },
  {
    id: "coupon_003",
    code: "FLASH50",
    name: "Flash Sale",
    description: "50% off for 24 hours only",
    discountType: "percentage",
    discountValue: 50,
    minimumPurchase: 100,
    maximumDiscount: 200,
    isActive: true,
    isOneTimeUse: false,
    usageLimit: 200,
    usageCount: 87,
    perUserLimit: 1,
    applicableTo: {
      type: "products",
      categories: [],
      products: ["prod_01", "prod_05", "prod_10"],
    },
    excludeItems: {
      categories: [],
      products: [],
    },
    startsAt: "2023-10-15T00:00:00Z",
    expiresAt: "2023-10-16T00:00:00Z",
    createdAt: "2023-10-10T16:30:00Z",
    updatedAt: "2023-10-14T12:00:00Z",
  },
  {
    id: "coupon_004",
    code: "FREESHIP",
    name: "Free Shipping",
    description: "Free shipping on all orders",
    discountType: "free_shipping",
    discountValue: 0,
    minimumPurchase: 25,
    maximumDiscount: null,
    isActive: true,
    isOneTimeUse: false,
    usageLimit: null,
    usageCount: 943,
    perUserLimit: null,
    applicableTo: {
      type: "global",
      categories: [],
      products: [],
    },
    excludeItems: {
      categories: [],
      products: [],
    },
    startsAt: "2023-01-01T00:00:00Z",
    expiresAt: "2023-12-31T23:59:59Z",
    createdAt: "2022-12-15T09:00:00Z",
    updatedAt: "2023-10-05T11:20:00Z",
  },
  {
    id: "coupon_005",
    code: "FIXED25",
    name: "$25 Off",
    description: "$25 off on orders over $150",
    discountType: "fixed_amount",
    discountValue: 25,
    minimumPurchase: 150,
    maximumDiscount: null,
    isActive: true,
    isOneTimeUse: false,
    usageLimit: 300,
    usageCount: 124,
    perUserLimit: 1,
    applicableTo: {
      type: "global",
      categories: [],
      products: [],
    },
    excludeItems: {
      categories: [],
      products: ["prod_03", "prod_07"],
    },
    startsAt: "2023-09-15T00:00:00Z",
    expiresAt: "2023-11-15T23:59:59Z",
    createdAt: "2023-09-10T14:30:00Z",
    updatedAt: "2023-10-12T15:45:00Z",
  },
  {
    id: "coupon_006",
    code: "BOGO",
    name: "Buy One Get One",
    description: "Buy one, get one free",
    discountType: "buy_x_get_y",
    discountValue: 100,
    minimumPurchase: null,
    maximumDiscount: null,
    isActive: true,
    isOneTimeUse: false,
    usageLimit: 200,
    usageCount: 78,
    perUserLimit: 2,
    applicableTo: {
      type: "categories",
      categories: ["cat_06"],
      products: [],
    },
    excludeItems: {
      categories: [],
      products: [],
    },
    startsAt: "2023-10-01T00:00:00Z",
    expiresAt: "2023-10-31T23:59:59Z",
    createdAt: "2023-09-20T10:15:00Z",
    updatedAt: "2023-10-08T09:30:00Z",
  },
  {
    id: "coupon_007",
    code: "VIP15",
    name: "VIP Discount",
    description: "15% off for VIP customers",
    discountType: "percentage",
    discountValue: 15,
    minimumPurchase: null,
    maximumDiscount: 100,
    isActive: true,
    isOneTimeUse: true,
    usageLimit: 500,
    usageCount: 132,
    perUserLimit: 1,
    applicableTo: {
      type: "global",
      categories: [],
      products: [],
    },
    excludeItems: {
      categories: ["cat_02"],
      products: [],
    },
    startsAt: "2023-08-01T00:00:00Z",
    expiresAt: "2023-12-31T23:59:59Z",
    createdAt: "2023-07-25T16:45:00Z",
    updatedAt: "2023-10-02T13:20:00Z",
  },
  {
    id: "coupon_008",
    code: "HOLIDAY10",
    name: "Holiday Special",
    description: "10% off for the holiday season",
    discountType: "percentage",
    discountValue: 10,
    minimumPurchase: 30,
    maximumDiscount: 50,
    isActive: false,
    isOneTimeUse: false,
    usageLimit: 1000,
    usageCount: 0,
    perUserLimit: 1,
    applicableTo: {
      type: "global",
      categories: [],
      products: [],
    },
    excludeItems: {
      categories: [],
      products: [],
    },
    startsAt: "2023-12-01T00:00:00Z",
    expiresAt: "2023-12-25T23:59:59Z",
    createdAt: "2023-10-15T11:30:00Z",
    updatedAt: "2023-10-15T11:30:00Z",
  },
];

export default function CouponsPage() {
  const columns = [
    {
      accessorKey: "code",
      header: "Coupon Code",
      cell: ({ row }) => {
        const code = row.getValue("code") as string;
        const name = row.original.name;

        return (
          <div>
            <div className="flex items-center">
              <span className="font-mono font-medium bg-gray-100 px-2 py-1 rounded border">
                {code}
              </span>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 ml-1"
                onClick={() => {
                  navigator.clipboard.writeText(code);
                }}
              >
                <Copy className="h-3.5 w-3.5 text-gray-500" />
              </Button>
            </div>
            <div className="text-sm mt-1">
              <Link
                href={`/withAuth/promotions/coupons/${row.original.id}`}
                className="font-medium hover:underline"
              >
                {name}
              </Link>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "discountType",
      header: "Discount Type",
      cell: ({ row }) => {
        const type = row.getValue("discountType") as string;
        const value = row.original.discountValue;

        let displayValue = "";
        if (type === "percentage") {
          displayValue = `${value}% off`;
        } else if (type === "fixed_amount") {
          displayValue = `$${value} off`;
        } else if (type === "free_shipping") {
          displayValue = "Free shipping";
        } else if (type === "buy_x_get_y") {
          displayValue = "Buy one get one";
        }

        return <div>{displayValue}</div>;
      },
    },
    {
      accessorKey: "usageCount",
      header: "Usage",
      cell: ({ row }) => {
        const used = parseInt(row.getValue("usageCount"));
        const limit = row.original.usageLimit;

        return (
          <div className="flex flex-col">
            <div className="font-medium">{used}</div>
            {limit && (
              <div className="text-xs text-gray-500">
                of {limit} ({Math.round((used / limit) * 100)}%)
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "minimumPurchase",
      header: "Min. Purchase",
      cell: ({ row }) => {
        const minPurchase = row.getValue("minimumPurchase");
        if (!minPurchase) return <div>-</div>;

        return <div>${minPurchase}</div>;
      },
    },
    {
      accessorKey: "applicableTo",
      header: "Applies To",
      cell: ({ row }) => {
        const applicableTo = row.getValue("applicableTo") as any;

        if (applicableTo.type === "global") {
          return <div>All products</div>;
        } else if (applicableTo.type === "categories") {
          return (
            <div>
              <span className="text-sm">
                {applicableTo.categories.length} categories
              </span>
            </div>
          );
        } else if (applicableTo.type === "products") {
          return (
            <div>
              <span className="text-sm">
                {applicableTo.products.length} products
              </span>
            </div>
          );
        }

        return <div>-</div>;
      },
    },
    {
      accessorKey: "expiresAt",
      header: "Expiration",
      cell: ({ row }) => {
        const startsAt = new Date(row.original.startsAt);
        const expiresAt = new Date(row.getValue("expiresAt") as string);
        const now = new Date();

        const isExpired = expiresAt < now;
        const isActive = now >= startsAt && now <= expiresAt;

        return (
          <div className="flex flex-col">
            <div
              className={isExpired ? "text-red-600 font-medium" : "font-medium"}
            >
              {format(expiresAt, "MMM dd, yyyy")}
            </div>
            <div className="text-xs text-gray-500">
              {isExpired ? "Expired" : isActive ? "Active" : "Scheduled"}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("isActive") as boolean;
        const startsAt = new Date(row.original.startsAt);
        const expiresAt = new Date(row.original.expiresAt);
        const now = new Date();

        const isExpired = expiresAt < now;
        const isScheduled = startsAt > now;

        if (isExpired) {
          return (
            <Badge
              variant="outline"
              className="bg-red-50 text-red-700 border-red-200"
            >
              Expired
            </Badge>
          );
        } else if (!isActive) {
          return (
            <Badge
              variant="outline"
              className="bg-gray-100 text-gray-800 border-gray-200"
            >
              Inactive
            </Badge>
          );
        } else if (isScheduled) {
          return (
            <Badge
              variant="outline"
              className="bg-amber-50 text-amber-700 border-amber-200"
            >
              Scheduled
            </Badge>
          );
        } else {
          return (
            <Badge className="bg-green-100 text-green-800 border-green-200">
              Active
            </Badge>
          );
        }
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const coupon = row.original;

        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem>
                  <Link
                    href={`/withAuth/promotions/coupons/${coupon.id}`}
                    className="w-full"
                  >
                    View details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link
                    href={`/withAuth/promotions/coupons/${coupon.id}/edit`}
                    className="w-full"
                  >
                    Edit coupon
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => navigator.clipboard.writeText(coupon.code)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy code
                </DropdownMenuItem>
                <DropdownMenuItem>View usage stats</DropdownMenuItem>
                <DropdownMenuSeparator />
                {coupon.isActive ? (
                  <DropdownMenuItem>
                    <XCircle className="h-4 w-4 mr-2" />
                    Deactivate
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Activate
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem className="text-red-600">
                  Delete coupon
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  // Calculate coupon statistics
  const activeCoupons = coupons.filter(
    (c) =>
      c.isActive &&
      new Date(c.startsAt) <= new Date() &&
      new Date(c.expiresAt) >= new Date()
  ).length;
  const expiredCoupons = coupons.filter(
    (c) => new Date(c.expiresAt) < new Date()
  ).length;
  const scheduledCoupons = coupons.filter(
    (c) => c.isActive && new Date(c.startsAt) > new Date()
  ).length;
  const totalRedemptions = coupons.reduce((sum, c) => sum + c.usageCount, 0);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coupons</h1>
          <p className="text-muted-foreground">
            Create and manage discount coupons
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Link href="/withAuth/promotions/coupons/create">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Coupon
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TagIcon className="h-4 w-4 mr-2 text-gray-500" />
              Active Coupons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCoupons}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-gray-500" />
              Scheduled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduledCoupons}</div>
            <p className="text-xs text-muted-foreground">Upcoming promotions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertCircle className="h-4 w-4 mr-2 text-gray-500" />
              Expired
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiredCoupons}</div>
            <p className="text-xs text-muted-foreground">
              Past their expiration date
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CreditCard className="h-4 w-4 mr-2 text-gray-500" />
              Redemptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRedemptions}</div>
            <p className="text-xs text-muted-foreground">Total coupon uses</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-medium">Check Coupon</h2>
            <p className="text-sm text-gray-500">
              Verify a coupon code or generate a new coupon
            </p>
          </div>
          <div className="flex w-full md:w-auto items-center gap-2">
            <div className="relative flex-1 md:w-64">
              <Input
                type="text"
                placeholder="Enter coupon code..."
                className="pl-2 uppercase"
              />
            </div>
            <Button>Verify</Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="all-coupons">
        <TabsList>
          <TabsTrigger value="all-coupons">All Coupons</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
        </TabsList>
        <TabsContent value="all-coupons" className="p-0 mt-4">
          <DataTable
            columns={columns}
            data={coupons}
            searchableColumns={[
              {
                id: "code",
                title: "Coupon Code",
              },
              {
                id: "name",
                title: "Coupon Name",
              },
            ]}
            filterableColumns={[
              {
                id: "discountType",
                title: "Discount Type",
                options: [
                  { label: "Percentage", value: "percentage" },
                  { label: "Fixed Amount", value: "fixed_amount" },
                  { label: "Free Shipping", value: "free_shipping" },
                  { label: "Buy X Get Y", value: "buy_x_get_y" },
                ],
              },
              {
                id: "isActive",
                title: "Status",
                options: [
                  { label: "Active", value: "true" },
                  { label: "Inactive", value: "false" },
                ],
              },
            ]}
          />
        </TabsContent>
        <TabsContent value="active" className="p-0 mt-4">
          <DataTable
            columns={columns}
            data={coupons.filter(
              (c) =>
                c.isActive &&
                new Date(c.startsAt) <= new Date() &&
                new Date(c.expiresAt) >= new Date()
            )}
            searchableColumns={[
              {
                id: "code",
                title: "Coupon Code",
              },
              {
                id: "name",
                title: "Coupon Name",
              },
            ]}
          />
        </TabsContent>
        <TabsContent value="scheduled" className="p-0 mt-4">
          <DataTable
            columns={columns}
            data={coupons.filter(
              (c) => c.isActive && new Date(c.startsAt) > new Date()
            )}
            searchableColumns={[
              {
                id: "code",
                title: "Coupon Code",
              },
              {
                id: "name",
                title: "Coupon Name",
              },
            ]}
          />
        </TabsContent>
        <TabsContent value="expired" className="p-0 mt-4">
          <DataTable
            columns={columns}
            data={coupons.filter((c) => new Date(c.expiresAt) < new Date())}
            searchableColumns={[
              {
                id: "code",
                title: "Coupon Code",
              },
              {
                id: "name",
                title: "Coupon Name",
              },
            ]}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}
