import Image from "next/image";
import { getStorePaymentMethod } from "@workspace/lib/payments/store-methods";
import { cn } from "@/lib/utils";

/** A payment method's logo, or its brand initials when there is no logo file yet. */
export function PaymentMethodLogo({ method, label, className }: { method: string; label: string; className?: string }) {
  const m = getStorePaymentMethod(method);
  const base = cn("flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-white", className);
  if (m?.logo) {
    return (
      <span className={base}>
        <Image src={m.logo} alt={label} width={44} height={44} className="size-full object-contain p-1" />
      </span>
    );
  }
  const badge = m && "badge" in m ? m.badge : undefined;
  return (
    <span
      className={cn(base, "border-transparent text-[11px] font-bold text-white")}
      style={{ backgroundColor: badge?.color ?? "#64748b" }}
      role="img"
      aria-label={label}
    >
      <span dir="ltr">{badge?.text ?? label.slice(0, 2)}</span>
    </span>
  );
}
