"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Star,
  CheckCircle,
  XCircle,
  MessageCircle,
  Flag,
  UserCheck,
  EyeOff,
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
import { Textarea } from "@workspace/ui/components/textarea";
import { DataTable } from "@/app/(dashboard)/_components/data-table/data-table";

// Define the review type
interface Review {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  orderId?: string;
  orderItemId?: string;
  rating: number;
  title?: string;
  comment: string;
  images: string[];
  isVerifiedPurchase: boolean;
  isAnonymous: boolean;
  status: "pending" | "approved" | "rejected" | "flagged";
  helpfulCount: number;
  unhelpfulCount: number;
  reportCount: number;
  createdAt: string;
}

// Mock data for reviews
const mockReviews: Review[] = [
  {
    id: "rev_001",
    userId: "user_001",
    userName: "John Smith",
    userEmail: "john.smith@example.com",
    orderId: "ord_12345",
    orderItemId: "item_67890",
    rating: 5,
    title: "Amazing smartphone!",
    comment:
      "This is the best smartphone I've ever owned. The camera is incredible and the battery life is fantastic. I can easily go all day without needing to charge. The screen is bright and vibrant, and the performance is top-notch. Highly recommended!",
    images: ["/api/placeholder/400/300", "/api/placeholder/400/300"],
    isVerifiedPurchase: true,
    isAnonymous: false,
    status: "approved",
    helpfulCount: 15,
    unhelpfulCount: 2,
    reportCount: 0,
    createdAt: "2023-10-15T14:30:00Z",
  },
  {
    id: "rev_002",
    userId: "user_002",
    userName: "Emily Johnson",
    userEmail: "emily.johnson@example.com",
    orderId: "ord_23456",
    orderItemId: "item_78901",
    rating: 4,
    title: "Great phone with minor issues",
    comment:
      "I'm loving this phone overall. The design is sleek and it's very fast. Camera quality is excellent. Only giving 4 stars because the battery life could be better and it gets a bit warm during heavy usage. Otherwise, it's a solid device.",
    images: [],
    isVerifiedPurchase: true,
    isAnonymous: false,
    status: "approved",
    helpfulCount: 8,
    unhelpfulCount: 1,
    reportCount: 0,
    createdAt: "2023-10-12T09:45:00Z",
  },
  {
    id: "rev_003",
    userId: "user_003",
    userName: "Anonymous User",
    userEmail: "michael.brown@example.com",
    orderId: "ord_34567",
    orderItemId: "item_89012",
    rating: 2,
    title: "Disappointed with quality",
    comment:
      "I was excited to get this phone but I'm disappointed. The screen has a small dead pixel and the battery drains way too quickly. Customer service wasn't very helpful either. Would not recommend.",
    images: ["/api/placeholder/400/300"],
    isVerifiedPurchase: true,
    isAnonymous: true,
    status: "pending",
    helpfulCount: 3,
    unhelpfulCount: 7,
    reportCount: 0,
    createdAt: "2023-10-10T16:20:00Z",
  },
  {
    id: "rev_004",
    userId: "user_004",
    userName: "Sarah Davis",
    userEmail: "sarah.davis@example.com",
    orderId: "ord_45678",
    orderItemId: "item_90123",
    rating: 5,
    title: "Worth every penny!",
    comment:
      "Absolutely in love with my new phone! The camera takes stunning photos, especially in low light. The display is gorgeous and the performance is blazing fast. Battery easily lasts all day even with heavy use. Highly recommend!",
    images: [
      "/api/placeholder/400/300",
      "/api/placeholder/400/300",
      "/api/placeholder/400/300",
    ],
    isVerifiedPurchase: true,
    isAnonymous: false,
    status: "approved",
    helpfulCount: 22,
    unhelpfulCount: 1,
    reportCount: 0,
    createdAt: "2023-10-08T11:10:00Z",
  },
  {
    id: "rev_005",
    userId: "user_005",
    userName: "Robert Wilson",
    userEmail: "robert.wilson@example.com",
    rating: 3,
    title: "It's okay, nothing special",
    comment:
      "It's an okay phone but not worth the high price tag. Performance is good but not great. Camera is decent. Battery life is average. There are better options available at this price point.",
    images: [],
    isVerifiedPurchase: false,
    isAnonymous: false,
    status: "flagged",
    helpfulCount: 5,
    unhelpfulCount: 8,
    reportCount: 2,
    createdAt: "2023-10-05T15:35:00Z",
  },
  {
    id: "rev_006",
    userId: "user_006",
    userName: "Jennifer Lee",
    userEmail: "jennifer.lee@example.com",
    orderId: "ord_56789",
    orderItemId: "item_01234",
    rating: 1,
    title: "Terrible experience",
    comment:
      "This is the worst phone I've ever purchased. It freezes constantly, the camera quality is poor, and it overheats during basic tasks. Save your money and look elsewhere. I've already returned mine.",
    images: [],
    isVerifiedPurchase: true,
    isAnonymous: false,
    status: "rejected",
    helpfulCount: 1,
    unhelpfulCount: 3,
    reportCount: 5,
    createdAt: "2023-10-02T08:50:00Z",
  },
];

interface ProductReviewsTableProps {
  productId: string;
}

export function ProductReviewsTable({ productId }: ProductReviewsTableProps) {
  // In a real app, you would fetch reviews data using the productId
  const [reviews, setReviews] = useState<Review[]>(mockReviews);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isReviewDetailOpen, setIsReviewDetailOpen] = useState(false);
  const [replyText, setReplyText] = useState<string>("");
  const [isReplying, setIsReplying] = useState(false);

  // Function to update review status
  const updateReviewStatus = (
    reviewId: string,
    newStatus: "pending" | "approved" | "rejected" | "flagged"
  ) => {
    setReviews(
      reviews.map((review) =>
        review.id === reviewId ? { ...review, status: newStatus } : review
      )
    );
  };

  // Rating display component
  const RatingStars = ({ rating }: { rating: number }) => {
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
  };

  // Review table columns
  const columns: ColumnDef<Review>[] = [
    {
      accessorKey: "rating",
      header: "Rating",
      cell: ({ row }) => {
        const rating = parseInt(row.getValue("rating"));
        return <RatingStars rating={rating} />;
      },
    },
    {
      accessorKey: "title",
      header: "Title/Comment",
      cell: ({ row }) => {
        const title = row.getValue("title") as string | undefined;
        const comment = row.original.comment;

        return (
          <div>
            {title ? <div className="font-medium">{title}</div> : null}
            <div className="text-sm text-gray-500 truncate max-w-md">
              {comment}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "userName",
      header: "Customer",
      cell: ({ row }) => {
        const review = row.original;
        const name = review.isAnonymous ? "Anonymous User" : review.userName;
        const initials = review.isAnonymous
          ? "A"
          : review.userName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase();

        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{name}</div>
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
        const status = row.getValue("status") as string;

        let badgeVariant: "default" | "secondary" | "destructive" | "outline" =
          "default";
        let label = "";

        switch (status) {
          case "approved":
            badgeVariant = "default";
            label = "Approved";
            break;
          case "pending":
            badgeVariant = "secondary";
            label = "Pending";
            break;
          case "rejected":
            badgeVariant = "destructive";
            label = "Rejected";
            break;
          case "flagged":
            badgeVariant = "outline";
            label = "Flagged";
            break;
        }

        return <Badge variant={badgeVariant}>{label}</Badge>;
      },
    },
    {
      accessorKey: "helpfulCount",
      header: "Helpful",
      cell: ({ row }) => {
        const helpful = parseInt(row.getValue("helpfulCount"));
        const unhelpful = row.original.unhelpfulCount;
        const total = helpful + unhelpful;

        return (
          <div className="text-center">
            <div className="font-medium">{helpful}</div>
            {total > 0 && (
              <div className="text-xs text-gray-500">
                {Math.round((helpful / total) * 100)}% of {total}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "reportCount",
      header: "Reports",
      cell: ({ row }) => {
        const reports = parseInt(row.getValue("reportCount"));

        if (reports === 0) {
          return <div className="text-center">0</div>;
        }

        return (
          <div className="text-center">
            <Badge
              variant="outline"
              className="bg-red-50 text-red-700 border-red-200"
            >
              {reports}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"));
        return <div className="text-sm">{date.toLocaleDateString()}</div>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const review = row.original;
        const isPending = review.status === "pending";
        const isRejected = review.status === "rejected";
        const isApproved = review.status === "approved";
        const isFlagged = review.status === "flagged";

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
                {!isApproved && (
                  <DropdownMenuItem
                    onClick={() => updateReviewStatus(review.id, "approved")}
                  >
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    Approve Review
                  </DropdownMenuItem>
                )}
                {!isRejected && (
                  <DropdownMenuItem
                    onClick={() => updateReviewStatus(review.id, "rejected")}
                  >
                    <XCircle className="h-4 w-4 mr-2 text-red-500" />
                    Reject Review
                  </DropdownMenuItem>
                )}
                {!isFlagged && (
                  <DropdownMenuItem
                    onClick={() => updateReviewStatus(review.id, "flagged")}
                  >
                    <Flag className="h-4 w-4 mr-2 text-amber-500" />
                    Flag for Review
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedReview(review);
                    setIsReviewDetailOpen(true);
                    setIsReplying(true);
                  }}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Reply to Review
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Mark as Verified
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">
                  <EyeOff className="h-4 w-4 mr-2" />
                  Hide Review
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <DataTable
        columns={columns}
        data={reviews}
        searchableColumns={[
          {
            id: "title",
            title: "Title",
          },
          {
            id: "comment",
            title: "Comment",
          },
          {
            id: "userName",
            title: "Customer Name",
          },
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
          {
            id: "rating",
            title: "Rating",
            options: [
              { label: "5 Stars", value: "5" },
              { label: "4 Stars", value: "4" },
              { label: "3 Stars", value: "3" },
              { label: "2 Stars", value: "2" },
              { label: "1 Star", value: "1" },
            ],
          },
          {
            id: "isVerifiedPurchase",
            title: "Purchase",
            options: [
              { label: "Verified", value: "true" },
              { label: "Unverified", value: "false" },
            ],
          },
        ]}
      />

      {/* Review Detail Dialog */}
      <Dialog open={isReviewDetailOpen} onOpenChange={setIsReviewDetailOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Review Details</DialogTitle>
            <DialogDescription>
              View and manage this customer review.
            </DialogDescription>
          </DialogHeader>

          {selectedReview && (
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <RatingStars rating={selectedReview.rating} />
                    <Badge variant="outline" className="ml-2">
                      {selectedReview.status.charAt(0).toUpperCase() +
                        selectedReview.status.slice(1)}
                    </Badge>
                  </div>
                  {selectedReview.title && (
                    <h3 className="text-lg font-semibold mt-2">
                      {selectedReview.title}
                    </h3>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>
                      By{" "}
                      {selectedReview.isAnonymous
                        ? "Anonymous User"
                        : selectedReview.userName}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(selectedReview.createdAt).toLocaleDateString()}
                    </span>
                    {selectedReview.isVerifiedPurchase && (
                      <>
                        <span>•</span>
                        <span className="text-green-600 flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified Purchase
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  {selectedReview.status !== "approved" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        updateReviewStatus(selectedReview.id, "approved")
                      }
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  )}
                  {selectedReview.status !== "rejected" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        updateReviewStatus(selectedReview.id, "rejected")
                      }
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-gray-700">{selectedReview.comment}</p>
              </div>

              {selectedReview.images.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Review Images</h4>
                  <div className="flex flex-wrap gap-3">
                    {selectedReview.images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Review image ${index + 1}`}
                        className="h-24 w-24 object-cover rounded-md border"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Customer Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Name:</span>{" "}
                    {selectedReview.userName}
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>{" "}
                    {selectedReview.userEmail}
                  </div>
                  {selectedReview.orderId && (
                    <div>
                      <span className="text-gray-500">Order ID:</span>{" "}
                      {selectedReview.orderId}
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500">Helpfulness:</span>{" "}
                    {selectedReview.helpfulCount} helpful,{" "}
                    {selectedReview.unhelpfulCount} unhelpful
                  </div>
                </div>
              </div>

              {isReplying && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Reply to Review</h4>
                  <Textarea
                    placeholder="Type your reply here..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={4}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsReplying(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        // In a real app, you would send the reply to your API
                        alert("Reply sent successfully!");
                        setReplyText("");
                        setIsReplying(false);
                      }}
                    >
                      Send Reply
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsReviewDetailOpen(false)}
            >
              Close
            </Button>
            {!isReplying && (
              <Button onClick={() => setIsReplying(true)}>
                <MessageCircle className="h-4 w-4 mr-2" />
                Reply
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
