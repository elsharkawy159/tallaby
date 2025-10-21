"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { LoaderCircle } from "lucide-react";
import { useTransition } from "react";
import { FieldValues, useForm } from "react-hook-form";
import Swal from "sweetalert2";
import { cn } from "@/lib/utils";
import { createClient } from "@/supabase/client";
import { z } from "zod";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";

export function ForgotForm() {
  const [isPending, startTransition] = useTransition();

  const forgotFormSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
  });
  const form = useForm<z.infer<typeof forgotFormSchema>>({
    resolver: zodResolver(forgotFormSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (values: z.infer<typeof forgotFormSchema>) => {
    startTransition(async () => {
      const supabse = createClient();
      const result = await supabse.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
      });
      const { error } = result;

      if (error) {
        Swal.fire({
          title: "Error Message",
          text: error.message,
          icon: "error",
        });
      } else {
        Swal.fire({
          text: "برجاء التحقق من البريد الإلكتروني الخاص بك لإعادة تعيين كلمة المرور الخاصة بك من الممكن أن يستغرق الأمر 5 دقائق. ",
          icon: "success",
        });
      }
    });
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
          <div className="space-y-5">
            <FormField
              control={form.control}
              name="email"
              render={({ field }: { field: FieldValues }) => (
                <FormItem className="space-y-3">
                  <FormLabel>البريد الالكتروني</FormLabel>
                  <FormControl>
                    <Input
                      id="email"
                      placeholder="hisaccount@mail.com"
                      type="email"
                      {...field}
                      className="h-12 rounded-xl"
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button
            type="submit"
            className="w-full flex gap-2 hover:text-white bg-gray-100 text-foreground "
            disabled={isPending}
          >
            إعادة تعيين كلمة المرور
            <LoaderCircle
              className={cn(" animate-spin", { hidden: !isPending })}
            />
          </Button>
        </form>
      </Form>
    </>
  );
}
