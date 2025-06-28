"use client";

import * as React from "react";
import { cn } from "@workspace/ui/lib/utils";
import { Label } from "@workspace/ui/components/label";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Switch } from "@workspace/ui/components/switch";
import { Slider } from "@workspace/ui/components/slider";
import { Calendar } from "@workspace/ui/components/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import {
  CalendarIcon,
  Upload,
  X,
  Plus,
  Trash2,
  Image as ImageIcon,
  DollarSign,
  Percent,
  Hash,
  Phone,
  Mail,
  Globe,
  Palette,
  AlertCircle,
  CheckCircle,
  Info,
} from "lucide-react";
import { format } from "date-fns";
import { useFormContext, Controller } from "react-hook-form";

interface FormFieldProps {
  name: string;
  label?: string;
  type?:
    | "text"
    | "email"
    | "password"
    | "number"
    | "tel"
    | "url"
    | "textarea"
    | "select"
    | "checkbox"
    | "switch"
    | "slider"
    | "date"
    | "file"
    | "image"
    | "tags"
    | "array"
    | "currency"
    | "percentage"
    | "phone"
    | "color"
    | "rich-text"
    | "multi-select"
    | "rating"
    | "time"
    | "datetime-local"
    | "week"
    | "month"
    | "range"
    | "search"
    | "url";
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  options?: { value: string; label: string; disabled?: boolean }[];
  min?: number;
  max?: number;
  step?: number;
  multiple?: boolean;
  accept?: string;
  rows?: number;
  description?: string;
  error?: string;
  prefix?: string;
  suffix?: string;
  showCurrency?: boolean;
  currency?: string;
  showPercentage?: boolean;
  arrayConfig?: {
    addButtonText?: string;
    removeButtonText?: string;
    itemLabel?: string;
    maxItems?: number;
    itemType?: "text" | "number" | "select" | "textarea";
    itemOptions?: { value: string; label: string }[];
  };
  tagsConfig?: {
    addButtonText?: string;
    placeholder?: string;
    maxTags?: number;
    separator?: string;
    suggestions?: string[];
  };
  validation?: {
    pattern?: RegExp;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
  helpText?: string;
  warningText?: string;
  successText?: string;
  showCharacterCount?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
  readOnly?: boolean;
  hidden?: boolean;
  tabIndex?: number;
  onBlur?: (
    event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onChange?: (value: any) => void;
  onFocus?: (
    event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
}

export const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  (
    {
      name,
      label,
      type = "text",
      placeholder,
      required = false,
      disabled = false,
      className,
      options = [],
      min,
      max,
      step,
      multiple = false,
      accept,
      rows = 3,
      description,
      error,
      prefix,
      suffix,
      showCurrency = false,
      currency = "EGP",
      showPercentage = false,
      arrayConfig = {},
      tagsConfig = {},
      validation,
      helpText,
      warningText,
      successText,
      showCharacterCount = false,
      autoComplete,
      autoFocus,
      readOnly,
      hidden,
      tabIndex,
      onBlur,
      onChange,
      onFocus,
      ...props
    },
    ref
  ) => {
    const {
      control,
      formState: { errors },
      watch,
      setValue,
    } = useFormContext();
    const fieldError = (errors[name]?.message as string) || error;
    const fieldValue = watch(name);
    const characterCount =
      typeof fieldValue === "string" ? fieldValue.length : 0;

    const getInputIcon = () => {
      switch (type) {
        case "email":
          return <Mail className="h-4 w-4" />;
        case "phone":
        case "tel":
          return <Phone className="h-4 w-4" />;
        case "url":
          return <Globe className="h-4 w-4" />;
        case "color":
          return <Palette className="h-4 w-4" />;
        case "currency":
          return <DollarSign className="h-4 w-4" />;
        case "percentage":
          return <Percent className="h-4 w-4" />;
        case "number":
          return <Hash className="h-4 w-4" />;
        default:
          return null;
      }
    };

    const getStatusIcon = () => {
      if (fieldError) return <AlertCircle className="h-4 w-4 text-red-500" />;
      if (successText)
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      if (warningText)
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      if (helpText) return <Info className="h-4 w-4 text-blue-500" />;
      return null;
    };

    const renderField = () => {
      switch (type) {
        case "textarea":
          return (
            <Controller
              name={name}
              control={control}
              render={({ field }) => (
                <div className="relative">
                  <Textarea
                    {...field}
                    placeholder={placeholder}
                    disabled={disabled}
                    rows={rows}
                    readOnly={readOnly}
                    autoFocus={autoFocus}
                    tabIndex={tabIndex}
                    onBlur={onBlur}
                    onFocus={onFocus}
                    className={cn(
                      "resize-none",
                      fieldError && "border-red-500 focus:border-red-500",
                      showCharacterCount && "pr-12"
                    )}
                  />
                  {showCharacterCount && (
                    <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                      {characterCount}
                    </div>
                  )}
                </div>
              )}
            />
          );

        case "select":
          return (
            <Controller
              name={name}
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger
                    className={cn(
                      fieldError && "border-red-500 focus:border-red-500"
                    )}
                  >
                    <SelectValue placeholder={placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        disabled={option.disabled}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          );

        case "multi-select":
          return (
            <Controller
              name={name}
              control={control}
              render={({ field }) => {
                const selectedValues = field.value || [];
                return (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md">
                      {selectedValues.map((value: string) => {
                        const option = options.find(
                          (opt) => opt.value === value
                        );
                        return (
                          <Badge
                            key={value}
                            variant="secondary"
                            className="gap-1"
                          >
                            {option?.label || value}
                            <button
                              type="button"
                              onClick={() => {
                                const newValues = selectedValues.filter(
                                  (v: string) => v !== value
                                );
                                field.onChange(newValues);
                              }}
                              className="ml-1 hover:text-red-500"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                    <Select
                      onValueChange={(value) => {
                        if (!selectedValues.includes(value)) {
                          field.onChange([...selectedValues, value]);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Add items..." />
                      </SelectTrigger>
                      <SelectContent>
                        {options
                          .filter(
                            (option) => !selectedValues.includes(option.value)
                          )
                          .map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              }}
            />
          );

        case "checkbox":
          return (
            <Controller
              name={name}
              control={control}
              render={({ field }) => (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={name}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={disabled}
                  />
                  {label && (
                    <Label htmlFor={name} className="text-sm font-normal">
                      {label}
                    </Label>
                  )}
                </div>
              )}
            />
          );

        case "switch":
          return (
            <Controller
              name={name}
              control={control}
              render={({ field }) => (
                <div className="flex items-center space-x-2">
                  <Switch
                    id={name}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={disabled}
                  />
                  {label && (
                    <Label htmlFor={name} className="text-sm font-normal">
                      {label}
                    </Label>
                  )}
                </div>
              )}
            />
          );

        case "slider":
          return (
            <Controller
              name={name}
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <Slider
                    value={[field.value || 0]}
                    onValueChange={([value]) => field.onChange(value)}
                    min={min || 0}
                    max={max || 100}
                    step={step || 1}
                    disabled={disabled}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{min || 0}</span>
                    <span className="font-medium">{field.value || 0}</span>
                    <span>{max || 100}</span>
                  </div>
                </div>
              )}
            />
          );

        case "date":
          return (
            <Controller
              name={name}
              control={control}
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !field.value && "text-muted-foreground",
                        fieldError && "border-red-500"
                      )}
                      disabled={disabled}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, "PPP") : placeholder}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={disabled}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
          );

        case "file":
          return (
            <Controller
              name={name}
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-4 text-gray-500" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span>{" "}
                          or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          {accept || "Any file"}
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept={accept}
                        multiple={multiple}
                        onChange={(e) => {
                          const files = e.target.files;
                          if (files) {
                            field.onChange(
                              multiple ? Array.from(files) : files[0]
                            );
                          }
                        }}
                        disabled={disabled}
                      />
                    </label>
                  </div>
                  {field.value && (
                    <div className="text-sm text-gray-600">
                      {multiple
                        ? `${field.value.length} files selected`
                        : field.value.name}
                    </div>
                  )}
                </div>
              )}
            />
          );

        case "image":
          return (
            <Controller
              name={name}
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <ImageIcon className="w-8 h-8 mb-4 text-gray-500" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span>{" "}
                          or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF up to 10MB
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        multiple={multiple}
                        onChange={(e) => {
                          const files = e.target.files;
                          if (files) {
                            field.onChange(
                              multiple ? Array.from(files) : files[0]
                            );
                          }
                        }}
                        disabled={disabled}
                      />
                    </label>
                  </div>
                  {field.value && (
                    <div className="grid grid-cols-2 gap-2">
                      {multiple ? (
                        Array.from(field.value as File[]).map(
                          (file: File, index: number) => (
                            <div key={index} className="relative">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={file.name}
                                className="w-full h-24 object-cover rounded"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newFiles = Array.from(
                                    field.value as File[]
                                  ).filter((_, i) => i !== index);
                                  field.onChange(newFiles);
                                }}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          )
                        )
                      ) : (
                        <div className="relative">
                          <img
                            src={URL.createObjectURL(field.value as File)}
                            alt={(field.value as File).name}
                            className="w-full h-20 object-cover rounded"
                          />
                          <button
                            type="button"
                            onClick={() => field.onChange(null)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            />
          );

        case "tags":
          return (
            <Controller
              name={name}
              control={control}
              render={({ field }) => {
                const tags = field.value || [];
                const [inputValue, setInputValue] = React.useState("");

                const addTag = () => {
                  const tag = inputValue.trim();
                  if (tag && !tags.includes(tag)) {
                    const newTags = [...tags, tag];
                    field.onChange(newTags);
                    setInputValue("");
                  }
                };

                const removeTag = (tagToRemove: string) => {
                  const newTags = tags.filter(
                    (tag: string) => tag !== tagToRemove
                  );
                  field.onChange(newTags);
                };

                const handleKeyPress = (e: React.KeyboardEvent) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                };

                return (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md">
                      {tags.map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="gap-1">
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={tagsConfig.placeholder || "Add a tag..."}
                        disabled={
                          disabled ||
                          (tagsConfig.maxTags
                            ? tags.length >= tagsConfig.maxTags
                            : false)
                        }
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        onClick={addTag}
                        disabled={
                          disabled ||
                          !inputValue.trim() ||
                          (tagsConfig.maxTags
                            ? tags.length >= tagsConfig.maxTags
                            : false)
                        }
                        size="sm"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {tagsConfig.suggestions &&
                      tagsConfig.suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {tagsConfig.suggestions
                            .filter((suggestion) => !tags.includes(suggestion))
                            .map((suggestion) => (
                              <button
                                key={suggestion}
                                type="button"
                                onClick={() => {
                                  if (!tags.includes(suggestion)) {
                                    field.onChange([...tags, suggestion]);
                                  }
                                }}
                                className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                              >
                                {suggestion}
                              </button>
                            ))}
                        </div>
                      )}
                  </div>
                );
              }}
            />
          );

        case "array":
          return (
            <Controller
              name={name}
              control={control}
              render={({ field }) => {
                const items = field.value || [];
                const [inputValue, setInputValue] = React.useState("");

                const addItem = () => {
                  const item = inputValue.trim();
                  if (item && !items.includes(item)) {
                    const newItems = [...items, item];
                    field.onChange(newItems);
                    setInputValue("");
                  }
                };

                const removeItem = (itemToRemove: string) => {
                  const newItems = items.filter(
                    (item: string) => item !== itemToRemove
                  );
                  field.onChange(newItems);
                };

                return (
                  <div className="space-y-2">
                    <div className="space-y-2">
                      {items.map((item: string, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            value={item}
                            onChange={(e) => {
                              const newItems = [...items];
                              newItems[index] = e.target.value;
                              field.onChange(newItems);
                            }}
                            placeholder={arrayConfig.itemLabel || "Item"}
                            disabled={disabled}
                          />
                          <Button
                            type="button"
                            onClick={() => removeItem(item)}
                            variant="outline"
                            size="sm"
                            disabled={disabled}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={arrayConfig.itemLabel || "Add an item..."}
                        disabled={
                          disabled ||
                          (arrayConfig.maxItems
                            ? items.length >= arrayConfig.maxItems
                            : false)
                        }
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        onClick={addItem}
                        disabled={
                          disabled ||
                          !inputValue.trim() ||
                          (arrayConfig.maxItems
                            ? items.length >= arrayConfig.maxItems
                            : false)
                        }
                        size="sm"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              }}
            />
          );

        case "currency":
          return (
            <Controller
              name={name}
              control={control}
              render={({ field }) => (
                <div className="relative">
                  {showCurrency && (
                    <div className="absolute left-3 top-1/2 text-sm transform -translate-y-1/2 text-gray-500">
                      {currency === "USD" ? "$" : currency}
                    </div>
                  )}
                  <Input
                    {...field}
                    type="number"
                    placeholder={placeholder}
                    disabled={disabled}
                    min={min}
                    max={max}
                    step={step || 0.01}
                    className={cn(
                      showCurrency && "pl-12",
                      fieldError &&
                        "border-red-500 text-base focus:border-red-500"
                    )}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      field.onChange(value);
                      onChange?.(value);
                    }}
                  />
                </div>
              )}
            />
          );

        case "percentage":
          return (
            <Controller
              name={name}
              control={control}
              render={({ field }) => (
                <div className="relative">
                  <Input
                    {...field}
                    type="number"
                    placeholder={placeholder}
                    disabled={disabled}
                    min={min || 0}
                    max={max || 100}
                    step={step || 0.01}
                    className={cn(
                      "pr-8",
                      fieldError && "border-red-500 focus:border-red-500"
                    )}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      field.onChange(value);
                      onChange?.(value);
                    }}
                  />
                  {showPercentage && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      %
                    </div>
                  )}
                </div>
              )}
            />
          );

        case "color":
          return (
            <Controller
              name={name}
              control={control}
              render={({ field }) => (
                <div className="flex items-center gap-2">
                  <Input
                    {...field}
                    type="color"
                    disabled={disabled}
                    className="w-16 h-10 p-1 border rounded"
                  />
                  <Input
                    {...field}
                    type="text"
                    placeholder={placeholder || "#000000"}
                    disabled={disabled}
                    className={cn(
                      "flex-1",
                      fieldError && "border-red-500 focus:border-red-500"
                    )}
                  />
                </div>
              )}
            />
          );

        case "rating":
          return (
            <Controller
              name={name}
              control={control}
              render={({ field }) => (
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => field.onChange(star)}
                      disabled={disabled}
                      className="text-2xl hover:scale-110 transition-transform"
                    >
                      {star <= (field.value || 0) ? "★" : "☆"}
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-500">
                    {field.value || 0}/5
                  </span>
                </div>
              )}
            />
          );

        default:
          return (
            <Controller
              name={name}
              control={control}
              render={({ field }) => (
                <div className="relative">
                  {prefix && (
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      {prefix}
                    </div>
                  )}
                  <Input
                    {...field}
                    type={type}
                    placeholder={placeholder}
                    disabled={disabled}
                    readOnly={readOnly}
                    autoFocus={autoFocus}
                    autoComplete={autoComplete}
                    tabIndex={tabIndex}
                    min={min}
                    max={max}
                    step={step}
                    onBlur={onBlur}
                    onFocus={onFocus}
                    className={cn(
                      prefix && "pl-8",
                      suffix && "pr-8",
                      fieldError && "border-red-500 focus:border-red-500"
                    )}
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      onChange?.(e.target.value);
                    }}
                  />
                  {suffix && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      {suffix}
                    </div>
                  )}
                </div>
              )}
            />
          );
      }
    };

    if (hidden) return null;

    return (
      <div ref={ref} className={cn("space-y-2", className)}>
        {label && (
          <Label htmlFor={name} className="text-sm font-medium">
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </Label>
        )}

        {renderField()}

        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <div className="flex-1 space-y-1">
            {fieldError && <p className="text-sm text-red-500">{fieldError}</p>}
            {successText && (
              <p className="text-sm text-green-600">{successText}</p>
            )}
            {warningText && (
              <p className="text-sm text-yellow-600">{warningText}</p>
            )}
            {helpText && !fieldError && !successText && !warningText && (
              <p className="text-sm text-gray-500">{helpText}</p>
            )}
            {description &&
              !fieldError &&
              !successText &&
              !warningText &&
              !helpText && (
                <p className="text-sm text-gray-500">{description}</p>
              )}
          </div>
        </div>
      </div>
    );
  }
);

FormField.displayName = "FormField";
