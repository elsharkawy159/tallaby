import {
  TrendingUp,
  Users,
  Target,
  DollarSign,
  BarChart3,
  Mail,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { Progress } from "@workspace/ui/components/progress";
import { useTranslations } from "next-intl";
import { parseCurrencyAmount } from "@workspace/lib";

const campaigns = [
  {
    id: "CAM001",
    name: "Summer Sale 2024",
    type: "Discount",
    status: "Active",
    reach: 12500,
    conversions: 580,
    budget: "EGP 2,500",
    spent: "EGP 1,850",
  },
  {
    id: "CAM002",
    name: "New Product Launch",
    type: "Promotion",
    status: "Scheduled",
    reach: 8200,
    conversions: 320,
    budget: "EGP 1,500",
    spent: "EGP 0",
  },
  {
    id: "CAM003",
    name: "Holiday Special",
    type: "Bundle",
    status: "Completed",
    reach: 15600,
    conversions: 890,
    budget: "EGP 3,000",
    spent: "EGP 2,950",
  },
];

const promotions = [
  {
    code: "SUMMER20",
    discount: "20%",
    uses: 245,
    limit: 1000,
    expires: "2024-08-31",
    status: "Active",
  },
  {
    code: "FIRST10",
    discount: "10%",
    uses: 892,
    limit: 1000,
    expires: "2024-12-31",
    status: "Active",
  },
  {
    code: "BUNDLE50",
    discount: "EGP 50",
    uses: 156,
    limit: 500,
    expires: "2024-07-15",
    status: "Expired",
  },
];

export const MarketingDashboard = () => {
  const t = useTranslations();

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t("marketing.title")}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            {t("marketing.subtitle")}
          </p>
        </div>
      </div>

      <div className="relative">
        <div
          className="select-none pointer-events-none blur-sm opacity-60"
          aria-hidden="true"
        >
          {/* Marketing Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("marketing.totalReach")}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      36,300
                    </p>
                    <p className="text-sm text-green-600">+15.2% this month</p>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("marketing.conversions")}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      1,790
                    </p>
                    <p className="text-sm text-green-600">+8.7% this month</p>
                  </div>
                  <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                    <Target className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("marketing.marketingROI")}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      3.2x
                    </p>
                    <p className="text-sm text-green-600">+12.5% this month</p>
                  </div>
                  <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("marketing.adSpend")}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      EGP 4,800
                    </p>
                    <p className="text-sm text-orange-600">EGP 1,200 remaining</p>
                  </div>
                  <div className="bg-orange-100 dark:bg-orange-900 p-3 rounded-full">
                    <DollarSign className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Active Campaigns */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t("marketing.activeCampaigns")}</CardTitle>
                  <Button variant="outline" size="sm">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    {t("marketing.viewAnalytics")}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {campaigns.map((campaign) => (
                    <div key={campaign.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{campaign.name}</h4>
                        <Badge
                          variant={
                            campaign.status === "Active"
                              ? "default"
                              : campaign.status === "Scheduled"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {t(`marketing.${campaign.status.toLowerCase()}`)}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div>Reach: {campaign.reach.toLocaleString()}</div>
                        <div>Conversions: {campaign.conversions}</div>
                        <div>Budget: {campaign.budget}</div>
                        <div>Spent: {campaign.spent}</div>
                      </div>
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Budget Used</span>
                          <span>
                            {Math.round(
                              (parseCurrencyAmount(campaign.spent) /
                                parseCurrencyAmount(campaign.budget)) *
                                100
                            )}
                            %
                          </span>
                        </div>
                        <Progress
                          value={
                            (parseCurrencyAmount(campaign.spent) /
                              parseCurrencyAmount(campaign.budget)) *
                            100
                          }
                          className="h-2"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Promotional Codes */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t("marketing.promotionalCodes")}</CardTitle>
                  <Button variant="outline" size="sm">
                    <Mail className="h-4 w-4 mr-2" />
                    {t("marketing.emailCodes")}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {promotions.map((promo) => (
                    <div key={promo.code} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono text-sm">
                            {promo.code}
                          </code>
                          <span className="text-green-600 font-semibold">
                            {promo.discount}
                          </span>
                        </div>
                        <Badge
                          variant={
                            promo.status === "Active" ? "default" : "destructive"
                          }
                        >
                          {t(`marketing.${promo.status.toLowerCase()}`)}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <div>
                          Uses: {promo.uses} / {promo.limit}
                        </div>
                        <div>Expires: {promo.expires}</div>
                      </div>
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Usage</span>
                          <span>
                            {Math.round((promo.uses / promo.limit) * 100)}%
                          </span>
                        </div>
                        <Progress
                          value={(promo.uses / promo.limit) * 100}
                          className="h-2"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <span className="rounded-full border bg-background/80 px-6 py-2 text-lg font-semibold tracking-wide text-foreground shadow-sm backdrop-blur-sm">
            Soon
          </span>
        </div>
      </div>
    </div>
  );
};
