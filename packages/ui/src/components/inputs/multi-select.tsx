"use client";

import * as React from "react";
import { cn } from "@workspace/ui/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { BaseField, type BaseFieldProps } from "./base-field";
import { Controller, useFormContext } from "react-hook-form";
import { X, Search } from "lucide-react";

export interface MultiSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  description?: string;
}

export interface MultiSelectProps extends Omit<BaseFieldProps, "children"> {
  placeholder?: string;
  options: MultiSelectOption[];
  maxItems?: number;
  searchable?: boolean;
  searchPlaceholder?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  onChange?: (values: string[]) => void;
}

export const MultiSelect = React.forwardRef<HTMLDivElement, MultiSelectProps>(
  (
    {
      name,
      placeholder = "Select items...",
      options = [],
      maxItems,
      searchable = false,
      searchPlaceholder = "Search options...",
      badgeVariant = "secondary",
      onChange,
      disabled = false,
      ...baseProps
    },
    ref
  ) => {
    const {
      control,
      formState: { errors },
    } = useFormContext();

    const [searchQuery, setSearchQuery] = React.useState("");
    const fieldError = errors[name]?.message as string;

    const filteredOptions = React.useMemo(() => {
      if (!searchable || !searchQuery) return options;

      return options.filter(
        (option) =>
          option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          option.value.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }, [options, searchQuery, searchable]);

    return (
      <BaseField
        ref={ref}
        name={name}
        error={fieldError}
        disabled={disabled}
        {...baseProps}
      >
        <Controller
          name={name}
          control={control}
          render={({ field }) => {
            const selectedValues: string[] = field.value || [];
            const isMaxReached = maxItems
              ? selectedValues.length >= maxItems
              : false;

            const removeValue = (valueToRemove: string) => {
              const newValues = selectedValues.filter(
                (v) => v !== valueToRemove
              );
              field.onChange(newValues);
              onChange?.(newValues);
            };

            const addValue = (valueToAdd: string) => {
              if (!selectedValues.includes(valueToAdd) && !isMaxReached) {
                const newValues = [...selectedValues, valueToAdd];
                field.onChange(newValues);
                onChange?.(newValues);
              }
            };

            return (
              <div className="space-y-2">
                {/* Selected Items Display */}
                <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md bg-background">
                  {selectedValues.length === 0 ? (
                    <span className="text-muted-foreground text-sm py-1">
                      {placeholder}
                    </span>
                  ) : (
                    selectedValues.map((value) => {
                      const option = options.find((opt) => opt.value === value);
                      return (
                        <Badge
                          key={value}
                          variant={badgeVariant}
                          className="gap-1 pr-1"
                        >
                          <span>{option?.label || value}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => removeValue(value)}
                            disabled={disabled}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      );
                    })
                  )}
                </div>

                {/* Search Input (if searchable) */}
                {searchable && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={searchPlaceholder}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                      disabled={disabled}
                    />
                  </div>
                )}

                {/* Options Selector */}
                <Select
                  onValueChange={addValue}
                  disabled={disabled || isMaxReached}
                  value="" // Always reset to empty after selection
                >
                  <SelectTrigger
                    className={cn(
                      fieldError && "border-red-500 focus:border-red-500"
                    )}
                  >
                    <SelectValue
                      placeholder={
                        isMaxReached
                          ? `Maximum ${maxItems} items selected`
                          : "Add items..."
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredOptions
                      .filter(
                        (option) => !selectedValues.includes(option.value)
                      )
                      .map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          disabled={option.disabled || isMaxReached}
                        >
                          <div className="flex flex-col">
                            <span>{option.label}</span>
                            {option.description && (
                              <span className="text-xs text-muted-foreground">
                                {option.description}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    {filteredOptions.filter(
                      (option) => !selectedValues.includes(option.value)
                    ).length === 0 && (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        {searchQuery
                          ? "No options found"
                          : "All options selected"}
                      </div>
                    )}
                  </SelectContent>
                </Select>

                {/* Items Count */}
                {maxItems && (
                  <div className="text-xs text-muted-foreground text-right">
                    {selectedValues.length}/{maxItems} items selected
                  </div>
                )}
              </div>
            );
          }}
        />
      </BaseField>
    );
  }
);

MultiSelect.displayName = "MultiSelect";
