import type { LucideIcon } from "lucide-react";
import { SectionIcon } from "@/components/form/form-ui";

/** In-page jump links to the page's sections (no tabs: every section is on the page). */
export function InPageNav({ label, items }: { label: string; items: { id: string; label: string; icon: LucideIcon }[] }) {
  return (
    <nav aria-label={label} className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {items.map(({ id, label: text, icon: Icon }) => (
        <a
          key={id}
          href={`#${id}`}
          className="flex shrink-0 items-center gap-2 rounded-[10px] border bg-card px-3 py-[7px] text-sm whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground"
        >
          <Icon className="size-4" aria-hidden />
          {text}
        </a>
      ))}
    </nav>
  );
}

/** A titled group of cards on a single settings page (icon, title, short description). */
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
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-[136px] space-y-4 md:scroll-mt-[88px]">
      <div className="flex items-start gap-3 border-b pb-3">
        <SectionIcon icon={icon} />
        <div className="min-w-0">
          <h2 id={`${id}-title`} className="text-lg font-bold">
            {title}
          </h2>
          <p className="mt-0.5 text-[13px] leading-relaxed text-pretty text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
