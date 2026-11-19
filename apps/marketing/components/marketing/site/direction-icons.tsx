import { ArrowRight, ChevronRight } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

/** Points "forward": right in English, left in Arabic. */
export function ForwardArrow({ className }: { className?: string }) {
  return <ArrowRight aria-hidden className={cn("size-4 rtl:rotate-180", className)} />;
}

export function BackArrow({ className }: { className?: string }) {
  return <ArrowRight aria-hidden className={cn("size-4 ltr:rotate-180", className)} />;
}

export function ForwardChevron({ className }: { className?: string }) {
  return <ChevronRight aria-hidden className={cn("size-3.5 rtl:rotate-180", className)} />;
}
