import Image from "next/image";
import Link from "next/link";

export function RiderLogo() {
  return (
    <Link href="/" className="flex shrink-0 items-center hover:opacity-80">
      <Image
        src="/logo-primary.png"
        alt="Tallaby"
        width={120}
        height={32}
        className="md:h-8 h-6 w-auto object-contain"
        priority
      />
    </Link>
  );
}
