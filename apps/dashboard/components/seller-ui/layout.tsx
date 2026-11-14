import type { LucideIcon } from "lucide-react";
import { PHONE_COMPACT_ACTIONS } from "./buttons";
import { cn } from "@/lib/utils";

/* Page frame, cards and section headers: the design's `.pg`, `.hd`, `.card`, `.ch`, `.sec`, `.shd`. Server-safe. */

export type Tone = "primary" | "accent" | "success" | "danger" | "info" | "solid" | "neutral";

const TONE_CLASSES: Record<Tone, string> = {
  primary: "bg-primary-soft text-primary-ink",
  accent: "bg-accent-soft text-accent-ink",
  success: "bg-success-soft text-success",
  danger: "bg-destructive-soft text-destructive",
  info: "bg-(--s-info-soft) text-(--s-info)",
  solid: "bg-(--s-solid) text-(--s-solid-fg)",
  neutral: "bg-(--s-fill) text-(--s-subtle)",
};

/**
 * The page's frame: padding, max width and the gap between sections. Start every
 * converted page with this. `narrow` is the design's 960px form column.
 */
export function PageContainer({
  narrow = false,
  className,
  ...props
}: React.ComponentProps<"div"> & { narrow?: boolean }) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full flex-col gap-5 p-7 max-[1020px]:px-4 max-[1020px]:py-5 max-[600px]:gap-3.5 max-[600px]:px-3 max-[600px]:py-4",
        narrow ? "max-w-[1016px]" : "max-w-[1360px]",
        className,
      )}
      {...props}
    />
  );
}

/** Title and actions at the top of a page. Below 720px the actions fill the row and the amber one stretches. */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-wrap items-end justify-between gap-4 max-[720px]:items-stretch max-[600px]:gap-2.5",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-[clamp(22px,2.4vw,28px)] font-bold leading-[1.35] text-(--s-ink) max-[600px]:text-[19px]">{title}</h1>
        {description && (
          <div className="mt-0.5 text-pretty text-[14.5px] leading-[1.7] text-(--s-muted) max-[600px]:text-[13.5px]">
            {description}
          </div>
        )}
      </div>
      {actions && (
        <div
          className={cn(
            "flex flex-wrap items-center gap-2 max-[720px]:w-full max-[720px]:[&>[data-sui-button=amber]]:flex-[1_1_auto]",
            PHONE_COMPACT_ACTIONS,
          )}
        >
          {actions}
        </div>
      )}
    </header>
  );
}

/** Rounded square holding an icon (`.it`). */
export function IconTile({
  icon: Icon,
  tone = "primary",
  size = "md",
  className,
}: {
  icon: LucideIcon;
  tone?: Tone;
  /** md 36px, lg 46px. */
  size?: "md" | "lg";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center",
        size === "md" ? "size-9 rounded-xl [&_svg]:size-[17px]" : "size-[46px] rounded-[15px] [&_svg]:size-[22px]",
        TONE_CLASSES[tone],
        className,
      )}
    >
      <Icon aria-hidden />
    </span>
  );
}

/** The design's card surface. Use it wherever a page shows a block of content. */
export function SellerCard({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "min-w-0 rounded-[24px] border border-(--s-line) bg-(--s-glass) text-(--s-body) shadow-(--s-shadow-card) max-[600px]:rounded-[20px]",
        className,
      )}
      {...props}
    />
  );
}

/** A card's title row with an action opposite (`.ch`), for dashboard-style cards. */
export function SellerCardHeader({
  title,
  description,
  action,
  id,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-3 px-[22px] pt-5 max-[600px]:px-4 max-[600px]:pt-4", className)}>
      <div className="min-w-0">
        <h3 id={id} className="flex items-center gap-2 text-[15.5px] font-bold leading-normal text-(--s-ink)">
          {title}
        </h3>
        {description && <div className="text-[12.5px] leading-normal text-(--s-subtle)">{description}</div>}
      </div>
      {action}
    </div>
  );
}

/**
 * Settings-style card (`.sec` + `.shd`): icon, title, explanation, an optional
 * action opposite the title, then the content with an 18px gap.
 */
export function SectionCard({
  icon,
  tone,
  title,
  description,
  action,
  children,
  className,
  ...props
}: Omit<React.ComponentProps<"section">, "title"> & {
  icon?: LucideIcon;
  tone?: Tone;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <SellerCard
      className={cn(
        "flex scroll-mt-24 flex-col gap-[18px] px-6 pb-6 pt-[22px] max-[720px]:gap-4 max-[720px]:px-4 max-[720px]:pb-5 max-[720px]:pt-[18px]",
        className,
      )}
      {...props}
    >
      <div className="flex items-start gap-3.5 max-[720px]:gap-2.5">
        {icon && <IconTile icon={icon} tone={tone} className="max-[720px]:size-[34px]" />}
        <div className="min-w-0 flex-1">
          <h2 className="flex flex-wrap items-center gap-2 text-[16.5px] font-bold leading-normal text-(--s-ink)">
            {title}
          </h2>
          {description && <div className="text-pretty text-[13px] text-(--s-subtle)">{description}</div>}
        </div>
        {action && <div className="mt-0.5 shrink-0">{action}</div>}
      </div>
      {children}
    </SellerCard>
  );
}

/** Two equal columns that stack at 860px (`.g2c`). */
export function TwoColumns({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("grid grid-cols-2 items-start gap-4 max-[860px]:grid-cols-1 [&>*]:min-w-0", className)}
      {...props}
    />
  );
}
