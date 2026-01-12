import Link from "next/link";
import { LogoProps } from "./layout/header.types";
import Image from "next/image";
import { cn } from "@/lib/utils";

export const Logo = ({ className, logoClassName, color = "white" }: LogoProps) => {
  
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
        className={cn("h-10 w-auto object-contain", logoClassName)}
      />
    </Link>
  );
};
