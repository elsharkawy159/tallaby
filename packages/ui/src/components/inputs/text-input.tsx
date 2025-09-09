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
import { Input } from "@workspace/ui/components/input";
import { cn } from "@workspace/ui/lib/utils";
import { Globe, Hash, Mail, Phone, Search, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface TextInputProps<TFieldValues extends FieldValues> {
  form: UseFormReturn<TFieldValues>;
  name: Path<TFieldValues>;
  label?: string | React.ReactNode;
  description?: string;
  placeholder?: string;
  className?: string;
  type?: React.InputHTMLAttributes<HTMLInputElement>["type"];
  required?: boolean;
  disabled?: boolean;
  showIcon?: boolean;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  autoFocus?: boolean;
}

export function TextInput<TFieldValues extends FieldValues>({
  form,
  name,
  label,
  description,
  placeholder,
  className,
  type = "text",
  required = false,
  disabled = false,
  showIcon = true,
  onBlur,
  autoFocus = false,
}: TextInputProps<TFieldValues>) {
  if (!form) {
    throw new Error("TextInput must be used within a FormProvider");
  }

  const getInputIcon = () => {
    if (!showIcon) return null;

    switch (type) {
      case "email":
        return <Mail className="h-4 w-4" />;
      case "tel":
        return <Phone className="h-4 w-4" />;
      case "url":
        return <Globe className="h-4 w-4" />;
      case "number":
        return <Hash className="h-4 w-4" />;
      case "search":
        return <Search className="h-4 w-4" />;
      default:
        return null;
    }
  };
  const inputIcon = getInputIcon();

  // Password visibility state
  const [isVisible, setIsVisible] = useState(false);

  // Determine input type for password visibility toggle
  const inputType =
    type === "password" ? (isVisible ? "text" : "password") : type;
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {label && (
            <FormLabel>
              {label} {required && <span className="text-red-600">*</span>}
            </FormLabel>
          )}
          <FormControl>
            <div className="relative">
              {inputIcon && (
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 flex items-center gap-1">
                  {inputIcon}
                </div>
              )}
              <Input
                autoFocus={autoFocus}
                {...field}
                placeholder={placeholder}
                type={inputType}
                className={cn(
                  "h-11 rounded-lg",
                  inputIcon && "pl-10",
                  type === "password" && "pe-9",
                  className
                )}
                disabled={disabled}
                value={
                  field.value as PathValue<TFieldValues, Path<TFieldValues>>
                }
                onChange={(e) => {
                  let value: any = e.target.value;
                  if (type === "number") {
                    value =
                      e.target.value === ""
                        ? undefined
                        : Number(e.target.value);
                  }
                  field.onChange(
                    value as PathValue<TFieldValues, Path<TFieldValues>>
                  );
                }}
                onBlur={(e) => {
                  field.onBlur();
                  if (typeof onBlur === "function") {
                    onBlur(e);
                  }
                }}
              />
              {type === "password" && (
                <button
                  type="button"
                  className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => setIsVisible((prevState) => !prevState)}
                  aria-label={isVisible ? "Hide password" : "Show password"}
                  aria-pressed={isVisible}
                  aria-controls={field.name}
                >
                  {isVisible ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              )}
            </div>
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
