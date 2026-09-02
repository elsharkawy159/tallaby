"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";

import { updateMyProfile, uploadRiderAvatar } from "../../rider.server";

interface ProfileEditFormProps {
  fullName: string | null;
  phone: string | null;
  email: string | null;
  avatarUrl: string | null;
}

export function ProfileEditForm({
  fullName: initialFullName,
  phone: initialPhone,
  email,
  avatarUrl: initialAvatarUrl,
}: ProfileEditFormProps) {
  const t = useTranslations("rider");
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [isUploading, startUploadTransition] = useTransition();
  const [fullName, setFullName] = useState(initialFullName ?? "");
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? "");

  const displayName = fullName || email || "?";
  const isBusy = isPending || isUploading;

  const handleAvatarSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    startUploadTransition(async () => {
      const result = await uploadRiderAvatar(formData);
      if (result.success && result.data?.url) {
        setAvatarUrl(result.data.url);
        toast.success(result.message ?? t("saved"));
        router.refresh();
      } else {
        toast.error(result.error ?? t("somethingWrong"));
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      const result = await updateMyProfile({
        fullName,
        phone,
        avatarUrl: avatarUrl || undefined,
      });

      if (result.success) {
        toast.success(result.message ?? t("saved"));
        router.refresh();
      } else {
        toast.error(result.error ?? t("somethingWrong"));
      }
    });
  };

  return (
    <Card className="gap-0 py-4">
      <CardContent className="px-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="group relative shrink-0 rounded-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={isBusy}
              aria-label={t("changePhoto")}
            >
              <Avatar className="size-14">
                {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
                <AvatarFallback className="text-lg font-semibold text-primary">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                {isUploading ? (
                  <Loader2 className="size-5 animate-spin text-white" />
                ) : (
                  <Camera className="size-5 text-white" />
                )}
              </span>
            </button>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{t("editProfile")}</p>
              <p className="truncate text-xs text-muted-foreground">
                {email ?? "—"}
              </p>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto px-0 text-xs"
                onClick={() => fileInputRef.current?.click()}
                disabled={isBusy}
              >
                {t("changePhoto")}
              </Button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            disabled={isBusy}
            onChange={handleAvatarSelect}
          />

          <div className="space-y-1.5">
            <Label htmlFor="rider-profile-name">{t("fullName")}</Label>
            <Input
              id="rider-profile-name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              disabled={isBusy}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rider-profile-phone">{t("phone")}</Label>
            <Input
              id="rider-profile-phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              disabled={isBusy}
              required
            />
          </div>

          <Button type="submit" disabled={isBusy || !fullName.trim() || !phone.trim()}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {isPending ? t("saving") : t("saveProfile")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
