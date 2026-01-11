import Link from "next/link";
import { LogoProps } from "./layout/header.types";
import Image from "next/image";

export const Logo = ({ className, color = "white" }: LogoProps) => {
  
  return (
    <Link href="/" className={className}>
      <Image
        src={
          color === "white"
            ? "/logo.white.png"
            : color === "primary"
              ? "/logo-primary.png"
              : "/logo.secondary.png"
        }
        alt="Tallaby"
        width={150}
        height={150}
        className="h-10 w-auto object-contain"
      />
    </Link>
  );
};
