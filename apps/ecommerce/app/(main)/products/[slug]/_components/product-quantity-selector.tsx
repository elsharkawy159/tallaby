"use client";

import { useState, useEffect } from "react";
import { Button } from "@workspace/ui/components/button";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

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

  return (
    <div
      className={cn(
        "flex items-center border border-gray-300 rounded-lg w-fit",
        className
      )}
    >
      <Button
        variant="ghost"
        size="sm"
        disabled={disabled || quantity <= min}
        className="h-10 w-10 rounded-r-none border-r rounded-l-lg border-gray-300 hover:bg-gray-100 duration-100"
        onClick={() => handleQuantityChange(-1)}
        aria-label="Decrease quantity"
      >
        <Minus className="h-4 w-4" />
      </Button>
      <span className="px-6 py-2 text-center min-w-[4rem] font-medium text-base">
        {quantity}
      </span>
      <Button
        variant="ghost"
        size="sm"
        disabled={disabled || (max !== undefined && quantity >= max)}
        className="h-10 w-10 rounded-l-none border-l rounded-r-lg border-gray-300 hover:bg-gray-100 duration-100"
        onClick={() => handleQuantityChange(1)}
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
};
