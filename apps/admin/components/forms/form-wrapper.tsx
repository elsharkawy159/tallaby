"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type FieldValues } from "react-hook-form";
import type { ZodType } from "zod";
import { Form } from "@workspace/ui/components/form";
import { Loader2 } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";

interface FormWrapperProps<TValues extends FieldValues> {
  schema: ZodType<TValues>;
  defaultValues?: Partial<TValues>;
  onSubmit: (values: TValues) => Promise<void> | void;
  children: React.ReactNode;
  className?: string;
  submitText?: string;
  resetText?: string;
  showReset?: boolean;
  isPending?: boolean;
}

export function FormWrapper<TValues extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  children,
  className,
  submitText = "Submit",
  resetText = "Reset",
  showReset = false,
  isPending = false,
}: FormWrapperProps<TValues>) {
  const form = useForm<TValues>({
    resolver: zodResolver(schema as any) as any,
    defaultValues: defaultValues as any,
  });

  async function handleSubmit(values: TValues) {
    await onSubmit(values);
  }

  return (
    <Form {...(form as any)}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className={cn("space-y-6", className)}
      >
        {children}

        <div className="flex items-center justify-end gap-2">
          {showReset && (
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              disabled={isPending}
            >
              {resetText}
            </Button>
          )}
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitText}
          </Button>
        </div>
      </form>
    </Form>
  );
}
