"use client";

import { useState, useTransition } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Check, FolderTree, Pencil, Plus, Trash2, X } from "lucide-react";
import { BLOG_CATEGORY_NAME_MAX, BLOG_MAX_CATEGORIES } from "@workspace/lib/cms";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog";
import { EmptyState, IconButton, Note, PageHeader, Row, Rows, SellerButton, SellerCard, TextInput } from "@/components/seller-ui";
import type { BlogCategoryItem } from "../blog.dto";
import { changeBlogCategory } from "./blog-categories.server";

/**
 * The blog categories list (owner, 2026-11-27): add, rename, reorder and
 * delete. Every change goes through `changeBlogCategory`, which re-checks the
 * store; the page then refreshes from the server.
 */
export function BlogCategories({
  storeId,
  initial,
  readOnly,
  title,
  description,
}: {
  storeId: string;
  initial: BlogCategoryItem[];
  readOnly: boolean;
  title: string;
  description: string;
}) {
  const t = useTranslations("websiteBlog.categories");
  const tErrors = useTranslations("websiteBlog.errors");
  const router = useRouter();
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const disabled = readOnly || isPending;
  const full = initial.length >= BLOG_MAX_CATEGORIES;
  const postsBase = `/stores/${storeId}/website/blog`;

  const run = (op: Record<string, unknown>, done?: () => void, success?: string) =>
    startTransition(async () => {
      const result = await changeBlogCategory(storeId, op);
      if (!result.success) {
        toast.error(result.error === "duplicateName" || result.error === "limitReached" || result.error === "notFound" ? t(`errors.${result.error}`) : tErrors(result.error));
        return;
      }
      done?.();
      if (success) toast.success(success);
      router.refresh();
    });

  const onAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    run({ op: "add", name: name.trim() }, () => setName(""), t("added"));
  };

  const onRename = () => {
    if (!editing || !editing.name.trim()) return;
    run({ op: "rename", id: editing.id, name: editing.name.trim() }, () => setEditing(null), t("renamed"));
  };

  return (
    <>
      <PageHeader className="sui-rise" title={title} description={description} />
      {readOnly && <Note>{t("readOnly")}</Note>}

      {!readOnly && (
        <form onSubmit={onAdd} className="sui-rise flex items-center gap-2 max-[600px]:flex-col max-[600px]:items-stretch">
          <TextInput
            aria-label={t("newName")}
            placeholder={t("newName")}
            maxLength={BLOG_CATEGORY_NAME_MAX}
            value={name}
            disabled={disabled || full}
            onChange={(e) => setName(e.target.value)}
            className="flex-1"
          />
          <SellerButton type="submit" disabled={disabled || full || !name.trim()}>
            <Plus aria-hidden />
            {t("add")}
          </SellerButton>
        </form>
      )}
      {full && !readOnly && <Note tone="amber">{t("errors.limitReached")}</Note>}

      {initial.length === 0 ? (
        <SellerCard className="sui-rise">
          <EmptyState icon={FolderTree} title={t("emptyTitle")} description={t("emptyText")} />
        </SellerCard>
      ) : (
        <Rows className="sui-rise">
          {initial.map((category, index) =>
            editing?.id === category.id ? (
              <Row
                key={category.id}
                title={
                  <TextInput
                    autoFocus
                    aria-label={t("rename")}
                    maxLength={BLOG_CATEGORY_NAME_MAX}
                    value={editing.name}
                    disabled={disabled}
                    onChange={(e) => setEditing({ id: category.id, name: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") onRename();
                      if (e.key === "Escape") setEditing(null);
                    }}
                  />
                }
                end={
                  <>
                    <IconButton aria-label={t("save")} title={t("save")} disabled={disabled || !editing.name.trim()} onClick={onRename}>
                      <Check aria-hidden />
                    </IconButton>
                    <IconButton aria-label={t("cancel")} title={t("cancel")} disabled={isPending} onClick={() => setEditing(null)}>
                      <X aria-hidden />
                    </IconButton>
                  </>
                }
              />
            ) : (
              <Row
                key={category.id}
                start={
                  !readOnly && (
                    <div className="flex flex-col">
                      <IconButton className="size-7" aria-label={t("moveUp")} title={t("moveUp")} disabled={disabled || index === 0} onClick={() => run({ op: "move", id: category.id, direction: "up" })}>
                        <ArrowUp aria-hidden />
                      </IconButton>
                      <IconButton
                        className="size-7"
                        aria-label={t("moveDown")}
                        title={t("moveDown")}
                        disabled={disabled || index === initial.length - 1}
                        onClick={() => run({ op: "move", id: category.id, direction: "down" })}
                      >
                        <ArrowDown aria-hidden />
                      </IconButton>
                    </div>
                  )
                }
                title={<span className="min-w-0 truncate">{category.name}</span>}
                description={
                  <Link href={`${postsBase}?category=${category.id}`} className="no-underline hover:underline">
                    {t("postCount", { count: category.postCount })}
                  </Link>
                }
                end={
                  !readOnly && (
                    <>
                      <IconButton aria-label={t("rename")} title={t("rename")} disabled={disabled} onClick={() => setEditing({ id: category.id, name: category.name })}>
                        <Pencil aria-hidden />
                      </IconButton>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <IconButton className="text-destructive hover:text-destructive" aria-label={t("delete")} title={t("delete")} disabled={disabled}>
                            <Trash2 aria-hidden />
                          </IconButton>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
                            <AlertDialogDescription>{t("deleteText", { name: category.name, count: category.postCount })}</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => run({ op: "delete", id: category.id }, undefined, t("deleted"))}
                              className="bg-destructive text-white hover:bg-destructive/90"
                            >
                              {t("delete")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )
                }
              />
            ),
          )}
        </Rows>
      )}
    </>
  );
}
