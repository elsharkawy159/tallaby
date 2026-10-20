"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFormatter, useTranslations } from "next-intl";
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
} from "lucide-react";

import { storeHostname, storeUrl, subdomainFromName } from "@workspace/lib/storefront";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
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
import { Progress } from "@workspace/ui/components/progress";
import { TextInput } from "@workspace/ui/components/inputs/text-input";

import { SubdomainField } from "@/components/stores/subdomain-field.client";
import { StoreLogo } from "@/components/stores/store-logo.client";
import { selectStore } from "@/components/dashboard/store-switcher.server";
import { cn } from "@/lib/utils";
import { archiveStoreAction, checkNewStoreSubdomain, createStoreAction, restoreStoreAction } from "./stores.server";
import type { StoreCardData, StoreErrorKey } from "./stores.dto";

const GRADIENTS = [
  "from-emerald-500/20 to-teal-500/20",
  "from-sky-500/20 to-cyan-500/20",
  "from-amber-500/20 to-orange-500/20",
  "from-rose-500/20 to-pink-500/20",
  "from-violet-500/20 to-indigo-500/20",
];

function gradientFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length]!;
}

export function StoresView({
  stores,
  selectedId,
  maxStores,
  openCreate,
}: {
  stores: StoreCardData[];
  selectedId: string | null;
  maxStores: number;
  openCreate: boolean;
}) {
  const t = useTranslations("stores");
  const [createOpen, setCreateOpen] = useState(openCreate);
  const atLimit = stores.length >= maxStores;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-muted-foreground">{t("description")}</p>
          <div className="flex max-w-xs items-center gap-3">
            <Progress value={(stores.length / Math.max(maxStores, 1)) * 100} className="h-1.5" />
            <span className="shrink-0 text-xs text-muted-foreground">
              {t("usage", { count: stores.length, max: maxStores })}
            </span>
          </div>
        </div>
        <Button onClick={() => setCreateOpen(true)} disabled={atLimit} title={atLimit ? t("limitHint") : undefined}>
          <Plus className="size-4" />
          {t("create")}
        </Button>
      </div>

      {atLimit && <p className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">{t("limitHint")}</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stores.map((store) => (
          <StoreCard key={store.id} store={store} isSelected={store.id === selectedId} />
        ))}
      </div>

      <CreateStoreDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
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

  return (
    <div
      className={cn(
        "group overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-md",
        isSelected && "ring-2 ring-primary/40",
        archived && "opacity-70",
      )}
    >
      <div className={cn("relative flex h-32 items-center justify-center bg-gradient-to-br", gradientFor(store.subdomain))}>
        <StoreLogo name={store.name} logoUrl={store.logoUrl} className="size-14 rounded-2xl border-background shadow-sm" />
        <div className="absolute start-3 top-3 flex gap-1.5">
          {store.isPrimary && <Badge variant="secondary">{tNav("primaryStore")}</Badge>}
          {archived && <Badge variant="outline">{tNav("archived")}</Badge>}
          {store.status === "suspended" && <Badge variant="destructive">{t("suspended")}</Badge>}
        </div>
        {!archived && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute end-3 top-3 flex size-8 items-center justify-center rounded-lg bg-background/80 opacity-0 shadow-sm transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
            aria-label={tNav("viewStore")}
          >
            <ExternalLink className="size-4" />
          </a>
        )}
      </div>
      <div className="flex items-start justify-between gap-2 p-4">
        <div className="min-w-0 space-y-1">
          <h3 className="truncate font-semibold leading-tight">{store.name}</h3>
          <p dir="ltr" className="truncate text-start text-sm text-muted-foreground rtl:text-end">
            {host}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("createdOn", { date: format.dateTime(new Date(store.createdAt), { dateStyle: "medium" }) })}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8 shrink-0" disabled={isPending} aria-label={t("actions")}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <MoreHorizontal className="size-4" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!archived && (
              <DropdownMenuItem asChild>
                <a href={url} target="_blank" rel="noopener noreferrer">
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
    </div>
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
      router.replace("/stores");
      router.refresh();
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
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="size-4 animate-spin" />}
                {t("create")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
