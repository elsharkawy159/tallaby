"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ClipboardList, Inbox, LoaderCircle, Pencil, Plus, Trash2 } from "lucide-react";

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
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { SectionCard, SMALL_BUTTON_CLASS } from "@/components/form/form-ui";
import { createForm, deleteForm } from "./forms.server";

const formatDate = (iso: string, locale: string) =>
  new Intl.DateTimeFormat(locale === "en" ? "en-EG" : "ar-EG", { dateStyle: "medium" }).format(new Date(iso));

export function FormsList({ storeId, forms, readOnly }: { storeId: string; forms: StoreFormSummary[]; readOnly: boolean }) {
  const t = useTranslations("storeForms");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState<StoreFormSummary | null>(null);
  const base = `/stores/${storeId}/website/forms`;

  // A ready-to-use contact form; the seller edits it on the next screen.
  const onCreate = () =>
    startTransition(async () => {
      const result = await createForm(storeId, {
        name: t("starter.name"),
        fields: [
          { id: "name", type: "text", key: "name", label: t("starter.fullName"), required: true, width: "half" },
          { id: "phone", type: "phone", key: "phone", label: t("starter.phone"), required: false, width: "half" },
          { id: "email", type: "email", key: "email", label: t("starter.email"), required: true, width: "full" },
          { id: "message", type: "textarea", key: "message", label: t("starter.message"), required: true, width: "full" },
        ],
      });
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
    <div className="space-y-5">
      {readOnly && <p className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">{t("readOnly")}</p>}
      <SectionCard
        id="store-forms"
        icon={ClipboardList}
        title={t("list.title")}
        description={t("list.description")}
        action={
          <Button type="button" size="sm" className={SMALL_BUTTON_CLASS} disabled={readOnly || isPending} onClick={onCreate}>
            {isPending ? <LoaderCircle className="animate-spin" /> : <Plus />}
            {t("list.create")}
          </Button>
        }
      >
        {forms.length === 0 ? (
          <div className="py-8 text-center">
            <p className="font-medium">{t("list.emptyTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("list.emptyBody")}</p>
          </div>
        ) : (
          <ul className="divide-y">
            {forms.map((form) => (
              <li key={form.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`${base}/${form.id}`} className="truncate font-medium hover:underline">
                      {form.name}
                    </Link>
                    {form.status === "disabled" && <Badge variant="secondary">{t("status.disabled")}</Badge>}
                    {form.newCount > 0 && <Badge>{t("list.newCount", { count: form.newCount })}</Badge>}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t("list.meta", { fields: form.fieldCount, submissions: form.submissionCount })}
                    {form.lastSubmissionAt && ` · ${t("list.lastSubmission", { date: formatDate(form.lastSubmissionAt, locale) })}`}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <Button asChild variant="outline" size="sm" className={SMALL_BUTTON_CLASS}>
                    <Link href={`${base}/submissions?form=${form.id}`}>
                      <Inbox />
                      {t("list.submissions")}
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className={SMALL_BUTTON_CLASS}>
                    <Link href={`${base}/${form.id}`}>
                      <Pencil />
                      {t("list.edit")}
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-[34px]"
                    disabled={readOnly || isPending}
                    onClick={() => setDeleting(form)}
                    aria-label={t("list.delete")}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-muted-foreground">{t("list.placeHint")}</p>
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
    </div>
  );
}
