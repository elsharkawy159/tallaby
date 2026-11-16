import { getTranslations } from "next-intl/server";
import { splitTallabyCredit, TALLABY_HOME } from "@workspace/store-sections/render";
import { cn } from "@workspace/ui/lib/utils";

/**
 * The Tallaby credit («صمم عبر منصة طلبي» / "Built with Tallaby") for footers
 * drawn outside the builder tree (the default footer, or a site without a
 * footer); builder footers get the same text from `drawChrome`. Plain text in
 * the footer's colour, with only the brand name underlined.
 */
export async function PoweredByTallaby({ className }: { className?: string }) {
  const t = await getTranslations("storefront");
  const { lead, brand } = splitTallabyCredit(t("poweredBy"));
  return (
    <a href={TALLABY_HOME} target="_blank" rel="noopener noreferrer" className={cn("inline-flex items-baseline gap-1 text-sm", className)}>
      {lead ? <span>{lead}</span> : null}
      <span className="font-semibold underline underline-offset-4">{brand}</span>
    </a>
  );
}
