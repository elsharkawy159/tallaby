"use client";

import { useState, useTransition } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Inbox, LoaderCircle, Mail, MessageSquareText, Pencil, Plus, ShoppingBag, type LucideIcon } from "lucide-react";

import { CountPill, IconTile, SectionCard, SellerButton, Tag } from "@/components/seller-ui";
import type { BuiltInFormKind } from "./built-in-forms.lib";
import { openBuiltInForm } from "./built-in-forms.server";

export type BuiltInFormCard = {
  kind: BuiltInFormKind;
  /** The store form behind the card; null while the store has none yet. */
  form: { id: string; status: "active" | "disabled"; fieldCount: number; submissionCount: number; newCount: number } | null;
  /** The form is already saved as this card's form (stores.settings.builtInForms). */
  pinned: boolean;
};

const ICONS: Record<BuiltInFormKind, LucideIcon> = { newsletter: Mail, contact: MessageSquareText };

function Card({
  icon,
  title,
  description,
  status,
  meta,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  status: React.ReactNode;
  meta: React.ReactNode;
  action: React.ReactNode;
}) {
  return (
    <li className="flex min-w-0 flex-col gap-3 rounded-[20px] border border-(--s-line) bg-(--s-surface) p-4">
      <div className="flex items-start gap-3">
        <IconTile icon={icon} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <b className="text-sm font-bold text-(--s-ink)">{title}</b>
            {status}
          </div>
          <p className="mt-0.5 text-pretty text-[12.5px] text-(--s-subtle)">{description}</p>
        </div>
      </div>
      <p className="flex flex-wrap items-center gap-1.5 text-xs text-(--s-muted)">{meta}</p>
      <div className="mt-auto flex flex-wrap gap-2">{action}</div>
    </li>
  );
}

/**
 * Website › Forms › Store forms: every form the storefront already shows, as
 * a card that opens its editor. Checkout opens Store settings › Checkout (its
 * own editor and save); the newsletter and contact cards open their store
 * form, made from the starter copy the first time when the store has none.
 */
export function BuiltInForms({
  storeId,
  readOnly,
  checkoutFieldCount,
  cards,
}: {
  storeId: string;
  readOnly: boolean;
  /** Fields the checkout page shows (the fixed delivery ones plus the extra ones turned on). */
  checkoutFieldCount: number;
  cards: BuiltInFormCard[];
}) {
  const t = useTranslations("storeForms.hub");
  const tf = useTranslations("storeForms");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [opening, setOpening] = useState<BuiltInFormKind | null>(null);
  const base = `/stores/${storeId}/website/forms`;

  const open = (kind: BuiltInFormKind) => {
    setOpening(kind);
    startTransition(async () => {
      const result = await openBuiltInForm(storeId, kind);
      if (result.success) router.push(`${base}/${result.data.id}`);
      else {
        toast.error(tf(`errors.${result.error}`));
        setOpening(null);
      }
    });
  };

  return (
    <SectionCard id="built-in-forms" icon={ShoppingBag} title={t("title")} description={t("description")}>
      <ul className="grid grid-cols-3 gap-3 max-[900px]:grid-cols-2 max-[600px]:grid-cols-1">
        <Card
          icon={ShoppingBag}
          title={t("checkout.title")}
          description={t("checkout.description")}
          status={<Tag tone="success">{tf("status.active")}</Tag>}
          meta={t("fields", { count: checkoutFieldCount })}
          action={
            <SellerButton asChild variant="mini" size="xs">
              <Link href={`/stores/${storeId}/settings/checkout#checkout-form`}>
                <Pencil aria-hidden />
                {t("edit")}
              </Link>
            </SellerButton>
          }
        />
        {cards.map(({ kind, form, pinned }) => {
          const busy = isPending && opening === kind;
          // The first open goes through the server, which remembers which form this card is (or creates it).
          const editAction =
            form ? (
              <SellerButton asChild variant="mini" size="xs">
                <Link
                  href={`${base}/${form.id}`}
                  onClick={(e) => {
                    if (readOnly || pinned) return;
                    e.preventDefault();
                    open(kind);
                  }}
                >
                  {busy ? <LoaderCircle className="animate-spin" aria-hidden /> : <Pencil aria-hidden />}
                  {t("edit")}
                </Link>
              </SellerButton>
            ) : (
              <SellerButton variant="mini" size="xs" disabled={readOnly || isPending} onClick={() => open(kind)}>
                {busy ? <LoaderCircle className="animate-spin" aria-hidden /> : <Plus aria-hidden />}
                {t("setUp")}
              </SellerButton>
            );
          return (
            <Card
              key={kind}
              icon={ICONS[kind]}
              title={t(`${kind}.title`)}
              description={t(`${kind}.description`)}
              status={
                form ? <Tag tone={form.status === "active" ? "success" : "muted"}>{tf(`status.${form.status}`)}</Tag> : <Tag tone="warning">{t("notSetUp")}</Tag>
              }
              meta={
                form ? (
                  <>
                    {tf("list.meta", { fields: form.fieldCount, submissions: form.submissionCount })}
                    {form.newCount > 0 && <CountPill value={tf("list.newCount", { count: form.newCount })} />}
                  </>
                ) : (
                  t("notSetUpHint")
                )
              }
              action={
                <>
                  {editAction}
                  {form && form.submissionCount > 0 && (
                    <SellerButton asChild variant="mini" size="xs">
                      <Link href={`${base}?form=${form.id}#submissions`}>
                        <Inbox aria-hidden />
                        {tf("list.submissions")}
                      </Link>
                    </SellerButton>
                  )}
                </>
              }
            />
          );
        })}
      </ul>
    </SectionCard>
  );
}
