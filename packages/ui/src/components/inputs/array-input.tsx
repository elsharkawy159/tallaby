"use client";

import * as React from "react";
import { cn } from "@workspace/ui/lib/utils";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import { BaseField, type BaseFieldProps } from "./base-field";
import { Controller, useFormContext } from "react-hook-form";
import { Plus, Trash2, GripVertical, Copy } from "lucide-react";
import Draggable from "react-draggable";

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
  autoAddEmpty?: boolean; // Auto-add empty field when last one is filled
  enableSmartPaste?: boolean; // Enable smart paste functionality
  emptyStateText?: string;
  showItemCount?: boolean;
  showToast?: boolean; // Show toast notifications
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
      autoAddEmpty = true,
      enableSmartPaste = true,
      emptyStateText = "No items added yet",
      showItemCount = true,
      showToast = false,
      ...baseProps
    },
    ref
  ) => {
    const {
      control,
      formState: { errors },
    } = useFormContext();

    const fieldError = errors[name]?.message as string;
    const [isDragging, setIsDragging] = React.useState(false);
    const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
    const [focusedIndex, setFocusedIndex] = React.useState<number | null>(null);
    const [dragPositions, setDragPositions] = React.useState<
      Record<number, { x: number; y: number }>
    >({});

    const showToastMessage = React.useCallback(
      (message: string, type: "success" | "info" = "success") => {
        if (showToast && typeof window !== "undefined") {
          // Simple toast fallback if no toast library is available
          console.log(`${type.toUpperCase()}: ${message}`);
        }
      },
      [showToast]
    );

    const handleSmartPaste = React.useCallback(
      (pastedText: string, currentItems: any[], currentIndex: number) => {
        if (!enableSmartPaste) return false;

        // Split by newlines and filter out empty lines
        const lines = pastedText
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0);

        if (lines.length <= 1) return false; // Not a multi-line paste

        // Replace current items starting from currentIndex with pasted lines
        const newItems = [...currentItems];
        lines.forEach((line, i) => {
          const targetIndex = currentIndex + i;
          if (targetIndex < maxItems) {
            if (targetIndex < newItems.length) {
              newItems[targetIndex] =
                itemType === "number" ? parseFloat(line) || 0 : line;
            } else {
              newItems.push(
                itemType === "number" ? parseFloat(line) || 0 : line
              );
            }
          }
        });

        return newItems;
      },
      [enableSmartPaste, itemType, maxItems]
    );

    const handleDragStart = React.useCallback((index: number) => {
      setIsDragging(true);
      setDraggedIndex(index);
    }, []);

    const handleDragStop = React.useCallback(
      (
        index: number,
        e: any,
        data: { x: number; y: number },
        items: any[],
        updateAllItems: (newItems: any[]) => void
      ) => {
        setIsDragging(false);
        setDraggedIndex(null);

        // Reset position
        setDragPositions((prev) => ({ ...prev, [index]: { x: 0, y: 0 } }));

        // Find the drop target by checking element positions
        const draggedElement = e.target.closest("[data-item-index]");
        if (!draggedElement) return;

        const allItems = document.querySelectorAll("[data-item-index]");
        let dropIndex = index;

        // Find which item we're over based on Y position
        const draggedRect = draggedElement.getBoundingClientRect();
        const draggedCenterY = draggedRect.top + draggedRect.height / 2;

        allItems.forEach((element, i) => {
          if (i === index) return; // Skip self

          const rect = element.getBoundingClientRect();
          const centerY = rect.top + rect.height / 2;

          if (draggedCenterY > centerY && i < index) {
            dropIndex = i;
          } else if (draggedCenterY < centerY && i > index) {
            dropIndex = i;
          }
        });

        // Perform the reorder if position changed
        if (dropIndex !== index) {
          const newItems = [...items];
          const [movedItem] = newItems.splice(index, 1);
          newItems.splice(dropIndex, 0, movedItem);
          updateAllItems(newItems);
          showToastMessage(`Moved item to position ${dropIndex + 1}`, "info");
        }
      },
      [showToastMessage]
    );

    const handleDrag = React.useCallback(
      (index: number, e: any, data: { x: number; y: number }) => {
        setDragPositions((prev) => ({
          ...prev,
          [index]: { x: data.x, y: data.y },
        }));
      },
      []
    );

    const renderItemInput = (
      value: any,
      onItemChange: (value: any) => void,
      index: number,
      isDisabled: boolean,
      items: any[],
      updateAllItems: (newItems: any[]) => void
    ) => {
      const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      ) => {
        const newValue =
          itemType === "number"
            ? parseFloat(e.target.value) || 0
            : e.target.value;
        onItemChange(newValue);

        // Auto-add empty field if this is the last field and it has content
        if (
          autoAddEmpty &&
          index === items.length - 1 &&
          newValue &&
          items.length < maxItems
        ) {
          const newItems = [...items];
          newItems[index] = newValue;
          newItems.push(itemType === "number" ? 0 : "");
          updateAllItems(newItems);
        }
      };

      const handlePaste = (e: React.ClipboardEvent) => {
        const pastedText = e.clipboardData.getData("text");
        const smartPasteResult = handleSmartPaste(pastedText, items, index);

        if (smartPasteResult) {
          e.preventDefault();
          updateAllItems(smartPasteResult);
          const addedCount = smartPasteResult.length - items.length + 1;
          showToastMessage(`Pasted ${addedCount} items`, "success");
        }
      };

      const handleFocus = () => setFocusedIndex(index);
      const handleBlur = () => setFocusedIndex(null);

      const inputProps = {
        value: value || "",
        onChange: handleChange,
        onPaste: handlePaste,
        onFocus: handleFocus,
        onBlur: handleBlur,
        placeholder:
          index === 0 && enableSmartPaste
            ? `${itemPlaceholder} (paste list here)`
            : itemPlaceholder,
        disabled: isDisabled,
        className: cn(
          "flex-1 transition-all duration-200",
          focusedIndex === index && "ring-2 ring-primary/20"
        ),
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
              onChange={(e) => onItemChange(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              disabled={isDisabled}
              className={cn(
                "flex-1 px-3 py-2 border border-input bg-background rounded-md text-sm transition-all duration-200",
                focusedIndex === index && "ring-2 ring-primary/20"
              )}
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

            // Ensure we always have at least one empty field for input when autoAddEmpty is enabled
            React.useEffect(() => {
              if (autoAddEmpty && items.length === 0) {
                field.onChange([itemType === "number" ? 0 : ""]);
              }
            }, [items.length, autoAddEmpty, field, itemType]);

            return (
              <div className="space-y-3">
                {/* Items List */}
                <div className="space-y-2 relative">
                  {items.map((item, index) => {
                    const hasContent =
                      itemType === "number"
                        ? item > 0
                        : Boolean(item?.toString().trim());
                    const isLastItem = index === items.length - 1;
                    const showRemoveButton =
                      items.length > 1 || (minItems === 0 && hasContent);
                    const isDraggedItem = draggedIndex === index;
                    const position = dragPositions[index] || { x: 0, y: 0 };

                    const ItemContent = (
                      <div
                        data-item-index={index}
                        className={cn(
                          "group flex items-start gap-3 p-3 rounded-lg border transition-all duration-200",
                          isDraggedItem && "opacity-70 shadow-lg z-50",
                          focusedIndex === index &&
                            "border-primary/50 bg-primary/5",
                          hasContent
                            ? "border-border"
                            : "border-dashed border-muted-foreground/30",
                          allowReorder &&
                            hasContent &&
                            !disabled &&
                            "cursor-move",
                          isDragging && !isDraggedItem && "pointer-events-none"
                        )}
                        style={{
                          transform: isDraggedItem
                            ? `translate(${position.x}px, ${position.y}px) rotate(2deg)`
                            : undefined,
                          zIndex: isDraggedItem ? 1000 : undefined,
                        }}
                      >
                        {/* Drag Handle */}
                        {allowReorder && !disabled && hasContent && (
                          <div className="flex items-center pt-1 cursor-move text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-200 hover:text-primary">
                            <GripVertical className="h-4 w-4" />
                          </div>
                        )}

                        {/* Item Number */}
                        <div className="flex items-center pt-1 text-xs text-muted-foreground font-medium min-w-[1.5rem]">
                          {index + 1}.
                        </div>

                        {/* Input Field */}
                        {renderItemInput(
                          item,
                          (value) => updateItem(index, value),
                          index,
                          disabled || isDragging,
                          items,
                          field.onChange
                        )}

                        {/* Remove Button */}
                        {showRemoveButton && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                            disabled={disabled || !canRemove || isDragging}
                            className={cn(
                              "px-2 text-muted-foreground hover:text-destructive transition-all duration-200",
                              "opacity-0 group-hover:opacity-100",
                              focusedIndex === index && "opacity-100"
                            )}
                            title={removeButtonText}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    );

                    // Wrap with Draggable if reordering is allowed and item has content
                    if (allowReorder && !disabled && hasContent) {
                      return (
                        <Draggable
                          key={`draggable-${index}`}
                          axis="y"
                          position={position}
                          onStart={() => handleDragStart(index)}
                          onDrag={(e, data) => handleDrag(index, e, data)}
                          onStop={(e, data) =>
                            handleDragStop(
                              index,
                              e,
                              data,
                              items,
                              field.onChange
                            )
                          }
                          disabled={disabled}
                          bounds="parent"
                          handle=".cursor-move"
                        >
                          <div>{ItemContent}</div>
                        </Draggable>
                      );
                    }

                    // Return non-draggable item
                    return <div key={index}>{ItemContent}</div>;
                  })}
                </div>

                {/* Empty State */}
                {items.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/20">
                    <div className="flex flex-col items-center gap-2">
                      <Copy className="h-8 w-8 opacity-50" />
                      <p className="font-medium">{emptyStateText}</p>
                      {enableSmartPaste && (
                        <p className="text-xs">
                          Tip: Paste a list to add multiple items at once
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Controls */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    {!autoAddEmpty && (
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
                    )}

                    {enableSmartPaste && items.length > 0 && (
                      <div className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                        💡 Paste list in first field to split into items
                      </div>
                    )}
                  </div>

                  {showItemCount && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium">
                        {
                          items.filter((item) =>
                            itemType === "number"
                              ? item > 0
                              : Boolean(item?.toString().trim())
                          ).length
                        }
                      </span>
                      <span>/</span>
                      <span>{maxItems === Infinity ? "∞" : maxItems}</span>
                      <span>items</span>
                    </div>
                  )}
                </div>

                {/* Hints */}
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  {allowReorder &&
                    items.filter((item) =>
                      itemType === "number"
                        ? item > 0
                        : Boolean(item?.toString().trim())
                    ).length > 1 && (
                      <span className="flex items-center gap-1">
                        <GripVertical className="h-3 w-3" />
                        Drag by the grip handle to reorder
                      </span>
                    )}
                  {autoAddEmpty && <span>New field appears when you type</span>}
                  {isDragging && (
                    <span className="flex items-center gap-1 text-primary">
                      🔄 Drop to reorder items
                    </span>
                  )}
                </div>
              </div>
            );
          }}
        />
      </BaseField>
    );
  }
);

ArrayInput.displayName = "ArrayInput";
