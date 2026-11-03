import { getTranslations } from "next-intl/server";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import type { StorePolicyKind } from "@/lib/store-site/store-policy.lib";
import type { Storefront } from "@/lib/storefront.server";
import { whatsappNumber } from "./storefront-footer";

/**
 * A store's own returns, shipping or contact page when the seller hasn't built
 * one in the website builder (ROADMAP.md F-46). It only states the seller's
 * text; with none, it says to ask the store and never promises a return period.
 */
export async function StorePolicyPage({
  store,
  kind,
  text,
}: {
  store: Pick<Storefront, "displayName" | "supportPhone" | "supportEmail" | "supportWhatsapp">;
  kind: StorePolicyKind;
  text: string | null;
}) {
  const t = await getTranslations("storefront.policy");
  const whatsapp = whatsappNumber(store.supportWhatsapp ?? store.supportPhone ?? "");
  const hasContact = Boolean(whatsapp || store.supportPhone || store.supportEmail);

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-12 sm:py-16">
      <h1 className="text-3xl font-bold sm:text-4xl">{t(`${kind}.title`)}</h1>
      {text ? (
        <p dir="auto" className="mt-6 leading-relaxed whitespace-pre-line">
          {text}
        </p>
      ) : (
        <p className="mt-6 leading-relaxed opacity-80">
          {t(hasContact ? `${kind}.empty` : `${kind}.emptyNoContact`, { store: store.displayName })}
        </p>
      )}
      {hasContact && (
        <div className="mt-8 flex flex-wrap gap-3">
          {whatsapp && (
            <Button asChild>
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="size-4" aria-hidden />
                {t("whatsapp")}
              </a>
            </Button>
          )}
          {store.supportPhone && (
            <Button asChild variant="outline">
              <a href={`tel:${store.supportPhone.replace(/[^\d+]/g, "")}`}>
                <Phone className="size-4" aria-hidden />
                <bdi dir="ltr" className="tabular-nums">
                  {store.supportPhone}
                </bdi>
              </a>
            </Button>
          )}
          {store.supportEmail && (
            <Button asChild variant="outline">
              <a href={`mailto:${store.supportEmail}`}>
                <Mail className="size-4" aria-hidden />
                {t("email")}
              </a>
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
