"use client";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import { Switch } from "@workspace/ui/components/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Checkbox } from "@workspace/ui/components/checkbox";
import type { Control, FieldPath, FieldValues } from "react-hook-form";

interface FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  control: Control<TFieldValues>;
  name: TName;
  label?: string;
  description?: string;
  placeholder?: string;
  type?:
    | "text"
    | "number"
    | "email"
    | "password"
    | "textarea"
    | "switch"
    | "select"
    | "checkbox";
  options?: { label: string; value: string }[];
  disabled?: boolean;
  className?: string;
}

export function FormInputField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  control,
  name,
  label,
  description,
  placeholder,
  type = "text",
  options,
  disabled = false,
  className,
}: FormFieldProps<TFieldValues, TName>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            {type === "textarea" ? (
              <Textarea
                placeholder={placeholder}
                {...field}
                disabled={disabled}
                className="resize-y min-h-20"
              />
            ) : type === "switch" ? (
              <div className="flex items-center space-x-2">
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={disabled}
                />
                {placeholder && (
                  <span className="text-sm text-gray-500">{placeholder}</span>
                )}
              </div>
            ) : type === "select" && options ? (
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : type === "checkbox" ? (
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={disabled}
                  id={`checkbox-${name}`}
                />
                {placeholder && (
                  <label
                    htmlFor={`checkbox-${name}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {placeholder}
                  </label>
                )}
              </div>
            ) : (
              <Input
                type={type}
                placeholder={placeholder}
                {...field}
                disabled={disabled}
                onChange={(e) => {
                  // Convert to number if type is number
                  if (type === "number") {
                    const value = e.target.value;
                    field.onChange(value === "" ? "" : Number(value));
                  } else {
                    field.onChange(e);
                  }
                }}
                value={field.value ?? ""}
              />
            )}
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
