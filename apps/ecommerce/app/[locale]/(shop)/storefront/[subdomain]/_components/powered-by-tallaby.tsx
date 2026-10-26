import { getTranslations } from "next-intl/server";

/**
 * "Powered by Tallaby" for footers drawn outside the builder tree (the default
 * footer, or a site without a footer); builder footers get it from `drawChrome`.
 */
export async function PoweredByTallaby({ className }: { className?: string }) {
  const t = await getTranslations("storefront");
  return (
    <span className={className}>
      {t.rich("poweredBy", {
        link: (chunks) => (
          <a href="https://tallaby.com" target="_blank" rel="noopener" className="font-semibold underline underline-offset-2">
            {chunks}
          </a>
        ),
      })}
    </span>
  );
}
