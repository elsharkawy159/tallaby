"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ChevronDown, ClipboardList, Inbox, LoaderCircle, Pencil, Plus, Trash2 } from "lucide-react";

import { FORM_TEMPLATE_IDS } from "@workspace/lib/store-forms";
import type { StoreFormSummary } from "@workspace/lib/store-forms/server";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@workspace/ui/components/dropdown-menu";
import { CountPill, EmptyState, IconButton, IconTile, Note, Row, Rows, SectionCard, SellerButton, Tag } from "@/components/seller-ui";
import { createFormFromTemplate, deleteForm } from "./forms.server";

const formatDate = (iso: string, locale: string) =>
  new Intl.DateTimeFormat(locale === "en" ? "en-EG" : "ar-EG", { dateStyle: "medium" }).format(new Date(iso));

export function FormsList({ storeId, forms, readOnly }: { storeId: string; forms: StoreFormSummary[]; readOnly: boolean }) {
  const t = useTranslations("storeForms");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState<StoreFormSummary | null>(null);
  const base = `/stores/${storeId}/website/forms`;

  // A ready-made form (built on the server); the seller edits it on the next screen.
  const onCreate = (templateId: string) =>
    startTransition(async () => {
      const result = await createFormFromTemplate(storeId, templateId);
      if (result.success) router.push(`${base}/${result.data.id}`);
      else toast.error(t(`errors.${result.error}`));
    });

  const onDelete = (form: StoreFormSummary) =>
    startTransition(async () => {
      const result = await deleteForm(storeId, form.id);
      if (result.success) {
        toast.success(t("list.deleted"));
        router.refresh();
      } else {
        toast.error(t(`errors.${result.error}`));
      }
      setDeleting(null);
    });

  return (
    <>
      {readOnly && <Note>{t("readOnly")}</Note>}
      <SectionCard
        id="store-forms"
        icon={ClipboardList}
        title={t("list.title")}
        description={t("list.description")}
        action={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SellerButton size="sm" disabled={readOnly || isPending}>
                {isPending ? <LoaderCircle className="animate-spin" aria-hidden /> : <Plus aria-hidden />}
                {t("list.create")}
                <ChevronDown aria-hidden />
              </SellerButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>{t("list.templates")}</DropdownMenuLabel>
              {FORM_TEMPLATE_IDS.map((id) => (
                <DropdownMenuItem key={id} className="flex-col items-start gap-0.5" onSelect={() => onCreate(id)}>
                  <span className="font-medium">{t(`templates.${id}.name` as never)}</span>
                  <span className="text-xs text-muted-foreground">{t(`templates.${id}.description` as never)}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        }
      >
        {forms.length === 0 ? (
          <Rows>
            <EmptyState icon={ClipboardList} title={t("list.emptyTitle")} description={t("list.emptyBody")} />
          </Rows>
        ) : (
          <Rows>
            {forms.map((form) => (
              <Row
                key={form.id}
                className="flex-wrap max-[600px]:[&>.min-w-0]:basis-full"
                start={<IconTile icon={ClipboardList} className="max-[600px]:hidden" />}
                title={
                  <>
                    <Link href={`${base}/${form.id}`} className="min-w-0 truncate text-inherit no-underline hover:underline">
                      {form.name}
                    </Link>
                    {form.status === "disabled" && <Tag>{t("status.disabled")}</Tag>}
                    {form.newCount > 0 && <CountPill value={t("list.newCount", { count: form.newCount })} />}
                  </>
                }
                description={
                  <>
                    {t("list.meta", { fields: form.fieldCount, submissions: form.submissionCount })}
                    {form.lastSubmissionAt && ` · ${t("list.lastSubmission", { date: formatDate(form.lastSubmissionAt, locale) })}`}
                  </>
                }
                end={
                  <>
                    <SellerButton asChild variant="mini" size="xs">
                      <Link href={`${base}?form=${form.id}#submissions`}>
                        <Inbox aria-hidden />
                        {t("list.submissions")}
                      </Link>
                    </SellerButton>
                    <SellerButton asChild variant="mini" size="xs">
                      <Link href={`${base}/${form.id}`}>
                        <Pencil aria-hidden />
                        {t("list.edit")}
                      </Link>
                    </SellerButton>
                    <IconButton className="text-destructive hover:text-destructive" disabled={readOnly || isPending} onClick={() => setDeleting(form)} aria-label={t("list.delete")}>
                      <Trash2 aria-hidden />
                    </IconButton>
                  </>
                }
              />
            ))}
          </Rows>
        )}
        <Note>{t("list.placeHint")}</Note>
      </SectionCard>

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("list.deleteTitle", { name: deleting?.name ?? "" })}</AlertDialogTitle>
            <AlertDialogDescription>{t("list.deleteDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                if (deleting) onDelete(deleting);
              }}
            >
              {t("list.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
