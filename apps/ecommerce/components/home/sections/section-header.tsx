import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: ReactNode;
  description?: string;
  more?: { label: string; href: string };
  /** Light text for sections that sit on a teal panel. */
  inverted?: boolean;
  id?: string;
}

export function SectionHeader({ title, description, more, inverted, id }: SectionHeaderProps) {
  return (
    <div className="mb-4 flex flex-wrap items-end gap-x-4 gap-y-1">
      <div className="min-w-0 flex-1">
        <h2
          id={id}
          className={cn(
            "text-balance text-xl font-bold leading-snug md:text-[22px]",
            inverted ? "text-white" : "text-neutral-900",
          )}
        >
          {title}
        </h2>
        {description && (
          <p className={cn("mt-0.5 text-[13px]", inverted ? "text-[#b9cfd5]" : "text-neutral-600")}>
            {description}
          </p>
        )}
      </div>
      {more && (
        <Link
          href={more.href}
          className={cn(
            "flex items-center gap-1 whitespace-nowrap text-[13px] font-semibold hover:underline",
            inverted ? "text-[#ffd166] hover:text-[#ffd166]" : "text-primary",
          )}
        >
          {more.label}
          <ArrowLeft className="size-3.5 ltr:rotate-180" aria-hidden />
        </Link>
      )}
    </div>
  );
}
