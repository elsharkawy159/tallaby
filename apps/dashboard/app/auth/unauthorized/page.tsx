import {
  AlertTriangle,
  XCircle,
  Shield,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import { Suspense } from "react";

import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import Link from "next/link";

interface UnauthorizedContentProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

function UnauthorizedContent({ searchParams }: UnauthorizedContentProps) {
  const reason = (searchParams.reason as string) || "default";
  const title = (searchParams.title as string) || "Access Restricted";
  const message = searchParams.message as string;

  // Seller information from middleware
  const businessName = searchParams.businessName as string;
  const displayName = searchParams.displayName as string;
  const joinDate = searchParams.joinDate as string;
  const updatedAt = searchParams.updatedAt as string;
  const status = searchParams.status as string;

  const getIcon = () => {
    switch (reason) {
      case "pending":
        return (
          <AlertTriangle className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
        );
      case "approved":
        return (
          <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
        );
      case "suspended":
        return <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />;
      case "restricted":
        return (
          <Shield className="h-8 w-8 text-orange-600 dark:text-orange-400" />
        );
      case "no_seller_profile":
        return (
          <AlertTriangle className="h-8 w-8 text-orange-600 dark:text-orange-400" />
        );
      default:
        return (
          <AlertTriangle className="h-8 w-8 text-gray-600 dark:text-gray-400" />
        );
    }
  };

  const getCreateSellerButton = () => {
    if (reason === "no_seller_profile") {
      return (
        <Button asChild className="w-full">
          <Link
            href={
              process.env.ECOMMERCE_DOMAIN + "/become-seller"
            }
          >
            Create Seller Account
            <ExternalLink className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center">
            {getIcon()}
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription className="text-base">{message}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Show seller information if available */}
          {businessName && (
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <div className="flex justify-between">
                <span>Business Name:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {businessName}
                </span>
              </div>
              {displayName && displayName !== businessName && (
                <div className="flex justify-between">
                  <span>Display Name:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {displayName}
                  </span>
                </div>
              )}
              {joinDate && (
                <div className="flex justify-between">
                  <span>Application Date:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {new Date(joinDate).toLocaleDateString()}
                  </span>
                </div>
              )}
              {updatedAt && (
                <div className="flex justify-between">
                  <span>Last Updated:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {new Date(updatedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              {status && (
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span
                    className={`font-medium capitalize ${
                      status === "pending"
                        ? "text-yellow-600 dark:text-yellow-400"
                        : status === "suspended"
                          ? "text-red-600 dark:text-red-400"
                          : status === "restricted"
                            ? "text-orange-600 dark:text-orange-400"
                            : "text-green-600 dark:text-green-400"
                    }`}
                  >
                    {status}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2">
            {getCreateSellerButton()}

            <Button
              asChild
              className="w-full"
              variant={reason === "no_seller_profile" ? "outline" : "default"}
            >
              <a href="mailto:support@yourstore.com">
                Contact Support
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function UnauthorizedPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 dark:border-gray-100"></div>
        </div>
      }
    >
      <UnauthorizedContent searchParams={resolvedSearchParams} />
    </Suspense>
  );
}
