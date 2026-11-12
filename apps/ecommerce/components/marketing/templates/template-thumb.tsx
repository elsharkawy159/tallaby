import { cn } from "@workspace/ui/lib/utils";
import { TemplateShot } from "@workspace/ui/components/template-shot";
import type { PreviewShot } from "@workspace/store-sections/template-preview";
import { TemplateLiveThumb } from "./template-live-thumb.client";

/** A live frame's height for a 3:4 box at the 1280 px frame width. */
const TALL_FRAME_HEIGHT = 1707;

/**
 * A template card's tall (3:4) preview (owner, 2026-11-12): the template's
 * home page screenshot when it has one (`GalleryEntry.shot`, scrolled on
 * hover of the nearest `.tpl-shot-trigger`), else its home page drawn live
 * in the same frame, so the grid stays even.
 */
export function TemplateThumb({ shot, liveSrc, className, sizes }: { shot: PreviewShot | null; liveSrc: string; className?: string; sizes?: string }) {
  return shot ? (
    <TemplateShot src={shot.src} width={shot.width} height={shot.height} sizes={sizes} className={className} />
  ) : (
    <TemplateLiveThumb src={liveSrc} className={cn("aspect-[3/4]", className)} frameHeight={TALL_FRAME_HEIGHT} />
  );
}
