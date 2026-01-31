"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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
import { CategorySearchBar } from "./_components/category-search-bar";
import type { Category } from "./categories.types";
import type { CategorySearchResult } from "@/actions/categories";

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
    [router],
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

const SCROLL_POLL_INTERVAL_MS = 100;
const SCROLL_POLL_MAX_ATTEMPTS = 50; // ~5 seconds max wait
const SCROLL_AFTER_FOUND_MS = 150; // Brief delay after element found for layout/accordion

function CategoryTreeContent({
  rootCategories,
  locale,
  onRefresh,
}: CategoryTreeContentProps) {
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [scrollToCategoryId, setScrollToCategoryId] = useState<string | null>(
    null,
  );
  const cardContentRef = useRef<HTMLDivElement>(null);

  const handleSearchSelect = useCallback((result: CategorySearchResult) => {
    setExpandedIds(result.ancestryIds);
    setScrollToCategoryId(result.id);
  }, []);

  // Wait for the target category to be fetched and rendered, then scroll to it
  useEffect(() => {
    if (!scrollToCategoryId || !cardContentRef.current) return;

    let attempts = 0;
    const targetId = scrollToCategoryId;
    const contentEl = cardContentRef.current;

    const scrollToElement = () => {
      const el = contentEl.querySelector(`[data-category-id="${targetId}"]`);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }, SCROLL_AFTER_FOUND_MS);
        // Clear highlight after scroll completes
        setTimeout(() => setScrollToCategoryId(null), 2500);
        return true;
      }
      return false;
    };

    const interval = setInterval(() => {
      attempts++;
      if (scrollToElement() || attempts >= SCROLL_POLL_MAX_ATTEMPTS) {
        clearInterval(interval);
      }
    }, SCROLL_POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [scrollToCategoryId]);

  return (
    <div className="space-y-4">
      <div className="w-full">
        <CategorySearchBar
          locale={locale}
          onSelect={handleSearchSelect}
          className="w-full"
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderTree className="h-5 w-5 text-primary" />
            Category Structure ({locale.toUpperCase()})
          </CardTitle>
        </CardHeader>
        <CardContent ref={cardContentRef}>
          <CategoryTree
            rootCategories={rootCategories}
            locale={locale}
            onRefresh={onRefresh}
            expandedIds={expandedIds}
            onExpandedIdsChange={setExpandedIds}
            scrollToCategoryId={scrollToCategoryId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
