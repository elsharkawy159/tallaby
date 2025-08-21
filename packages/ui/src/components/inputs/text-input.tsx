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

  // Determine input type for password visibility toggle
  const inputType = type;

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
                {...field}
                placeholder={placeholder}
                type={inputType}
                className={cn(
                  "h-11 rounded-lg",
                  inputIcon && "pl-10",
                  type === "password" && "pr-10",
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
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  aria-label={type === "password" ? "Hide password" : "Show password"}
                >
                  {type === "password" ? (
                    <EyeOff className="h-4 w-4 cursor-pointer" />
                  ) : (
                    <Eye className="h-4 w-4 cursor-pointer" />
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
