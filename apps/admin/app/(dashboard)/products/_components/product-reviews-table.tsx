"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Star,
  CheckCircle,
  XCircle,
  Flag,
} from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar";
import { DataTable } from "@/app/(dashboard)/_components/data-table/data-table";
import { updateReviewStatus } from "@/actions/products";
import { toast } from "sonner";
import type { ProductReviewRow, ReviewStatus } from "../products.types";

interface ProductReviewsTableProps {
  reviews: ProductReviewRow[];
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
}

export function ProductReviewsTable({ reviews: initialReviews }: ProductReviewsTableProps) {
  const router = useRouter();
  const [reviews, setReviews] = useState(initialReviews);
  const [selectedReview, setSelectedReview] = useState<ProductReviewRow | null>(null);
  const [isReviewDetailOpen, setIsReviewDetailOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setReviews(initialReviews);
  }, [initialReviews]);

  const handleUpdateStatus = async (reviewId: string, newStatus: ReviewStatus) => {
    setIsUpdating(true);
    try {
      const result = await updateReviewStatus(reviewId, newStatus);
      if (result.success) {
        setReviews((current) =>
          current.map((review) =>
            review.id === reviewId ? { ...review, status: newStatus } : review
          )
        );
        if (selectedReview?.id === reviewId) {
          setSelectedReview((current) =>
            current ? { ...current, status: newStatus } : current
          );
        }
        toast.success(`Review ${newStatus}`);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update review");
      }
    } catch {
      toast.error("Failed to update review");
    } finally {
      setIsUpdating(false);
    }
  };

  const columns: ColumnDef<ProductReviewRow>[] = [
    {
      accessorKey: "rating",
      header: "Rating",
      cell: ({ row }) => <RatingStars rating={row.original.rating} />,
    },
    {
      accessorKey: "title",
      header: "Title/Comment",
      cell: ({ row }) => (
        <div>
          {row.original.title ? (
            <div className="font-medium">{row.original.title}</div>
          ) : null}
          <div className="text-sm text-gray-500 truncate max-w-md">
            {row.original.comment ?? "—"}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "userName",
      header: "Customer",
      cell: ({ row }) => {
        const review = row.original;
        const initials = review.isAnonymous
          ? "A"
          : review.userName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{review.userName}</div>
              {review.isVerifiedPurchase && (
                <div className="text-xs text-green-600 flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verified Purchase
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const variant =
          status === "approved"
            ? "default"
            : status === "rejected"
              ? "destructive"
              : status === "flagged"
                ? "outline"
                : "secondary";

        return (
          <Badge variant={variant}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => (
        <div className="text-sm">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const review = row.original;

        return (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedReview(review);
                setIsReviewDetailOpen(true);
              }}
            >
              View
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                {review.status !== "approved" && (
                  <DropdownMenuItem
                    disabled={isUpdating}
                    onClick={() => handleUpdateStatus(review.id, "approved")}
                  >
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    Approve Review
                  </DropdownMenuItem>
                )}
                {review.status !== "rejected" && (
                  <DropdownMenuItem
                    disabled={isUpdating}
                    onClick={() => handleUpdateStatus(review.id, "rejected")}
                  >
                    <XCircle className="h-4 w-4 mr-2 text-red-500" />
                    Reject Review
                  </DropdownMenuItem>
                )}
                {review.status !== "flagged" && (
                  <DropdownMenuItem
                    disabled={isUpdating}
                    onClick={() => handleUpdateStatus(review.id, "flagged")}
                  >
                    <Flag className="h-4 w-4 mr-2 text-amber-500" />
                    Flag for Review
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={isUpdating}
                  onClick={() => handleUpdateStatus(review.id, "pending")}
                >
                  Mark as Pending
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No reviews for this product yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DataTable
        columns={columns}
        data={reviews}
        searchableColumns={[
          { id: "title", title: "Title" },
          { id: "userName", title: "Customer Name" },
        ]}
        filterableColumns={[
          {
            id: "status",
            title: "Status",
            options: [
              { label: "Approved", value: "approved" },
              { label: "Pending", value: "pending" },
              { label: "Rejected", value: "rejected" },
              { label: "Flagged", value: "flagged" },
            ],
          },
        ]}
      />

      <Dialog open={isReviewDetailOpen} onOpenChange={setIsReviewDetailOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Review Details</DialogTitle>
            <DialogDescription>View and manage this customer review.</DialogDescription>
          </DialogHeader>

          {selectedReview && (
            <div className="space-y-6">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <RatingStars rating={selectedReview.rating} />
                    <Badge variant="outline">
                      {selectedReview.status.charAt(0).toUpperCase() +
                        selectedReview.status.slice(1)}
                    </Badge>
                  </div>
                  {selectedReview.title && (
                    <h3 className="text-lg font-semibold mt-2">{selectedReview.title}</h3>
                  )}
                  <div className="text-sm text-gray-500">
                    {new Date(selectedReview.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  {selectedReview.status !== "approved" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isUpdating}
                      onClick={() =>
                        handleUpdateStatus(selectedReview.id, "approved")
                      }
                    >
                      Approve
                    </Button>
                  )}
                  {selectedReview.status !== "rejected" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isUpdating}
                      onClick={() =>
                        handleUpdateStatus(selectedReview.id, "rejected")
                      }
                    >
                      Reject
                    </Button>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-gray-700">{selectedReview.comment ?? "No comment"}</p>
              </div>

              {selectedReview.images.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {selectedReview.images.map((image, index) => (
                    <Image
                      key={index}
                      src={image}
                      alt={`Review image ${index + 1}`}
                      width={96}
                      height={96}
                      className="h-24 w-24 object-cover rounded-md border"
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReviewDetailOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
