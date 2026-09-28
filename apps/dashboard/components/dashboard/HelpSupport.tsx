import { useTranslations } from "next-intl";
import {
  HelpCircle,
  MessageSquare,
  FileText,
  Video,
  Mail,
  Phone,
  Search,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import { SupportChatLink } from "./support-chat-link.client";

const faqKeys = [
  "addProduct",
  "trackSales",
  "paymentMethods",
  "shippingRates",
  "customizeStore",
] as const;

const quickLinkKeys = [
  "gettingStarted",
  "productManagement",
  "orderProcessing",
  "marketingTools",
  "paymentSetup",
  "shippingConfiguration",
] as const;

const videoTutorials = [
  { key: "dashboardOverview", duration: "5:30", views: "12.5k" },
  { key: "firstProduct", duration: "8:15", views: "9.8k" },
  { key: "managingOrders", duration: "6:45", views: "7.2k" },
  { key: "promotions", duration: "4:20", views: "5.1k" },
] as const;

export const HelpSupport = () => {
  const t = useTranslations("help");
  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center">
          <div>
            <p className="text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <SupportChatLink />
          <Button variant="outline">
            <Mail className="h-4 w-4 me-2" />
            {t("contactSupport")}
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="mb-8">
        <CardContent>
          <div className="text-center mb-4">
            <h2 className="text-xl font-semibold mb-2">{t("searchTitle")}</h2>
            <p className="text-muted-foreground">{t("searchSubtitle")}</p>
          </div>
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              placeholder={t("searchPlaceholder")}
              className="ps-10 py-3 text-lg"
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Help Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <div className="bg-blue-100 dark:bg-blue-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold mb-2">{t("browseFaqs")}</h3>
            <p className="text-muted-foreground text-sm">{t("browseFaqsDescription")}</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <div className="bg-purple-100 dark:bg-purple-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Video className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-semibold mb-2">{t("videoTutorials")}</h3>
            <p className="text-muted-foreground text-sm">{t("videoTutorialsDescription")}</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <div className="bg-green-100 dark:bg-green-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-semibold mb-2">{t("contactSupport")}</h3>
            <p className="text-muted-foreground text-sm">{t("contactSupportDescription")}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>{t("quickLinks.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {quickLinkKeys.map((key) => (
                <div
                  key={key}
                  className="flex items-center p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <FileText className="h-5 w-5 text-muted-foreground me-3" />
                  <div>
                    <p className="font-medium">{t(`quickLinks.${key}.title`)}</p>
                    <p className="text-sm text-muted-foreground">
                      {t(`quickLinks.${key}.description`)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Video Tutorials */}
        <Card>
          <CardHeader>
            <CardTitle>{t("videoTutorials")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {videoTutorials.map((video) => (
                <div
                  key={video.key}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center">
                    <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded me-3">
                      <Video className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="font-medium">{t(`videos.${video.key}`)}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("views", { count: video.views })}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {video.duration}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FAQs */}
      <Card>
        <CardHeader>
          <CardTitle>{t("faqTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqKeys.map((key) => (
              <AccordionItem key={key} value={key}>
                <AccordionTrigger className="text-start">
                  {t(`faqs.${key}.question`)}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {t(`faqs.${key}.answer`)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t("stillNeedHelp")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="font-semibold mb-2">{t("liveChat")}</h4>
              <p className="text-muted-foreground text-sm mb-3">{t("liveChatDescription")}</p>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                {t("startChat")}
              </Button>
            </div>

            <div className="text-center">
              <div className="bg-green-100 dark:bg-green-900/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Mail className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h4 className="font-semibold mb-2">{t("emailSupport")}</h4>
              <p className="text-muted-foreground text-sm mb-3">{t("emailSupportDescription")}</p>
              <Button size="sm" variant="outline">
                {t("sendEmail")}
              </Button>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 dark:bg-purple-900/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Phone className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h4 className="font-semibold mb-2">{t("phoneSupport")}</h4>
              <p className="text-muted-foreground text-sm mb-3">{t("phoneSupportHours")}</p>
              <Button size="sm" variant="outline">
                {t("callNow")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
