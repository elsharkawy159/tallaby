import { Truck, RotateCcw, Banknote, BadgeCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { contentParams } from "@/lib/content-params";

/**
 * Homepage trust strip. Every claim here has to hold: the threshold and the
 * return window come from `contentParams`, which reads the same constants the
 * cart and checkout use.
 */
const FeaturesSection = async ({ locale = "en" }: { locale?: string }) => {
  const t = await getTranslations("pages.home.features");
  const values = contentParams(locale);

  const features = [
    {
      icon: Truck,
      title: t("deliveryTitle", values),
      description: t("deliveryBody", values),
    },
    {
      icon: Banknote,
      title: t("paymentTitle"),
      description: t("paymentBody"),
    },
    {
      icon: RotateCcw,
      title: t("returnsTitle", values),
      description: t("returnsBody", values),
    },
    {
      icon: BadgeCheck,
      title: t("sellersTitle"),
      description: t("sellersBody"),
    },
  ];

  return (
    <section className="py-12 sm:py-16 bg-gradient-to-br from-primary via-primary/80 to-primary/70 text-white">
      <div className="container">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
            {t("heading")}
          </h2>
          <p className="text-base sm:text-lg text-white/80 max-w-2xl mx-auto">
            {t("subheading")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div key={index} className="text-center">
                <div className="bg-white/10 backdrop-blur-sm w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <IconComponent className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-white/80 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
