"use client";

import React, { useTransition } from "react";
import { Button } from "@workspace/ui/components/button";
import { Edit, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { cn, getPublicUrl } from "@/lib/utils";
import Image from "next/image";
import { toggleProductStatus } from "@/actions/products";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export const ProductImageCell = ({
  images,
  title,
}: {
  images: string[];
  title: string;
}) => (
  <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded overflow-hidden">
    {images && images.length > 0 ? (
      <Image
        src={getPublicUrl(images[0], "products")}
        alt={title}
        width={100}
        height={100}
        className="object-cover w-full h-full"
      />
    ) : (
      <div className="text-xs text-gray-400">No Image</div>
    )}
  </div>
);

export const ProductTitleCell = ({ title }: { title: string }) => (
  <span className="font-medium text-gray-900 truncate max-w-xs block">
    {title}
  </span>
);

export const ProductDescriptionCell = ({
  description,
}: {
  description?: string;
}) => (
  <span className="text-gray-500 truncate block max-w-md" title={description}>
    {description || "-"}
  </span>
);

export const ProductActionsCell = ({
  id,
  status,
}: {
  id: string;
  status: "draft" | "pending" | "active" | "rejected";
}) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const canToggle = status === "active" || status === "draft";

  const handleToggle = () => {
    startTransition(async () => {
      const result = await toggleProductStatus(id);
      if (result.success) {
        toast.success(
          status === "active"
            ? "Product hidden (draft)"
            : "Product submitted for review"
        );
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update product status");
      }
    });
  };

  return (
    <div className="flex gap-2">
      {canToggle && (
        <Button
          type="button"
          size="icon"
          variant={status === "active" ? "outline" : "secondary"}
          aria-label={status === "active" ? "Deactivate" : "Activate"}
          disabled={isPending}
          onClick={handleToggle}
        >
          {status === "active" ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </Button>
      )}
      <Button asChild size="icon" variant="ghost" aria-label="Edit">
        <Link href={`/products/${id}`}>
          <Edit className="w-4 h-4" />
        </Link>
      </Button>
    </div>
  );
};

const statusStyles: Record<
  "draft" | "pending" | "active" | "rejected",
  string
> = {
  draft: "bg-gray-100 text-gray-800",
  pending: "bg-amber-100 text-amber-800",
  active: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export const ProductStatusCell = ({
  status,
}: {
  status: "draft" | "pending" | "active" | "rejected";
}) => (
  <span
    className={cn(
      "text-xs px-2 py-0.5 rounded font-medium capitalize",
      statusStyles[status]
    )}
  >
    {status}
  </span>
);
