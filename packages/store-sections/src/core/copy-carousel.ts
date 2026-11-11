/**
 * The carousel's fixed strings, on their own so the carousel runtime
 * (`render/carousel-runtime.client.tsx`) ships only these few instead of the
 * whole `SECTION_COPY` table, which keeps them under the same keys. Each one
 * is its own constant: `SECTION_COPY` refers to them by name (a property
 * access would keep the whole table in every client bundle).
 */
export const COPY_CAROUSEL = { ar: "عروض مميزة", en: "Featured" } as const;
export const COPY_CAROUSEL_SLIDE = { ar: "الشريحة {n}", en: "Slide {n}" } as const;
export const COPY_CAROUSEL_SLIDE_OF = { ar: "{n} من {total}", en: "{n} of {total}" } as const;
export const COPY_CAROUSEL_PAUSE = { ar: "إيقاف العرض", en: "Pause slideshow" } as const;
export const COPY_CAROUSEL_PLAY = { ar: "تشغيل العرض", en: "Play slideshow" } as const;
export const COPY_CAROUSEL_PREVIOUS = { ar: "السابق", en: "Previous" } as const;
export const COPY_CAROUSEL_NEXT = { ar: "التالي", en: "Next" } as const;

/** The strings the carousel runtime reads (pause and play button labels). */
export const CAROUSEL_COPY = { carouselPause: COPY_CAROUSEL_PAUSE, carouselPlay: COPY_CAROUSEL_PLAY } as const;
