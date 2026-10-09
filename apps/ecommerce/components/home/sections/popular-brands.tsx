import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getTopBrandsByProductCount } from "@/actions/brands";

const BRAND_LIMIT = 8;

export async function PopularBrands() {
  const t = await getTranslations("pages.home.brands");

  const result = await getTopBrandsByProductCount(BRAND_LIMIT);
  const brands = result.success ? (result.data ?? []) : [];

  if (brands.length === 0) return null;

  return (
    <section aria-labelledby="brands-title" className="container mt-9">
      <h2 id="brands-title" className="mb-4 text-xl font-bold text-neutral-900 md:text-[22px]">
        {t("title")}
      </h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {brands.map((brand) => (
          <li key={brand.id}>
            <Link
              href={`/brands/${brand.slug}`}
              dir="auto"
              title={brand.name}
              className="grid h-19 place-items-center rounded-[14px] border border-neutral-200 bg-white px-3 font-[family-name:var(--font-montserrat)] text-[17px] font-extrabold tracking-tight text-neutral-800 transition-colors hover:border-primary hover:text-primary"
            >
              {brand.logoUrl ? (
                <Image
                  src={brand.logoUrl}
                  alt={brand.name}
                  width={120}
                  height={48}
                  className="max-h-12 w-auto object-contain"
                />
              ) : (
                <span className="truncate">{brand.name}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
