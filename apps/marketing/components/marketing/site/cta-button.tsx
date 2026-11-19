import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";

/**
 * The marketing site's pill buttons, on the shared shadcn Button: amber for the
 * main action, dark teal for secondary ones, outline on light surfaces and
 * ghost on dark ones. Inside CtaBand, a dark button turns amber.
 */
export const ctaButtonVariants = cva(
  "rounded-full font-bold whitespace-nowrap shadow-none transition-[background-color,border-color,box-shadow,transform] duration-150 hover:no-underline active:scale-[.98] rtl:flex-row [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      tone: {
        amber: "bg-amber-600 text-teal-900 hover:-translate-y-px hover:bg-amber-700 hover:text-teal-900",
        teal: "bg-teal-900 text-white hover:bg-[#0b3542] hover:text-white",
        dark: "bg-teal-900 text-white hover:bg-[#0b3542] hover:text-white",
        outline:
          "border-[1.5px] border-teal-100 bg-white text-teal-900 hover:-translate-y-px hover:border-teal-700 hover:bg-white hover:text-teal-900 hover:shadow-[0_8px_20px_rgba(13,55,67,0.08)]",
        ghost: "border-[1.5px] border-white/30 bg-transparent text-white hover:border-white/50 hover:bg-white/10 hover:text-white",
      },
      size: {
        md: "h-[52px] px-[26px] text-[15px]",
        sm: "h-[42px] px-[18px] text-sm",
        lg: "h-[52px] px-8 text-base",
      },
    },
    compoundVariants: [
      { tone: "amber", size: "md", className: "shadow-cta! hover:shadow-cta-hover!" },
      { tone: "amber", size: "lg", className: "shadow-cta! hover:shadow-cta-hover!" },
    ],
    defaultVariants: { tone: "amber", size: "md" },
  },
);

type CtaButtonProps = React.ComponentProps<typeof Button> & VariantProps<typeof ctaButtonVariants>;

export function CtaButton({ tone, size, className, ...props }: CtaButtonProps) {
  return <Button data-tone={tone ?? "amber"} className={cn(ctaButtonVariants({ tone, size }), className)} {...props} />;
}
