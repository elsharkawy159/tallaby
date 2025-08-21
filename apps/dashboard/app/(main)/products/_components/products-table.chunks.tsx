import React from "react";
import { Button } from "@workspace/ui/components/button";
import { Edit, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { cn, getPublicUrl } from "@/lib/utils";
import Image from "next/image";

export const ProductImageCell = ({
  images,
  title,
}: {
  images: string[];
  title: string;
}) => (
  <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded overflow-hidden">
    {images && images.length > 0 ? (
      // eslint-disable-next-line @next/next/no-img-element
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
  isActive,
}: {
  id: string;
  isActive: boolean;
}) => (
  <div className="flex gap-2">
    <form
      action={isActive ? "/api/products/deactivate" : "/api/products/activate"}
      method="post"
    >
      <input type="hidden" name="productId" value={id} />
      <Button
        type="submit"
        size="icon"
        variant={isActive ? "outline" : "secondary"}
        aria-label={isActive ? "Deactivate" : "Activate"}
      >
        {isActive ? (
          <EyeOff className="w-4 h-4" />
        ) : (
          <Eye className="w-4 h-4" />
        )}
      </Button>
    </form>
    <Button asChild size="icon" variant="ghost" aria-label="Edit">
      <Link href={`/products/new?page=edit&id=${id}`}>
        <Edit className="w-4 h-4" />
      </Link>
    </Button>
  </div>
);

export const ProductStatusCell = ({ status }: { status: boolean }) => (
  <span
    className={cn(
      "text-xs px-2 py-0.5 rounded font-medium",
      status ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
    )}
  >
    {status ? "Active" : "Inactive"}
  </span>
);