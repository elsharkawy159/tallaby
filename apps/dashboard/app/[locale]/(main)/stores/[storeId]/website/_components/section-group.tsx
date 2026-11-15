import type { LucideIcon } from "lucide-react";
import { IconTile } from "@/components/seller-ui";

/** In-page jump links to the page's sections (`.anch`): every section stays on the page. */
export function InPageNav({ label, items }: { label: string; items: { id: string; label: string; icon: LucideIcon }[] }) {
  return (
    <nav aria-label={label} className="sui-rise -mx-1 flex gap-1.5 overflow-x-auto px-1 py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {items.map(({ id, label: text, icon: Icon }) => (
        <a
          key={id}
          href={`#${id}`}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-(--s-field) bg-(--s-surface) px-3.5 text-[13px] font-semibold text-(--s-muted) no-underline transition-colors duration-150 hover:border-(--tallaby-teal-300) hover:text-(--s-ink) max-[600px]:h-10"
        >
          <Icon className="size-3.5" aria-hidden />
          {text}
        </a>
      ))}
    </nav>
  );
}

/** A titled group of cards on a single settings page (`.sh2`): icon, title, short description. */
export function SectionGroup({
  id,
  icon,
  title,
  description,
  children,
}: {
  id: string;
  icon: LucideIcon;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="flex scroll-mt-24 flex-col gap-3.5 [&:not(:first-of-type)]:mt-3">
      <div className="flex items-center gap-2.5">
        <IconTile icon={icon} tone="solid" />
        <div className="min-w-0">
          <h2 id={`${id}-title`} className="text-lg font-bold leading-normal text-(--s-ink)">
            {title}
          </h2>
          {description && <p className="text-pretty text-[13px] text-(--s-subtle)">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}
