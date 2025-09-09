"use client";
import { UseFormReturn, FieldValues, Path, PathValue } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Textarea } from "@workspace/ui/components/textarea";
import { cn } from "@workspace/ui/lib/utils";

interface TextareaInputProps<TFieldValues extends FieldValues> {
  form: UseFormReturn<TFieldValues>;
  name: Path<TFieldValues>;
  label?: string | React.ReactNode;
  description?: string;
  placeholder?: string;
  className?: string;
  rows?: number;
  cols?: number;
  resize?: "none" | "vertical" | "horizontal" | "both";
  readOnly?: boolean;
  autoFocus?: boolean;
  tabIndex?: number;
  required?: boolean;
  disabled?: boolean;
  validation?: {
    minLength?: number;
    maxLength?: number;
  };
  showCharacterCount?: boolean;
  onBlur?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
  onChange?: (value: string) => void;
  onFocus?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
}

export function TextareaInput<TFieldValues extends FieldValues>({
  form,
  name,
  label,
  description,
  placeholder,
  className,
  rows = 3,
  cols,
  resize = "vertical",
  readOnly = false,
  autoFocus = false,
  tabIndex,
  required = false,
  disabled = false,
  validation,
  showCharacterCount = false,
  onBlur,
  onChange,
  onFocus,
}: TextareaInputProps<TFieldValues>) {
  if (!form) {
    throw new Error("TextareaInput must be used within a FormProvider");
  }

  const resizeClass = {
    none: "resize-none",
    vertical: "resize-y",
    horizontal: "resize-x",
    both: "resize",
  }[resize];

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => {
        const characterCount =
          typeof field.value === "string" ? field.value.length : 0;

        return (
          <FormItem>
            {label && (
              <FormLabel>
                {label} {required && <span className="text-red-600">*</span>}
              </FormLabel>
            )}
            <FormControl>
              <div className="relative">
                <Textarea
                  {...field}
                  id={name}
                  placeholder={placeholder}
                  disabled={disabled}
                  readOnly={readOnly}
                  autoFocus={autoFocus}
                  tabIndex={tabIndex}
                  rows={rows}
                  cols={cols}
                  maxLength={validation?.maxLength}
                  onBlur={(e) => {
                    field.onBlur();
                    if (typeof onBlur === "function") {
                      onBlur(e);
                    }
                  }}
                  onFocus={onFocus}
                  className={cn(
                    "h-auto rounded-lg",
                    resizeClass,
                    showCharacterCount && validation?.maxLength && "pb-6",
                    readOnly && "cursor-not-allowed bg-gray-100",
                    className
                  )}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    if (typeof onChange === "function") {
                      onChange(e.target.value);
                    }
                  }}
                  value={
                    field.value as PathValue<TFieldValues, Path<TFieldValues>>
                  }
                />
                {showCharacterCount && validation?.maxLength && (
                  <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-white px-1">
                    {characterCount}/{validation.maxLength}
                  </div>
                )}
              </div>
            </FormControl>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
