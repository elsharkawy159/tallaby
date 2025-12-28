"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Plus, RefreshCw, FolderTree } from "lucide-react";
import { CategoryTree } from "./_components/categories.chunks";
import type { Category } from "./categories.types";

interface CategoriesContentProps {
  rootCategories: Category[];
  locale: "en" | "ar";
}

export function CategoriesContent({
  rootCategories,
  locale: initialLocale,
}: CategoriesContentProps) {
  const router = useRouter();
  const [locale, setLocale] = useState<"en" | "ar">(initialLocale);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 500);
  }, [router]);

  const handleLocaleChange = useCallback(
    (newLocale: "en" | "ar") => {
      setLocale(newLocale);
      const params = new URLSearchParams(window.location.search);
      params.set("locale", newLocale);
      router.push(`?${params.toString()}`);
    },
    [router]
  );

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">
            Manage your product categories and structure
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Link href="/withAuth/categories/create">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </Link>
        </div>
      </div>

      {/* Locale Tabs */}
      <Tabs
        value={locale}
        onValueChange={(value) => handleLocaleChange(value as "en" | "ar")}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="en">English</TabsTrigger>
          <TabsTrigger value="ar">Arabic</TabsTrigger>
        </TabsList>

        <TabsContent value="en" className="space-y-4">
          <CategoryTreeContent
            rootCategories={rootCategories.filter((cat) => cat.locale === "en")}
            locale="en"
            onRefresh={handleRefresh}
          />
        </TabsContent>

        <TabsContent value="ar" className="space-y-4">
          <CategoryTreeContent
            rootCategories={rootCategories.filter((cat) => cat.locale === "ar")}
            locale="ar"
            onRefresh={handleRefresh}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}

interface CategoryTreeContentProps {
  rootCategories: Category[];
  locale: "en" | "ar";
  onRefresh: () => void;
}

function CategoryTreeContent({
  rootCategories,
  locale,
  onRefresh,
}: CategoryTreeContentProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderTree className="h-5 w-5 text-primary" />
          Category Structure ({locale.toUpperCase()})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CategoryTree
          rootCategories={rootCategories}
          locale={locale}
          onRefresh={onRefresh}
        />
      </CardContent>
    </Card>
  );
}
