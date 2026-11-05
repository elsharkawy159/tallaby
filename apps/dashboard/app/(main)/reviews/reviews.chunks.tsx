"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { HelpCircle, Mail, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  EmptyState,
  NativeSelect,
  PageTabs,
  SectionCard,
  SellerButton,
  SellerCard,
  StatusBadge,
  Tag,
  TextArea,
} from "@/components/seller-ui";
import { getPublicUrl } from "@/lib/utils";
import { formatDateTime, formatNumber } from "@/lib/i18n/format";
import { answerProductQuestionAction, updateProductAnswerAction } from "@/actions/products";
import { SearchPill } from "../orders/orders-ui";

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
  /** Added by the seller from the product form, not by a customer. */
  sellerAdded?: boolean;
};

const REVIEW_SORTS = ["newest", "oldest", "lowest", "highest"] as const;
type ReviewSort = (typeof REVIEW_SORTS)[number];

const PAGE_STEP = 20;

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
    <>
      <PageTabs
        label={t("title")}
        value={activeTab}
        onChange={(key) => setActiveTab(key as "product" | "store")}
        tabs={[
          { key: "product", label: t("productTab", { count: productRows.length }) },
          { key: "store", label: t("storeTab", { count: storeRows.length }) },
        ]}
      />
      <VendorReviewsList key={activeTab} rows={activeTab === "product" ? productRows : storeRows} reviewType={activeTab} />
    </>
  );
}

/** Reviews as rows that read the same on a phone and a desktop: search, sort and a "show more". */
function VendorReviewsList({ rows, reviewType }: { rows: VendorReviewRow[]; reviewType: "product" | "store" }) {
  const t = useTranslations("reviews");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<ReviewSort>("newest");
  const [shown, setShown] = useState(PAGE_STEP);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const found = q
      ? rows.filter((r) =>
          [r.title, r.content, r.customerName, r.productTitle].filter(Boolean).join(" ").toLowerCase().includes(q),
        )
      : rows;
    const time = (r: VendorReviewRow) => new Date(r.createdAt).getTime();
    return [...found].sort((a, b) =>
      sort === "newest"
        ? time(b) - time(a)
        : sort === "oldest"
          ? time(a) - time(b)
          : sort === "lowest"
            ? a.rating - b.rating
            : b.rating - a.rating,
    );
  }, [rows, query, sort]);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <SearchPill
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShown(PAGE_STEP);
          }}
          placeholder={t("search")}
          aria-label={t("search")}
        />
        <NativeSelect
          aria-label={t("sortLabel")}
          value={sort}
          onChange={(e) => setSort(e.target.value as ReviewSort)}
          className="h-[42px] w-auto rounded-full text-[13px] font-semibold max-[720px]:w-full"
        >
          {REVIEW_SORTS.map((key) => (
            <option key={key} value={key}>
              {t(`sort.${key}`)}
            </option>
          ))}
        </NativeSelect>
      </div>

      {visible.length === 0 ? (
        <SellerCard>
          <EmptyState icon={Star} title={t(rows.length ? "noMatch" : "empty")} />
        </SellerCard>
      ) : (
        <ul className="overflow-hidden rounded-[20px] border border-(--s-line) bg-(--s-surface)">
          {visible.slice(0, shown).map((row) => (
            <ReviewRow key={row.id} row={row} reviewType={reviewType} />
          ))}
        </ul>
      )}

      {visible.length > shown && (
        <SellerButton type="button" variant="mini" className="self-center" onClick={() => setShown((n) => n + PAGE_STEP)}>
          {t("showMore")}
        </SellerButton>
      )}
    </>
  );
}

function ReviewRow({ row, reviewType }: { row: VendorReviewRow; reviewType: "product" | "store" }) {
  const t = useTranslations("reviews");
  const locale = useLocale();
  const image = row.productImage ? getPublicUrl(row.productImage, "products") : undefined;

  return (
    <li className="flex flex-col gap-3 p-4 transition-colors duration-150 hover:bg-(--s-tint) [&+&]:border-t [&+&]:border-(--s-line-soft)">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="flex min-w-0 flex-[1_1_220px] items-center gap-3">
          <Avatar className="size-9">
            <AvatarImage src={row.customerAvatar || undefined} alt={row.customerName} />
            <AvatarFallback>{initials(row.customerName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <b className="truncate text-[13.5px] font-bold text-(--s-text)">{row.customerName}</b>
              {row.sellerAdded && <Tag>{t("sellerAdded")}</Tag>}
            </div>
            <time dateTime={row.createdAt} className="block text-xs text-(--s-subtle)">
              {formatDateTime(row.createdAt, locale)}
            </time>
          </div>
        </div>
        <StatusBadge tone={row.replied ? "success" : "muted"}>{row.replied ? t("replied") : t("unreplied")}</StatusBadge>
      </div>

      <div className="flex items-center gap-1" role="img" aria-label={`${t("columns.rating")}: ${row.rating}`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={15}
            className={i < Math.round(row.rating) ? "text-accent" : "text-(--s-field-strong)"}
            fill={i < Math.round(row.rating) ? "currentColor" : "none"}
            aria-hidden
          />
        ))}
        <span className="ms-1 font-montserrat text-xs tabular-nums text-(--s-subtle)">
          {formatNumber(row.rating, locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
        </span>
      </div>

      {(row.title || row.content) && (
        <div className="flex min-w-0 flex-col gap-0.5">
          {row.title && <b className="text-[13.5px] font-bold text-(--s-text)">{row.title}</b>}
          {row.content && <p className="whitespace-pre-line text-pretty text-[13.5px] leading-[1.7] text-(--s-body)">{row.content}</p>}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        {reviewType === "store" ? (
          <div className="min-w-0 text-xs text-(--s-subtle)">
            <b className="block font-semibold text-(--s-text)">{t("orderNumber", { number: row.orderNumber ?? "—" })}</b>
            {t("storeReview")}
          </div>
        ) : (
          <div className="flex min-w-0 flex-[1_1_180px] items-center gap-2.5">
            {image ? (
              <Image src={image} width={40} height={40} alt={row.productTitle} className="size-10 rounded-xl border border-(--s-line) object-cover" />
            ) : (
              <span className="size-10 shrink-0 rounded-xl border border-(--s-line) bg-(--s-fill)" />
            )}
            <span className="min-w-0 truncate text-[13px] font-semibold text-(--s-text)">{row.productTitle}</span>
          </div>
        )}
        {row.customerEmail ? (
          <SellerButton asChild variant="mini" size="xs">
            <a href={`mailto:${row.customerEmail}`} title={row.customerEmail}>
              <Mail aria-hidden />
              {t("emailCustomer")}
            </a>
          </SellerButton>
        ) : (
          <span className="text-xs text-(--s-faint)">{t("noEmail")}</span>
        )}
      </div>
    </li>
  );
}

export function VendorReviewsSkeleton() {
  return (
    <>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48 max-w-full" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <Skeleton className="h-[42px] w-full max-w-[420px] rounded-full" />
      <Skeleton className="h-64 rounded-[20px]" />
    </>
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

export function VendorQASection({ questions }: { questions: VendorQuestionRow[] }) {
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
    <SectionCard icon={HelpCircle} title={t("title")} description={t("description")}>
      {sorted.length === 0 ? (
        <EmptyState title={t("empty")} />
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map((q) => {
            const existing = q.answers[0];
            const isEditing = editing === q.id && Boolean(existing);
            const productImg = q.productImage ? getPublicUrl(q.productImage, "products") : undefined;
            return (
              <div key={q.id} className="flex flex-col gap-3 rounded-[20px] border border-(--s-line) bg-(--s-surface) p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      {productImg ? (
                        <Image src={productImg} alt={q.productTitle} className="size-10 rounded-xl border border-(--s-line) object-cover" width={40} height={40} />
                      ) : (
                        <span className="size-10 shrink-0 rounded-xl border border-(--s-line) bg-(--s-fill)" />
                      )}
                      <span className="min-w-0 truncate text-[13px] font-semibold text-(--s-muted)">{q.productTitle}</span>
                    </div>
                    <p className="mt-2 text-[14px] font-bold text-(--s-text)">{q.question}</p>
                    {q.createdAt && <p className="text-xs text-(--s-subtle)">{formatDateTime(q.createdAt, locale)}</p>}
                  </div>
                  {existing && !isEditing && (
                    <SellerButton
                      variant="mini"
                      size="xs"
                      onClick={() => {
                        setEditing(q.id);
                        setDrafts((s) => ({ ...s, [q.id]: existing.answer }));
                      }}
                    >
                      {t("editAnswer")}
                    </SellerButton>
                  )}
                </div>

                {existing && !isEditing ? (
                  <p className="rounded-[14px] bg-(--s-tint) px-3 py-2.5 text-[13.5px] leading-[1.7] text-(--s-body)">{existing.answer}</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    <TextArea
                      placeholder={existing ? t("updatePlaceholder") : t("writePlaceholder")}
                      aria-label={existing ? t("updatePlaceholder") : t("writePlaceholder")}
                      value={drafts[q.id] ?? ""}
                      onChange={(e) => setDrafts((s) => ({ ...s, [q.id]: e.target.value }))}
                    />
                    <div className="flex gap-2">
                      <SellerButton
                        variant="solid"
                        onClick={() => handleSubmit(q)}
                        disabled={busy === q.id || !(drafts[q.id] ?? "").trim()}
                      >
                        {busy === q.id ? t("submitting") : existing ? t("save") : t("submit")}
                      </SellerButton>
                      {isEditing && (
                        <SellerButton
                          variant="outline"
                          onClick={() => {
                            setEditing(null);
                            setDrafts((s) => ({ ...s, [q.id]: "" }));
                          }}
                        >
                          {t("cancel")}
                        </SellerButton>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}
