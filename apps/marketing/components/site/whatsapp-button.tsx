import { CONTACT } from "@/lib/site.lib";
import { BrandIcon } from "./brand-icon";

/** Floating WhatsApp chat button, bottom right on every page. */
export function WhatsAppButton({ label }: { label: string }) {
  return (
    <a
      href={CONTACT.whatsapp}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      data-print="hide"
      data-whatsapp-float
      className="fixed right-5 bottom-5 z-[55] grid size-14 place-items-center rounded-full bg-[#25D366] text-white shadow-[0_10px_28px_rgba(0,0,0,0.25)] transition-transform hover:scale-105 hover:text-white focus-visible:outline-offset-4"
    >
      <BrandIcon name="whatsapp" className="size-7" />
    </a>
  );
}
