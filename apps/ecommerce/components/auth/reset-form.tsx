"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@workspace/ui/components/form";
import { Button } from "@workspace/ui/components/button";
import { LoaderCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import { cn } from "@/lib/utils";
import { createClient } from "@/supabase/client";
import { z } from "zod";
import { Input } from "@workspace/ui/components/input";

export function ResetForm() {
  const { push } = useRouter();
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("error") == "access_denied" || searchParams.get("error_code") == "403") {
      Swal.fire({
        title: "رسالة خطأ",
        text: "انتهت صلاحية رابط إعادة التعيين برجاء المحاولة مرة اخرى",
        icon: "error",
      });

      push("/auth/forgot-password");
    }
  }, [searchParams]);

  const resetFormSchema = z.object({
    password: z.string().min(1, "Password is required"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
  });

  const form = useForm<z.infer<typeof resetFormSchema>>({
    resolver: zodResolver(resetFormSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (values: z.infer<typeof resetFormSchema>) => {
    startTransition(async () => {
      const supabase = createClient();
      const result = await supabase.auth.updateUser({
        password: values.password,
      });
      const { error, data } = result;

      if (error) {
        Swal.fire({
          title: "Error Message",
          text: error.message,
          icon: "error",
        });
      } else {
        Swal.fire({
          text: "تم إعادة تعيين كلمة المرور الخاصة بك بنجاح!",
          icon: "success",
        });

        push("/");
      }
    });
  };

  return (
    <>
      <div className="space-y-2 text-center flex flex-col py-6">
        <h2 className=" text-xl font-medium">إعادة تعيين كلمة المرور</h2>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
          <div className="space-y-5">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>كلمة المرور</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>تأكيد كلمة المرور</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" className="w-full flex gap-2 bg-gray-100 text-foreground " disabled={isPending}>
            إعادة تعيين كلمة المرور
            <LoaderCircle className={cn(" animate-spin", { hidden: !isPending })} />
          </Button>
        </form>
      </Form>
    </>
  );
}
