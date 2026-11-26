"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { updateProduct } from "@/actions/products";
import { PRODUCT_IMAGE_ACCEPT } from "@/lib/images/image-format.lib";
import { prepareImageForUpload } from "@/lib/images/prepare-image.client";
import { uploadProductImage } from "@/components/inputs/use-seller-upload";
import { MAX_PRODUCT_IMAGES } from "../add/product-images.lib";
import { useProductStoreId } from "./product-store.client";

const KNOWN_IMAGE_ERRORS = ["imageFormatInvalid", "imageTooLarge", "imageUnreadable"];

/**
 * Drop image files on a product (list thumbnail or grid card) to append them
 * to its photos: each file is checked, uploaded through a signed URL, then the
 * product is saved with `updateProduct` (the server checks seller and store)
 * and the list is refreshed. Files past MAX_PRODUCT_IMAGES are skipped.
 */
export function useProductImageDrop({
  productId,
  images,
  noClick = false,
  noKeyboard = false,
}: {
  productId: string;
  images: string[];
  noClick?: boolean;
  noKeyboard?: boolean;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const busy = useRef(false);
  // The photos as last saved here, so a second drop before the refresh lands
  // doesn't overwrite the first one's photos.
  const current = useRef(images);
  useEffect(() => {
    current.current = images;
  }, [images]);

  const tToast = useTranslations("toast");
  const t = useTranslations("products.imageUpload");
  const productStoreId = useProductStoreId();
  const router = useRouter();

  const uploadOne = useCallback(
    async (file: File): Promise<string | null> => {
      try {
        // Checks the format and size; HEIC, BMP, TIFF… are uploaded as a JPEG.
        const upload = await prepareImageForUpload(file);
        // Signed upload into the seller's own folder (the bucket refuses direct writes, 0153).
        return await uploadProductImage(upload);
      } catch (error) {
        console.error("File upload error:", error);
        const key = error instanceof Error ? error.message : "";
        toast.error(KNOWN_IMAGE_ERRORS.includes(key) ? tToast(key) : tToast("failedToUploadImage"));
        return null;
      }
    },
    [tToast]
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0 || busy.current) return;

      const existing = current.current;
      const room = MAX_PRODUCT_IMAGES - existing.length;
      if (room <= 0) {
        toast.error(tToast("maxImagesAllowedPerProduct"));
        return;
      }
      const files = acceptedFiles.slice(0, room);
      const skipped = acceptedFiles.length - files.length;
      if (skipped > 0) {
        toast.warning(t("skipped", { count: skipped, max: MAX_PRODUCT_IMAGES }));
      }

      busy.current = true;
      setIsUploading(true);
      try {
        const uploaded = (await Promise.all(files.map(uploadOne))).filter(
          (path): path is string => path !== null
        );
        if (uploaded.length === 0) return;

        const next = [...existing, ...uploaded];
        const result = await updateProduct(productStoreId, productId, { images: next });
        if (result.success) {
          current.current = next;
          toast.success(tToast("imagesUploadedSuccessfully", { count: uploaded.length }));
          router.refresh();
        } else {
          toast.error(tToast("failedToUpdateProductImages"));
        }
      } catch (error) {
        console.error("Upload error:", error);
        toast.error(tToast("failedToUploadImages"));
      } finally {
        busy.current = false;
        setIsUploading(false);
      }
    },
    [productId, productStoreId, router, t, tToast, uploadOne]
  );

  const onDropRejected = useCallback(
    (rejections: FileRejection[]) => {
      if (rejections.length > 0) toast.error(tToast("imageFormatInvalid"));
    },
    [tToast]
  );

  const dropzone = useDropzone({
    accept: PRODUCT_IMAGE_ACCEPT,
    onDrop,
    onDropRejected,
    disabled: isUploading,
    multiple: true,
    noClick,
    noKeyboard,
  });

  return { ...dropzone, isUploading };
}
