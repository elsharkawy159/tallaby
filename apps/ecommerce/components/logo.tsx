import Link from "next/link";
import { LogoProps } from "./layout/header.types";
import Image from "next/image";

export const Logo = ({ className }: LogoProps) => {
  return (
    <Link href="/" className={className}>
      <Image
        src="/logo.white.png"
        alt="Tallaby"
        width={150}
        height={150}
        className="h-10 w-auto object-contain"
      />
    </Link>
  );
};
