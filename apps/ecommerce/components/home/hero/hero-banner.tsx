import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Button } from "@workspace/ui/components/button";
import { getProducts } from "@/actions/products";
import { contentParams } from "@/lib/content-params";
import { cn, resolvePrimaryImage, PRODUCT_IMAGE_FALLBACK } from "@/lib/utils";
import type { ProductCardProps } from "@/components/product";
import HeroCarousel from "./hero-carousel";

// Three arched "shop windows"; the middle one stands taller, the first gets an
// amber outline for depth.
const FRAME_HEIGHTS = [
  "h-40 sm:h-56 lg:h-72 xl:h-80",
  "h-48 sm:h-68 lg:h-88 xl:h-96",
  "h-40 sm:h-56 lg:h-72 xl:h-80",
];

const DARK_OUTLINE =
  "border-[#0d3743]/35 bg-transparent text-[#0d3743] hover:bg-[#0d3743]/10 hover:text-[#0d3743]";

const TONES = {
  teal: {
    surface: "bg-primary text-primary-foreground",
    body: "text-primary-foreground/80",
    tag: "",
    primary: "bg-accent text-accent-foreground hover:bg-accent/90",
    outline:
      "border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground",
  },
  amber: {
    surface: "bg-accent text-[#0d3743]",
    body: "text-[#5b3a05]",
    tag: "bg-white text-[#c2410c]",
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: DARK_OUTLINE,
  },
  mist: {
    surface: "bg-[#e6eef0] text-[#0d3743]",
    body: "text-neutral-700",
    tag: "bg-white text-primary",
    primary: "bg-accent text-accent-foreground hover:bg-accent/90",
    outline: DARK_OUTLINE,
  },
};

export default async function HeroBanner({ locale }: { locale: string }) {
  const [t, result] = await Promise.all([
    getTranslations("pages.home"),
    getProducts({ sortBy: "newest", limit: 18, locale: locale as "en" | "ar" }),
  ]);
  const values = contentParams(locale);

  // Newest products that have a real image.
  const latest = ((result?.success && (result.data as ProductCardProps[])) || [])
    .map((p) => ({
      slug: String(p.slug ?? ""),
      title: String(p.title ?? ""),
      image: resolvePrimaryImage(p.images),
    }))
    .filter((p) => p.slug && p.image !== PRODUCT_IMAGE_FALLBACK)
    .slice(0, 9);

  const slides = [
    {
      tone: TONES.teal,
      headline: t("heroHeadline"),
      description: t("heroDescription", values),
      cta: { label: t("heroCtaPrimary"), href: "/products" },
    },
    {
      tone: TONES.amber,
      tag: t("slides.newTag"),
      headline: t("slides.newHeadline"),
      description: t("slides.newDescription"),
      cta: { label: t("slides.newCta"), href: "/products?sort=newest" },
    },
    {
      tone: TONES.mist,
      tag: t("slides.codTag"),
      headline: t("slides.codHeadline"),
      description: t("slides.codDescription", values),
      cta: { label: t("slides.codCta"), href: "/products" },
    },
  ];
  const browse = t("heroCtaBrowse");

  return (
    <HeroCarousel
      dir={locale === "ar" ? "rtl" : "ltr"}
      labels={{ previous: t("slides.previous"), next: t("slides.next") }}
    >
      {slides.map((slide, s) => {
        const c = slide.tone;
        const Heading = s === 0 ? "h1" : "h2";
        // Three products per slide; reuse the newest if there are fewer than nine.
        const products = latest.length
          ? [0, 1, 2].map((i) => latest[(s * 3 + i) % latest.length]!)
          : [];

        return (
          <div key={s} className={cn("h-full overflow-hidden", c.surface)}>
            <div className="container grid items-end gap-10 pb-32 pt-10 sm:pb-40 sm:pt-14 lg:grid-cols-2 lg:gap-16 lg:pb-44 lg:pt-16">
              <div className="max-w-xl lg:self-center">
                {slide.tag && (
                  <span className={cn("mb-4 inline-flex rounded-full px-3 py-1 text-xs font-bold", c.tag)}>
                    {slide.tag}
                  </span>
                )}
                <Heading className="text-balance text-4xl font-bold leading-[1.15] sm:text-5xl lg:text-6xl">
                  {slide.headline}
                </Heading>
                <p className={cn("mt-5 max-w-md text-base leading-relaxed sm:text-lg", c.body)}>
                  {slide.description}
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button asChild size="lg" className={c.primary}>
                    <Link href={slide.cta.href}>{slide.cta.label}</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className={c.outline}>
                    <Link href="/categories">{browse}</Link>
                  </Button>
                </div>
              </div>

              {products.length > 0 && (
                <div className="mx-auto flex w-full max-w-md items-end justify-center gap-3 sm:gap-4 lg:max-w-none lg:gap-5">
                  {products.map((product, i) => (
                    <Link
                      key={i}
                      href={`/products/${product.slug}`}
                      aria-label={product.title}
                      className={cn(
                        "relative block w-[30%] max-w-48 overflow-hidden rounded-t-full rounded-b-2xl bg-white shadow-2xl shadow-black/25",
                        i === 0 && "outline-2 outline-offset-4 outline-accent",
                        FRAME_HEIGHTS[i],
                      )}
                    >
                      <Image
                        src={product.image}
                        alt=""
                        fill
                        priority={s === 0}
                        className="object-contain p-[12%]"
                        sizes="(min-width: 1024px) 192px, 30vw"
                      />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </HeroCarousel>
  );
}
