import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FileText, House, LayoutGrid, Package, ShoppingCart } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CtaButton } from "@/components/marketing/site/cta-button";
import { BackArrow, ForwardArrow, ForwardChevron } from "@/components/marketing/site/direction-icons";
import { Container, Eyebrow } from "@/components/marketing/site/layout-primitives";
import { SignupTrigger } from "@/components/marketing/signup/signup-trigger.client";
import { SoonBadge, TemplateFrame } from "@/components/marketing/templates/template-card";
import { TemplatePreview } from "@/components/marketing/templates/template-preview.client";
import { formatMoney } from "@/lib/marketing/format.lib";
import { pageMetadata } from "@/lib/marketing/metadata.lib";
import { displayName, GALLERY_TEMPLATES } from "@/lib/marketing/templates.data";
import type { GalleryEntry } from "@/lib/marketing/templates.lib";
import { findGalleryEntry, getTemplateGallery } from "@/lib/marketing/templates.server";

type Props = { params: Promise<{ locale: string; id: string }> };

/**
 * One template. Hand-made previews are pre-rendered; templates added in the
 * admin without a preview (thumbnail only) resolve on demand from the
 * catalog (lib/marketing/templates.server.ts).
 */
export function generateStaticParams() {
  return GALLERY_TEMPLATES.map((t) => ({ id: t.id }));
}

function entryName(entry: GalleryEntry): string {
  return entry.name ?? (entry.preview ? displayName(entry.preview.look.name) : entry.id);
}

async function entryCopy(entry: GalleryEntry, locale: string) {
  const t = await getTranslations({ locale, namespace: "templates" });
  if (entry.preview) return { desc: entry.description ?? t(`items.${entry.id}.desc`), long: t(`items.${entry.id}.long`) };
  return { desc: entry.description ?? "", long: entry.description ?? "" };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const entry = await findGalleryEntry(locale, id);
  if (!entry) return {};
  const { desc } = await entryCopy(entry, locale);
  const meta = await pageMetadata({
    locale,
    page: "template",
    path: `/templates/${id}`,
    values: { name: entryName(entry), desc },
  });
  return entry.thumbnailUrl ? { ...meta, openGraph: { ...meta.openGraph, images: [{ url: entry.thumbnailUrl }] } } : meta;
}

export default async function TemplatePage({ params }: Props) {
  const { locale, id } = await params;
  const [entry, gallery] = await Promise.all([findGalleryEntry(locale, id), getTemplateGallery(locale)]);
  if (!entry) notFound();

  const t = await getTranslations("templates");
  const { desc, long } = await entryCopy(entry, locale);
  const name = entryName(entry);
  const soon = entry.status === "soon";
  const index = gallery.indexOf(entry);
  const prev = gallery[(index - 1 + gallery.length) % gallery.length]!;
  const next = gallery[(index + 1) % gallery.length]!;
  const more = gallery.filter((x) => x !== entry).slice(0, 3);
  const category = t(`categories.${entry.category}`);

  const pages = [
    { icon: House, label: t("detail.pHome") },
    { icon: LayoutGrid, label: t("detail.pCollection") },
    { icon: Package, label: t("detail.pProduct") },
    { icon: ShoppingCart, label: t("detail.pCart") },
    { icon: FileText, label: t("detail.pPolicies") },
  ];

  return (
    <>
      <div className="relative bg-teal-900 pt-7 pb-[120px] text-white">
        <Container>
          <nav className="mb-[22px] flex items-center gap-2 text-[13px] text-haze">
            <Link href="/templates" className="text-[#c9d9dd]">
              {t("hero.eyebrow")}
            </Link>
            <ForwardChevron />
            <span aria-current="page">{name}</span>
          </nav>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <Eyebrow>{category}</Eyebrow>
              <h1 className="font-latin text-[clamp(40px,6vw,72px)] leading-none font-extrabold tracking-[-0.03em]">{name}</h1>
              {desc ? <p className="mt-3.5 max-w-[560px] text-[17px] text-mist">{desc}</p> : null}
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              {soon ? <SoonBadge>{t("soon")}</SoonBadge> : <SignupTrigger>{t("detail.use")}</SignupTrigger>}
              {entry.previewUrl ? (
                <CtaButton asChild tone="ghost">
                  <a href={entry.previewUrl} target="_blank" rel="noopener noreferrer">
                    {t("detail.demo")}
                  </a>
                </CtaButton>
              ) : (
                <CtaButton asChild tone="ghost">
                  <a href="#stage">{t("detail.demo")}</a>
                </CtaButton>
              )}
            </div>
          </div>
        </Container>
      </div>

      <Container id="stage" className="relative -mt-[90px] scroll-mt-24">
        {entry.preview ? (
          <TemplatePreview templateId={entry.preview.id} available={!soon} />
        ) : (
          <TemplateFrame image={entry.thumbnailUrl} url={`${entry.id}.tallaby.com`} className="mx-auto max-w-[1000px]" />
        )}
      </Container>

      <Container>
        <div className="grid gap-7 pt-16 pb-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)] md:gap-10">
          <div>
            <h3 className="mb-3.5 text-[15px] font-bold text-teal-900">{t("detail.about")}</h3>
            <p className="text-base text-slate-ink">{long}</p>
          </div>
          <div>
            <h3 className="mb-3.5 text-[15px] font-bold text-teal-900">{t("detail.pages")}</h3>
            <ul className="m-0 grid list-none gap-2.5 p-0">
              {pages.map((p) => (
                <li key={p.label} className="flex items-center gap-2.5 text-[15px] text-[#33454a]">
                  <p.icon className="size-[17px] text-teal-500" aria-hidden />
                  {p.label}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-3.5 text-[15px] font-bold text-teal-900">{t("detail.details")}</h3>
            <dl className="grid grid-cols-[auto_1fr] gap-x-[18px] gap-y-2.5 text-sm">
              <dt className="text-neutral-600">{t("detail.bestFor")}</dt>
              <dd className="m-0 font-semibold text-teal-900">{category}</dd>
              {entry.preview ? (
                <>
                  <dt className="text-neutral-600">{t("detail.font")}</dt>
                  <dd className="m-0 font-semibold text-teal-900">{entry.preview.font}</dd>
                  <dt className="text-neutral-600">{t("detail.colorOptions")}</dt>
                  <dd className="m-0 font-latin font-semibold text-teal-900">{entry.preview.variants.length}</dd>
                </>
              ) : null}
              <dt className="text-neutral-600">{t("detail.price")}</dt>
              <dd className="m-0 font-semibold text-teal-900">{entry.price ? formatMoney(entry.price, locale) : t("detail.free")}</dd>
            </dl>
          </div>
        </div>

        {more.length ? (
          <section className="pt-12 pb-24">
            <h2 className="mb-11 text-[28px] font-extrabold text-teal-900">{t("detail.more")}</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {more.map((x) => (
                <Link key={x.id} href={`/templates/${x.id}`} className="group grid gap-2.5 hover:no-underline">
                  <TemplateFrame
                    look={x.preview?.look}
                    image={x.thumbnailUrl}
                    badge={x.status === "soon" ? <SoonBadge>{t("soon")}</SoonBadge> : null}
                    className="rounded-[14px] group-hover:-translate-y-1"
                  />
                  <b className="font-latin text-base text-teal-900">{entryName(x)}</b>
                </Link>
              ))}
            </div>
            <div className="mt-12 flex justify-between gap-4 border-t border-neutral-200 pt-6">
              <Link href={`/templates/${prev.id}`} className="flex items-center gap-2 font-bold text-teal-700">
                <BackArrow />
                {entryName(prev)}
              </Link>
              <Link href={`/templates/${next.id}`} className="flex items-center gap-2 font-bold text-teal-700">
                {entryName(next)}
                <ForwardArrow />
              </Link>
            </div>
          </section>
        ) : (
          <div className="pb-24" />
        )}
      </Container>
    </>
  );
}
