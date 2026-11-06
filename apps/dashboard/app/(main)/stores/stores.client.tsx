"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { toast } from "sonner";
import { z } from "zod";
import {
  Archive,
  ArchiveRestore,
  Copy,
  ExternalLink,
  Loader2,
  MoreHorizontal,
  MousePointerClick,
  Plus,
  Sparkles,
} from "lucide-react";

import { storeHostname, storeUrl, subdomainFromName } from "@workspace/lib/storefront";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Form } from "@workspace/ui/components/form";
import { TextInput } from "@workspace/ui/components/inputs/text-input";

import { SubdomainField } from "@/components/stores/subdomain-field.client";
import { StoreSiteStatusNote } from "@/components/stores/store-site-status-note";
import { StoreLogo } from "@/components/stores/store-logo.client";
import { selectStore } from "@/components/dashboard/store-switcher.server";
import { IconButton, Note, PageHeader, SellerButton, SellerCard, Tag } from "@/components/seller-ui";
import { cn } from "@/lib/utils";
import { archiveStoreAction, checkNewStoreSubdomain, createStoreAction, restoreStoreAction } from "./stores.server";
import type { StoreCardData, StoreErrorKey } from "./stores.dto";

export function StoresView({
  stores,
  selectedId,
  maxStores,
  openCreate,
  aiBuilder = false,
}: {
  stores: StoreCardData[];
  selectedId: string | null;
  maxStores: number;
  openCreate: boolean;
  /** The AI Store Builder's switch (F-54). */
  aiBuilder?: boolean;
}) {
  const t = useTranslations("stores");
  const tBuilder = useTranslations("aiBuilder");
  const [createOpen, setCreateOpen] = useState(openCreate);
  const atLimit = stores.length >= maxStores;

  return (
    <>
      <PageHeader
        title={t("title")}
        description={
          <>
            {t("description")}
            <div className="mt-2 flex max-w-xs items-center gap-3">
              <div
                className="h-1.5 flex-1 overflow-hidden rounded-full bg-(--s-fill)"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={maxStores}
                aria-valuenow={stores.length}
              >
                <div
                  className="h-full rounded-full bg-(--s-primary)"
                  style={{ width: `${Math.min(100, (stores.length / Math.max(maxStores, 1)) * 100)}%` }}
                />
              </div>
              <span className="shrink-0 text-xs text-(--s-subtle)">{t("usage", { count: stores.length, max: maxStores })}</span>
            </div>
          </>
        }
        actions={
          <>
            {aiBuilder && (
              <SellerButton variant="outline" asChild>
                <Link href="/ai-builder">
                  <Sparkles aria-hidden />
                  {tBuilder("entry")}
                </Link>
              </SellerButton>
            )}
            <SellerButton onClick={() => setCreateOpen(true)} disabled={atLimit} title={atLimit ? t("limitHint") : undefined}>
              <Plus aria-hidden />
              {t("create")}
            </SellerButton>
          </>
        }
      />

      {atLimit && <Note tone="amber">{t("limitHint")}</Note>}

      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-3.5">
        {stores.map((store) => (
          <StoreCard key={store.id} store={store} isSelected={store.id === selectedId} />
        ))}
      </div>

      <CreateStoreDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}

function useErrorToast() {
  const t = useTranslations("stores.errors");
  return (error: StoreErrorKey) => toast.error(t(error));
}

function StoreCard({ store, isSelected }: { store: StoreCardData; isSelected: boolean }) {
  const t = useTranslations("stores");
  const tNav = useTranslations("nav");
  const format = useFormatter();
  const router = useRouter();
  const showError = useErrorToast();
  const [isPending, startTransition] = useTransition();
  const [confirmArchive, setConfirmArchive] = useState(false);
  const url = storeUrl(store.subdomain, store.customDomain);
  const host = storeHostname(store.subdomain, store.customDomain);
  const archived = store.status === "archived";

  const run = (action: () => Promise<{ success: boolean; error?: StoreErrorKey }>, done: string) =>
    startTransition(async () => {
      const result = await action();
      if (result.success) {
        toast.success(done);
        router.refresh();
      } else if (result.error) {
        showError(result.error);
      }
    });

  const copy = () =>
    navigator.clipboard.writeText(url).then(
      () => toast.success(tNav("storeLinkCopied")),
      () => toast.error(tNav("storeLinkCopyFailed")),
    );

  const makeCurrent = () =>
    startTransition(async () => {
      const result = await selectStore(store.id);
      if (result.success) {
        toast.success(t("selected", { name: store.name }));
        router.refresh();
      }
    });

  // Selecting only steers the sidebar; every store page still takes its storeId from the URL.
  const manage = () =>
    startTransition(async () => {
      await selectStore(store.id);
      router.push(`/stores/${store.id}/website`);
    });

  return (
    <SellerCard
      className={cn(
        "flex flex-col gap-3 p-5 transition-shadow duration-200 hover:shadow-(--s-shadow-hover) max-[600px]:p-4",
        isSelected && "border-(--s-primary) shadow-[0_0_0_3px_var(--s-focus-soft)]",
        archived && "opacity-70",
      )}
    >
      <div className="flex items-start gap-3">
        <StoreLogo name={store.name} logoUrl={store.logoUrl} className="size-12 shrink-0 rounded-2xl border-(--s-line)" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[15.5px] font-bold leading-snug text-(--s-ink)">{store.name}</h2>
          <bdi dir="ltr" className="block truncate font-montserrat text-[12.5px] text-(--s-subtle)">
            {host}
          </bdi>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconButton disabled={isPending} aria-label={t("actions")}>
              {isPending ? <Loader2 className="animate-spin" aria-hidden /> : <MoreHorizontal aria-hidden />}
            </IconButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!archived && (
              <DropdownMenuItem asChild>
                <a href={`/api/stores/${store.id}/view`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-4" />
                  {tNav("viewStore")}
                </a>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={copy}>
              <Copy className="size-4" />
              {tNav("copyStoreLink")}
            </DropdownMenuItem>
            {!archived && !isSelected && (
              <DropdownMenuItem onSelect={makeCurrent}>
                <MousePointerClick className="size-4" />
                {t("makeCurrent")}
              </DropdownMenuItem>
            )}
            {!store.isPrimary && (
              <>
                <DropdownMenuSeparator />
                {archived ? (
                  <DropdownMenuItem onSelect={() => run(() => restoreStoreAction(store.id), t("restored"))}>
                    <ArchiveRestore className="size-4" />
                    {t("restore")}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onSelect={() => setConfirmArchive(true)} className="text-destructive focus:text-destructive">
                    <Archive className="size-4" />
                    {t("archive")}
                  </DropdownMenuItem>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {(store.isPrimary || archived || store.status === "suspended") && (
        <div className="flex flex-wrap gap-1.5">
          {store.isPrimary && <Tag tone="info">{tNav("primaryStore")}</Tag>}
          {archived && <Tag>{tNav("archived")}</Tag>}
          {store.status === "suspended" && <Tag tone="danger">{t("suspended")}</Tag>}
        </div>
      )}

      <div className="flex min-w-0 flex-col gap-1">
        {!archived && <StoreSiteStatusNote siteStatus={store.siteStatus} />}
        <p className="text-xs text-(--s-subtle)">
          {t("createdOn", { date: format.dateTime(new Date(store.createdAt), { dateStyle: "medium" }) })}
        </p>
      </div>

      {!archived && (
        <div className="mt-auto flex items-center gap-2">
          <SellerButton type="button" variant="outline" className="flex-1" disabled={isPending} onClick={manage}>
            {t("manage")}
          </SellerButton>
          <IconButton asChild aria-label={tNav("viewStore")} className="size-[42px] border-[1.5px] border-(--s-outline)">
            <a href={`/api/stores/${store.id}/view`} target="_blank" rel="noopener noreferrer">
              <ExternalLink aria-hidden />
            </a>
          </IconButton>
        </div>
      )}

      <AlertDialog open={confirmArchive} onOpenChange={setConfirmArchive}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("archiveTitle", { name: store.name })}</AlertDialogTitle>
            <AlertDialogDescription>{t("archiveDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => run(() => archiveStoreAction(store.id), t("archived"))}>
              {t("archive")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SellerCard>
  );
}

function CreateStoreDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("stores");
  const tSignup = useTranslations("signup");
  const router = useRouter();
  const showError = useErrorToast();
  const [isPending, startTransition] = useTransition();
  const [available, setAvailable] = useState(false);

  const schema = z.object({
    name: z.string().trim().min(2, t("errors.nameTooShort")).max(80, t("errors.nameTooLong")),
    subdomain: z.string().trim().min(3, tSignup("tooShort")).max(32, tSignup("tooLong")),
  });
  type Values = z.infer<typeof schema>;
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: "", subdomain: "" } });

  useEffect(() => {
    if (!open) form.reset();
  }, [open, form]);

  // Fill the address from the name until the seller edits the address themselves
  // (typing in it or picking a suggestion marks it dirty).
  const name = form.watch("name");
  useEffect(() => {
    if (form.getFieldState("subdomain").isDirty) return;
    form.setValue("subdomain", subdomainFromName(name ?? ""));
  }, [name, form]);

  const onSubmit = (values: Values) => {
    if (!available) {
      form.setError("subdomain", { message: t("errors.invalidSubdomain") });
      return;
    }
    startTransition(async () => {
      const result = await createStoreAction(values);
      if (!result.success) {
        if (result.error === "subdomainTaken") form.setError("subdomain", { message: t("errors.subdomainTaken") });
        showError(result.error);
        return;
      }
      toast.success(t("createdToast", { name: values.name }));
      onOpenChange(false);
      // Open the new store so the seller lands on its next step, not back on the list.
      await selectStore(result.data.id);
      router.push(`/stores/${result.data.id}/website`);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("createTitle")}</DialogTitle>
          <DialogDescription>{t("createDescription")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <TextInput form={form} name="name" label={t("name")} placeholder={t("namePlaceholder")} disabled={isPending} autoFocus required />
            <SubdomainField
              form={form}
              name="subdomain"
              check={checkNewStoreSubdomain}
              onAvailabilityChange={setAvailable}
              disabled={isPending}
            />
            <DialogFooter>
              <SellerButton type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                {t("cancel")}
              </SellerButton>
              <SellerButton type="submit" disabled={isPending}>
                {isPending && <Loader2 className="animate-spin" aria-hidden />}
                {t("create")}
              </SellerButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
