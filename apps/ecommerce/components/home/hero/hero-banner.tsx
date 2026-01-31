import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@workspace/ui/components/button";

const HERO_PRODUCT_IMAGES = [
  {
    src: "/accessories.jpg",
    alt: "Accessories",
  },
  {
    src: "/cosmetics.jpg",
    alt: "Personal care",
  },
  {
    src: "/fashion.png",
    alt: "Fashion",
  },
] as const;

export default async function HeroBanner() {
  const t = await getTranslations("pages.home");

  return (
    <div className="relative isolate bg-white">
      {/* Grid background */}
      <svg
        aria-hidden
        className="absolute inset-x-0 top-0 -z-10 h-[32rem] w-full stroke-gray-200 [mask-image:radial-gradient(32rem_32rem_at_center,white,transparent)]"
      >
        <defs>
          <pattern
            id="hero-grid"
            x="50%"
            y={-1}
            width={200}
            height={200}
            patternUnits="userSpaceOnUse"
          >
            <path d="M.5 200V.5H200" fill="none" />
          </pattern>
        </defs>
        <svg x="50%" y={-1} className="overflow-visible fill-gray-50">
          <path
            d="M-200 0h201v201h-201Z M600 0h201v201h-201Z M-400 600h201v201h-201Z M200 800h201v201h-201Z"
            strokeWidth={0}
          />
        </svg>
        <rect
          fill="url(#hero-grid)"
          width="100%"
          height="100%"
          strokeWidth={0}
        />
      </svg>

      <div className="overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 pb-32 pt-18 sm:pt-60 lg:px-8 lg:pt-32">
          <div className="mx-auto max-w-2xl gap-x-14 lg:mx-0 lg:flex lg:max-w-none lg:items-center">
            <div className="relative w-full shrink-0 lg:max-w-xl xl:max-w-2xl">
              <h1 className="text-balance text-2xl font-semibold text-gray-900 sm:text-6xl lg:leading-18">
                {t("heroHeadline")}
              </h1>
              <p className="md:mt-8 mt-4 max-w-md font-medium leading-relaxed text-gray-500 sm:max-w-md sm:text-xl lg:max-w-none">
                {t("heroDescription")}
              </p>
              <div className="mt-10">
                <Button asChild>
                  <Link href="/products">{t("heroCtaPrimary")}</Link>
                </Button>
              </div>
            </div>
            {/* Product images – 3 columns, items-center, middle -mt-2 */}
            <div className="mt-14 hidden flex-row items-center justify-center gap-4 sm:pl-20 lg:mt-0 lg:flex lg:flex-1 lg:justify-start lg:pl-0">
              <div className="w-44 flex-none">
                <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-gray-100 shadow-lg ring-1 ring-gray-900/10">
                  <Image
                    src={HERO_PRODUCT_IMAGES[0].src}
                    alt={HERO_PRODUCT_IMAGES[0].alt}
                    fill
                    className="object-cover"
                    sizes="176px"
                  />
                </div>
              </div>
              <div className="w-44 flex-none -mt-10">
                <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-gray-100 shadow-lg ring-1 ring-gray-900/10">
                  <Image
                    src={HERO_PRODUCT_IMAGES[1].src}
                    alt={HERO_PRODUCT_IMAGES[1].alt}
                    fill
                    className="object-cover"
                    sizes="176px"
                  />
                </div>
              </div>
              <div className="w-44 flex-none">
                <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-gray-100 shadow-lg ring-1 ring-gray-900/10">
                  <Image
                    src={HERO_PRODUCT_IMAGES[2].src}
                    alt={HERO_PRODUCT_IMAGES[2].alt}
                    fill
                    className="object-cover"
                    sizes="176px"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
