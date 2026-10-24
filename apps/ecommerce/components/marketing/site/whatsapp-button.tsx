import { CONTACT } from "@/lib/marketing/site.lib";
import { BrandIcon } from "./brand-icon";

/**
 * Floating WhatsApp chat button, at the bottom end corner (left in Arabic) so
 * it doesn't cover where lines start. Hidden while a dialog has locked the
 * page scroll (the signup dialog), so it never covers a dialog's buttons.
 */
export function WhatsAppButton({ label }: { label: string }) {
  if (!CONTACT.whatsapp) return null;
  return (
    <a
      href={CONTACT.whatsapp}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      data-print="hide"
      data-whatsapp-float
      className="fixed end-5 bottom-5 z-[55] grid size-14 place-items-center rounded-full bg-[#25D366] text-white shadow-[0_10px_28px_rgba(0,0,0,0.25)] transition-transform hover:scale-105 hover:text-white focus-visible:outline-offset-4 [body[data-scroll-locked]_&]:hidden"
    >
      <BrandIcon name="whatsapp" className="size-7" />
    </a>
  );
}
