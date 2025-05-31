import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
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
import { Badge } from "@workspace/ui/components/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import {
  Plus,
  Filter,
  Download,
  Upload,
  Store,
  Users,
  ShoppingCart,
  CreditCard,
  Star,
  MoreHorizontal,
  CheckCircle,
  Clock,
  AlertTriangle,
  Ban,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";

// Mock data for demonstration
const sellers = [
  {
    id: "seller_001",
    businessName: "TechRetail Inc.",
    displayName: "TechRetail",
    slug: "techretail",
    logoUrl: "/api/placeholder/100/100",
    description: "Premium electronics retailer with a wide range of products.",
    businessType: "Corporation",
    isVerified: true,
    isOfficial: true,
    status: "approved",
    joinDate: "2023-01-15T10:30:00Z",
    productCount: 458,
    averageRating: 4.7,
    reviewCount: 543,
    totalSales: 234500,
    commissionRate: 10.0,
    walletBalance: 15780.45,
    supportEmail: "support@techretail.com",
  },
  {
    id: "seller_002",
    businessName: "MobileDepot LLC",
    displayName: "MobileDepot",
    slug: "mobiledepot",
    logoUrl: "/api/placeholder/100/100",
    description: "Specialized in mobile phones and accessories.",
    businessType: "LLC",
    isVerified: true,
    isOfficial: false,
    status: "approved",
    joinDate: "2023-02-10T14:45:00Z",
    productCount: 215,
    averageRating: 4.5,
    reviewCount: 327,
    totalSales: 156000,
    commissionRate: 12.5,
    walletBalance: 9320.8,
    supportEmail: "support@mobiledepot.com",
  },
  {
    id: "seller_003",
    businessName: "AudioGear Solutions",
    displayName: "AudioGear",
    slug: "audiogear",
    logoUrl: "/api/placeholder/100/100",
    description: "Premium audio equipment and accessories.",
    businessType: "Partnership",
    isVerified: true,
    isOfficial: false,
    status: "approved",
    joinDate: "2023-03-05T09:15:00Z",
    productCount: 178,
    averageRating: 4.6,
    reviewCount: 243,
    totalSales: 127600,
    commissionRate: 15.0,
    walletBalance: 7450.3,
    supportEmail: "support@audiogear.com",
  },
  {
    id: "seller_004",
    businessName: "FashionTrends Co.",
    displayName: "FashionTrends",
    slug: "fashiontrends",
    logoUrl: "/api/placeholder/100/100",
    description: "Latest fashion apparel and accessories.",
    businessType: "Corporation",
    isVerified: true,
    isOfficial: true,
    status: "approved",
    joinDate: "2023-04-12T11:30:00Z",
    productCount: 352,
    averageRating: 4.4,
    reviewCount: 412,
    totalSales: 187300,
    commissionRate: 12.0,
    walletBalance: 12580.75,
    supportEmail: "support@fashiontrends.com",
  },
  {
    id: "seller_005",
    businessName: "HomeGoods Plus",
    displayName: "HomeGoods+",
    slug: "homegoods-plus",
    logoUrl: "/api/placeholder/100/100",
    description: "Home decor and kitchen essentials.",
    businessType: "LLC",
    isVerified: true,
    isOfficial: false,
    status: "approved",
    joinDate: "2023-05-08T16:20:00Z",
    productCount: 267,
    averageRating: 4.3,
    reviewCount: 289,
    totalSales: 145800,
    commissionRate: 13.5,
    walletBalance: 8970.6,
    supportEmail: "support@homegoodsplus.com",
  },
  {
    id: "seller_006",
    businessName: "BookHaven Online",
    displayName: "BookHaven",
    slug: "bookhaven",
    logoUrl: "/api/placeholder/100/100",
    description: "Wide selection of books across all genres.",
    businessType: "Sole Proprietorship",
    isVerified: true,
    isOfficial: false,
    status: "approved",
    joinDate: "2023-06-15T13:40:00Z",
    productCount: 523,
    averageRating: 4.8,
    reviewCount: 378,
    totalSales: 98700,
    commissionRate: 14.0,
    walletBalance: 6540.25,
    supportEmail: "support@bookhaven.com",
  },
  {
    id: "seller_007",
    businessName: "SportsFan Supply",
    displayName: "SportsFan",
    slug: "sportsfan",
    logoUrl: "/api/placeholder/100/100",
    description: "Sports equipment and fan merchandise.",
    businessType: "LLC",
    isVerified: false,
    isOfficial: false,
    status: "pending",
    joinDate: "2023-08-23T10:15:00Z",
    productCount: 42,
    averageRating: 0,
    reviewCount: 0,
    totalSales: 0,
    commissionRate: 15.0,
    walletBalance: 0,
    supportEmail: "support@sportsfan.com",
  },
  {
    id: "seller_008",
    businessName: "Toy Universe Ltd.",
    displayName: "Toy Universe",
    slug: "toy-universe",
    logoUrl: "/api/placeholder/100/100",
    description: "Toys and games for all ages.",
    businessType: "Corporation",
    isVerified: false,
    isOfficial: false,
    status: "suspended",
    joinDate: "2023-03-18T14:50:00Z",
    productCount: 187,
    averageRating: 3.2,
    reviewCount: 132,
    totalSales: 76400,
    commissionRate: 15.0,
    walletBalance: 4320.15,
    supportEmail: "support@toyuniverse.com",
  },
];

export default function SellersPage() {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sellers</h1>
          <p className="text-muted-foreground">
            Manage marketplace sellers and their accounts
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
          <Link href="/withAuth/sellers/create">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Seller
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Store className="h-4 w-4 mr-2 text-gray-500" />
              Total Sellers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sellers.length}</div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-2 text-gray-500" />
              Active Sellers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sellers.filter((s) => s.status === "approved").length}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round(
                (sellers.filter((s) => s.status === "approved").length /
                  sellers.length) *
                  100
              )}
              % of total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <ShoppingCart className="h-4 w-4 mr-2 text-gray-500" />
              Total Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sellers.reduce((sum, seller) => sum + seller.productCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Across all sellers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CreditCard className="h-4 w-4 mr-2 text-gray-500" />
              Revenue Generated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                maximumFractionDigits: 0,
              }).format(
                sellers.reduce((sum, seller) => sum + seller.totalSales, 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">Total seller sales</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all-sellers">
        <TabsList>
          <TabsTrigger value="all-sellers">All Sellers</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="pending">Pending Approval</TabsTrigger>
          <TabsTrigger value="suspended">Suspended</TabsTrigger>
        </TabsList>
        <TabsContent value="all-sellers" className="p-0 mt-4">
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50 dark:bg-gray-800">
                  <th className="py-4 px-4 text-left text-sm font-medium">
                    Seller
                  </th>
                  <th className="py-4 px-4 text-center text-sm font-medium">
                    Status
                  </th>
                  <th className="py-4 px-4 text-center text-sm font-medium">
                    Products
                  </th>
                  <th className="py-4 px-4 text-center text-sm font-medium">
                    Rating
                  </th>
                  <th className="py-4 px-4 text-center text-sm font-medium">
                    Commission
                  </th>
                  <th className="py-4 px-4 text-right text-sm font-medium">
                    Sales
                  </th>
                  <th className="py-4 px-4 text-right text-sm font-medium">
                    Balance
                  </th>
                  <th className="py-4 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {sellers.map((seller) => (
                  <tr
                    key={seller.id}
                    className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={seller.logoUrl} />
                          <AvatarFallback>
                            {seller.displayName.substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <Link
                            href={`/withAuth/sellers/${seller.id}`}
                            className="font-medium hover:underline"
                          >
                            {seller.businessName}
                          </Link>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            {seller.displayName}
                            {seller.isVerified && (
                              <CheckCircle className="h-3 w-3 text-blue-500" />
                            )}
                            {seller.isOfficial && (
                              <Badge
                                variant="outline"
                                className="text-xs h-4 bg-blue-50 text-blue-700 border-blue-200"
                              >
                                Official
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <StatusBadge status={seller.status} />
                    </td>
                    <td className="py-4 px-4 text-center">
                      {seller.productCount}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                          <span className="ml-1 font-medium">
                            {seller.averageRating
                              ? seller.averageRating.toFixed(1)
                              : "N/A"}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {seller.reviewCount} reviews
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      {seller.commissionRate}%
                    </td>
                    <td className="py-4 px-4 text-right font-medium">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                        maximumFractionDigits: 0,
                      }).format(seller.totalSales)}
                    </td>
                    <td className="py-4 px-4 text-right font-medium">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                        maximumFractionDigits: 2,
                      }).format(seller.walletBalance)}
                    </td>
                    <td className="py-4 px-4">
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
                              href={`/withAuth/sellers/${seller.id}`}
                              className="w-full"
                            >
                              View details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Link
                              href={`/withAuth/sellers/${seller.id}/edit`}
                              className="w-full"
                            >
                              Edit seller
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Link
                              href={`/withAuth/sellers/${seller.id}/products`}
                              className="w-full"
                            >
                              View products
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Link
                              href={`/withAuth/sellers/${seller.id}/orders`}
                              className="w-full"
                            >
                              View orders
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Link
                              href={`/withAuth/sellers/${seller.id}/payouts`}
                              className="w-full"
                            >
                              Manage payouts
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {seller.status === "pending" && (
                            <DropdownMenuItem>Approve seller</DropdownMenuItem>
                          )}
                          {seller.status === "approved" && (
                            <DropdownMenuItem className="text-red-600">
                              Suspend seller
                            </DropdownMenuItem>
                          )}
                          {seller.status === "suspended" && (
                            <DropdownMenuItem className="text-green-600">
                              Reactivate seller
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
        <TabsContent value="approved" className="p-0 mt-4">
          <div className="rounded-md border">
            <table className="w-full">
              {/* Same table structure as above, but filtered for approved sellers */}
              <thead>
                <tr className="border-b bg-gray-50 dark:bg-gray-800">
                  <th className="py-4 px-4 text-left text-sm font-medium">
                    Seller
                  </th>
                  <th className="py-4 px-4 text-center text-sm font-medium">
                    Status
                  </th>
                  <th className="py-4 px-4 text-center text-sm font-medium">
                    Products
                  </th>
                  <th className="py-4 px-4 text-center text-sm font-medium">
                    Rating
                  </th>
                  <th className="py-4 px-4 text-center text-sm font-medium">
                    Commission
                  </th>
                  <th className="py-4 px-4 text-right text-sm font-medium">
                    Sales
                  </th>
                  <th className="py-4 px-4 text-right text-sm font-medium">
                    Balance
                  </th>
                  <th className="py-4 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {sellers
                  .filter((seller) => seller.status === "approved")
                  .map((seller) => (
                    <tr
                      key={seller.id}
                      className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      {/* Same row structure as above */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={seller.logoUrl} />
                            <AvatarFallback>
                              {seller.displayName.substring(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <Link
                              href={`/withAuth/sellers/${seller.id}`}
                              className="font-medium hover:underline"
                            >
                              {seller.businessName}
                            </Link>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              {seller.displayName}
                              {seller.isVerified && (
                                <CheckCircle className="h-3 w-3 text-blue-500" />
                              )}
                              {seller.isOfficial && (
                                <Badge
                                  variant="outline"
                                  className="text-xs h-4 bg-blue-50 text-blue-700 border-blue-200"
                                >
                                  Official
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <StatusBadge status={seller.status} />
                      </td>
                      <td className="py-4 px-4 text-center">
                        {seller.productCount}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex flex-col items-center">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                            <span className="ml-1 font-medium">
                              {seller.averageRating
                                ? seller.averageRating.toFixed(1)
                                : "N/A"}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {seller.reviewCount} reviews
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        {seller.commissionRate}%
                      </td>
                      <td className="py-4 px-4 text-right font-medium">
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                          maximumFractionDigits: 0,
                        }).format(seller.totalSales)}
                      </td>
                      <td className="py-4 px-4 text-right font-medium">
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                          maximumFractionDigits: 2,
                        }).format(seller.walletBalance)}
                      </td>
                      <td className="py-4 px-4">
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
                                href={`/withAuth/sellers/${seller.id}`}
                                className="w-full"
                              >
                                View details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Link
                                href={`/withAuth/sellers/${seller.id}/edit`}
                                className="w-full"
                              >
                                Edit seller
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Link
                                href={`/withAuth/sellers/${seller.id}/products`}
                                className="w-full"
                              >
                                View products
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Link
                                href={`/withAuth/sellers/${seller.id}/orders`}
                                className="w-full"
                              >
                                View orders
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Link
                                href={`/withAuth/sellers/${seller.id}/payouts`}
                                className="w-full"
                              >
                                Manage payouts
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              Suspend seller
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
        <TabsContent value="pending" className="p-0 mt-4">
          {/* Similar table for pending sellers */}
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50 dark:bg-gray-800">
                  <th className="py-4 px-4 text-left text-sm font-medium">
                    Seller
                  </th>
                  <th className="py-4 px-4 text-center text-sm font-medium">
                    Status
                  </th>
                  <th className="py-4 px-4 text-center text-sm font-medium">
                    Products
                  </th>
                  <th className="py-4 px-4 text-center text-sm font-medium">
                    Business Type
                  </th>
                  <th className="py-4 px-4 text-center text-sm font-medium">
                    Join Date
                  </th>
                  <th className="py-4 px-4 text-center text-sm font-medium">
                    Support Email
                  </th>
                  <th className="py-4 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {sellers
                  .filter((seller) => seller.status === "pending")
                  .map((seller) => (
                    <tr
                      key={seller.id}
                      className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={seller.logoUrl} />
                            <AvatarFallback>
                              {seller.displayName.substring(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <Link
                              href={`/withAuth/sellers/${seller.id}`}
                              className="font-medium hover:underline"
                            >
                              {seller.businessName}
                            </Link>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              {seller.displayName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <StatusBadge status={seller.status} />
                      </td>
                      <td className="py-4 px-4 text-center">
                        {seller.productCount}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {seller.businessType}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {new Date(seller.joinDate).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {seller.supportEmail}
                      </td>
                      <td className="py-4 px-4">
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
                                href={`/withAuth/sellers/${seller.id}`}
                                className="w-full"
                              >
                                View details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-green-600">
                              Approve seller
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              Reject seller
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
        <TabsContent value="suspended" className="p-0 mt-4">
          {/* Similar table for suspended sellers */}
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50 dark:bg-gray-800">
                  <th className="py-4 px-4 text-left text-sm font-medium">
                    Seller
                  </th>
                  <th className="py-4 px-4 text-center text-sm font-medium">
                    Status
                  </th>
                  <th className="py-4 px-4 text-center text-sm font-medium">
                    Products
                  </th>
                  <th className="py-4 px-4 text-center text-sm font-medium">
                    Rating
                  </th>
                  <th className="py-4 px-4 text-right text-sm font-medium">
                    Sales
                  </th>
                  <th className="py-4 px-4 text-right text-sm font-medium">
                    Balance
                  </th>
                  <th className="py-4 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {sellers
                  .filter((seller) => seller.status === "suspended")
                  .map((seller) => (
                    <tr
                      key={seller.id}
                      className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={seller.logoUrl} />
                            <AvatarFallback>
                              {seller.displayName.substring(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <Link
                              href={`/withAuth/sellers/${seller.id}`}
                              className="font-medium hover:underline"
                            >
                              {seller.businessName}
                            </Link>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              {seller.displayName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <StatusBadge status={seller.status} />
                      </td>
                      <td className="py-4 px-4 text-center">
                        {seller.productCount}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex flex-col items-center">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                            <span className="ml-1 font-medium">
                              {seller.averageRating
                                ? seller.averageRating.toFixed(1)
                                : "N/A"}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {seller.reviewCount} reviews
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right font-medium">
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                          maximumFractionDigits: 0,
                        }).format(seller.totalSales)}
                      </td>
                      <td className="py-4 px-4 text-right font-medium">
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                          maximumFractionDigits: 2,
                        }).format(seller.walletBalance)}
                      </td>
                      <td className="py-4 px-4">
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
                                href={`/withAuth/sellers/${seller.id}`}
                                className="w-full"
                              >
                                View details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-green-600">
                              Reactivate seller
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "approved":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 px-2 flex items-center gap-1 justify-center">
          <CheckCircle className="h-3 w-3" />
          Approved
        </Badge>
      );
    case "pending":
      return (
        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 px-2 flex items-center gap-1 justify-center">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      );
    case "suspended":
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100 px-2 flex items-center gap-1 justify-center">
          <Ban className="h-3 w-3" />
          Suspended
        </Badge>
      );
    case "restricted":
      return (
        <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 px-2 flex items-center gap-1 justify-center">
          <AlertTriangle className="h-3 w-3" />
          Restricted
        </Badge>
      );
    default:
      return (
        <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100 px-2">
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
  }
}
