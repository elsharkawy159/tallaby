import { getTranslations } from "next-intl/server";
import { TALLABY_HOME, TALLABY_MARK_URL } from "@workspace/store-sections/render";
import { cn } from "@workspace/ui/lib/utils";

/**
 * The Tallaby badge («صمم عبر منصة طلبي» / "Built with Tallaby") for footers
 * drawn outside the builder tree (the default footer, or a site without a
 * footer); builder footers get the same pill from `drawChrome`. White with
 * dark ink and a hairline border, so it reads on any footer colour.
 */
export async function PoweredByTallaby({ className }: { className?: string }) {
  const t = await getTranslations("storefront");
  return (
    <a
      href={TALLABY_HOME}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-[rgb(23_79_98/0.22)] bg-white py-1.5 ps-1.5 pe-3.5 text-sm leading-tight font-semibold text-[#0f3441] shadow-[0_1px_2px_rgb(0_0_0/0.06)] transition-[background-color,border-color,box-shadow] duration-200 hover:border-[#174f62] hover:bg-[#eef6f7] hover:shadow-[0_4px_12px_rgb(0_0_0/0.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#174f62] motion-reduce:transition-none",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- a fixed 22px mark on tallaby.com, same file the tree badge uses */}
      <img src={TALLABY_MARK_URL} alt="" width={22} height={22} loading="lazy" decoding="async" className="size-[22px] rounded-md" />
      <span>{t("poweredBy")}</span>
    </a>
  );
}
