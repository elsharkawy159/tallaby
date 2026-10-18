import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";

/**
 * The marketing site's pill buttons, built on the shared shadcn Button.
 * Tones follow the design: amber CTA, teal, dark, outlined, and a ghost
 * button for dark heroes.
 */
export const ctaButtonVariants = cva(
  "rounded-full font-bold whitespace-nowrap shadow-none transition-colors hover:no-underline active:opacity-90 rtl:flex-row [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      tone: {
        amber: "bg-amber-600 text-teal-900 hover:bg-amber-700 hover:text-teal-900",
        teal: "bg-teal-700 text-white hover:bg-teal-900 hover:text-white",
        dark: "bg-teal-900 text-white hover:bg-teal-950 hover:text-white",
        outline: "border border-teal-100 bg-white text-teal-700 hover:bg-teal-50 hover:text-teal-900",
        ghost: "border border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white",
      },
      size: {
        md: "h-12 px-6 text-[15px]",
        sm: "h-10 px-[18px] text-sm",
        lg: "h-[54px] px-7 text-base",
      },
    },
    defaultVariants: { tone: "amber", size: "md" },
  },
);

type CtaButtonProps = React.ComponentProps<typeof Button> & VariantProps<typeof ctaButtonVariants>;

export function CtaButton({ tone, size, className, ...props }: CtaButtonProps) {
  return <Button className={cn(ctaButtonVariants({ tone, size }), className)} {...props} />;
}
