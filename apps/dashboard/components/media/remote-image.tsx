import Image, { type ImageProps } from "next/image";
import { isOptimizableImage } from "@/lib/image-hosts";

/**
 * next/image for stored and remote URLs: resized and cached when the host is
 * in `OPTIMIZED_IMAGE_HOSTS`, served as is otherwise (imported product images
 * from any site, local `blob:` previews, SVG/GIF), since next/image throws on
 * unconfigured hosts.
 */
export function RemoteImage({ src, unoptimized, ...props }: Omit<ImageProps, "src"> & { src: string }) {
  return <Image {...props} src={src} unoptimized={unoptimized || !isOptimizableImage(src)} />;
}
