"use client";

import Image from "next/image";
import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent } from "@workspace/ui/components/card";
import { cn } from "@workspace/ui/lib/utils";
import { getPublicUrl } from "@/lib/utils";

interface ProductImagesGalleryProps {
  images: string[];
  readOnly?: boolean;
}

function resolveImageUrl(image: string): string {
  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }
  return getPublicUrl(image, "products");
}

export function ProductImagesGallery({
  images,
  readOnly = false,
}: ProductImagesGalleryProps) {
  if (images.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {readOnly
          ? "No images uploaded for this product."
          : "No images yet. Add images in the edit form."}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {images.map((image, index) => (
        <Card
          key={`${image}-${index}`}
          className={cn(
            "overflow-hidden relative",
            index === 0 && "ring-2 ring-primary"
          )}
        >
          <CardContent className="p-0">
            <div className="relative aspect-square w-full">
              <Image
                src={resolveImageUrl(image)}
                alt={`Product image ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 25vw"
              />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-2 flex flex-wrap gap-1">
              {index === 0 && (
                <Badge className="bg-primary text-white">Primary</Badge>
              )}
              <Badge variant="outline" className="bg-black/50 text-white border-none">
                Position {index + 1}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
