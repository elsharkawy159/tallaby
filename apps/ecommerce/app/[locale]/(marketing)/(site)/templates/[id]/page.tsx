import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FileText, House } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { Breadcrumb } from "@/components/marketing/site/breadcrumb";
import { CtaButton } from "@/components/marketing/site/cta-button";
import { JsonLd } from "@/components/marketing/site/json-ld";
import { BackArrow, ForwardArrow } from "@/components/marketing/site/direction-icons";
import { Container, Eyebrow } from "@/components/marketing/site/layout-primitives";
import { SignupTrigger } from "@/components/marketing/signup/signup-trigger.client";
import { TemplateFrame } from "@/components/marketing/templates/template-card";
import { TemplateStage } from "@/components/marketing/templates/template-stage.client";
import { localizedUrl, pageMetadata } from "@/lib/marketing/metadata.lib";
import { templateMetaDesc } from "@/lib/marketing/seo.lib";
import { breadcrumbSchema } from "@/lib/marketing/structured-data.lib";
import { templateFrameSrc } from "@/lib/marketing/templates.lib";
import { findGalleryEntry, getTemplateGallery } from "@/lib/marketing/templates.server";

type Props = { params: Promise<{ locale: string; id: string }> };

/** One template from the code catalog. */
export async function generateStaticParams() {
  const gallery = await getTemplateGallery(routing.defaultLocale);
  return gallery.map((entry) => ({ id: entry.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const entry = await findGalleryEntry(locale, id);
  if (!entry) return {};
  const t = await getTranslations({ locale, namespace: "templates" });
  const meta = await pageMetadata({
    locale,
    page: "template",
    path: `/templates/${id}`,
    // An empty description would render ". Free, …".
    values: {
      name: entry.name,
      category: t(`categories.${entry.category}`),
      desc: templateMetaDesc(entry.description?.trim() || t("detail.metaFallback", { name: entry.name })),
    },
  });
  return entry.thumbnailUrl
    ? {
        ...meta,
        openGraph: { ...meta.openGraph, images: [{ url: entry.thumbnailUrl, alt: entry.name }] },
        twitter: { ...meta.twitter, images: [entry.thumbnailUrl] },
      }
    : meta;
}

export default async function TemplatePage({ params }: Props) {
  const { locale, id } = await params;
  const [entry, gallery] = await Promise.all([findGalleryEntry(locale, id), getTemplateGallery(locale)]);
  if (!entry) notFound();

  const [t, tm] = await Promise.all([getTranslations("templates"), getTranslations("meta")]);
  const index = gallery.indexOf(entry);
  const prev = gallery[(index - 1 + gallery.length) % gallery.length]!;
  const next = gallery[(index + 1) % gallery.length]!;
  // The same kind of store first, then the rest of the catalog.
  const more = [...gallery.filter((x) => x !== entry && x.category === entry.category), ...gallery.filter((x) => x !== entry && x.category !== entry.category)].slice(0, 3);
  const category = t(`categories.${entry.category}`);
  const breadcrumbs = breadcrumbSchema([
    { name: tm("siteName"), url: localizedUrl(locale, "/") },
    { name: t("hero.eyebrow"), url: localizedUrl(locale, "/templates") },
    { name: entry.name, url: localizedUrl(locale, `/templates/${entry.id}`) },
  ]);

  return (
    <>
      <JsonLd data={breadcrumbs} />
      <div className="relative pt-9 pb-[120px] text-[#33464b]">
        <Container>
          <Breadcrumb items={[{ label: t("hero.eyebrow"), href: "/templates" }, { label: entry.name }]} className="mb-[22px]" />
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <Eyebrow>{category}</Eyebrow>
              <h1 className="font-latin text-[clamp(40px,6vw,72px)] leading-none font-extrabold tracking-[-0.03em] text-teal-900">{entry.name}</h1>
              {entry.description ? <p className="mt-3.5 max-w-[560px] text-[17px] text-[#56696e]">{entry.description}</p> : null}
            </div>
            <div className="grid gap-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <SignupTrigger>{t("detail.use")}</SignupTrigger>
                <CtaButton asChild tone="outline">
                  <a href={entry.previewUrl ?? templateFrameSrc(locale, entry.id)} target="_blank" rel="noopener noreferrer">
                    {t("detail.demo")}
                  </a>
                </CtaButton>
              </div>
              {/* Signup doesn't carry the template yet: say where to apply it. */}
              <small className="max-w-[440px] text-[13px] text-ink-500">{t("detail.useHint", { name: entry.name })}</small>
            </div>
          </div>
        </Container>
      </div>

      <Container id="stage" className="relative -mt-[90px] scroll-mt-24">
        <TemplateStage templateKey={entry.id} pages={entry.pages} editions={entry.editions} />
      </Container>

      <Container>
        <div className="grid gap-7 pt-16 pb-6 min-[901px]:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)] min-[901px]:gap-10">
          <div>
            <h2 className="mb-3.5 text-[15px] font-bold text-teal-900">{t("detail.about")}</h2>
            <p className="text-base text-[#4d5f64]">{entry.description ?? t("detail.metaFallback", { name: entry.name })}</p>
          </div>
          <div>
            <h2 className="mb-3.5 text-[15px] font-bold text-teal-900">{t("detail.pages")}</h2>
            <ul className="m-0 grid list-none gap-2.5 p-0">
              {entry.pages.map((p) => {
                const Icon = p.isHome ? House : FileText;
                return (
                  <li key={p.slug} className="flex items-center gap-2.5 text-[15px] text-[#33454a]">
                    <Icon className="size-[17px] text-teal-500" aria-hidden />
                    {p.name}
                  </li>
                );
              })}
            </ul>
          </div>
          <div>
            <h2 className="mb-3.5 text-[15px] font-bold text-teal-900">{t("detail.details")}</h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-[18px] gap-y-2.5 text-sm">
              <dt className="text-ink-500">{t("detail.bestFor")}</dt>
              <dd className="m-0 font-semibold text-teal-900">{category}</dd>
              <dt className="text-ink-500">{t("detail.pageCount")}</dt>
              <dd className="m-0 font-latin font-semibold text-teal-900">{entry.pages.length}</dd>
              {entry.palette.length ? (
                <>
                  <dt className="text-ink-500">{t("detail.colors")}</dt>
                  <dd className="m-0 flex items-center gap-1">
                    {entry.palette.map((color) => (
                      <i key={color} className="block size-4 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)]" style={{ background: color }} />
                    ))}
                  </dd>
                </>
              ) : null}
              <dt className="text-ink-500">{t("detail.price")}</dt>
              <dd className="m-0 font-semibold text-teal-900">{t("detail.free")}</dd>
            </dl>
          </div>
        </div>

        {more.length ? (
          <section className="pt-12 pb-16">
            <h2 className="mb-8 text-[28px] font-bold text-teal-900">{t("detail.more")}</h2>
            <div className="grid gap-6 min-[601px]:grid-cols-2 min-[901px]:grid-cols-3">
              {more.map((x) => (
                <Link key={x.id} href={x.shot?.edition ? `/templates/${x.id}?edition=${encodeURIComponent(x.shot.edition)}` : `/templates/${x.id}`} className="group grid gap-2.5 hover:no-underline">
                  <TemplateFrame shot={x.shot} liveSrc={templateFrameSrc(locale, x.id, undefined, true)} className="rounded-card border-line shadow-soft group-hover:-translate-y-1" />
                  <b className="font-latin text-base text-teal-900">{x.name}</b>
                </Link>
              ))}
            </div>
            <div className="mt-12 flex justify-between gap-4 border-t border-line pt-6">
              <Link href={`/templates/${prev.id}`} className="flex items-center gap-2 font-bold text-teal-700">
                <BackArrow />
                <span className="font-latin">{prev.name}</span>
              </Link>
              <Link href={`/templates/${next.id}`} className="flex items-center gap-2 font-bold text-teal-700">
                <span className="font-latin">{next.name}</span>
                <ForwardArrow />
              </Link>
            </div>
          </section>
        ) : (
          <div className="pb-16" />
        )}
      </Container>
    </>
  );
}
