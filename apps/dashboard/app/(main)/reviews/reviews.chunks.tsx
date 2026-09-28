"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import type { ColumnDef } from "@tanstack/react-table";
import { TableSection } from "@workspace/ui/components/table-section";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { getPublicUrl } from "@/lib/utils";
import { formatDateTime, formatNumber } from "@/lib/i18n/format";
import { Star } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Textarea } from "@workspace/ui/components/textarea";
import { CardDescription } from "@workspace/ui/components/card";
import {
  answerProductQuestionAction,
  updateProductAnswerAction,
} from "@/actions/products";

export type VendorReviewRow = {
  id: string;
  createdAt: string;
  rating: number;
  title?: string | null;
  content?: string | null;
  customerName: string;
  customerEmail?: string | null;
  customerAvatar?: string | null;
  productTitle: string;
  productImage?: string | null;
  productSlug?: string | null;
  orderNumber?: string | null;
  reviewType?: "product" | "store";
  replied: boolean;
};

export function VendorReviewsTabs({
  productRows,
  storeRows,
}: {
  productRows: VendorReviewRow[];
  storeRows: VendorReviewRow[];
}) {
  const t = useTranslations("reviews");
  const [activeTab, setActiveTab] = useState<"product" | "store">("product");

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant={activeTab === "product" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("product")}
        >
          {t("productTab", { count: productRows.length })}
        </Button>
        <Button
          variant={activeTab === "store" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("store")}
        >
          {t("storeTab", { count: storeRows.length })}
        </Button>
      </div>
      <VendorReviewsTable
        rows={activeTab === "product" ? productRows : storeRows}
        reviewType={activeTab}
      />
    </div>
  );
}

export function VendorReviewsTable({
  rows,
  reviewType = "product",
}: {
  rows: VendorReviewRow[];
  reviewType?: "product" | "store";
}) {
  const t = useTranslations("reviews");
  const locale = useLocale();
  const columns = useMemo<ColumnDef<VendorReviewRow, any>[]>(
    () => [
      {
        id: "created",
        header: t("columns.date"),
        size: 140,
        accessorFn: (row) => row.createdAt,
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">
            {formatDateTime(row.original.createdAt, locale)}
          </div>
        ),
      },
      {
        id: "customer",
        header: t("columns.customer"),
        size: 240,
        cell: ({ row }) => (
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={row.original.customerAvatar || undefined}
                alt={row.original.customerName}
              />
              <AvatarFallback>
                {initials(row.original.customerName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="truncate font-medium">
                {row.original.customerName}
              </div>
              {row.original.customerEmail && (
                <a
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline truncate"
                  href={`mailto:${row.original.customerEmail}`}
                  title={row.original.customerEmail}
                >
                  {row.original.customerEmail}
                </a>
              )}
            </div>
          </div>
        ),
      },
      {
        id: "product",
        header: reviewType === "store" ? t("columns.order") : t("columns.product"),
        size: 320,
        cell: ({ row }) => {
          if (reviewType === "store") {
            return (
              <div className="min-w-0">
                <div className="truncate font-medium">
                  {t("orderNumber", { number: row.original.orderNumber ?? "—" })}
                </div>
                <div className="text-xs text-muted-foreground">
                  {t("storeReview")}
                </div>
              </div>
            );
          }

          const image = row.original.productImage
            ? getPublicUrl(row.original.productImage, "products")
            : undefined;
          return (
            <div className="flex items-center gap-3">
              {image ? (
                <Image
                  src={image}
                  width={40}
                  height={40}
                  alt={row.original.productTitle}
                  className="h-10 w-10 rounded object-cover border"
                />
              ) : (
                <div className="h-10 w-10 rounded border bg-muted" />
              )}
              <div className="min-w-0">
                <div className="truncate font-medium">
                  {row.original.productTitle}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        id: "rating",
        header: t("columns.rating"),
        size: 140,
        accessorFn: (row) => row.rating,
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={
                  i < Math.round(row.original.rating)
                    ? "text-yellow-500"
                    : "text-muted-foreground/40"
                }
                size={16}
                fill={
                  i < Math.round(row.original.rating) ? "currentColor" : "none"
                }
              />
            ))}
            <span className="text-xs text-muted-foreground ms-1">
              ({formatNumber(row.original.rating, locale, {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })})
            </span>
          </div>
        ),
      },
      {
        id: "review",
        header: t("columns.review"),
        size: 420,
        cell: ({ row }) => (
          <div className="space-y-1">
            {row.original.title && (
              <div className="font-medium truncate">{row.original.title}</div>
            )}
            {row.original.content && (
              <div className="text-sm text-muted-foreground line-clamp-2">
                {row.original.content}
              </div>
            )}
          </div>
        ),
      },
      {
        id: "status",
        header: t("columns.status"),
        size: 120,
        accessorFn: (row) => (row.replied ? t("replied") : t("unreplied")),
        cell: ({ row }) => (
          <Badge variant={row.original.replied ? "default" : "secondary"}>
            {row.original.replied ? t("replied") : t("unreplied")}
          </Badge>
        ),
      },
      {
        id: "contact",
        header: t("columns.contact"),
        size: 140,
        cell: ({ row }) =>
          row.original.customerEmail ? (
            <a
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              href={`mailto:${row.original.customerEmail}`}
            >
              {t("emailCustomer")}
            </a>
          ) : (
            <span className="text-sm text-muted-foreground">{t("noEmail")}</span>
          ),
      },
    ],
    [reviewType, t, locale]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <TableSection<VendorReviewRow>
          rows={rows}
          columns={columns}
          searchColumnId="review"
        />
      </CardContent>
    </Card>
  );
}

export function VendorReviewsSkeleton() {
  const t = useTranslations("reviews");
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48 rounded-md border bg-muted" />
      </CardContent>
    </Card>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "?";
  const last = parts[1]?.[0] ?? "";
  return (first + last).toUpperCase();
}

// Q&A section types
export type VendorQuestionRow = {
  id: string;
  question: string;
  createdAt?: string;
  isAnswered: boolean;
  productId: string;
  productTitle: string;
  productImage?: string | null;
  answers: Array<{ id: string; answer: string; createdAt?: string }>;
};

export function VendorQASection({
  questions,
}: {
  questions: VendorQuestionRow[];
}) {
  const t = useTranslations("reviews.qa");
  const locale = useLocale();
  // Sort: unanswered first then latest by createdAt desc
  const sorted = useMemo(() => {
    return [...questions].sort((a, b) => {
      if (a.isAnswered !== b.isAnswered) return a.isAnswered ? 1 : -1;
      const ad = new Date(a.createdAt || 0).getTime();
      const bd = new Date(b.createdAt || 0).getTime();
      return bd - ad;
    });
  }, [questions]);

  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const handleSubmit = async (q: VendorQuestionRow) => {
    setBusy(q.id);
    try {
      const existing = q.answers[0];
      const form = new FormData();
      form.set("productId", q.productId);
      if (existing) {
        form.set("answerId", existing.id);
        form.set("answer", drafts[q.id] || "");
        await updateProductAnswerAction(form);
        setEditing(null);
      } else {
        form.set("questionId", q.id);
        form.set("answer", drafts[q.id] || "");
        await answerProductQuestionAction(form);
      }
      setDrafts((s) => ({ ...s, [q.id]: "" }));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sorted.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            {t("empty")}
          </div>
        ) : (
          sorted.map((q) => {
            const existing = q.answers[0];
            const isEditing = editing === q.id && Boolean(existing);
            const productImg = q.productImage
              ? getPublicUrl(q.productImage, "products")
              : undefined;
            return (
              <div key={q.id} className="rounded-md border p-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      {productImg ? (
                        <Image
                          src={productImg}
                          alt={q.productTitle}
                          className="h-10 w-10 rounded object-cover border"
                          width={40}
                          height={40}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded border bg-muted" />
                      )}
                      <div className="truncate font-medium">
                        {q.productTitle}
                      </div>
                    </div>
                    <div className="mt-2 font-medium">{q.question}</div>
                    {q.createdAt && (
                      <div className="text-xs text-muted-foreground">
                        {formatDateTime(q.createdAt, locale)}
                      </div>
                    )}
                  </div>
                  {existing && !isEditing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditing(q.id);
                        setDrafts((s) => ({ ...s, [q.id]: existing.answer }));
                      }}
                    >
                      {t("editAnswer")}
                    </Button>
                  )}
                </div>

                {existing && !isEditing ? (
                  <div className="rounded-md bg-muted p-3">
                    <div className="text-sm">{existing.answer}</div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Textarea
                      placeholder={
                        existing ? t("updatePlaceholder") : t("writePlaceholder")
                      }
                      value={drafts[q.id] ?? ""}
                      onChange={(e) =>
                        setDrafts((s) => ({ ...s, [q.id]: e.target.value }))
                      }
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleSubmit(q)}
                        disabled={busy === q.id || !(drafts[q.id] ?? "").trim()}
                      >
                        {busy === q.id
                          ? t("submitting")
                          : existing
                            ? t("save")
                            : t("submit")}
                      </Button>
                      {isEditing && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setEditing(null);
                            setDrafts((s) => ({ ...s, [q.id]: "" }));
                          }}
                        >
                          {t("cancel")}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
