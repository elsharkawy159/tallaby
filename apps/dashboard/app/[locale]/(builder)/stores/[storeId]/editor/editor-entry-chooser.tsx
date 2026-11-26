import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { storeBuilderEnabled } from "@/components/dashboard/sidebar.config";
import { loadStorePageAccess } from "@/lib/stores/store-page.server";
import { aiEditorHref, manualEditorHref } from "./editor-entry.lib";

/* The add-product chooser's cards (products/add/add-method-chooser.client.tsx), as links. */
const CARD =
  "group relative flex h-full w-full cursor-pointer flex-col items-start gap-2.5 rounded-[20px] border-[1.5px] border-(--s-line) bg-(--s-surface) p-6 text-start shadow-(--s-shadow-card) transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-(--s-primary) hover:shadow-[0_12px_32px_rgba(20,81,99,.10)] focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-(--s-focus) motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500 motion-safe:fill-mode-backwards max-[900px]:p-5";
const BACK =
  "inline-flex h-[34px] items-center gap-1.5 rounded-full border border-(--s-line) bg-(--s-surface) ps-3 pe-3.5 text-[13px] text-(--s-muted) transition-colors hover:border-(--s-field-strong) hover:text-(--s-ink) max-[600px]:h-10 [&_svg]:size-[15px] [&_svg]:ltr:rotate-180";

function Card({ href, image, title, body, meta, className }: { href: string; image: string; title: string; body: string; meta: string; className?: string }) {
  return (
    <Link href={href} className={className ? `${CARD} ${className}` : CARD}>
      {/* Decorative (docs/dashboard-photos.md §4): the title carries the meaning. */}
      <Image src={image} alt="" aria-hidden width={72} height={72} className="mb-1.5 size-[72px] select-none" />
      <b className="text-base font-bold text-(--s-ink)">{title}</b>
      <small className="flex-1 text-[13px] leading-[1.75] text-pretty text-(--s-muted)">{body}</small>
      <span className="mt-1 flex w-full items-center justify-between gap-2 border-t border-(--s-line) pt-3.5 text-xs text-(--s-faint)">
        <span>{meta}</span>
        <ArrowLeft
          className="size-4 shrink-0 text-primary-ink transition-transform duration-200 group-hover:-translate-x-[3px] ltr:rotate-180 ltr:group-hover:translate-x-[3px]"
          aria-hidden
        />
      </span>
    </Link>
  );
}

/**
 * The first step of /stores/[storeId]/editor while AI is on (owner, 2026-11-26):
 * edit with AI or by hand. It reads only the checked store (id, name), never the
 * editor's data, so it renders fast.
 */
export async function EditorEntryChooser({ storeId }: { storeId: string }) {
  const [store, t] = await Promise.all([loadStorePageAccess(storeId), getTranslations("editorEntry")]);
  if (!storeBuilderEnabled(store.sellerId)) notFound();

  return (
    <div className="seller-shell flex min-h-dvh flex-col bg-background">
      <div className="mx-auto flex w-full max-w-[860px] flex-1 flex-col gap-8 px-6 pt-7 pb-12 max-[900px]:gap-[22px] max-[900px]:px-4 max-[900px]:pt-4 max-[900px]:pb-7">
        <div>
          <Link href={`/stores/${encodeURIComponent(store.id)}/website`} className={BACK}>
            <ArrowRight aria-hidden />
            {t("back")}
          </Link>
        </div>
        <div className="m-auto flex w-full flex-col gap-8 max-[900px]:gap-[22px]">
          <div className="flex flex-col items-center gap-2 text-center motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
            <p className="max-w-full truncate text-sm font-semibold text-(--s-muted)">{store.name}</p>
            <h1 className="text-[26px] leading-normal font-bold text-balance text-(--s-ink) max-[640px]:text-[21px]">{t("title")}</h1>
          </div>
          <ul aria-label={t("label")} className="grid grid-cols-2 gap-4 max-[640px]:grid-cols-1">
            <li>
              <Card
                href={aiEditorHref(store.id)}
                image="/illustrations/features/add-ai.png"
                title={t("aiTitle")}
                body={t("aiBody")}
                meta={t("aiMeta")}
                className="border-(--s-primary)/40"
              />
            </li>
            <li>
              <Card
                href={manualEditorHref(store.id)}
                image="/illustrations/onboarding/setup-design.png"
                title={t("manualTitle")}
                body={t("manualBody")}
                meta={t("manualMeta")}
                className="[animation-delay:60ms]"
              />
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
