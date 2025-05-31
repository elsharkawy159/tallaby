"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
// import { cn } from "@workspace/ui/lib/utils";
import { Form } from "@workspace/ui/components/form";
// import { Button } from "@workspace/ui/components/button";
import { Loader2 } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";

interface FormWrapperProps<T extends z.ZodType> {
  schema: T;
  defaultValues?: any;
  onSubmit: (values: z.infer<T>) => Promise<void> | void;
  children: React.ReactNode;
  className?: string;
  submitText?: string;
  resetText?: string;
  showReset?: boolean;
  isPending?: boolean;
}

export function FormWrapper<T extends z.ZodType>({
  schema,
  defaultValues,
  onSubmit,
  children,
  className,
  submitText = "Submit",
  resetText = "Reset",
  showReset = false,
  isPending = false,
}: FormWrapperProps<T>) {
  const form = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  async function handleSubmit(values: z.infer<T>) {
    await onSubmit(values);
  }

  return (
    <Form {...form}>
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
