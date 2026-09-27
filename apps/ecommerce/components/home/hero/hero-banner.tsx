import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Truck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@workspace/ui/components/button";
import { contentParams } from "@/lib/content-params";
import { cn } from "@/lib/utils";

// Three arched "shop windows". The middle one stands taller, like the main
// door of an arcade; the amber outline behind the first gives the row depth.
const HERO_WINDOWS = [
  { src: "/accessories.jpg", frame: "h-40 sm:h-56 lg:h-72 xl:h-80", outlined: true },
  { src: "/fashion.png", frame: "h-48 sm:h-68 lg:h-88 xl:h-96", outlined: false },
  { src: "/cosmetics.jpg", frame: "h-40 sm:h-56 lg:h-72 xl:h-80", outlined: false },
] as const;

export default async function HeroBanner({ locale }: { locale: string }) {
  const t = await getTranslations("pages.home");
  const values = contentParams(locale);

  return (
    <div className="relative isolate overflow-hidden bg-primary text-primary-foreground">
      {/* A quiet arch echo in the background, same shape as the windows. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -start-32 -z-10 h-[28rem] w-80 rounded-t-full border-[40px] border-primary-foreground/[0.04] lg:h-[36rem] lg:w-[26rem]"
      />

      <div className="container pb-32 pt-10 sm:pb-40 sm:pt-14 lg:pb-44 lg:pt-16">
        <div className="grid items-end gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
          <div className="max-w-xl lg:self-center">
            <h1 className="text-balance text-4xl font-bold leading-[1.15] sm:text-5xl lg:text-6xl">
              {t("heroHeadline")}
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-primary-foreground/80 sm:text-lg">
              {t("heroDescription", values)}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Link href="/products">{t("heroCtaPrimary")}</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <Link href="/categories">{t("heroCtaBrowse")}</Link>
              </Button>
            </div>
          </div>

          <div aria-hidden className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="flex items-end justify-center gap-3 sm:gap-4 lg:gap-5">
              {HERO_WINDOWS.map((item) => (
                <div key={item.src} className="relative w-[30%] max-w-48">
                  {item.outlined && (
                    <span className="absolute -start-2.5 -top-2.5 h-full w-full rounded-t-full rounded-b-2xl border-2 border-accent sm:-start-3.5 sm:-top-3.5" />
                  )}
                  <div
                    className={cn(
                      "relative w-full overflow-hidden rounded-t-full rounded-b-2xl bg-primary-foreground/10 shadow-2xl shadow-black/25 ring-1 ring-primary-foreground/15",
                      item.frame,
                    )}
                  >
                    <Image
                      src={item.src}
                      alt=""
                      fill
                      priority
                      className="object-cover"
                      sizes="(min-width: 1024px) 192px, 30vw"
                    />
                  </div>
                </div>
              ))}
            </div>

            <DeliveryStamp text={t("heroStamp", values)} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Circular text badge that turns slowly — the hero's single moving element.
function DeliveryStamp({ text }: { text: string }) {
  return (
    <div className="absolute -top-6 end-0 h-24 w-24 sm:-top-8 sm:h-32 sm:w-32 lg:-end-4 lg:-top-6 lg:h-36 lg:w-36">
      <svg
        viewBox="0 0 200 200"
        // LTR base so an RTL run starts on the path instead of running off it.
        direction="ltr"
        className="h-full w-full animate-[spin_28s_linear_infinite] motion-reduce:animate-none"
      >
        <circle cx="100" cy="100" r="98" className="fill-accent" />
        <defs>
          <path
            id="hero-stamp-path"
            d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0"
          />
        </defs>
        <text className="fill-accent-foreground text-[15px] font-bold">
          <textPath href="#hero-stamp-path" textLength="462" lengthAdjust="spacingAndGlyphs">
            {text}
          </textPath>
        </text>
      </svg>
      <span className="absolute inset-0 m-auto flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground sm:h-14 sm:w-14 lg:h-16 lg:w-16">
        <Truck className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7" />
      </span>
    </div>
  );
}
