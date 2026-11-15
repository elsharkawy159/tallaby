"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
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
import { IconButton } from "@/components/seller-ui";
import { deletePost } from "./blog.server";

export function DeletePostButton({
  storeId,
  postId,
  title,
  afterDelete,
}: {
  storeId: string;
  postId: string;
  title: string;
  /** Where to go after deleting (the list refreshes in place by default). */
  afterDelete?: string;
}) {
  const t = useTranslations("websiteBlog");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onDelete = () =>
    startTransition(async () => {
      const result = await deletePost(storeId, postId);
      if (!result.success) {
        toast.error(t(`errors.${result.error}`));
        return;
      }
      toast.success(t("deleted"));
      if (afterDelete) router.push(afterDelete);
      else router.refresh();
    });

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <IconButton className="text-destructive hover:text-destructive" aria-label={t("delete")} disabled={isPending}>
          <Trash2 aria-hidden />
        </IconButton>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
          <AlertDialogDescription>{t("deleteText", { title })}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={onDelete} className="bg-destructive text-white hover:bg-destructive/90">{t("delete")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
