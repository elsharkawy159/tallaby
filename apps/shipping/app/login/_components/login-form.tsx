"use client";

import { useEffect, useMemo, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Loader2, Truck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";

import { login } from "@/actions/auth";
import { LanguageSwitcher } from "@/components/language-switcher";

/**
 * react-hook-form + zodResolver as everywhere else, but deliberately using
 * `register()` with plain Input/Label rather than the shared <Form>/<FormField>
 * components.
 *
 * pnpm currently resolves two copies of react-hook-form (packages/ui declares
 * react ^19.2.3 while the apps pin 19.2.8), so a `Control` created here is
 * structurally incompatible with the one <Form> expects — the same error that
 * accounts for much of apps/admin's existing typecheck output. Switch this back
 * to <FormField> once React is deduped across the workspace.
 */
export function LoginForm() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("login");

  const schema = useMemo(
    () =>
      z.object({
        email: z.email(t("emailInvalid")),
        password: z.string().min(6, t("passwordMin")),
      }),
    [t]
  );

  type FormData = z.infer<typeof schema>;

  useEffect(() => {
    if (searchParams.get("error") === "forbidden") {
      toast.error(t("forbidden"));
    }
  }, [searchParams, t]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: FormData) => {
    startTransition(async () => {
      const result = await login(values.email, values.password);

      if (!result.success) {
        toast.error(result.error ?? t("couldNotSignIn"));
        return;
      }

      router.replace(result.redirectTo ?? "/");
      router.refresh();
    });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
      <div className="absolute end-4 top-4">
        <LanguageSwitcher />
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Truck className="size-5" />
          </div>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            <div className="grid gap-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder={t("emailPlaceholder")}
                aria-invalid={Boolean(errors.email)}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">{t("password")}</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                aria-invalid={Boolean(errors.password)}
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {isPending ? t("signingIn") : t("signIn")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
