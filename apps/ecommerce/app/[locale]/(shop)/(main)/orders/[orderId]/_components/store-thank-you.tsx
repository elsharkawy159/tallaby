import Image from "next/image";
import { MessageCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { formatPricePlain } from "@workspace/lib";
import { Card, CardContent, CardTitle } from "@workspace/ui/components/card";
import { Link } from "@/i18n/navigation";
import type { StoreThankYouView } from "./store-thank-you.server";

/**
 * The store's thank-you block on its order page (ROADMAP.md F-25b): the
 * seller's message (plain text), "Confirm on WhatsApp" with the order
 * number, and a few of the store's products. Pixel and analytics events stay
 * where they were (MetaPurchase, HostStoreTracking); this block adds none.
 */
export async function StoreThankYou({
  view,
  locale,
}: {
  view: StoreThankYouView;
  locale: string;
}) {
  const t = await getTranslations("storeThankYou");

  return (
    <div className="space-y-4 md:space-y-6">
      {(view.message || view.whatsappUrl) && (
        <Card className="rounded-xl md:rounded-2xl border border-primary/20 bg-background">
          <CardContent className="flex flex-col items-center gap-4 py-4 text-center md:py-6">
            {view.message && (
              <p className="max-w-2xl whitespace-pre-wrap break-words text-sm md:text-base text-foreground">{view.message}</p>
            )}
            {view.whatsappUrl && (
              <a
                href={view.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-[#25D366] px-6 text-sm font-semibold text-white hover:opacity-90"
              >
                <MessageCircle className="size-4" aria-hidden />
                {t("confirmOnWhatsapp")}
              </a>
            )}
          </CardContent>
        </Card>
      )}

      {view.products.length > 0 && (
        <section aria-labelledby="store-thank-you-products" className="space-y-3">
          <CardTitle id="store-thank-you-products" className="text-sm md:text-xl font-bold text-foreground">
            {t("suggestedTitle")}
          </CardTitle>
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {view.products.map((product) => (
              <li key={product.id}>
                <Link href={product.href} className="group block overflow-hidden rounded-xl border bg-background">
                  <div className="relative aspect-square bg-muted">
                    {product.image && (
                      <Image
                        src={product.image}
                        alt={product.title}
                        fill
                        sizes="(min-width: 768px) 25vw, 50vw"
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    )}
                  </div>
                  <div className="space-y-1 p-2 md:p-3">
                    <p className="line-clamp-2 text-xs md:text-sm font-medium text-foreground">{product.title}</p>
                    {product.price != null && (
                      <p className="text-xs md:text-sm font-semibold text-foreground">
                        {formatPricePlain(product.price, locale, view.currencyLabel)}
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
