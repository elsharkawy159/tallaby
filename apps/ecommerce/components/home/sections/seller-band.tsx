import { getTranslations } from "next-intl/server";
import { Button } from "@workspace/ui/components/button";
import { Link } from "@/i18n/navigation";
import { StartSellingLink } from "./seller-band.client";

export async function SellerBand() {
  const t = await getTranslations("pages.home.sellerBand");

  return (
    <section className="container mt-10 mb-12">
      <div className="relative isolate grid items-center gap-6 overflow-hidden rounded-3xl bg-primary px-6 py-8 text-white md:grid-cols-[1fr_auto] md:px-10 md:py-9">
        {/* Amber ring peeking in from the corner, same echo as the hero arch. */}
        <span
          aria-hidden
          className="pointer-events-none absolute -start-22 -top-30 -z-10 size-70 rounded-full border-[40px] border-accent/15"
        />
        <div>
          <h2 className="text-2xl font-bold md:text-[26px]">{t("title")}</h2>
          <p className="mt-1.5 max-w-xl text-[#cfdde1]">{t("description")}</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Button
            asChild
            size="lg"
            className="rounded-full bg-accent font-bold text-white hover:bg-[#e89318]"
          >
            <StartSellingLink>{t("start")}</StartSellingLink>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="rounded-full border-white/40 bg-transparent font-bold text-white hover:bg-white/10 hover:text-white"
          >
            <Link href="/sell">{t("learnMore")}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
