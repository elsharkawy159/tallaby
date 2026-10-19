"use client";

import { useState, useEffect } from "react";
import { Button } from "@workspace/ui/components/button";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface ProductQuantitySelectorProps {
  initialQuantity?: number;
  min?: number;
  max?: number;
  disabled?: boolean;
  onQuantityChange?: (quantity: number) => void;
  className?: string;
}

export const ProductQuantitySelector = ({
  initialQuantity = 1,
  min = 1,
  max,
  disabled = false,
  onQuantityChange,
  className,
}: ProductQuantitySelectorProps) => {
  const t = useTranslations("common");
  const [quantity, setQuantity] = useState(initialQuantity);

  useEffect(() => {
    setQuantity(initialQuantity);
  }, [initialQuantity]);

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(
      min,
      Math.min(max || Infinity, quantity + delta)
    );
    setQuantity(newQuantity);
    onQuantityChange?.(newQuantity);
  };

  const canDecrease = !disabled && quantity > min;
  const canIncrease = !disabled && (max === undefined || quantity < max);

  const stepButtonClassName = (enabled: boolean) =>
    cn(
      "size-10.5 shrink-0 rounded-none border-0",
      enabled && "bg-primary text-white hover:bg-primary/90 hover:text-white"
    );

  return (
    <div
      className={cn(
        "inline-flex h-10.5 shrink-0 items-center overflow-hidden rounded-lg border border-gray-300",
        className
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={!canDecrease}
        className={stepButtonClassName(canDecrease)}
        onClick={() => handleQuantityChange(-1)}
        aria-label={t("decreaseQuantity")}
      >
        <Minus className="size-4 shrink-0" />
      </Button>
      <span className="flex h-full min-w-10 shrink-0 items-center justify-center border-x border-gray-300 px-3 text-center text-base font-medium tabular-nums">
        {quantity}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={!canIncrease}
        className={stepButtonClassName(canIncrease)}
        onClick={() => handleQuantityChange(1)}
        aria-label={t("increaseQuantity")}
      >
        <Plus className="size-4 shrink-0" />
      </Button>
    </div>
  );
};
