"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type { User } from "@supabase/supabase-js";

import { Button } from "@workspace/ui/components/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import { Checkbox } from "@workspace/ui/components/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";

import {
  contactFormAuthenticatedSchema,
  contactFormGuestSchema,
  type ContactFormAuthenticatedData,
  type ContactFormGuestData,
} from "@/lib/validations/contact-schema";
import { submitContactForm } from "@/actions/contact";

interface ContactFormProps {
  user: User | null;
}

export function ContactForm({ user }: ContactFormProps) {
  const t = useTranslations("pages.contactPage");
  const tToast = useTranslations("toast");
  const [isPending, startTransition] = useTransition();

  const isAuthenticated = !!user;

  // Get default values based on authentication status
  const getDefaultValues = ():
    | ContactFormAuthenticatedData
    | ContactFormGuestData => {
    if (!isAuthenticated) {
      return {
        fullName: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
        requestCall: false,
      };
    }

    return {
      subject: "",
      message: "",
      requestCall: false,
    };
  };

  const defaultValues = getDefaultValues();

  // Use different schemas based on authentication status
  const form = useForm({
    resolver: zodResolver(
      isAuthenticated ? contactFormAuthenticatedSchema : contactFormGuestSchema
    ) as any,
    defaultValues: defaultValues as any,
  });

  const handleSubmit = (data: any) => {
    startTransition(async () => {
      try {
        const result = await submitContactForm(data);

        if (result.success) {
          toast.success(tToast("contactMessageSentSuccessfully"));
          form.reset(getDefaultValues());
        } else {
          toast.error(result.message || tToast("unexpectedError"));

          if (result.errors) {
            Object.entries(result.errors).forEach(([field, messages]) => {
              form.setError(field as any, {
                type: "server",
                message: messages[0],
              });
            });
          }
        }
      } catch (error) {
        console.error("Form submission error:", error);
        toast.error(tToast("unexpectedError"));
      }
    });
  };

  const subjectOptions = [
    { value: "general", label: t("generalInquiry") },
    { value: "order", label: t("orderSupport") },
    { value: "product", label: t("productQuestion") },
    { value: "returns", label: t("returnsRefunds") },
    { value: "technical", label: t("technicalIssue") },
    { value: "partnership", label: t("partnershipInquiry") },
    { value: "other", label: t("other") },
  ];

  return (
    <div className="max-w-2xl mx-auto w-full">
      <h2 className="text-2xl font-bold mb-6">{t("sendMessage")}</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Guest user fields */}
          {!isAuthenticated && (
            <>
              <FormField
                control={form.control as any}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("fullName")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("fullNamePlaceholder")}
                        {...field}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("emailAddress")} </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={t("emailPlaceholder")}
                        {...field}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("phoneNumber")}</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder={t("phonePlaceholder")}
                        {...field}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          {/* Subject field - for both authenticated and guest users */}
          <FormField
            control={form.control as any}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("subject")}</FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isPending}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("selectTopic")} />
                    </SelectTrigger>
                    <SelectContent>
                      {subjectOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Message field - for both authenticated and guest users */}
          <FormField
            control={form.control as any}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("message")}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t("messagePlaceholder")}
                    className="min-h-[150px]"
                    {...field}
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Request a call checkbox - for both authenticated and guest users */}
          <FormField
            control={form.control as any}
            name="requestCall"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md bg-white border border-gray-200 p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isPending}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="cursor-pointer">
                    {t("requestCall")}
                  </FormLabel>
                  <p className="text-sm text-muted-foreground">
                    {t("requestCallDescription")}
                  </p>
                </div>
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? t("sending") : t("sendMessageButton")}
          </Button>
        </form>
      </Form>
    </div>
  );
}
