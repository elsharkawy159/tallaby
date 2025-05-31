"use client";

import { useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import {
  Pencil,
  Trash,
  Star,
  MoveUp,
  MoveDown,
  ArrowUp,
  ArrowDown,
  ImagePlus,
} from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";

// Define the image type
interface ProductImage {
  id: string;
  url: string;
  altText: string;
  isPrimary: boolean;
  position: number;
  variantId?: string;
  variantName?: string;
}

// Mock data for product images
const mockImages: ProductImage[] = [
  {
    id: "img_001",
    url: "/api/placeholder/500/500",
    altText: "Smartphone X Pro - Black Front View",
    isPrimary: true,
    position: 1,
  },
  {
    id: "img_002",
    url: "/api/placeholder/500/500",
    altText: "Smartphone X Pro - Black Back View",
    isPrimary: false,
    position: 2,
  },
  {
    id: "img_003",
    url: "/api/placeholder/500/500",
    altText: "Smartphone X Pro - Black Side View",
    isPrimary: false,
    position: 3,
  },
  {
    id: "img_004",
    url: "/api/placeholder/500/500",
    altText: "Smartphone X Pro - White Front View",
    isPrimary: false,
    position: 4,
    variantId: "var_004",
    variantName: "White / 128GB",
  },
  {
    id: "img_005",
    url: "/api/placeholder/500/500",
    altText: "Smartphone X Pro - White Back View",
    isPrimary: false,
    position: 5,
    variantId: "var_004",
    variantName: "White / 128GB",
  },
  {
    id: "img_006",
    url: "/api/placeholder/500/500",
    altText: "Smartphone X Pro - Blue Front View",
    isPrimary: false,
    position: 6,
    variantId: "var_007",
    variantName: "Blue / 128GB",
  },
];

interface ProductImagesGalleryProps {
  productId: string;
}

export function ProductImagesGallery({ productId }: ProductImagesGalleryProps) {
  // In a real app, you would fetch images data using the productId
  const [images, setImages] = useState<ProductImage[]>(mockImages);
  const [selectedImage, setSelectedImage] = useState<ProductImage | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Handle making an image primary
  const handleSetPrimary = (imageId: string) => {
    setImages(
      images.map((img) => ({
        ...img,
        isPrimary: img.id === imageId,
      }))
    );
  };

  // Handle deleting an image
  const handleDelete = (imageId: string) => {
    setImages(images.filter((img) => img.id !== imageId));
    setIsDeleteDialogOpen(false);
  };

  // Handle moving an image position
  const handleMove = (imageId: string, direction: "up" | "down") => {
    const currentIndex = images.findIndex((img) => img.id === imageId);
    if (
      (direction === "up" && currentIndex === 0) ||
      (direction === "down" && currentIndex === images.length - 1)
    ) {
      return;
    }

    const newImages = [...images];
    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;

    // Swap the positions
    const temp = newImages[currentIndex];
    newImages[currentIndex] = newImages[targetIndex];
    newImages[targetIndex] = temp;

    // Update position numbers
    newImages.forEach((img, index) => {
      img.position = index + 1;
    });

    setImages(newImages);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <Button size="sm">
          <ImagePlus className="h-4 w-4 mr-2" />
          Add Images
        </Button>
      </div>

      {/* Main image gallery grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image) => (
          <Card
            key={image.id}
            className={cn(
              "overflow-hidden group relative",
              image.isPrimary && "ring-2 ring-primary"
            )}
          >
            <CardContent className="p-0">
              <img
                src={image.url}
                alt={image.altText}
                className="w-full aspect-square object-cover"
              />

              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="flex flex-col gap-2 p-4">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setSelectedImage(image);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                  {!image.isPrimary && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleSetPrimary(image.id)}
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Set as Primary
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="secondary">
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onClick={() => handleMove(image.id, "up")}
                      >
                        <ArrowUp className="h-4 w-4 mr-2" />
                        Move Up
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleMove(image.id, "down")}
                      >
                        <ArrowDown className="h-4 w-4 mr-2" />
                        Move Down
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Image info badges */}
              <div className="absolute bottom-0 left-0 right-0 p-2 flex flex-wrap gap-1">
                {image.isPrimary && (
                  <Badge className="bg-primary text-white">Primary</Badge>
                )}
                {image.position && (
                  <Badge
                    variant="outline"
                    className="bg-black/50 text-white border-none"
                  >
                    Position {image.position}
                  </Badge>
                )}
                {image.variantName && (
                  <Badge
                    variant="outline"
                    className="bg-black/50 text-white border-none"
                  >
                    {image.variantName}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Image</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this image? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          {selectedImage && (
            <div className="flex justify-center p-4">
              <img
                src={selectedImage.url}
                alt={selectedImage.altText}
                className="max-h-48 object-contain"
              />
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedImage && handleDelete(selectedImage.id)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
