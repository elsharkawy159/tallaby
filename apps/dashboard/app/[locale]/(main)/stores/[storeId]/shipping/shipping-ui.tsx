import { Check } from "lucide-react";
import { SellerCard } from "@/components/seller-ui";
import { cn } from "@/lib/utils";

/**
 * One numbered step of the shipping page (the design's `.sec` with `.stp`): the circle turns
 * green with a check once the step needs nothing more. Server or client.
 */
export function StepCard({
  step,
  done = false,
  title,
  description,
  action,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"section">, "title"> & {
  step: number;
  done?: boolean;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <SellerCard
      className={cn(
        "sui-rise flex scroll-mt-24 flex-col gap-4 px-6 pb-6 pt-[22px] max-[720px]:px-4 max-[720px]:pb-5 max-[720px]:pt-[18px]",
        className,
      )}
      {...props}
    >
      <div className="flex items-start gap-3.5 max-[720px]:flex-wrap max-[720px]:gap-2.5">
        <span
          className={cn(
            "mt-0.5 grid size-8 shrink-0 place-items-center rounded-full font-montserrat text-[13px] font-bold",
            done ? "bg-success text-white dark:text-[#0b2415]" : "bg-(--s-solid) text-(--s-solid-fg)",
          )}
        >
          {done ? <Check className="size-4 stroke-[2.6]" aria-hidden /> : step}
        </span>
        <div className="min-w-0 flex-1 basis-48">
          <h2 className="text-[17px] font-bold leading-normal text-(--s-ink)">{title}</h2>
          {description && <p className="text-pretty text-[13px] text-(--s-subtle)">{description}</p>}
        </div>
        {action && <div className="mt-0.5 shrink-0 max-[720px]:ms-[42px]">{action}</div>}
      </div>
      {children}
    </SellerCard>
  );
}
