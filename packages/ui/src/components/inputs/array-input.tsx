"use client";

import * as React from "react";
import { cn } from "@workspace/ui/lib/utils";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import { BaseField, type BaseFieldProps } from "./base-field";
import { SelectInput } from "./select-input";
import { Controller, useFormContext } from "react-hook-form";
import { Plus, Trash2, GripVertical } from "lucide-react";

export interface ArrayInputProps extends Omit<BaseFieldProps, "children"> {
  itemType?: "text" | "number" | "textarea" | "select";
  itemPlaceholder?: string;
  addButtonText?: string;
  removeButtonText?: string;
  maxItems?: number;
  minItems?: number;
  allowReorder?: boolean;
  itemOptions?: { value: string; label: string }[]; // For select type
  onChange?: (items: any[]) => void;
}

export const ArrayInput = React.forwardRef<HTMLDivElement, ArrayInputProps>(
  (
    {
      name,
      itemType = "text",
      itemPlaceholder = "Enter item...",
      addButtonText = "Add Item",
      removeButtonText = "Remove",
      maxItems = 10,
      minItems = 0,
      allowReorder = false,
      itemOptions = [],
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

    const fieldError = errors[name]?.message as string;

    const renderItemInput = (
      value: any,
      onChange: (value: any) => void,
      index: number,
      isDisabled: boolean
    ) => {
      const inputProps = {
        value: value || "",
        onChange: (
          e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
        ) => {
          const newValue =
            itemType === "number"
              ? parseFloat(e.target.value) || 0
              : e.target.value;
          onChange(newValue);
        },
        placeholder: itemPlaceholder,
        disabled: isDisabled,
        className: "flex-1",
      };

      switch (itemType) {
        case "textarea":
          return <Textarea {...inputProps} rows={2} />;

        case "number":
          return <Input {...inputProps} type="number" />;

        case "select":
          return (
            <select
              value={value || ""}
              onChange={(e) => onChange(e.target.value)}
              disabled={isDisabled}
              className="flex-1 px-3 py-2 border border-input bg-background rounded-md text-sm"
            >
              <option value="">{itemPlaceholder}</option>
              {itemOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          );

        default:
          return <Input {...inputProps} type="text" />;
      }
    };

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
            const items: any[] = field.value || [];
            const canAddMore = items.length < maxItems;
            const canRemove = items.length > minItems;

            const addItem = () => {
              if (canAddMore) {
                const newItem = itemType === "number" ? 0 : "";
                const newItems = [...items, newItem];
                field.onChange(newItems);
                onChange?.(newItems);
              }
            };

            const removeItem = (index: number) => {
              if (canRemove) {
                const newItems = items.filter((_, i) => i !== index);
                field.onChange(newItems);
                onChange?.(newItems);
              }
            };

            const updateItem = (index: number, value: any) => {
              const newItems = [...items];
              newItems[index] = value;
              field.onChange(newItems);
              onChange?.(newItems);
            };

            const moveItem = (fromIndex: number, toIndex: number) => {
              const newItems = [...items];
              const [movedItem] = newItems.splice(fromIndex, 1);
              newItems.splice(toIndex, 0, movedItem);
              field.onChange(newItems);
              onChange?.(newItems);
            };

            return (
              <div className="space-y-3">
                {/* Items List */}
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2"
                    draggable={allowReorder && !disabled}
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", index.toString());
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const fromIndex = parseInt(
                        e.dataTransfer.getData("text/plain")
                      );
                      if (fromIndex !== index) {
                        moveItem(fromIndex, index);
                      }
                    }}
                  >
                    {allowReorder && !disabled && (
                      <div className="flex items-center pt-2 cursor-move text-muted-foreground">
                        <GripVertical className="h-4 w-4" />
                      </div>
                    )}

                    {renderItemInput(
                      item,
                      (value) => updateItem(index, value),
                      index,
                      disabled
                    )}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(index)}
                      disabled={disabled || !canRemove}
                      className="mt-0.5 px-2"
                      title={removeButtonText}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {/* Empty State */}
                {items.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground border-2 border-dashed rounded-lg">
                    No items added yet
                  </div>
                )}

                {/* Add Button */}
                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addItem}
                    disabled={disabled || !canAddMore}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    {addButtonText}
                  </Button>

                  {maxItems && (
                    <span className="text-xs text-muted-foreground">
                      {items.length}/{maxItems} items
                    </span>
                  )}
                </div>

                {/* Hints */}
                {allowReorder && items.length > 1 && (
                  <p className="text-xs text-muted-foreground">
                    Drag items to reorder them
                  </p>
                )}
              </div>
            );
          }}
        />
      </BaseField>
    );
  }
);

ArrayInput.displayName = "ArrayInput";
