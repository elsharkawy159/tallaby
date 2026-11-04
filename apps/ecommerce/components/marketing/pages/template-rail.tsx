import { Link } from "@/i18n/navigation";
import { TemplateFrame } from "@/components/marketing/templates/template-card";
import { templateFrameSrc, type GalleryEntry } from "@/lib/marketing/templates.lib";
import { cn } from "@workspace/ui/lib/utils";

/** A template card from the real catalog: its home page live, its real name and blurb. */
export function TemplateRailCard({ entry, locale, previewLabel, className }: { entry: GalleryEntry; locale: string; previewLabel: string; className?: string }) {
  return (
    <Link
      href={`/templates/${entry.id}`}
      className={cn(
        "group flex snap-center flex-col overflow-hidden rounded-card border border-[#e3ebed] bg-white p-2.5 text-inherit transition-shadow duration-200 hover:no-underline hover:shadow-[0_16px_36px_rgba(13,55,67,0.1)]",
        className,
      )}
    >
      <TemplateFrame liveSrc={templateFrameSrc(locale, entry.id, undefined, true)} className="shadow-none" />
      <div className="flex items-center justify-between gap-2.5 px-1.5 pt-3 pb-1.5">
        <div className="min-w-0">
          <b className="block truncate text-[15px] text-teal-900">{entry.name}</b>
          {entry.description ? <small className="line-clamp-1 text-[13px] text-ink-500">{entry.description}</small> : null}
        </div>
        <span className="text-[13px] font-bold whitespace-nowrap text-teal-700">{previewLabel}</span>
      </div>
    </Link>
  );
}
